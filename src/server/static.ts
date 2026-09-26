import { normalize } from "node:path";

export const DIST_DIR = process.env.DIST_DIR ?? "frontend/dist";

// Serve a built asset from DIST_DIR, or null when there is none.
export async function serveAsset(pathname: string): Promise<Response | null> {
    const safe = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
    const path = safe === "/" ? "/index.html" : safe;
    const file = Bun.file(`${DIST_DIR}${path}`);
    if (await file.exists()) return new Response(file);
    return null;
}
