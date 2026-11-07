// Content negotiation between the HTML page and its markdown twin.

// Highest q the Accept header gives `type`. `explicit` ignores wildcard ranges,
// so a bare `*/*` (browsers, curl) never counts as asking for markdown.
function quality(accept: string, type: string, explicit: boolean): number {
    const [major] = type.split("/");
    const accepted = explicit ? [type] : [type, "*/*", `${major}/*`];
    let best = -1;
    for (const range of accept.split(",")) {
        const [media, ...params] = range.split(";").map((s) => s.trim().toLowerCase());
        if (!media || !accepted.includes(media)) continue;
        best = Math.max(best, qValue(params));
    }
    return best;
}

// RFC 9110: a media range without q= has q=1.
function qValue(params: string[]): number {
    const q = params.find((p) => p.startsWith("q="));
    return q ? Number.parseFloat(q.slice(2)) || 0 : 1;
}

// AI agents that fetch a page to read it (training crawlers and user-triggered
// fetchers). Search-index crawlers are left out on purpose: they read the HTML
// for structured data.
const MARKDOWN_BOTS =
    /\b(GPTBot|ChatGPT-User|ClaudeBot|Claude-User|anthropic-ai|PerplexityBot|Perplexity-User|DeepSeekBot|cohere-ai)\b/i;

export function isMarkdownBot(req: Request): boolean {
    return MARKDOWN_BOTS.test(req.headers.get("user-agent") ?? "");
}

// True when the client named text/markdown and ranks it at least as high as
// text/html, or is a known AI reader.
export function wantsMarkdown(req: Request): boolean {
    const accept = req.headers.get("accept") ?? "";
    const md = quality(accept, "text/markdown", true);
    if (md > 0 && md >= quality(accept, "text/html", false)) return true;
    return isMarkdownBot(req);
}

// Accept-only variant for data endpoints (the REST API): markdown only when the
// client names text/markdown and ranks it at least as high as `rival`. No
// User-Agent sniffing, so API clients always get JSON unless they ask.
export function acceptsMarkdownOver(req: Request, rival: string): boolean {
    const accept = req.headers.get("accept") ?? "";
    const md = quality(accept, "text/markdown", true);
    return md > 0 && md >= quality(accept, rival, false);
}

export const NEGOTIATED_VARY = "Accept, User-Agent";

const CACHE_CONTROL = "public, max-age=300";

export function markdownResponse(body: string, status = 200): Response {
    return new Response(body, {
        status,
        headers: {
            "content-type": "text/markdown; charset=utf-8",
            vary: NEGOTIATED_VARY,
            "cache-control": CACHE_CONTROL,
            "access-control-allow-origin": "*",
        },
    });
}

export function textResponse(
    body: string,
    contentType: string,
    status = 200,
): Response {
    return new Response(body, {
        status,
        headers: {
            "content-type": contentType,
            "cache-control": CACHE_CONTROL,
            "access-control-allow-origin": "*",
        },
    });
}

export function jsonResponse(
    body: unknown,
    contentType = "application/json; charset=utf-8",
    status = 200,
): Response {
    return textResponse(`${JSON.stringify(body, null, 2)}\n`, contentType, status);
}

export function htmlResponse(body: string, status = 200): Response {
    return new Response(body, {
        status,
        headers: {
            "content-type": "text/html; charset=utf-8",
            vary: NEGOTIATED_VARY,
            "cache-control": CACHE_CONTROL,
        },
    });
}
