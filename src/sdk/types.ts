// Wire shapes of the /sdk dataset. scripts/sdk-signals writes
// data/sdk-evidence.json (what was observed, each item with its URL) and
// data/sdk-scores.json (the rubric applied to that evidence). Nothing here is
// typed in by hand: change the pipeline and re-run `make sdk_signals`.

export const DIMENSION_IDS = [
    "protocol",
    "bindings",
    "ros_sim",
    "docs",
    "firmware",
    "support",
    "reliability",
] as const;
export type DimensionId = (typeof DIMENSION_IDS)[number];

// Machine-readable observation behind an evidence item. The scorer reads
// these; the page shows the item's title and link.
export type Signal =
    | "repo"
    | "licence"
    | "lang:python"
    | "lang:cpp"
    | "lang:rust"
    | "ros2-package"
    | "ros1-package"
    | "ros2-control"
    | "urdf"
    | "mjcf"
    | "examples"
    | "docs"
    | "docs-english"
    | "protocol-doc"
    | "firmware-source"
    | "firmware-update"
    | "config-tool"
    | "activity"
    | "docs-link"
    | "issue-response"
    | "forum-mention";

export type EvidenceSource = "github" | "catalog" | "hn" | "reddit" | "ros-discourse";

export type Polarity = "positive" | "negative" | "neutral";

export interface Evidence {
    id: string;
    brand: string;
    signal: Signal;
    source: EvidenceSource;
    url: string;
    // One line saying what was observed, e.g. "package.xml declares ament_cmake".
    title: string;
    // Repo slug for GitHub items.
    repo?: string;
    official?: boolean;
    // A number the rubric reads (file count, commits in 12 months).
    value?: number;
    // SPDX id for licence items.
    spdx?: string;
    // YYYY-MM-DD: post date, or last commit for activity.
    date?: string;
    // Forum items only: a short excerpt (at most 300 characters), the forum
    // or subreddit, the post's score, and the dimensions it was tagged with.
    quote?: string;
    forum?: string;
    score?: number;
    dimensions?: DimensionId[];
    // null until the LLM classifier has labelled the item.
    polarity?: Polarity | null;
}

export type CollectorStatus = "ok" | "skipped" | "blocked" | "error";

export interface CollectorRun {
    id:
        | "github-git"
        | "github-rest"
        | "catalog-docs"
        | "hn"
        | "reddit"
        | "ros-discourse";
    label: string;
    status: CollectorStatus;
    detail: string;
    items: number;
}

export interface ClassifierRun {
    status: "not-run" | "ok" | "below-threshold";
    model: string | null;
    goldSetSize: number;
    // Per-dimension agreement with the hand-labelled gold set, 0..1.
    agreement: Partial<Record<DimensionId, number>> | null;
    detail: string;
}

export interface EvidenceFile {
    asOf: string;
    collectors: CollectorRun[];
    classifier: ClassifierRun;
    evidence: Evidence[];
}

export type CheckStatus = "pass" | "partial" | "fail" | "unknown";

export interface CheckResult {
    id: string;
    status: CheckStatus;
    points: number;
    max: number;
    evidence: string[];
}

export interface DimensionScore {
    // 0..10, null when every check is unknown.
    score: number | null;
    checks: CheckResult[];
}

export type Provenance = "official" | "community";

export const CAPABILITY_IDS = [
    "python",
    "cpp",
    "rust",
    "ros2",
    "ros2_control",
    "urdf",
    "mjcf",
    "open_firmware",
    "documented_protocol",
] as const;
export type CapabilityId = (typeof CAPABILITY_IDS)[number];

export interface BrandScore {
    brand: string;
    name: string;
    // False for brands whose catalog entries have no command interface
    // (gearboxes, frameless motors): nothing to write an SDK against.
    applicable: boolean;
    actuatorIds: string[];
    dimensions: Record<DimensionId, DimensionScore>;
    capabilities: Record<CapabilityId, Provenance | null>;
    evidenceCount: number;
    // Median catalog price per Nm across the brand's commandable actuators.
    medianPricePerNm: number | null;
}

export interface ScoresFile {
    asOf: string;
    rubricVersion: number;
    brands: BrandScore[];
}
