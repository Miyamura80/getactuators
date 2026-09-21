// Resize every self-hosted product photo to a web-friendly size and re-encode
// it as WebP, then rewrite the dataset's image_url paths to match. The fetch
// workflow saves whatever a manufacturer CDN serves (often 1-2 MB PNGs), but
// the gallery only ever renders these in small tiles, so shipping the full
// resolution wastes bytes on every visit. Idempotent: an image already at or
// below the target just re-encodes to the same WebP file.
import {
    readFileSync,
    readdirSync,
    statSync,
    unlinkSync,
    writeFileSync,
} from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const DATA = "frontend/src/data/actuators.json";
const OUT_DIR = "frontend/public/actuator-images";
const PUBLIC_PREFIX = "/actuator-images";
const MAX_EDGE = 800; // px; comfortably larger than any tile the gallery draws
const QUALITY = 80;

interface Actuator {
    id: string;
    image_url?: string | null;
    [key: string]: unknown;
}

// Raster formats we re-encode. SVG is vector (already tiny, scales freely) so
// it is left untouched if one ever lands in the directory.
const RASTER = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif"]);

function extOf(file: string): string {
    return file.slice(file.lastIndexOf(".") + 1).toLowerCase();
}

function baseOf(file: string): string {
    return file.slice(0, file.lastIndexOf("."));
}

// Convert one file to <base>.webp (bounded to MAX_EDGE), drop the original if
// its name changed, and return the new basename. Null for non-raster inputs.
async function toWebp(file: string): Promise<string | null> {
    if (!RASTER.has(extOf(file))) return null;
    const src = join(OUT_DIR, file);
    // A WebP already within bounds is left byte-for-byte as is, so repeated
    // runs never re-encode (and progressively degrade) the same photo.
    if (extOf(file) === "webp") {
        const meta = await sharp(src).metadata();
        const w = meta.width ?? 0;
        const h = meta.height ?? 0;
        if (w > 0 && h > 0 && w <= MAX_EDGE && h <= MAX_EDGE) return file;
    }
    const target = `${baseOf(file)}.webp`;
    const buf = await sharp(src)
        .rotate() // honour EXIF orientation before metadata is dropped
        .resize(MAX_EDGE, MAX_EDGE, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toBuffer();
    writeFileSync(join(OUT_DIR, target), buf);
    if (file !== target) unlinkSync(src);
    return target;
}

async function main(): Promise<void> {
    const files = readdirSync(OUT_DIR).filter((f) => !f.startsWith("."));
    let before = 0;
    let after = 0;
    // id -> new basename, so image_url can be rewritten even when the
    // extension changes (png/jpg -> webp).
    const byId = new Map<string, string>();
    for (const file of files) {
        const srcSize = statSync(join(OUT_DIR, file)).size;
        // Skip and log a single unprocessable image (corrupt download, lying
        // content-type) rather than aborting and losing the whole batch's
        // freshly fetched, valid images.
        let out: string | null;
        try {
            out = await toWebp(file);
        } catch (err) {
            console.warn(`skip ${file}: ${(err as Error).message}`);
            continue;
        }
        if (!out) continue;
        before += srcSize;
        after += statSync(join(OUT_DIR, out)).size;
        byId.set(baseOf(out), out);
        console.log(`${file} -> ${out}`);
    }

    const rows = JSON.parse(readFileSync(DATA, "utf8")) as Actuator[];
    for (const row of rows) {
        const out = byId.get(row.id);
        if (out) row.image_url = `${PUBLIC_PREFIX}/${out}`;
    }
    writeFileSync(DATA, `${JSON.stringify(rows, null, 2)}\n`);

    const mb = (n: number) => (n / 1_000_000).toFixed(2);
    console.log(
        `\n=== ${byId.size} images optimized: ${mb(before)} MB -> ${mb(after)} MB ===`,
    );
}

await main();
