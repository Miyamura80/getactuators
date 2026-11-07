// Run from the repository root after intentional catalog/rendering changes:
// bun frontend/tests/capture-seo-pages.ts
// The backend suite checks these real server captures for drift; the frontend
// suite mounts React over them without needing backend-only MCP dependencies.
import { ACTUATORS } from "../../src/catalog";
import { findPage } from "../../src/server/agent/pages";
import { renderSpaPage } from "../../src/server/agent/html/render";

const actuator = ACTUATORS.find((a) => a.notes && a.sources.length && a.use_cases.length);
if (!actuator) throw new Error("No product with notes, sources and use cases");
const researched: { path: string; body: string; faq: Record<string, unknown> | null }[] = [];
const targets = [
    ["home", "/"],
    ["product", `/actuators/${encodeURIComponent(actuator.id)}`],
    ...["leaderdrive-lcs", "leaderdrive-lhd", "leaderdrive-lhs", "nidec-flexwave-wpg", "nidec-smart-flexwave-srh"].map((id) => ["researched", `/actuators/${id}`] as const),
] as const;

for (const [name, path] of targets) {
    const page = findPage(path);
    if (!page) throw new Error(`Missing page: ${path}`);
    const html = await renderSpaPage(page);
    const body = /<div id="root">[\s\S]*?(?=<script|<\/body>)/.exec(html)?.[0];
    if (!body) throw new Error(`No persistent catalog section: ${path}`);
    const faq = page.jsonLd().find((node) => node["@type"] === "FAQPage") ?? null;
    if (name === "researched") researched.push({ path, body, faq });
    else await Bun.write(
        `${import.meta.dir}/fixtures/${name}.json`,
        `${JSON.stringify({ path, body, faq }, null, 4)}\n`,
    );
    console.log(`Captured ${path}`);
}
await Bun.write(`${import.meta.dir}/fixtures/researched.json`, `${JSON.stringify(researched, null, 4)}\n`);
