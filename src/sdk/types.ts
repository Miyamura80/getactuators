// Shared vocabulary of /sdk: the seven dimensions an actuator SDK is scored on,
// the reader presets that weight them, and the record shapes the seeding
// pipeline (scripts/sdk-signals/) writes to src/sdk/data/.

export const SDK_DIMENSIONS = [
    "protocol",
    "bindings",
    "ros",
    "docs",
    "firmware",
    "support",
    "reliability",
] as const;
export type SdkDimension = (typeof SDK_DIMENSIONS)[number];

export const DIMENSION_LABEL: Record<SdkDimension, string> = {
    protocol: "Protocol openness",
    bindings: "Languages and bindings",
    ros: "ROS 2 and sim",
    docs: "Docs and examples",
    firmware: "Firmware and tooling",
    support: "Support and community",
    reliability: "Comms reliability",
};

export const DIMENSION_SHORT: Record<SdkDimension, string> = {
    protocol: "Protocol",
    bindings: "Bindings",
    ros: "ROS 2 / sim",
    docs: "Docs",
    firmware: "Firmware",
    support: "Support",
    reliability: "Comms",
};

export const SDK_PRESETS = ["balanced", "ros2", "python", "embedded", "rl"] as const;
export type SdkPreset = (typeof SDK_PRESETS)[number];

export const PRESET_LABEL: Record<SdkPreset, string> = {
    balanced: "Balanced",
    ros2: "ROS 2 shop",
    python: "Python hobbyist",
    embedded: "Embedded",
    rl: "RL / sim-first",
};

// Weights per preset; each row sums to 1. Shown on the page.
export const PRESET_WEIGHTS: Record<SdkPreset, Record<SdkDimension, number>> = {
    balanced: {
        protocol: 0.15,
        bindings: 0.15,
        ros: 0.15,
        docs: 0.15,
        firmware: 0.15,
        support: 0.1,
        reliability: 0.15,
    },
    ros2: {
        protocol: 0.1,
        bindings: 0.1,
        ros: 0.35,
        docs: 0.15,
        firmware: 0.05,
        support: 0.1,
        reliability: 0.15,
    },
    python: {
        protocol: 0.05,
        bindings: 0.3,
        ros: 0.05,
        docs: 0.3,
        firmware: 0.1,
        support: 0.15,
        reliability: 0.05,
    },
    embedded: {
        protocol: 0.35,
        bindings: 0.05,
        ros: 0.0,
        docs: 0.15,
        firmware: 0.2,
        support: 0.05,
        reliability: 0.2,
    },
    rl: {
        protocol: 0.1,
        bindings: 0.2,
        ros: 0.3,
        docs: 0.1,
        firmware: 0.05,
        support: 0.05,
        reliability: 0.2,
    },
};

export const CAPABILITIES = [
    "ros2",
    "python",
    "cpp",
    "rust",
    "urdf",
    "mjcf",
    "openFirmware",
    "documentedProtocol",
] as const;
export type Capability = (typeof CAPABILITIES)[number];

export const CAPABILITY_LABEL: Record<Capability, string> = {
    ros2: "ROS 2",
    python: "Python",
    cpp: "C++",
    rust: "Rust",
    urdf: "URDF",
    mjcf: "MJCF",
    openFirmware: "Open firmware",
    documentedProtocol: "Documented protocol",
};

// Who ships it: the maker, or the community when only third-party code exists.
export type CapabilityState = "official" | "community" | "none";

export const FORUMS = ["reddit", "hn", "ros-discourse", "forum", "github"] as const;
export type Forum = (typeof FORUMS)[number];

export const FORUM_LABEL: Record<Forum, string> = {
    reddit: "Reddit",
    hn: "Hacker News",
    "ros-discourse": "ROS Discourse",
    forum: "Maker forums",
    github: "GitHub issues",
};

export type Polarity = "positive" | "negative";

// One community claim about a brand's SDK, extracted from a public post.
// `claim` is our own one-sentence paraphrase: no quotes, no usernames.
export interface SdkEvidence {
    id: string;
    brand: string;
    dimension: SdkDimension;
    polarity: Polarity;
    claim: string;
    // Recurring complaint or praise theme, for the pain-point clusters.
    theme: string;
    url: string;
    forum: Forum;
    // Subreddit, repository or forum category the post sits in.
    venue: string;
    date: string;
    // Upvotes, points or reactions at collection time; null when unknown.
    score: number | null;
}

export interface DimensionScore {
    // 0 to 100, objective and community parts blended.
    score: number;
    // Null when the dimension has no checks, or no community claims.
    objective: number | null;
    community: number | null;
    positive: number;
    negative: number;
}

export interface BrandScore {
    brand: string;
    dimensions: Partial<Record<SdkDimension, DimensionScore>>;
    // Balanced preset; other presets are re-weighted from `dimensions`.
    overall: number;
    evidenceCount: number;
}

export interface MonthCount {
    month: string;
    positive: number;
    negative: number;
}

export interface ClassifierAgreement {
    dimension: SdkDimension;
    // Share of gold (post, brand) pairs where the classifier's verdict
    // (positive, negative or no claim) matches the hand label.
    agreement: number;
    // Stricter: claims both raters made over claims either made.
    overlap: number;
    // Gold (post, brand) pairs with a claim on this dimension.
    goldItems: number;
}
