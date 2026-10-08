import { ACTUATORS, CATEGORIES } from "@/catalog";
import {
    COMPARISON_PHOTO_NOTE,
    comparisonHubNumbers,
    comparisonPhotoAlt,
} from "@/catalog/compare";
import {
    COMPARISON_METHOD,
    comparisonSnapshot,
    comparisonTitle,
} from "@/catalog/comparison-registry";
const categoryLabel = (slug: string) =>
    CATEGORIES.find((category) => category.slug === slug)?.label ?? slug;
import { esc } from "./html/head";

const production = comparisonSnapshot(ACTUATORS);

export function comparisonHub(format: "html" | "md", records = ACTUATORS): string {
    const snapshot = records === ACTUATORS ? production : comparisonSnapshot(records);
    const groups = snapshot.groups;
    const authored = snapshot.authored.map((pair) => ({
        pair,
        models: pair.ids.flatMap((id) => {
            const model = records.find((a) => a.id === id);
            return model ? [model] : [];
        }),
    }));
    if (format === "md")
        return `## Source-scoped engineering comparison\n\n${authored.map(({ pair }) => `[${pair.title}](${pair.path}): reviewed documentation, revision conflicts and explicit unknowns. Not a matched bench test.`).join("\n\n")}\n\n${groups.map((group) => `## ${categoryLabel(group.category)} comparisons\n\n${group.pairs.map((pair) => `- [${comparisonTitle(pair, records)}](${pair.path})`).join("\n")}`).join("\n\n")}\n\n## How pairs are selected\n\n${COMPARISON_METHOD}\n\n[Choose 2–4 models yourself in the gallery](/actuators). Use the [actuator selection guide](/guides/robot-actuator-selection) to define voltage, packaging and duty requirements before shortlisting.`;
    return `<section class="comparison-hub" aria-label="Actuator comparison directory"><p>Browse exact catalog models by drive type, or <a href="/actuators">pick 2–4 models in the gallery</a>. Match voltage, packaging and duty requirements before shortlisting.</p><h2>Source-scoped engineering comparison</h2>${authored.map(({ pair, models }) => `<article class="comparison-feature"><h3><a href="${pair.path}">${esc(pair.title)}</a></h3><div class="comparison-feature-photos">${models.map((a) => `<a href="/actuators/${a.id}">${a.image_url ? `<img src="${esc(a.image_url)}" alt="${esc(comparisonPhotoAlt(a))}" width="320" height="320">` : "Photo unavailable"}<span>${esc(a.name)}</span></a>`).join("")}</div><p>${esc(COMPARISON_PHOTO_NOTE)}</p><p>Reviewed documentation, revision conflicts and explicit unknowns. Not a matched bench test.</p></article>`).join("")}<nav aria-label="Comparison drive categories">${groups.map((group) => `<a href="#compare-${group.category}">${esc(categoryLabel(group.category))}</a>`).join(" · ")}</nav>${groups
        .map(
            (group) =>
                `<section id="compare-${group.category}" tabindex="-1"><h2>${esc(categoryLabel(group.category))} comparisons</h2><ul class="comparison-links">${group.pairs
                    .map((pair) => {
                        const models = pair.ids.flatMap((id) => {
                            const model = records.find((a) => a.id === id);
                            return model ? [model] : [];
                        });
                        return `<li><a href="${pair.path}">${esc(comparisonTitle(pair, records))}</a><p>${models.map((a) => `${esc(a.name)}: ${esc(comparisonHubNumbers(a))}`).join("<br>")} (catalog values)</p></li>`;
                    })
                    .join("")}</ul></section>`,
        )
        .join(
            "",
        )}<details class="comparison-method"><summary>How pairs are selected</summary><p>${esc(COMPARISON_METHOD)}</p><a href="/guides/robot-actuator-selection">Actuator selection guide</a></details></section>`;
}
