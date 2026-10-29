import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

// The 3D kit's bundle contract: three.js, R3F and the part library ship only
// in lazy chunks under 250 KB gzipped, and the entry chunk every page loads
// carries none of it.

const BUDGET = 250 * 1024;
const out = mkdtempSync(join(tmpdir(), "x3-bundle-"));
let chunks: Map<string, string>;
let entry: string;

beforeAll(async () => {
    const build = Bun.spawn(
        [process.execPath, "node_modules/vite/bin/vite.js", "build", "--outDir", out, "--emptyOutDir", "--logLevel", "error"],
        { cwd: `${import.meta.dir}/..`, stdout: "pipe", stderr: "pipe", env: { ...process.env, NODE_ENV: "production" } },
    );
    const [stderr, exit] = await Promise.all([new Response(build.stderr).text(), build.exited]);
    if (exit !== 0) throw new Error(stderr);
    const assets = join(out, "assets");
    chunks = new Map(
        readdirSync(assets)
            .filter((f) => f.endsWith(".js"))
            .map((f) => [f, readFileSync(join(assets, f), "utf8")]),
    );
    const html = readFileSync(join(out, "index.html"), "utf8");
    const src = /<script[^>]+src="\/assets\/([^"]+\.js)"/.exec(html)?.[1];
    if (!src) throw new Error("no entry script in index.html");
    entry = src;
}, 180_000);

afterAll(() => rmSync(out, { recursive: true, force: true }));

const gz = (code: string) => gzipSync(code).length;

// Chunks that hold the renderer, plus every chunk that imports one of them.
function threeChunks(): string[] {
    const set = new Set([...chunks].filter(([, c]) => c.includes("WebGLRenderer")).map(([f]) => f));
    let grew = true;
    while (grew) {
        grew = false;
        for (const [f, code] of chunks) {
            if (f === entry || set.has(f)) continue;
            if ([...set].some((dep) => code.includes(`./${dep}`))) {
                set.add(f);
                grew = true;
            }
        }
    }
    return [...set];
}

test("the entry chunk carries no three.js and no kit code", () => {
    const code = chunks.get(entry) ?? "";
    expect(code.length).toBeGreaterThan(0);
    expect(code.includes("WebGLRenderer")).toBe(false);
    expect(code.includes("lamination-stack")).toBe(false);
    expect(code.includes("x3-chip")).toBe(false);
    // The markers are real: the kit's own chunks do contain them.
    const rest = [...chunks].filter(([f]) => f !== entry).map(([, c]) => c).join("");
    expect(rest.includes("lamination-stack") && rest.includes("x3-chip")).toBe(true);
});

test("the lazy 3D chunks stay under 250 KB gzipped", () => {
    const three = threeChunks();
    expect(three.length).toBeGreaterThan(0);
    expect(three).not.toContain(entry);
    const total = three.reduce((n, f) => n + gz(chunks.get(f) ?? ""), 0);
    expect(total).toBeLessThanOrEqual(BUDGET);
});
