import { absoluteUrl } from "@/server/site";
import type { Handler } from "@/server/types";
import { ApiError, problemResponse } from "./problem";
import {
    type RateLimitResult,
    clientKey,
    createRateLimiter,
    rateLimitHeaders,
} from "./rate-limit";

// Shared request/response plumbing for every /api endpoint: rate limiting,
// method dispatch (405 + Allow), CORS, version and discovery headers, and
// problem+json for anything that goes wrong.

export const API_VERSION = "1";

export interface ApiContext {
    req: Request;
    url: URL;
    params: Record<string, string>;
}

export type ApiHandler = (ctx: ApiContext) => Response | Promise<Response>;

type MethodMap = Partial<Record<"GET" | "POST", ApiHandler>>;

const limiter = createRateLimiter();

const EXPOSED_HEADERS = [
    "API-Version",
    "Link",
    "RateLimit",
    "RateLimit-Policy",
    "X-RateLimit-Limit",
    "X-RateLimit-Remaining",
    "X-RateLimit-Reset",
    "Retry-After",
    "Deprecation",
    "Sunset",
].join(", ");

const LINK_HEADER = [
    `<${absoluteUrl("/openapi.json")}>; rel="service-desc"; type="application/openapi+json"`,
    `<${absoluteUrl("/docs/api")}>; rel="service-doc"; type="text/html"`,
].join(", ");

export function json(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json; charset=utf-8" },
    });
}

function decorate(res: Response, rl: RateLimitResult | null): Response {
    const h = res.headers;
    h.set("Access-Control-Allow-Origin", "*");
    h.set("Access-Control-Expose-Headers", EXPOSED_HEADERS);
    h.set("API-Version", API_VERSION);
    h.append("Link", LINK_HEADER);
    if (!h.has("Cache-Control")) {
        h.set("Cache-Control", res.status < 300 ? "public, max-age=300" : "no-store");
    }
    if (rl) for (const [k, v] of Object.entries(rateLimitHeaders(rl))) h.set(k, v);
    return res;
}

async function guarded(fn: () => Response | Promise<Response>, path: string) {
    try {
        return await fn();
    } catch (err) {
        if (err instanceof ApiError) return problemResponse(err, path);
        console.error("api: unhandled error", err);
        return problemResponse(
            new ApiError("internal_error", {
                detail: "The server failed to answer this request.",
                hint: "Retry later; if it persists, open an issue on GitHub.",
            }),
            path,
        );
    }
}

// Run `fn` behind the rate limiter and decorate whatever it returns.
function limited(req: Request, fn: () => Response | Promise<Response>) {
    const path = new URL(req.url).pathname;
    const rl = limiter(clientKey(req));
    if (!rl.allowed) {
        const err = new ApiError(
            "rate_limited",
            {
                detail: `Limit of ${rl.limit} requests per minute exceeded.`,
                hint: `Wait ${rl.reset}s (see Retry-After) before retrying.`,
            },
            { "Retry-After": String(rl.reset) },
        );
        return decorate(problemResponse(err, path), rl);
    }
    return guarded(fn, path).then((res) => decorate(res, rl));
}

function preflight(allow: string): Response {
    return decorate(
        new Response(null, {
            status: 204,
            headers: {
                Allow: allow,
                "Access-Control-Allow-Methods": allow,
                "Access-Control-Allow-Headers": "Content-Type, Idempotency-Key, Accept",
                "Access-Control-Max-Age": "86400",
            },
        }),
        null,
    );
}

// Route handler for one API path. Methods not in `methods` get a 405.
export function endpoint(methods: MethodMap): Handler {
    const verbs = Object.keys(methods);
    const allow = [...verbs, ...(methods.GET ? ["HEAD"] : []), "OPTIONS"].join(", ");
    return (req, params) => {
        if (req.method === "OPTIONS") return preflight(allow);
        const verb = req.method === "HEAD" ? "GET" : req.method;
        const fn = methods[verb as keyof MethodMap];
        return limited(req, () => {
            if (!fn) {
                throw new ApiError(
                    "method_not_allowed",
                    {
                        detail: `${req.method} is not supported on this endpoint.`,
                        hint: `Use one of: ${allow}.`,
                    },
                    { Allow: allow },
                );
            }
            return fn({ req, url: new URL(req.url), params });
        });
    };
}

// Catch-all for /api/* paths that match no endpoint: never the SPA shell.
export const unknownEndpoint: Handler = (req) =>
    limited(req, () => {
        throw new ApiError("unknown_endpoint", {
            detail: `No API endpoint at ${new URL(req.url).pathname}.`,
            hint: "GET /api lists every endpoint; the full contract is /openapi.json.",
        });
    });
