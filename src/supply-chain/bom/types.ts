import type { PartShape, Transform, Vec3 } from "../scenes/spec";
import type { Confidence, SourceId, Sourced } from "../sourced";
import type { BomSlug } from "./path";

// A node's shape in the case explode. Id, label, sources and the inferred
// flag come from the node itself (see ./scene).
export type BomPart = PartShape & {
    assembled?: Transform;
    explodedOffset: Vec3;
    accent?: boolean;
};

// Data model of /bom: one bill-of-materials tree per actuator teardown, from
// the finished actuator down to the raw materials in it. Costs flow up the
// tree (what the next tier pays); raw material is priced at the case month
// with /metals priceAt() for rare earths and ./commodities for the rest.

export type BomKind = "assembly" | "component" | "material";

export const BOM_KIND_LABEL: Record<BomKind, string> = {
    assembly: "Assembly",
    component: "Part",
    material: "Raw material",
};

// A raw-material leaf: which price series, and how much of it.
export interface BomMaterial {
    // A /metals price series ("ndpr-alloy-cn") or a commodity ("copper").
    seriesId: string;
    massG: Sourced<number>;
}

// A cited figure shown beside a node to cross-check its cost: a list
// price, a market range, another analyst's estimate.
export interface BomReference {
    // Two to five words: "Foreign makers' unit price".
    label: string;
    value: Sourced<number>;
}

export interface BomNode {
    id: string;
    label: string;
    kind: BomKind;
    children?: BomNode[];
    // How many of this node sit in its parent; 1 when absent.
    qty?: number;
    // What the next tier pays for one unit, US$.
    unitCost?: Sourced<number>;
    // Leaves only.
    material?: BomMaterial;
    // Registry companies that make this node, and others that could.
    makerIds?: string[];
    alternateMakerIds?: string[];
    // How sure the maker attribution is. Absent with no makerIds.
    //   reported   the maker or buyer says so (filing, own product page)
    //   estimated  an analyst or the press names it; unconfirmed
    //   modeled    a typical listed maker of this part stands in, because
    //              this actuator's supplier is not public
    makerConfidence?: Confidence;
    // How the maker is known, or why none is named.
    makerNote?: string;
    // /manufacturing step ids that make this node.
    processStepIds?: string[];
    // This node's part in the case's explode; bomNodeId is set from `id`.
    part3d?: BomPart;
    references?: BomReference[];
    // Where the node and its place in the tree come from (teardown, filing).
    sources: SourceId[];
    // Structure inferred rather than seen in a teardown.
    inferred?: boolean;
    // One sentence, our words.
    note?: string;
}

export interface BomCase {
    slug: BomSlug;
    name: string;
    // Card title on the index, one to three words.
    short: string;
    // Which product this is, in one line.
    subject: string;
    // Catalog entry in actuators.json, when the actuator is listed.
    actuatorId?: string;
    // US$ at the stated volume.
    price: Sourced<number>;
    // Published mass of the whole actuator, when there is one.
    massG?: Sourced<number>;
    volumeAssumption: string;
    // Month raw materials are priced at, YYYY-MM.
    month: string;
    // Why this case is on the page, one or two sentences.
    why: string;
    // The page's finding in one sentence, our words.
    takeaway: string;
    root: BomNode;
}
