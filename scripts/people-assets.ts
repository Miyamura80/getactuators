// Asset pipeline for the people registry (src/people). Two commands:
//
//   bun scripts/people-assets.ts headshot <personId> <url|file> --licence consent [--credit "..."] [--source-url <url>]
//   bun scripts/people-assets.ts logo <orgId> <url|file> --licence press-kit [--credit "..."] [--source-url <url>]
//
// headshot: crops to a 512px square around the most salient region (sharp's
// attention strategy, which centres on the face in a portrait) and writes
// frontend/public/people/<id>.webp.
// logo: an SVG is kept as SVG; a raster is fitted into a transparent 256px
// square WebP. Either lands in frontend/public/orgs/<id>.<ext>.
// Both upsert the ImageAsset record (source, licence, retrieved date) into
// src/people/assets.json. --source-url records where the image came from when
// the bytes are read from a local copy.
//
// Only use images the person consented to or the organisation publishes for
// identification. For a LinkedIn photo, download it first and pass the profile
// URL as --source-url: the media.licdn.com link is signed and expires.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { type AssetFile, LICENCES, type Licence } from "../src/people";

const ASSETS_JSON = "src/people/assets.json";
const PUBLIC = "frontend/public";
export const MAX_BYTES = 80 * 1024;

function flag(args: string[], name: string): string | undefined {
    const i = args.indexOf(`--${name}`);
    return i >= 0 ? args[i + 1] : undefined;
}

async function load(src: string): Promise<{ bytes: Buffer; svg: boolean }> {
    if (/^https?:\/\//.test(src)) {
        const res = await fetch(src, { redirect: "follow" });
        if (!res.ok) throw new Error(`${src}: HTTP ${res.status}`);
        const bytes = Buffer.from(await res.arrayBuffer());
        const svg =
            (res.headers.get("content-type") ?? "").includes("svg") ||
            src.endsWith(".svg");
        return { bytes, svg };
    }
    return { bytes: readFileSync(src), svg: src.endsWith(".svg") };
}

// Re-encode at falling quality until the file fits the size budget.
async function webp(pipeline: sharp.Sharp): Promise<Buffer> {
    for (const quality of [82, 72, 62, 52]) {
        const out = await pipeline.clone().webp({ quality }).toBuffer();
        if (out.length <= MAX_BYTES) return out;
    }
    throw new Error(`Image does not fit ${MAX_BYTES} bytes`);
}

export async function headshot(bytes: Buffer): Promise<Buffer> {
    return webp(
        sharp(bytes)
            .rotate()
            .resize(512, 512, { fit: "cover", position: sharp.strategy.attention }),
    );
}

export async function logo(
    bytes: Buffer,
    svg: boolean,
): Promise<{ data: Buffer; ext: "svg" | "webp" }> {
    if (svg) {
        if (bytes.length > MAX_BYTES)
            throw new Error("SVG logo is larger than the size budget");
        return { data: bytes, ext: "svg" };
    }
    const data = await webp(
        sharp(bytes).resize(256, 256, {
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        }),
    );
    return { data, ext: "webp" };
}

// Where each kind lands, which assets.json table it fills, and how it is encoded.
const KINDS = {
    headshot: {
        dir: "people",
        encode: async (bytes: Buffer) => ({ data: await headshot(bytes), ext: "webp" }),
    },
    logo: { dir: "orgs", encode: logo },
} as const satisfies Record<
    string,
    {
        dir: keyof AssetFile;
        encode: (bytes: Buffer, svg: boolean) => Promise<{ data: Buffer; ext: string }>;
    }
>;

async function asset(kind: keyof typeof KINDS, args: string[]) {
    const [id, src] = args;
    const licence = flag(args, "licence") as Licence | undefined;
    if (!id || !src || !licence || !LICENCES.includes(licence)) {
        throw new Error(
            `Usage: ${kind} <id> <url|file> --licence ${LICENCES.join("|")}`,
        );
    }
    const { dir, encode } = KINDS[kind];
    const sourceUrl = flag(args, "source-url") ?? src;
    const { bytes, svg } = await load(src);
    const out = await encode(bytes, svg);
    const path = `/${dir}/${id}.${out.ext}`;
    writeFileSync(join(PUBLIC, path), out.data);
    const file: AssetFile = JSON.parse(readFileSync(ASSETS_JSON, "utf8"));
    const credit = flag(args, "credit");
    file[dir][id] = {
        path,
        sourceUrl,
        licence,
        ...(credit ? { credit } : {}),
        retrieved: new Date().toISOString().slice(0, 10),
    };
    writeFileSync(ASSETS_JSON, `${JSON.stringify(file, null, 4)}\n`);
    console.log(`Wrote ${PUBLIC}${path}`);
}

if (import.meta.main) {
    const [command, ...args] = process.argv.slice(2);
    if (command === "headshot" || command === "logo") await asset(command, args);
    else {
        console.error("Commands: headshot, logo");
        process.exit(1);
    }
}
