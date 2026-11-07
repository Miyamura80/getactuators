import {
    type EngineeringTopic,
    engineeringEvidenceFor,
} from "@/catalog/engineering-evidence";
import { bullets, mdLink, mdText } from "./md";

const titles: Record<EngineeringTopic, string> = {
    efficiency: "Efficiency",
    thermal: "Thermal duty",
    precision: "Precision",
    modeling: "Modeling",
};

export function engineeringEvidenceSection(id: string): string | undefined {
    const evidence = engineeringEvidenceFor(id);
    if (!evidence) return undefined;
    const topics = (Object.keys(titles) as EngineeringTopic[]).map((topic) => {
        const item = evidence.topics[topic];
        return [
            `### ${titles[topic]}`,
            `**Evidence: ${item.status}.** ${mdText(item.summary)}`,
            `**Scope / unknowns:** ${mdText(item.scope)}`,
            `**Source locators:**\n\n${bullets(item.sources.map((s) => `${mdLink(s.label, s.url)}: ${mdText(s.locator)}`))}`,
        ].join("\n\n");
    });
    return [
        "## Engineering evidence",
        `**Revision scope:** ${mdText(evidence.revision)}`,
        bullets(evidence.warnings.map(mdText)),
        ...topics,
    ].join("\n\n");
}
