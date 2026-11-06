// Captures the no-WebGL / dormant-scene posters for the 3D kit into
// frontend/public/posters/<scene id>.png. Run after intentional scene changes:
//
//   cd frontend && bun run build && cd ..
//   PORT=4317 bun run scripts/serve_frontend.ts &
//   bun frontend/scripts/capture-posters.ts http://localhost:4317 [scene ids...]
//
// Reduced motion is emulated so every scene renders its deterministic end
// state: explodes fully exploded, loops at their poster frame. Pass scene ids
// to capture only those; CHROME_PATH picks a browser binary.
import { chromium } from "playwright-core";
import { MANUFACTURING_PATH, PROCESS_CHAINS } from "../../src/supply-chain/processes";
import { PRODUCT_ID } from "../../src/supply-chain/processes/layout";
import { ALTS_PATH, ALT_TECHS } from "../../src/supply-chain/alts";
import { DEMO_SCENES, MAGNET_PRESS_LOOP } from "../../src/supply-chain/scenes/demos";

const [base = "http://localhost:4317", ...only] = process.argv.slice(2);
const out = `${import.meta.dir}/../public/posters`;

interface Target {
    id: string;
    url: string;
    // A tab to open first (the lab page shows one scene at a time).
    tab?: string;
    // A section to scroll into view first (the scene loads when visible).
    scroll?: string;
    // Pixel ratio: step cards draw the stage small, so they capture at 2x.
    scale: number;
}

// The lab page shows the kit demos; /manufacturing#step= opens a step card
// with its loop (or the product explode) as the page's only scene.
const LAB: Target[] = [...DEMO_SCENES.map((s) => s.id), MAGNET_PRESS_LOOP.id].map((id) => ({
    id,
    url: `${base}/lab/supply-chain`,
    tab: `#x3-tab-${id}`,
    scale: 1,
}));
const STEPS: Target[] = PROCESS_CHAINS.flatMap((c) => [
    ...c.steps
        .filter((s) => s.animation && s.animation.id !== MAGNET_PRESS_LOOP.id)
        .map((s) => ({ id: s.animation?.id ?? s.id, url: `${base}${MANUFACTURING_PATH}#step=${s.id}`, scale: 2 })),
    ...(c.productScene ? [{ id: c.productScene.id, url: `${base}${MANUFACTURING_PATH}#step=${PRODUCT_ID}`, scale: 2 }] : []),
]);
// /alts?tech=<id> opens that technology's spec card with its scene.
const ALTS: Target[] = ALT_TECHS.map((t) => ({
    id: t.scene.spec.id,
    url: `${base}${ALTS_PATH}?tech=${t.id}`,
    scroll: ".al-sp-stage .x3-stage",
    scale: 2,
}));
const TARGETS = [...LAB, ...STEPS, ...ALTS].filter((t) => only.length === 0 || only.includes(t.id));

const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH,
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const pages = new Map<number, Awaited<ReturnType<typeof browser.newPage>>>();
for (const t of TARGETS) {
    const page =
        pages.get(t.scale) ??
        (await browser.newPage({
            viewport: { width: 1280, height: 900 },
            deviceScaleFactor: t.scale,
            reducedMotion: "reduce",
        }));
    pages.set(t.scale, page);
    await page.goto("about:blank");
    await page.goto(t.url, { waitUntil: "networkidle" });
    if (t.scroll) await page.locator(t.scroll).scrollIntoViewIfNeeded();
    if (t.tab) {
        const tab = page.locator(t.tab);
        await tab.scrollIntoViewIfNeeded();
        await tab.click();
    }
    // Under reduced motion a loop holds its poster frame until played; the
    // canvas still mounts once the scene holds the WebGL slot.
    await page.waitForSelector('figure.x3[data-ready="true"]', { timeout: 30_000 });
    // Two settled frames after the context comes up.
    await page.waitForTimeout(1500);
    await page.mouse.move(0, 0);
    // Floating site chrome (the search button) must not land in the poster.
    await page.addStyleTag({ content: ".cmdk-trigger { display: none !important; }" });
    await page.locator('figure.x3[data-ready="true"] .x3-stage').first().screenshot({ path: `${out}/${t.id}.png` });
    console.log(`Captured ${t.id}`);
}
await browser.close();
