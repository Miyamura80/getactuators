import type { MetalId } from "../metals/elements";
import type { ExplodeSceneSpec, ProcessLoopSpec } from "../scenes/spec";
import type { SourceId, Sourced } from "../sourced";
import type { Stage } from "../stages";

// Data model of /manufacturing: one directed graph per process chain (the
// magnet chain, then the precision chain of gears, screws, bearings and
// encoders). Step ids
// are the contract with /bom: a BOM node's `processStepIds` point here and
// /manufacturing#step=<id> opens the step.

// Country shares a step or cluster draws, by key: the /metals stage shares
// for the magnet chain, and the precision chain's own estimates
// (./precision-shares). Each record is cited once.
export const SHARE_KEYS = [
    "ree-mining",
    "ree-separation",
    "hree-separation",
    "metal-alloy",
    "ndfeb-magnets",
    "strain-wave-gears",
    "roller-screws",
    "rolling-bearings",
    "encoders",
] as const;
export type ShareRef = (typeof SHARE_KEYS)[number];

// Pictogram drawn on a step node and in the twin's legend.
export const PROCESS_ICONS = [
    "pit",
    "clay",
    "flotation",
    "acid",
    "settler",
    "precipitate",
    "cell",
    "crucible",
    "wheel",
    "hydrogen",
    "mill",
    "press",
    "furnace",
    "diffusion",
    "saw",
    "coat",
    "coil",
    "gauge",
    "recycle",
    "lathe",
    "hob",
    "grind",
    "peen",
    "assemble",
    "laser",
    "chip",
    "seal",
] as const;
export type ProcessIcon = (typeof PROCESS_ICONS)[number];

// A headline number on a step: two or three per step, each cited.
export interface KeyNumber {
    // One to three words: "Grade", "Particle size".
    label: string;
    value: Sourced<number>;
}

export interface ProcessCluster {
    id: string;
    label: string;
    stage: Stage;
    shares?: ShareRef;
}

// Where a step sits on the map, in grid units (one column is one card
// width plus a gutter). Precomputed so the layout is stable across visits.
export interface GridPos {
    x: number;
    y: number;
}

export interface ProcessStep {
    id: string;
    cluster: string;
    // At most four words.
    label: string;
    // At most twelve words.
    caption: string;
    icon: ProcessIcon;
    inputs: string[];
    outputs: string[];
    keyNumbers: KeyNumber[];
    // Supply-chain registry companies known to run this step.
    companyIds: string[];
    shares?: ShareRef;
    // /bom nodes this step feeds (#76).
    bomNodeIds: string[];
    // /metals elements this step consumes or yields.
    elementIds: MetalId[];
    // Looping 3D vignette; steps without one show their pictogram.
    animation?: ProcessLoopSpec;
    // A side branch (heavy rare earths, diffusion, shot peening), another
    // route to the same output (magnetic instead of optical scale), or the
    // recycling loop.
    branch?: StepBranch;
    pos: GridPos;
    sources: SourceId[];
}

export const STEP_BRANCHES = ["heavy", "optional", "alternative", "recycling"] as const;
export type StepBranch = (typeof STEP_BRANCHES)[number];

export type EdgeKind = "main" | "branch" | "loop";

export interface ProcessEdge {
    from: string;
    to: string;
    kind: EdgeKind;
    // What flows, two or three words ("NdPr oxide").
    label?: string;
}

export interface ProcessChain {
    id: string;
    // Chain switcher label, one word.
    label: string;
    title: string;
    // Where the chain starts and ends, for the page lede ("ore to rotor").
    span: string;
    // What leaves the last step.
    product: string;
    // The product node's name on the map and card, two or three words.
    productLabel: string;
    // Sub-chains that run side by side (gear, screw, bearing, encoder):
    // no arrows between clusters, the product sits outside every cluster
    // and every final step feeds it.
    parallel?: boolean;
    clusters: ProcessCluster[];
    steps: ProcessStep[];
    edges: ProcessEdge[];
    // The product state drawn at the end of the chain.
    productScene?: ExplodeSceneSpec;
    productPos: GridPos;
    productBomNodeId?: string;
}
