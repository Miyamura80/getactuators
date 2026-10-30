import type { Route } from "../types";

// Pages that moved. /all (the spec table) merged into /actuators as its List
// view, so old links and bookmarks land on that view with their filters,
// sort and selection intact. A 301 lets search engines move the ranking too.

function moved(req: Request, to: string, extra?: [string, string]): Response {
    const params = new URLSearchParams(new URL(req.url).search);
    if (extra) params.set(...extra);
    const q = params.toString();
    return new Response(null, {
        status: 301,
        headers: { location: `${to}${q ? `?${q}` : ""}` },
    });
}

export const routes: Route[] = [
    {
        method: "GET",
        path: "/all",
        handler: (req) => moved(req, "/actuators", ["view", "list"]),
    },
    { method: "GET", path: "/all.md", handler: (req) => moved(req, "/actuators.md") },
];
