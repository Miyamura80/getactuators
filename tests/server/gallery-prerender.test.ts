import { expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Isolated process: shell caching and DIST_DIR must not leak into other tests.
// This boundary does not import React or require an installed frontend/build.
test("only the gallery serves the built React markup in its initial root", async () => {
    const dir = await mkdtemp(join(tmpdir(), "gallery-render-"));
    try {
        await writeFile(
            join(dir, "index.html"),
            '<html><head><title></title><meta name="description"></head><body><div id="root"></div></body></html>',
        );
        const gallery =
            '<div class="gallery-page"><a class="bento-card" href="/actuators/nabtesco-rv-42n"><img src="/actuator-images/nabtesco-rv-42n.webp"></a></div>';
        await writeFile(join(dir, "actuators.html"), gallery);
        const proc = Bun.spawn(
            [
                process.execPath,
                "-e",
                `
            import { renderSpaPage } from './src/server/agent/html/render.ts';
            import { findPage } from './src/server/agent/pages.ts';
            console.log(JSON.stringify(await Promise.all(['/actuators', '/', '/all', '/actuators/cubemars-ak80-9'].map(path => renderSpaPage(findPage(path))))));
        `,
            ],
            {
                cwd: process.cwd(),
                env: { ...process.env, DIST_DIR: dir },
                stdout: "pipe",
                stderr: "pipe",
            },
        );
        const output = await new Response(proc.stdout).text();
        expect(await proc.exited, await new Response(proc.stderr).text()).toBe(0);
        const pages = JSON.parse(output) as string[];
        expect(pages[0]).toContain(
            `<div id="root" data-gallery-prerender="true">${gallery}</div>`,
        );
        expect(pages[0]).toContain("Catalog details");
        for (const page of pages.slice(1)) {
            expect(page).not.toContain("data-gallery-prerender");
            expect(page).not.toContain('class="bento-card"');
        }
    } finally {
        await rm(dir, { recursive: true, force: true });
    }
});
