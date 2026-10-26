// Asset pipeline for the people registry (src/people). Three commands:
//
//   bun scripts/people-assets.ts headshot <personId> <url|file> --licence consent [--credit "..."] [--source-url <url>]
//   bun scripts/people-assets.ts logo <orgId> <url|file> --licence press-kit [--credit "..."] [--source-url <url>]
//   bun scripts/people-assets.ts contributions
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
// contributions: counts each person's commits and squash-merged PRs from git
// history (author or Co-authored-by trailer) into src/people/contributions.json.
//
// Only use images the person consented to or the organisation publishes for
// identification. Never scrape LinkedIn photos.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { PEOPLE, githubLogin } from "../src/people";
import type { Contribution, ImageAsset, Licence } from "../src/people/types";

// Image hosts the pipeline refuses. OPEN QUESTION (#85): whether
// media.licdn.com (LinkedIn photos) may ever be a source is for the owner to
// decide; until then it stays blocked, matching the rule above.
export const BLOCKED_IMAGE_HOSTS = ["media.licdn.com"];

export function blockedImageHost(url: string): string | undefined {
    if (!/^https?:\/\//.test(url)) return undefined;
    const host = new URL(url).hostname.toLowerCase();
    return BLOCKED_IMAGE_HOSTS.find((h) => host === h || host.endsWith(`.${h}`));
}

const ASSETS_JSON = "src/people/assets.json";
const CONTRIBUTIONS_JSON = "src/people/contributions.json";
const PUBLIC = "frontend/public";
export const MAX_BYTES = 80 * 1024;
const LICENCES: Licence[] = [
    "consent",
    "press-kit",
    "cc-by",
    "cc-by-sa",
    "public-domain",
    "own",
];

type AssetFile = {
    people: Record<string, ImageAsset>;
    orgs: Record<string, ImageAsset>;
};

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

async function asset(kind: "headshot" | "logo", args: string[]) {
    const [id, src] = args;
    const licence = flag(args, "licence") as Licence | undefined;
    if (!id || !src || !licence || !LICENCES.includes(licence)) {
        throw new Error(
            `Usage: ${kind} <id> <url|file> --licence ${LICENCES.join("|")}`,
        );
    }
    const sourceUrl = flag(args, "source-url") ?? src;
    for (const url of [src, sourceUrl]) {
        const blocked = blockedImageHost(url);
        if (blocked) throw new Error(`${blocked} is not an allowed image source`);
    }
    const { bytes, svg } = await load(src);
    const file: AssetFile = JSON.parse(readFileSync(ASSETS_JSON, "utf8"));
    let path: string;
    if (kind === "headshot") {
        path = `/people/${id}.webp`;
        writeFileSync(join(PUBLIC, path), await headshot(bytes));
    } else {
        const out = await logo(bytes, svg);
        path = `/orgs/${id}.${out.ext}`;
        writeFileSync(join(PUBLIC, path), out.data);
    }
    const credit = flag(args, "credit");
    const record: ImageAsset = {
        path,
        sourceUrl,
        licence,
        ...(credit ? { credit } : {}),
        retrieved: new Date().toISOString().slice(0, 10),
    };
    file[kind === "headshot" ? "people" : "orgs"][id] = record;
    writeFileSync(ASSETS_JSON, `${JSON.stringify(file, null, 4)}\n`);
    console.log(`Wrote ${PUBLIC}${path}`);
}

function git(args: string[]): string {
    const out = Bun.spawnSync(["git", ...args]);
    if (out.exitCode !== 0) throw new Error(out.stderr.toString());
    return out.stdout.toString();
}

function contributions() {
    const SEP = "\u001f";
    const log = git([
        "log",
        `--format=%ad${SEP}%ae${SEP}%s${SEP}%(trailers:key=Co-authored-by,valueonly,separator=;)`,
        "--date=short",
    ]);
    const people: Record<string, Contribution> = {};
    for (const person of PEOPLE) {
        const login = githubLogin(person);
        const emails = new Set((person.gitEmails ?? []).map((e) => e.toLowerCase()));
        const matches = (email: string) => {
            const e = email.toLowerCase();
            if (emails.has(e)) return true;
            return Boolean(
                login &&
                    new RegExp(
                        `^(\\d+\\+)?${login.toLowerCase()}@users\\.noreply\\.github\\.com$`,
                    ).test(e),
            );
        };
        const dates: string[] = [];
        let pullRequests = 0;
        for (const line of log.split("\n").filter(Boolean)) {
            const [date = "", author = "", subject = "", trailers = ""] =
                line.split(SEP);
            const coAuthors = [...trailers.matchAll(/<([^>]+)>/g)].map(
                (m) => m[1] ?? "",
            );
            if (!matches(author) && !coAuthors.some(matches)) continue;
            dates.push(date);
            if (/\(#\d+\)\s*$/.test(subject)) pullRequests++;
        }
        if (!dates.length) continue;
        dates.sort();
        people[person.id] = {
            commits: dates.length,
            pullRequests,
            first: dates[0] ?? "",
            last: dates[dates.length - 1] ?? "",
        };
    }
    const asOf = git(["log", "-1", "--format=%cd", "--date=short"]).trim();
    writeFileSync(CONTRIBUTIONS_JSON, `${JSON.stringify({ asOf, people }, null, 4)}\n`);
    console.log(
        `Wrote ${CONTRIBUTIONS_JSON}: ${Object.keys(people).length} people with commits`,
    );
}

if (import.meta.main) {
    const [command, ...args] = process.argv.slice(2);
    if (command === "headshot" || command === "logo") await asset(command, args);
    else if (command === "contributions") contributions();
    else {
        console.error("Commands: headshot, logo, contributions");
        process.exit(1);
    }
}
