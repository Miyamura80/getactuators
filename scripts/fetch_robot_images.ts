// Self-host the robot photos. Each robot's image_url starts as the absolute
// URL of the manufacturer's own product photo; this downloads it, resizes it to
// a WebP under frontend/public/robot-images and rewrites image_url to the local
// path, so the robots section never hotlinks a CDN that can rotate or block.
// A robot with no image_url gets its product page's share image (og:image)
// instead. Robots already pointing at a local path are skipped. Meant to run where
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

async function main(): Promise<void> {
    // Rewrite URLs in the raw text rather than re-serialising, so the file's
    // hand-kept layout (one-line joint rows) survives.
    let raw = readFileSync(DATA, "utf8");
    const data = JSON.parse(raw) as { robots: Robot[] };
    mkdirSync(OUT_DIR, { recursive: true });
    let saved = 0;
    const failed: string[] = [];
    for (const robot of data.robots) {
        const listed = robot.image_url;
        if (listed && !/^https?:\/\//.test(listed)) continue;
        const src =
            listed ?? (robot.product_url && (await shareImage(robot.product_url)));
        if (!src) {
            failed.push(`${robot.id}: no image_url and no share image`);
            continue;
        }
        const buf = await download(src, robot.product_url);
        if (!buf) {
            failed.push(`${robot.id}: ${src}`);
            continue;
        }
        try {
            const out = await sharp(buf)
                .rotate()
                .resize(MAX_EDGE, MAX_EDGE, { fit: "inside", withoutEnlargement: true })
                .webp({ quality: QUALITY })
                .toBuffer();
            writeFileSync(join(OUT_DIR, `${robot.id}.webp`), out);
            raw = raw.replace(
                JSON.stringify(src),
                JSON.stringify(`${PUBLIC_PREFIX}/${robot.id}.webp`),
            );
            saved++;
        } catch {
            failed.push(`${robot.id}: not a decodable image (${src})`);
        }
    }
    writeFileSync(DATA, raw);
    console.log(`Robot photos: ${saved} saved to ${OUT_DIR}`);
    for (const f of failed) console.log(`  kept remote URL for ${f}`);
}

await main();
