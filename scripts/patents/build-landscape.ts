#!/usr/bin/env bun
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { FamiliesFile, LandscapeFile } from "../../src/patents/types";
import { type PublicationRow, buildLandscape, toFamilies } from "./landscape";

// Builds data/patents/landscape.json and data/patents/families.json from the
// BigQuery export of queries/extract.sql (gzipped NDJSON, one publication
// per line). The raw extract is never committed.
//
//   bun run scripts/patents/build-landscape.ts [--input=path-or-url[,more]]
//       [--as-of=YYYY-MM-DD] [--out=data/patents]

const EXTRACT_URL =
    "https://storage.googleapis.com/actuatorlist-patents-patents-extract/actuator_pubs/part-000000000000.json.gz";

const argOf = (k: string) =>
    process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);

async function readPart(src: string): Promise<Uint8Array<ArrayBuffer>> {
    if (/^https?:\/\//.test(src)) {
        const res = await fetch(src);
        if (!res.ok) throw new Error(`${src}: HTTP ${res.status}`);
        return new Uint8Array(await res.arrayBuffer());
    }
    return new Uint8Array(await Bun.file(src).arrayBuffer());
}

function* parseRows(
    buf: Uint8Array<ArrayBuffer>,
    src: string,
): Generator<PublicationRow> {
    const gz = buf[0] === 0x1f && buf[1] === 0x8b;
    const text = new TextDecoder().decode(gz ? Bun.gunzipSync(buf) : buf);
    let line = 0;
    for (const raw of text.split("\n")) {
        line++;
        if (!raw.trim()) continue;
        try {
            yield JSON.parse(raw) as PublicationRow;
        } catch {
            throw new Error(`${src}:${line}: not JSON`);
        }
    }
}

// One family per line: small diffs on a rebuild, and no formatter pass.
function familiesJson(file: FamiliesFile): string {
    const rows = file.families.map((f) => `    ${JSON.stringify(f)}`).join(",\n");
    return `{\n  "asOf": ${JSON.stringify(file.asOf)},\n  "perTechnology": ${file.perTechnology},\n  "families": [\n${rows}\n  ]\n}\n`;
}

async function main() {
    const inputs = (argOf("input") ?? EXTRACT_URL).split(",");
    const asOf = argOf("as-of") ?? new Date().toISOString().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf))
        throw new Error(`--as-of=${asOf}: want YYYY-MM-DD`);
    const out = argOf("out") ?? "data/patents";
    const rows: PublicationRow[] = [];
    for (const src of inputs)
        for (const r of parseRows(await readPart(src), src)) rows.push(r);
    const { landscape, families } = buildLandscape(toFamilies(rows), asOf);
    await mkdir(out, { recursive: true });
    await Bun.write(
        join(out, "landscape.json"),
        `${JSON.stringify(landscape satisfies LandscapeFile)}\n`,
    );
    await Bun.write(join(out, "families.json"), familiesJson(families));
    const e = landscape.extract;
    console.log(
        `${e.publications} publications, ${e.families} families, ${e.matched} in a technology; ${families.families.length} families listed.`,
    );
    for (const [id, t] of Object.entries(landscape.technologies))
        console.log(`  ${id}: ${t.families} families, ${t.assignees} assignees`);
}

if (import.meta.main) await main();
