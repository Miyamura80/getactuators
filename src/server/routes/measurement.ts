import { DIST_DIR } from "../static";
import type { Route } from "../types";

// Docker ships Vite's dist; bare checkouts have only the checked-in public asset.
export async function measurementAsset(dist = DIST_DIR, publicDir = "frontend/public") {
    const built = Bun.file(`${dist}/measurement.js`);
    const file = (await built.exists())
        ? built
        : Bun.file(`${publicDir}/measurement.js`);
    return new Response(file, {
        headers: {
            "Content-Type": "text/javascript; charset=utf-8",
            "Cache-Control": "no-cache",
        },
    });
}

export const routes: Route[] = [
    { method: "GET", path: "/measurement.js", handler: () => measurementAsset() },
];
