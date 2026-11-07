// Self-host the robot photos. Each robot's image_url starts as the absolute
// URL of the manufacturer's own product photo; this downloads it, resizes it to
// a WebP under frontend/public/robot-images and rewrites image_url to the local
// path, so the robots section never hotlinks a CDN that can rotate or block.
// A robot with no image_url key gets its product page's share image
// (og:image) instead; an explicit null opts out and keeps the rendered art. Robots already pointing at a local path are skipped. Meant to run where
// outbound HTTPS is open (the fetch-images workflow or a local machine).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const DATA = "frontend/src/data/robots.json";
const OUT_DIR = "frontend/public/robot-images";
const PUBLIC_PREFIX = "/robot-images";
const MAX_EDGE = 800;
const QUALITY = 82;
const MAX_BYTES = 8_000_000;
const UA =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36";

interface Robot {
    id: string;
    product_url: string | null;
    image_url?: string | null;
    // Optional [left, top, width, height] as fractions of the source photo,
    // to cut the robot out of a wider lifestyle shot before resizing.
    image_crop?: [number, number, number, number];
    [key: string]: unknown;
}

async function download(url: string, referer: string | null): Promise<Buffer | null> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 30_000);
    try {
        const headers: Record<string, string> = {
            "User-Agent": UA,
            Accept: "image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8",
        };
        if (referer) headers.Referer = referer;
        const res = await fetch(url, {
            headers,
            redirect: "follow",
            signal: ctrl.signal,
        });
        if (!res.ok) return null;
        const type = res.headers.get("content-type") ?? "";
        if (
            !type.startsWith("image/") &&
            !type.startsWith("application/octet-stream")
        ) {
            return null;
        }
        const buf = Buffer.from(await res.arrayBuffer());
        return buf.length > 0 && buf.length <= MAX_BYTES ? buf : null;
    } catch {
        return null;
    } finally {
        clearTimeout(timer);
    }
}

// The page's own share-card photo, resolved against the page URL.
async function shareImage(pageUrl: string): Promise<string | null> {
    try {
        const res = await fetch(pageUrl, {
            headers: { "User-Agent": UA, Accept: "text/html" },
            redirect: "follow",
            signal: AbortSignal.timeout(30_000),
        });
        if (!res.ok) return null;
        const html = await res.text();
        const tag =
            /<meta[^>]+property=["']og:image["'][^>]*>/i.exec(html)?.[0] ??
            /<meta[^>]+name=["']twitter:image["'][^>]*>/i.exec(html)?.[0];
        const content = tag && /content=["']([^"']+)["']/i.exec(tag)?.[1];
        return content ? new URL(content.replaceAll("&amp;", "&"), res.url).href : null;
    } catch {
        return null;
    }
}

// Where to download this robot's photo from: its listed remote URL, or the
// product page's share image when no image_url key is set. Null when there is
// nothing to fetch (already local, or explicitly opted out with null).
async function photoSource(robot: Robot): Promise<string | null> {
    const listed = robot.image_url;
    if (listed === null) return null;
    if (listed) return /^https?:\/\//.test(listed) ? listed : null;
    return robot.product_url ? shareImage(robot.product_url) : null;
}

// Crop (if asked), resize to a bounded WebP and save it; false when the bytes do not decode.
async function savePhoto(robot: Robot, buf: Buffer): Promise<boolean> {
    try {
        let img = sharp(buf).rotate();
        if (robot.image_crop) {
            const { width = 0, height = 0 } = await sharp(buf).rotate().metadata();
            const [l, t, w, h] = robot.image_crop;
            img = sharp(
                await img
                    .extract({
                        left: Math.round(l * width),
                        top: Math.round(t * height),
                        width: Math.round(w * width),
                        height: Math.round(h * height),
                    })
                    .toBuffer(),
            );
        }
        const out = await img
            .resize(MAX_EDGE, MAX_EDGE, { fit: "inside", withoutEnlargement: true })
            .webp({ quality: QUALITY })
            .toBuffer();
        writeFileSync(join(OUT_DIR, `${robot.id}.webp`), out);
        return true;
    } catch {
        return false;
    }
}

async function main(): Promise<void> {
    // Rewrite URLs in the raw text rather than re-serialising, so the file's
    // hand-kept layout (one-line joint rows) survives.
    let raw = readFileSync(DATA, "utf8");
    const data = JSON.parse(raw) as { robots: Robot[] };
    mkdirSync(OUT_DIR, { recursive: true });
    let saved = 0;
    const failed: string[] = [];
    for (const robot of data.robots) {
        if (
            robot.image_url !== undefined &&
            !/^https?:\/\//.test(robot.image_url ?? "")
        ) {
            continue;
        }
        const src = await photoSource(robot);
        const buf = src ? await download(src, robot.product_url) : null;
        if (!src || !buf || !(await savePhoto(robot, buf))) {
            failed.push(`${robot.id}: ${src ?? "no image_url and no share image"}`);
            continue;
        }
        const local = JSON.stringify(`${PUBLIC_PREFIX}/${robot.id}.webp`);
        const idLine = `"id": ${JSON.stringify(robot.id)},`;
        raw = robot.image_url
            ? raw.replace(JSON.stringify(robot.image_url), local)
            : raw.replace(idLine, `${idLine}\n            "image_url": ${local},`);
        saved++;
    }
    writeFileSync(DATA, raw);
    console.log(`Robot photos: ${saved} saved to ${OUT_DIR}`);
    for (const f of failed) console.log(`  kept remote URL for ${f}`);
}

await main();
