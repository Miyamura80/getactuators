import { type FetchHandler, createHandler } from "@/server/app";
import { loadRegistry } from "@/server/registry";
import { SITE_URL } from "@/server/site";

// Shared fixture for the agent-surface tests: one handler built from the real
// route registry, plus small request helpers.

let handler: FetchHandler | null = null;

async function getHandler(): Promise<FetchHandler> {
    handler ??= createHandler(await loadRegistry());
    return handler;
}

export async function get(path: string, headers: Record<string, string> = {}) {
    const h = await getHandler();
    return h(new Request(`http://localhost${path}`, { headers }));
}

export async function getMarkdown(path: string) {
    return get(path, { accept: "text/markdown" });
}

// Paths the other agent-readiness PRs own (REST API, MCP). Links to them are
// checked by those PRs' tests, not here.
const EXTERNAL = [
    /^\/api(\/|$)/,
    /^\/mcp(\/|$)/,
    /^\/openapi\.json$/,
    /^\/docs\/api/,
    /^\/\.well-known\/mcp/,
];

export function isOwnedPath(path: string): boolean {
    return !EXTERNAL.some((r) => r.test(path));
}

// Same-site paths of every markdown link in `text`.
export function siteLinks(text: string): string[] {
    const out = new Set<string>();
    for (const m of text.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)) {
        const url = m[1] ?? "";
        if (url.startsWith(SITE_URL)) out.add(url.slice(SITE_URL.length) || "/");
    }
    return [...out];
}

export function expectFrontmatter(md: string): void {
    const m = /^---\n([\s\S]*?)\n---\n# \S/.exec(md);
    if (!m) throw new Error(`missing frontmatter + H1:\n${md.slice(0, 200)}`);
    for (const key of ["title:", "description:", "canonical:", "last-updated:"]) {
        if (!m[1]?.includes(key)) throw new Error(`frontmatter lacks ${key}`);
    }
    const fences = md.split("\n").filter((l) => /^\s*(```|~~~)/.test(l)).length;
    if (fences % 2 !== 0) throw new Error("unbalanced code fences");
}

// Visible text of an HTML fragment (tags stripped, whitespace collapsed).
export function visibleText(html: string): string {
    return html
        .replace(/<script[\s\S]*?<\/script>/g, "")
        .replace(/<style[\s\S]*?<\/style>/g, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}
