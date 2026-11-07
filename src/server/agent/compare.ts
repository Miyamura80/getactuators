import { ACTUATORS, type Actuator } from "@/catalog";
import {
    COMPARE_SPECS,
    comparisonCaveats,
    comparisonPhotoAlt,
    validatedCompareIds,
} from "@/catalog/compare";
import { publicFooter, publicHeader } from "../../public-navigation";
import { compareEngineeringSources } from "./compare-engineering";
import { comparisonHub } from "./comparison-hub";
import { esc } from "./html/head";

export function comparisonRows(search: string) {
    const ids = validatedCompareIds(
        search,
        ACTUATORS.map((a) => a.id),
    );
    return ids.map((id) => ACTUATORS.find((a) => a.id === id)!);
}
const COMPARE_INTRO =
    "# Compare actuators\n\nPick 2–4 actuators in the [gallery](/actuators). Share the selected URL. Unknown means not documented, not zero. Catalog specifications are not matched-condition measurements; no winner is implied.";
export function compareBody(search = ""): string {
    const rows = comparisonRows(search);
    return rows.length < 2
        ? `${COMPARE_INTRO}\n\n${comparisonHub("md")}`
        : `${COMPARE_INTRO}\n\n${compareSectionsMd(rows)}`;
}
// Model cards, specification table and caveats; callers supply their own heading.
export function compareSectionsMd(rows: Actuator[]): string {
    const clean = (s: string) => s.replaceAll("|", "\\|").replaceAll("\n", " ");
    return `${rows.map((a) => `## ${a.name}\n\n${a.image_url ? `![${comparisonPhotoAlt(a)}](${a.image_url})\n\n` : "Photo unavailable.\n\n"}[Catalog and sources](/actuators/${a.id})`).join("\n\n")}\n\n## Specifications\n\n| Specification | ${rows.map((a) => clean(a.name)).join(" | ")} |\n| --- | ${rows.map(() => "---").join(" | ")} |\n${COMPARE_SPECS.map((spec) => `| ${spec.label} | ${rows.map((a) => clean(spec.display(a))).join(" | ")} |`).join("\n")}\n\nSensor bits do not establish loaded accuracy. CAD geometry is not a calibrated simulation model. Verify thermal conditions, duty and exact revision before engineering use.\n\n${comparisonCaveats(rows).join("\n\n")}${compareEngineeringSources(rows, "md")}`;
}
function productCards(rows: Actuator[]): string {
    return `<div class="compare-products">${rows.map((a) => `<article><a href="/actuators/${esc(a.id)}">${a.image_url ? `<img src="${esc(a.image_url)}" alt="${esc(comparisonPhotoAlt(a))}" width="320" height="320">` : '<div class="compare-no-photo">Photo unavailable</div>'}<h2>${esc(a.name)}</h2></a><a href="/actuators/${esc(a.id)}">Catalog and sources</a></article>`).join("")}</div>`;
}
function caveatsBlock(rows: Actuator[]): string {
    return `<div class="compare-caveats">${comparisonCaveats(rows)
        .map((note) => `<p>${esc(note)}</p>`)
        .join("")}</div>`;
}
export function compareContent(rows: Actuator[]): string {
    if (rows.length < 2)
        return '<p>Pick 2–4 actuators in the <a href="/actuators">gallery</a>. A missing or invalid selection is not compared.</p>';
    return `${productCards(rows)}<div class="compare-spec-scroll" role="region" aria-label="Comparison specifications" tabindex="0"><table class="compare-specs"><caption>Catalog values: verify exact revision and conditions</caption><thead><tr><th scope="col">Specification</th>${rows.map((a) => `<th scope="col">${esc(a.name)}</th>`).join("")}</tr></thead><tbody>${COMPARE_SPECS.map((spec) => `<tr><th scope="row">${esc(spec.label)}</th>${rows.map((a) => `<td>${esc(spec.display(a))}</td>`).join("")}</tr>`).join("")}</tbody></table></div>${caveatsBlock(rows)}${compareEngineeringSources(rows, "html")}`;
}
function compareRecovery(rows: Actuator[]): string {
    return `<p role="status">Pick 2–4 actuators in the <a href="/actuators">gallery</a>. A missing or invalid selection is not compared.</p>${productCards(rows)}${caveatsBlock(rows)}`;
}
export function compareVisual(search: string): string {
    const rows = comparisonRows(search);
    return `<div class="compare-page">${publicHeader("/compare")}<main><h1>Compare actuators</h1><p>Share this URL. Unknown means not documented, not zero. No winner is implied.</p>${rows.length === 0 ? `${comparisonHub("html")}<p role="status">Pick 2–4 actuators in the <a href="/actuators">gallery</a>. A missing or invalid selection is not compared.</p>` : rows.length === 1 ? compareRecovery(rows) : compareContent(rows)}<p>Sensor bits are not loaded accuracy. CAD geometry is not a calibrated simulation model. Thermal duty and efficiency require matched operating conditions.</p></main>${publicFooter()}</div>`;
}
