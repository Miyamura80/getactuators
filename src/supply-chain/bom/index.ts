import { isProcessStepId } from "../processes";
import { getCompany } from "../registry";
import { sceneProblems } from "../scenes/check";
import { HARMONIC_FRAMELESS } from "./cases/harmonic-frameless";
import { OPTIMUS_LINEAR } from "./cases/optimus-linear";
import { UNITREE_QDD } from "./cases/unitree-qdd";
import { COMMODITIES, NDFEB_DENSITY, isMaterialSeries } from "./commodities";
import { flatten } from "./metrics";
import { caseScene } from "./scene";
import type { BomCase, BomNode } from "./types";

// /bom: three actuator teardowns, each a cited bill-of-materials tree with
// costs, raw material, makers and margins. Data only; zod wire shapes live
// in ./views (server side).

export {
    BOM_PATH,
    BOM_SLUGS,
    bomCasePath,
    bomSlugOf,
    isBomSlug,
    type BomSlug,
} from "./path";
export const BOM_AS_OF = "November 2026";
// ISO date the BOM data last changed (Dataset dateModified).
export const BOM_UPDATED = "2026-11-07";

export * from "./types";

// Index order: the page compares them left to right.
export const BOM_CASES: readonly BomCase[] = [
    OPTIMUS_LINEAR,
    UNITREE_QDD,
    HARMONIC_FRAMELESS,
];

export function getBomCase(slug: string): BomCase | undefined {
    return BOM_CASES.find((c) => c.slug === slug);
}

// The first case with a node of this id (for /bom#node=<id> deep links from
// /manufacturing, which name a node but not a case).
export function caseWithNode(id: string): BomCase | undefined {
    return BOM_CASES.find((c) => flatten(c.root).some((p) => p.node.id === id));
}

export const MAX_LABEL_WORDS = 5;
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const words = (s: string): number => s.trim().split(/\s+/).filter(Boolean).length;

function nodeErrors(c: BomCase, n: BomNode): string[] {
    const where = `bom ${c.slug}/${n.id}`;
    const companies = [...(n.makerIds ?? []), ...(n.alternateMakerIds ?? [])];
    const rules: [boolean, string][] = [
        [!KEBAB.test(n.id), "id is not kebab-case"],
        [
            words(n.label) > MAX_LABEL_WORDS,
            `label "${n.label}" is over ${MAX_LABEL_WORDS} words`,
        ],
        [n.sources.length === 0, "no sources"],
        [n.kind === "material" && !n.material, "material node without a material"],
        [
            n.kind === "material" && (n.children?.length ?? 0) > 0,
            "material node with children",
        ],
        [
            n.kind !== "material" && (n.children?.length ?? 0) === 0,
            "part or assembly with nothing below it",
        ],
        [
            !!n.material && !isMaterialSeries(n.material.seriesId),
            `unknown material series "${n.material?.seriesId}"`,
        ],
        [
            (n.makerIds?.length ?? 0) > 0 && !n.makerConfidence,
            "makers without a maker confidence",
        ],
        [
            n.qty !== undefined && (!Number.isInteger(n.qty) || n.qty < 1),
            "qty is not a positive whole number",
        ],
        ...companies
            .filter((id) => !getCompany(id))
            .map((id): [boolean, string] => [true, `unknown company "${id}"`]),
        ...(n.processStepIds ?? [])
            .filter((id) => !isProcessStepId(id))
            .map((id): [boolean, string] => [true, `unknown process step "${id}"`]),
    ];
    return rules.filter(([bad]) => bad).map(([, msg]) => `${where}: ${msg}`);
}

function caseErrors(c: BomCase): string[] {
    const placed = flatten(c.root);
    const ids = placed.map((p) => p.node.id);
    const dupes = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))].map(
        (id) => `bom ${c.slug}: duplicate node id "${id}"`,
    );
    const rootCost =
        c.root.unitCost?.value === c.price.value
            ? []
            : [`bom ${c.slug}: root unit cost must equal the case price`];
    const scene = sceneProblems(caseScene(c)).map((p) => `bom ${c.slug} scene: ${p}`);
    return [
        ...dupes,
        ...rootCost,
        ...scene,
        ...placed.flatMap((p) => nodeErrors(c, p.node)),
    ];
}

export function bomErrors(cases: readonly BomCase[] = BOM_CASES): string[] {
    return cases.flatMap(caseErrors);
}

// Every Sourced number in the BOM data for the citation audit: prices,
// unit costs, masses, references, commodity prices and densities. Tree
// shape, quantities and 3D geometry are model structure, not figures.
export function bomRecords(): unknown[] {
    const nodes = BOM_CASES.flatMap((c) => [
        { id: `${c.slug}`, price: c.price, mass: c.massG },
        ...flatten(c.root).map(({ node }) => ({
            id: `${c.slug}/${node.id}`,
            unitCost: node.unitCost,
            massG: node.material?.massG,
            references: node.references?.map((r) => r.value),
        })),
    ]);
    return [
        ...nodes,
        ...COMMODITIES.map((m) => ({ id: m.id, price: m.price, density: m.density })),
        { id: "ndfeb", density: NDFEB_DENSITY },
    ];
}

// Nodes as citing records (each node's structural sources).
export function bomNodeRecords(): { sources: readonly string[] }[] {
    return BOM_CASES.flatMap((c) =>
        flatten(c.root).map(({ node }) => ({ sources: node.sources })),
    );
}

export { caseScene, nodePart, partFor } from "./scene";
export {
    flatten,
    findNode,
    idiotIndex,
    marginCapture,
    materialNodeId,
    materialTotals,
    nodeCost,
    nodeMetrics,
    rawContentCost,
    stepMultiplier,
    toSankey,
    SALE_ID,
} from "./metrics";
export { COMMODITIES, materialLabel, materialPrice } from "./commodities";
