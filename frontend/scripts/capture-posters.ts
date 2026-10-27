// Captures the no-WebGL / dormant-scene posters for the 3D kit into
// frontend/public/posters/<scene id>.png. Run after intentional scene changes:
//
//   cd frontend && bun run build && cd ..
//   PORT=4317 bun run scripts/serve_frontend.ts &
//   bun frontend/scripts/capture-posters.ts http://localhost:4317
//
// Reduced motion is emulated so every scene renders its deterministic end
// state: explodes fully exploded, loops at their poster frame.
import { chromium } from "playwright-core";
import { DEMO_SCENES, MAGNET_PRESS_LOOP } from "../../src/supply-chain/scenes/demos";

const base = process.argv[2] ?? "http://localhost:4317";
const out = `${import.meta.dir}/../public/posters`;

// Each poster: the page that renders the scene and the tab that shows it.
const TARGETS = [...DEMO_SCENES.map((s) => s.id), MAGNET_PRESS_LOOP.id].map((id) => ({
    id,
    url: `${base}/lab/supply-chain`,
    tab: `#x3-tab-${id}`,
}));

const browser = await chromium.launch({
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
});
for (const t of TARGETS) {
    await page.goto(t.url, { waitUntil: "networkidle" });
    const tab = page.locator(t.tab);
    await tab.scrollIntoViewIfNeeded();
    await tab.click();
    await page.waitForSelector('figure.x3[data-ready="true"]', { timeout: 30_000 });
    // Two settled frames after the context comes up.
    await page.waitForTimeout(1500);
    await page.mouse.move(0, 0);
    // Floating site chrome (the search button) must not land in the poster.
    await page.addStyleTag({ content: ".cmdk-trigger { display: none !important; }" });
    await page.locator("figure.x3 .x3-stage").screenshot({ path: `${out}/${t.id}.png` });
    console.log(`Captured ${t.id}`);
}
await browser.close();
