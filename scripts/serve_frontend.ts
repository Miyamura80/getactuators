// Minimal static file server for the built frontend, for Railway.
// Serves frontend/dist and falls back to index.html for unknown paths.

const DIST = "frontend/dist";
const port = Number(process.env.PORT ?? 3000);

Bun.serve({
    port,
    async fetch(req) {
        const url = new URL(req.url);
        const path = url.pathname === "/" ? "/index.html" : url.pathname;
        const asset = Bun.file(`${DIST}${path}`);
        if (await asset.exists()) return new Response(asset);
        // SPA fallback
        return new Response(Bun.file(`${DIST}/index.html`), {
            headers: { "content-type": "text/html; charset=utf-8" },
        });
    },
});

console.log(`getactuators serving ${DIST} on :${port}`);
