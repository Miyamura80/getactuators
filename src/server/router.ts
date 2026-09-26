import type { Route } from "./types";

interface CompiledRoute {
    route: Route;
    regex: RegExp;
    keys: string[];
}

function compile(route: Route): CompiledRoute {
    const keys: string[] = [];
    // "*" matches every path (host-level routes such as the legacy redirect).
    if (route.path === "*") return { route, regex: /^/, keys };
    const pattern = route.path
        .split("/")
        .map((seg) => {
            if (seg.startsWith(":")) {
                keys.push(seg.slice(1));
                return "([^/]+)";
            }
            return seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        })
        .join("/");
    return { route, regex: new RegExp(`^${pattern}$`), keys };
}

function methodMatches(route: Route, method: string): boolean {
    if (!route.method) return true;
    const allowed = Array.isArray(route.method) ? route.method : [route.method];
    // HEAD is answered by the GET handler (Bun strips the body).
    return allowed.includes(method) || (method === "HEAD" && allowed.includes("GET"));
}

export interface RouteMatch {
    route: Route;
    params: Record<string, string>;
}

export function createRouter(routes: Route[]): (req: Request) => RouteMatch[] {
    const compiled = routes.map(compile);
    return (req) => {
        const url = new URL(req.url);
        const out: RouteMatch[] = [];
        for (const c of compiled) {
            if (!methodMatches(c.route, req.method)) continue;
            const m = c.regex.exec(url.pathname);
            if (!m) continue;
            const params: Record<string, string> = {};
            c.keys.forEach((k, i) => {
                params[k] = decodeURIComponent(m[i + 1] ?? "");
            });
            out.push({ route: c.route, params });
        }
        return out;
    };
}
