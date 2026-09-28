import { SITE_URL } from "../site";
import type { Route } from "../types";

// The site moved from getactuators.com to actuatorlist.com. Requests that
// arrive on an old or non-canonical host are sent to the canonical origin with
// the same path and query. This module sorts first so it runs before any other
// route. GET and HEAD get a 301; other methods get a 308 so MCP and API POSTs
// keep their method and body.

const CANONICAL = new URL(SITE_URL);

const LEGACY_HOSTS = new Set([
    "getactuators.com",
    "www.getactuators.com",
    "www.actuatorlist.com",
]);

// Host as the client sent it: the first X-Forwarded-Host value when a proxy
// set one, else Host. Lowercased, port stripped.
function requestHost(req: Request): string {
    const forwarded = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
    const raw = forwarded || req.headers.get("host") || new URL(req.url).host;
    return raw.toLowerCase().replace(/:\d+$/, "");
}

function legacyRedirect(req: Request): Response | null {
    const host = requestHost(req);
    if (!LEGACY_HOSTS.has(host) || host === CANONICAL.hostname) return null;
    const { pathname, search } = new URL(req.url);
    const location = `${CANONICAL.origin}${pathname}${search}`;
    const status = req.method === "GET" || req.method === "HEAD" ? 301 : 308;
    return new Response(null, { status, headers: { location } });
}

export const routes: Route[] = [{ path: "*", handler: legacyRedirect }];
