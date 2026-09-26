import { type Registry, loadRegistry } from "./registry";
import { createRouter } from "./router";
import { serveAsset, serveSpaShell } from "./static";

export type FetchHandler = (req: Request) => Promise<Response>;

// Request pipeline: registered routes (in order, first non-null wins), then a
// built static asset, then the SPA shell. Response hooks run on all of them.
export function createHandler(registry: Registry): FetchHandler {
    const match = createRouter(registry.routes);
    const resolve = async (req: Request): Promise<Response> => {
        for (const { route, params } of match(req)) {
            const res = await route.handler(req, params);
            if (res) return res;
        }
        if (req.method === "GET" || req.method === "HEAD") {
            const asset = await serveAsset(new URL(req.url).pathname);
            if (asset) return asset;
        }
        return serveSpaShell();
    };
    return async (req) => {
        let res = await resolve(req);
        for (const hook of registry.hooks) res = await hook(req, res);
        return res;
    };
}

export async function startServer(port: number): Promise<void> {
    const handler = createHandler(await loadRegistry());
    Bun.serve({ port, fetch: handler });
}
