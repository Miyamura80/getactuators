import { renderDocsHtml, renderDocsMarkdown } from "@/api/docs/render";
import type { Route } from "../types";

// Developer docs for the REST API: HTML at /docs/api, Markdown twin at
// /docs/api.md, and the conventional /docs and /developers entry points.

let html: string | null = null;
let markdown: string | null = null;

const CACHE = "public, max-age=300";

function markdownResponse(): Response {
    markdown ??= renderDocsMarkdown();
    return new Response(markdown, {
        headers: {
            "Content-Type": "text/markdown; charset=utf-8",
            "Cache-Control": CACHE,
            Link: '</docs/api>; rel="canonical"',
            Vary: "Accept",
        },
    });
}

function prefersMarkdown(req: Request): boolean {
    const accept = req.headers.get("accept") ?? "";
    return accept.includes("text/markdown") && !accept.includes("text/html");
}

const redirect = (to: string) => () =>
    new Response(null, { status: 301, headers: { Location: to } });

export const routes: Route[] = [
    {
        method: "GET",
        path: "/docs/api",
        handler: (req) => {
            if (prefersMarkdown(req)) return markdownResponse();
            html ??= renderDocsHtml();
            return new Response(html, {
                headers: {
                    "Content-Type": "text/html; charset=utf-8",
                    "Cache-Control": CACHE,
                    Link: '</docs/api.md>; rel="alternate"; type="text/markdown", </openapi.json>; rel="service-desc"',
                    Vary: "Accept",
                },
            });
        },
    },
    { method: "GET", path: "/docs/api.md", handler: markdownResponse },
    { method: "GET", path: "/docs/api/", handler: redirect("/docs/api") },
    { method: "GET", path: "/docs", handler: redirect("/docs/api") },
    { method: "GET", path: "/docs/", handler: redirect("/docs/api") },
    { method: "GET", path: "/developers", handler: redirect("/docs/api") },
    { method: "GET", path: "/developers/", handler: redirect("/docs/api") },
];
