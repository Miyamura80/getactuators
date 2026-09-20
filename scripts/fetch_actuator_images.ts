// Fetch one product photo per actuator from the pages we already cite, and
// self-host it under frontend/public so the app never hotlinks a manufacturer
// CDN. Reads share-card meta tags (og:image / twitter:image / link image_src)
// from product_url, falling back to source_url. Writes image_url back into the
// dataset. Meant to run where outbound HTTPS is open (CI or a local machine);
// the hosted remote session's egress policy blocks manufacturer hosts.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DATA = "frontend/src/data/actuators.json";
const OVERRIDES = "scripts/image_overrides.json";
const OUT_DIR = "frontend/public/actuator-images";
const PUBLIC_PREFIX = "/actuator-images";
const MAX_BYTES = 2_000_000;
const UA =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36";

interface Actuator {
    id: string;
    brand: string;
    product_url: string | null;
    source_url: string | null;
    image_url?: string | null;
    [key: string]: unknown;
}

const EXT_BY_TYPE: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
    "image/svg+xml": "svg",
};

async function get(
    url: string,
    accept: string,
    referer?: string,
): Promise<Response | null> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 30_000);
    try {
        const headers: Record<string, string> = { "User-Agent": UA, Accept: accept };
        // A Referer defeats the hotlink/bot protection some image CDNs apply to
        // a bare cross-origin request from a datacenter IP.
        if (referer) headers.Referer = referer;
        const res = await fetch(url, {
            headers,
            redirect: "follow",
            signal: ctrl.signal,
        });
        return res.ok ? res : null;
    } catch {
        return null;
    } finally {
        clearTimeout(timer);
    }
}

function attr(tag: string, name: string): string | null {
    const m = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i"));
    return m?.[1] ?? null;
}

// Best-to-worst image candidate from a page's HTML, resolved to an absolute URL.
function pickImage(html: string, base: string): string | null {
    const metas = html.match(/<meta[^>]+>/gi) ?? [];
    const byKey = (needle: string): string | null => {
        for (const tag of metas) {
            const key = (
                attr(tag, "property") ??
                attr(tag, "name") ??
                ""
            ).toLowerCase();
            if (key === needle) {
                const content = attr(tag, "content");
                if (content) return content;
            }
        }
        return null;
    };
    const raws: Array<string | null> = [
        byKey("og:image:secure_url"),
        byKey("og:image"),
        byKey("twitter:image"),
        byKey("twitter:image:src"),
    ];
    const link = html.match(/<link[^>]+rel=["']image_src["'][^>]*>/i)?.[0];
    if (link) raws.push(attr(link, "href"));

    for (const raw of raws) {
        if (!raw) continue;
        try {
            const abs = new URL(raw, base).toString();
            if (/^https?:\/\//.test(abs)) return abs;
        } catch {
            // skip malformed candidate
        }
    }
    return null;
}

async function download(
    url: string,
    id: string,
    referer?: string,
): Promise<string | null> {
    const res = await get(url, "image/*", referer);
    if (!res) return null;
    const type = ((res.headers.get("content-type") ?? "").split(";")[0] ?? "")
        .trim()
        .toLowerCase();
    const ext = EXT_BY_TYPE[type];
    if (!ext) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.byteLength === 0 || buf.byteLength > MAX_BYTES) return null;
    const file = `${id}.${ext}`;
    writeFileSync(join(OUT_DIR, file), buf);
    return `${PUBLIC_PREFIX}/${file}`;
}

function loadOverrides(): Record<string, string> {
    try {
        return JSON.parse(readFileSync(OVERRIDES, "utf8")) as Record<string, string>;
    } catch {
        return {};
    }
}

// A photo already committed for this id, if any (keeps re-runs idempotent).
function existingFile(id: string): string | null {
    for (const ext of new Set(Object.values(EXT_BY_TYPE))) {
        if (existsSync(join(OUT_DIR, `${id}.${ext}`)))
            return `${PUBLIC_PREFIX}/${id}.${ext}`;
    }
    return null;
}

// Crawl a row's cited pages for a product photo and self-host the first hit.
async function fetchForRow(row: Actuator): Promise<string | null> {
    const pages = [row.product_url, row.source_url].filter(Boolean) as string[];
    for (const page of pages) {
        const res = await get(page, "text/html,application/xhtml+xml");
        if (!res) continue;
        const candidate = pickImage(await res.text(), res.url || page);
        if (!candidate) continue;
        const saved = await download(candidate, row.id, page);
        if (saved) return saved;
    }
    return null;
}

// Resolve one row's photo: a manual override wins, then a photo already on
// disk (so re-runs do not re-crawl the whole set), then a fresh page crawl.
async function resolveImage(
    row: Actuator,
    overrides: Record<string, string>,
): Promise<string | null> {
    const override = overrides[row.id];
    if (override) {
        const referer = row.product_url ?? row.source_url ?? undefined;
        const saved = await download(override, row.id, referer);
        if (saved) return saved;
    }
    const existing = existingFile(row.id);
    if (existing && row.image_url) return existing;
    return fetchForRow(row);
}

async function main(): Promise<void> {
    if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
    const rows = JSON.parse(readFileSync(DATA, "utf8")) as Actuator[];
    const overrides = loadOverrides();

    let hit = 0;
    for (const row of rows) {
        const saved = await resolveImage(row, overrides);
        row.image_url = saved;
        if (saved) hit++;
        console.log(`${saved ? "OK " : "-- "} ${row.id}${saved ? ` -> ${saved}` : ""}`);
    }

    writeFileSync(DATA, `${JSON.stringify(rows, null, 2)}\n`);
    console.log(`\n=== saved ${hit}/${rows.length} product photos ===`);
}

await main();
