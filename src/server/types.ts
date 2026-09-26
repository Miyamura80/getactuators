// A route handler returns a Response, or null to let the next matching route
// (and finally the static/SPA fallback) handle the request.
export type Handler = (
    req: Request,
    params: Record<string, string>,
) => Response | null | Promise<Response | null>;

export interface Route {
    // Omit to match every method.
    method?: string | string[];
    // Exact path ("/llms.txt"), a pattern with :params ("/api/v1/actuators/:id"),
    // or "*" to match every path.
    path: string;
    handler: Handler;
}

// Runs on every response the server produces (routes and static files alike),
// e.g. to add Link headers. Must return the response to send.
export type ResponseHook = (
    req: Request,
    res: Response,
) => Response | Promise<Response>;

// Shape of each module under src/server/routes/. The registry auto-discovers
// these, so a new surface is a new file, never an edit to a shared list.
export interface RouteModule {
    routes?: Route[];
    hooks?: ResponseHook[];
}
