// Run from repository root: bun frontend/tests/capture-comparisons.ts
// Real HTTP-handler captures, without root-package imports in frontend tests.
import { get } from "../../tests/server/agent-helpers";

const captures = [];
for (const path of ["/compare", "/compare?compare=cubemars-ak80-9,xiaomi-cybergear"]) {
    const response = await get(path);
    if (response.status !== 200) throw new Error(`Capture failed: ${path}`);
    const html = await response.text();
    const root = /<div id="root">([\s\S]*)<\/div>\s*(?:<script[^>]*>[\s\S]*?<\/script>\s*)*<\/body>/.exec(html)?.[1];
    if (!root) throw new Error(`Missing comparison root: ${path}`);
    captures.push({ path, root });
}
await Bun.write(new URL("./fixtures/comparisons.json", import.meta.url), `${JSON.stringify(captures, null, 4)}\n`);
console.log(`Captured ${captures.length} comparison states`);
