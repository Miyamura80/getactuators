import { ACTUATORS } from "@/catalog";
import {
    AUTHORED_COMPARISONS,
    comparisonDirectory,
    comparisonTitle,
} from "@/catalog/comparison-registry";

// Authored dossiers are linked from their own section, not this catalog-only list.
const pairs = comparisonDirectory(ACTUATORS).filter(
    (pair) => !AUTHORED_COMPARISONS.some((authored) => authored.path === pair.path),
);
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
