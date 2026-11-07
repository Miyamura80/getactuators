import type { CompareActuator } from "@/catalog/compare";
import { engineeringEvidenceFor } from "@/catalog/engineering-evidence";
import { esc } from "./html/head";
import { bullets, mdLink, mdText } from "./md";

export function compareEngineeringSources(
    rows: CompareActuator[],
    format: "html" | "md",
): string {
    const sections = rows.flatMap((a) => {
        const evidence = engineeringEvidenceFor(a.id);
        if (!evidence) return [];
        return Object.entries(evidence.topics).map(([topic, item]) => {
            const title = `${a.name} / ${topic}`;
            if (format === "md")
                return [
                    `### ${mdText(title)}`,
                    `**Revision scope:** ${mdText(evidence.revision)}`,
                    mdText(item.summary),
                    `**Scope / unknowns:** ${mdText(item.scope)}`,
                    bullets(
                        item.sources.map(
                            (source) =>
                                `${mdLink(source.label, source.url)}: ${mdText(source.locator)}`,
                        ),
                    ),
                ].join("\n\n");
            return `<details data-actuator-id="${esc(a.id)}" data-topic="${esc(topic)}"><summary>${esc(title)}: scope &amp; sources</summary><p>${esc(evidence.revision)}</p><p>${esc(item.summary)}</p><p>${esc(item.scope)}</p><ul>${item.sources.map((source) => `<li><a href="${esc(source.url)}">${esc(source.label)}</a>: ${esc(source.locator)}</li>`).join("")}</ul></details>`;
        });
    });
    if (!sections.length) return "";
    return format === "md"
        ? `\n\n## Engineering scope & sources\n\n${sections.join("\n\n")}`
        : `<section aria-label="Engineering scope and sources"><h2>Engineering scope &amp; sources</h2>${sections.join("")}</section>`;
}
