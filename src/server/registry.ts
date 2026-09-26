import { join } from "node:path";
import type { ResponseHook, Route, RouteModule } from "./types";

const ROUTES_DIR = join(import.meta.dir, "routes");

export interface Registry {
    routes: Route[];
    hooks: ResponseHook[];
}

// Auto-discover every module in src/server/routes/ (sorted, so order is
// deterministic). Adding an agent surface means adding a file there.
export async function loadRegistry(dir: string = ROUTES_DIR): Promise<Registry> {
    const files: string[] = [];
    for await (const f of new Bun.Glob("*.ts").scan({ cwd: dir })) {
        if (!f.endsWith(".test.ts")) files.push(f);
    }
    files.sort();
    const routes: Route[] = [];
    const hooks: ResponseHook[] = [];
    for (const f of files) {
        const mod = (await import(join(dir, f))) as RouteModule;
        routes.push(...(mod.routes ?? []));
        hooks.push(...(mod.hooks ?? []));
    }
    return { routes, hooks };
}
