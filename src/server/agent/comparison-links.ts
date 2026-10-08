import { ACTUATORS } from "@/catalog";
import { comparisonDirectory, comparisonTitle } from "@/catalog/comparison-registry";

const pairs = comparisonDirectory(ACTUATORS);
export function catalogComparisonLinks(
    ids: readonly string[],
    heading = "Catalog comparisons",
    excludePath?: string,
): string {
    const related = pairs.filter(
        (pair) => pair.path !== excludePath && pair.ids.some((id) => ids.includes(id)),
    );
    if (!related.length) return "";
    return `## ${heading}\n\nCatalog specifications and source caveats, not compatibility recommendations.\n\n${related.map((pair) => `- [${comparisonTitle(pair, ACTUATORS)}](${pair.path})`).join("\n")}\n\n[Browse actuator comparisons](/compare).`;
}
