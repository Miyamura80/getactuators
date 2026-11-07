import {
    type ApiContext,
    type ApiHandler,
    endpoint,
    unknownEndpoint,
} from "@/api/http";
import type { Operation } from "@/api/operations";
import { API_INDEX, API_OPERATIONS, OPENAPI_DOC } from "@/api/surface";
import { absoluteUrl } from "@/server/site";
import { apiMarkdown, hasApiMarkdown } from "../agent/api-md";
import { acceptsMarkdownOver } from "../agent/negotiate";
import { createRouter } from "../router";
import type { Handler, Route } from "../types";

// Public read-only REST API (/api, /api/v1/*, /openapi.json). Routes are
// generated from the operation list so the spec and the server always agree.
//
// Every GET operation with a markdown renderer also answers as markdown:
//   <path>.md (query string kept)          -> markdown twin
//   Accept: text/markdown ranked >= JSON   -> markdown twin on the JSON URL
// Unknown or malformed .md paths fall through to the JSON 404 catch-all.

function markdownRes(body: string, jsonUrl: URL): Response {
    return new Response(body, {
        headers: {
            "Content-Type": "text/markdown; charset=utf-8",
            Vary: "Accept",
            Link: `<${absoluteUrl(`${jsonUrl.pathname}${jsonUrl.search}`)}>; rel="alternate"; type="application/json"`,
        },
    });
}

// The GET handler of `op`, negotiating JSON vs markdown on the Accept header.
function negotiated(op: Operation): ApiHandler {
    if (!hasApiMarkdown(op.operationId)) return op.handler;
    return async (ctx) => {
        if (acceptsMarkdownOver(ctx.req, "application/json")) {
            return markdownRes(apiMarkdown(op.operationId, ctx), ctx.url);
        }
        const res = await op.handler(ctx);
        res.headers.append("Vary", "Accept");
        return res;
    };
}

function groupByPath(): Map<string, Partial<Record<"GET" | "POST", ApiHandler>>> {
    const byPath = new Map<string, Partial<Record<"GET" | "POST", ApiHandler>>>();
    for (const op of API_OPERATIONS) {
        const handler = op.method === "GET" ? negotiated(op) : op.handler;
        byPath.set(op.path, { ...byPath.get(op.path), [op.method]: handler });
    }
    return byPath;
}

const operationRoutes: Route[] = [...groupByPath()].map(([path, methods]) => ({
    path,
    handler: endpoint(methods),
}));

const indexHandler = negotiated(API_INDEX);

// Aliases for the index and the spec.
const aliasRoutes: Route[] = [
    { path: "/api/", handler: endpoint({ GET: indexHandler }) },
    { path: "/api/v1", handler: endpoint({ GET: indexHandler }) },
    { path: "/api/v1/", handler: endpoint({ GET: indexHandler }) },
    { path: "/api/openapi.json", handler: endpoint({ GET: OPENAPI_DOC.handler }) },
];

// `.md` twins: strip the suffix, match the remaining path against the GET
// operations that have a renderer, and answer through the same endpoint
// plumbing (rate limit, CORS, 405, problem+json errors).
const twinOps: { path: string; operationId: string }[] = [
    ...API_OPERATIONS.filter((op) => op.method === "GET"),
    { path: "/api/v1", operationId: API_INDEX.operationId },
].filter((op) => hasApiMarkdown(op.operationId));

const matchTwin = createRouter(
    twinOps.map((op) => ({ path: op.path, handler: () => null })),
);

const twin: Handler = (req) => {
    const url = new URL(req.url);
    if (!url.pathname.endsWith(".md")) return null;
    const jsonUrl = new URL(url);
    jsonUrl.pathname = url.pathname.slice(0, -".md".length);
    const [hit] = matchTwin(new Request(jsonUrl));
    const op = hit && twinOps.find((o) => o.path === hit.route.path);
    if (!hit || !op) return null;
    const render = (ctx: ApiContext) =>
        markdownRes(apiMarkdown(op.operationId, { ...ctx, url: jsonUrl }), jsonUrl);
    return endpoint({ GET: render })(req, hit.params);
};

// Twins run before the operation routes: `/api/v1/actuators/:id` would
// otherwise take `/api/v1/actuators/compare.md` as an id.
const twinRoutes: Route[] = [
    "/api.md",
    "/api/:p0",
    "/api/:p0/:p1",
    "/api/:p0/:p1/:p2",
    "/api/:p0/:p1/:p2/:p3",
].map((path) => ({ path, handler: twin }));

// Any other /api/* path (up to 8 segments) is a JSON 404, never the SPA shell.
// Must stay last: routes are tried in order and these match everything.
const catchAllRoutes: Route[] = Array.from({ length: 8 }, (_, depth) => ({
    path: `/api${Array.from({ length: depth + 1 }, (_, i) => `/:p${i}`).join("")}`,
    handler: unknownEndpoint,
}));

export const routes: Route[] = [
    ...twinRoutes,
    ...operationRoutes,
    ...aliasRoutes,
    ...catchAllRoutes,
];
