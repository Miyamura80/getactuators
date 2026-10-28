import { existsSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Thin git helpers for the GitHub collector. Repos are cloned bare with
// --filter=blob:none, so only trees and commit metadata download; file
// contents are fetched one blob at a time when a check reads them.

export const CACHE_DIR = process.env.SDK_SIGNALS_CACHE ?? join(tmpdir(), "sdk-signals");

async function run(args: string[], timeoutMs = 180_000): Promise<string | null> {
    const proc = Bun.spawn(["git", ...args], {
        stdout: "pipe",
        stderr: "pipe",
        env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
    });
    const timer = setTimeout(() => proc.kill(), timeoutMs);
    const out = await new Response(proc.stdout).arrayBuffer();
    const code = await proc.exited;
    clearTimeout(timer);
    return code === 0 ? Buffer.from(out).toString("utf8") : null;
}

async function runBytes(args: string[]): Promise<Uint8Array | null> {
    const proc = Bun.spawn(["git", ...args], { stdout: "pipe", stderr: "pipe" });
    const out = new Uint8Array(await new Response(proc.stdout).arrayBuffer());
    return (await proc.exited) === 0 ? out : null;
}

export interface RepoClone {
    dir: string;
    files: string[];
    lastCommit: string;
    commitsSince: number;
}

// Clone the last year of history (or just the tip when the repo has no
// commits that recent) and list the tree at HEAD.
export async function cloneRepo(
    slug: string,
    since: string,
): Promise<RepoClone | null> {
    mkdirSync(CACHE_DIR, { recursive: true });
    const dir = join(CACHE_DIR, `${slug.replace("/", "__")}.git`);
    if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
    const url = `https://github.com/${slug}`;
    const base = ["clone", "--bare", "--filter=blob:none", "--quiet"];
    const cloned =
        (await run([...base, `--shallow-since=${since}`, url, dir])) !== null ||
        (await run([...base, "--depth=1", url, dir])) !== null;
    if (!cloned) return null;
    const tree = await run(["-C", dir, "ls-tree", "-r", "--name-only", "HEAD"]);
    const last = await run(["-C", dir, "log", "-1", "--format=%cI", "HEAD"]);
    const count = await run([
        "-C",
        dir,
        "rev-list",
        "--count",
        `--since=${since}`,
        "HEAD",
    ]);
    if (tree === null || last === null) return null;
    return {
        dir,
        files: tree.split("\n").filter(Boolean),
        lastCommit: last.trim().slice(0, 10),
        commitsSince: Number(count?.trim() ?? 0),
    };
}

export async function readBlob(dir: string, path: string): Promise<Uint8Array | null> {
    return runBytes(["-C", dir, "cat-file", "-p", `HEAD:${path}`]);
}

// Text of a PDF via poppler's pdftotext when it is installed; null otherwise.
export async function pdfText(bytes: Uint8Array): Promise<string | null> {
    if (!Bun.which("pdftotext")) return null;
    const proc = Bun.spawn(["pdftotext", "-q", "-l", "80", "-", "-"], {
        stdin: bytes,
        stdout: "pipe",
        stderr: "pipe",
    });
    const text = await new Response(proc.stdout).text();
    return (await proc.exited) === 0 ? text : null;
}
