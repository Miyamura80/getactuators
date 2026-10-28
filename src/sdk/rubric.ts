import type { DimensionId, Signal } from "./types";

// The /sdk scoring rubric. A dimension scores 0 to 10: the points its checks
// earn over the points of the checks that could be decided. A check is
// "unknown" (left out, not zero) only when its collector did not run; a
// missing signal after a collector ran is a fail. Official evidence earns
// full points, community-only evidence half, unless the check says otherwise.

export const RUBRIC_VERSION = 1;

export interface DimensionDef {
    id: DimensionId;
    label: string;
    short: string;
    question: string;
    objective: string;
    community: string;
}

export const DIMENSIONS: readonly DimensionDef[] = [
    {
        id: "protocol",
        label: "Protocol openness",
        short: "Protocol",
        question: "Can you talk to it without the vendor's code?",
        objective:
            "a published protocol document; an open licence; an open implementation",
        community: "complaints about undocumented commands",
    },
    {
        id: "bindings",
        label: "Languages and bindings",
        short: "Bindings",
        question: "Is there a maintained library for your language?",
        objective:
            "Python, C/C++ and Rust sources in official repos; commits in the last 12 months",
        community: '"had to write my own driver" mentions',
    },
    {
        id: "ros_sim",
        label: "ROS 2 and sim",
        short: "ROS 2 / sim",
        question: "Does it drop into a ROS 2 or simulation stack?",
        objective:
            "an ament package.xml; a ros2_control hardware plugin; URDF or MJCF models",
        community: "sim-to-real reports",
    },
    {
        id: "docs",
        label: "Docs and examples",
        short: "Docs",
        question: "Can you get it moving from the docs alone?",
        objective:
            "documentation in official repos; runnable example files; English text",
        community: '"docs are Chinese only / outdated"',
    },
    {
        id: "firmware",
        label: "Firmware and tooling",
        short: "Firmware",
        question: "Can you configure, update and recover it?",
        objective:
            "open firmware source; a configuration tool; a documented firmware update",
        community: "bricking and flashing stories",
    },
    {
        id: "support",
        label: "Support and community",
        short: "Support",
        question: "Will someone answer when it breaks?",
        objective:
            "official repo activity; community repos; forum discussion; issue response time",
        community: "sentiment of support experiences",
    },
    {
        id: "reliability",
        label: "Reliability of the comms stack",
        short: "Reliability",
        question: "Does the bus stay up at your control rate?",
        objective: "known bus-off and timeout bugs; maximum reliable control rate",
        community: "jitter and dropout reports",
    },
];

export type CheckRule =
    // Any item with one of the signals: official full, community half.
    | {
          kind: "presence";
          signals: Signal[];
          communityFull?: boolean;
          osiOnly?: boolean;
      }
    // Sum of `value` over matching items, official and community alike, in tiers
    // [minimum, share of max] from the top.
    | {
          kind: "tiers";
          signals: Signal[];
          tiers: [number, number][];
          officialOnly?: boolean;
      }
    // Number of distinct community repos.
    | { kind: "community-repos"; tiers: [number, number][] }
    // Median issue response in hours (lower is better), [maximum, share] tiers;
    // unknown when the REST collector did not run.
    | { kind: "response"; tiers: [number, number][] }
    // Share of classified reliability posts that are not negative; unknown
    // until the classifier passes its gold set.
    | { kind: "classified"; dimension: DimensionId; minPosts: number };

export interface CheckDef {
    id: string;
    dimension: DimensionId;
    label: string;
    max: number;
    rule: CheckRule;
}

const presence = (
    signals: Signal[],
    extra: Partial<Extract<CheckRule, { kind: "presence" }>> = {},
): CheckRule => ({
    kind: "presence",
    signals,
    ...extra,
});

export const CHECKS: readonly CheckDef[] = [
    {
        id: "protocol-doc",
        dimension: "protocol",
        label: "Wire protocol documented in public",
        max: 4,
        rule: presence(["protocol-doc"]),
    },
    {
        id: "open-licence",
        dimension: "protocol",
        label: "SDK under an OSI open-source licence",
        max: 3,
        rule: presence(["licence"], { osiOnly: true }),
    },
    {
        id: "open-implementation",
        dimension: "protocol",
        label: "Protocol implemented in public source code",
        max: 3,
        rule: presence(["lang:python", "lang:cpp", "lang:rust"], {
            communityFull: true,
        }),
    },
    {
        id: "python",
        dimension: "bindings",
        label: "Python library",
        max: 3,
        rule: presence(["lang:python"]),
    },
    {
        id: "cpp",
        dimension: "bindings",
        label: "C or C++ library",
        max: 3,
        rule: presence(["lang:cpp"]),
    },
    {
        id: "rust",
        dimension: "bindings",
        label: "Rust library",
        max: 1,
        rule: presence(["lang:rust"]),
    },
    {
        id: "maintained",
        dimension: "bindings",
        label: "Official code changed in the last 12 months",
        max: 3,
        rule: {
            kind: "tiers",
            signals: ["activity"],
            tiers: [[1, 1]],
            officialOnly: true,
        },
    },
    {
        id: "ros2-package",
        dimension: "ros_sim",
        label: "ROS 2 package",
        max: 4,
        rule: presence(["ros2-package"]),
    },
    {
        id: "ros2-control",
        dimension: "ros_sim",
        label: "ros2_control hardware interface",
        max: 3,
        rule: presence(["ros2-control"]),
    },
    {
        id: "sim-model",
        dimension: "ros_sim",
        label: "URDF or MJCF model",
        max: 3,
        rule: presence(["urdf", "mjcf"]),
    },
    {
        id: "docs-present",
        dimension: "docs",
        label: "Documentation published by the maker",
        max: 4,
        rule: presence(["docs", "docs-link"]),
    },
    {
        id: "examples",
        dimension: "docs",
        label: "Runnable examples (20+ files for full marks)",
        max: 3,
        rule: {
            kind: "tiers",
            signals: ["examples"],
            tiers: [
                [20, 1],
                [5, 0.6],
                [1, 0.3],
            ],
        },
    },
    {
        id: "english",
        dimension: "docs",
        label: "Docs in English",
        max: 3,
        rule: presence(["docs-english"]),
    },
    {
        id: "open-firmware",
        dimension: "firmware",
        label: "Firmware source is public",
        max: 4,
        rule: presence(["firmware-source"]),
    },
    {
        id: "config-tool",
        dimension: "firmware",
        label: "Configuration tool",
        max: 3,
        rule: presence(["config-tool"]),
    },
    {
        id: "firmware-update",
        dimension: "firmware",
        label: "Firmware update procedure documented",
        max: 3,
        rule: presence(["firmware-update"]),
    },
    {
        id: "activity",
        dimension: "support",
        label: "Official commits in 12 months (100+ for full marks)",
        max: 4,
        rule: {
            kind: "tiers",
            signals: ["activity"],
            tiers: [
                [100, 1],
                [20, 0.6],
                [1, 0.3],
            ],
            officialOnly: true,
        },
    },
    {
        id: "community-repos",
        dimension: "support",
        label: "Third-party repos built on it",
        max: 3,
        rule: {
            kind: "community-repos",
            tiers: [
                [2, 1],
                [1, 0.5],
            ],
        },
    },
    {
        id: "discussion",
        dimension: "support",
        label: "SDK discussion on forums (10+ posts for full marks)",
        max: 3,
        rule: {
            kind: "tiers",
            signals: ["forum-mention"],
            tiers: [
                [10, 1],
                [3, 0.6],
                [1, 0.3],
            ],
        },
    },
    {
        id: "issue-response",
        dimension: "support",
        label: "Median first response on GitHub issues",
        max: 3,
        rule: {
            kind: "response",
            tiers: [
                [24, 1],
                [72, 0.6],
                [336, 0.3],
            ],
        },
    },
    {
        id: "comms-reports",
        dimension: "reliability",
        label: "Bus-off, timeout and dropout reports (classified)",
        max: 10,
        rule: { kind: "classified", dimension: "reliability", minPosts: 3 },
    },
];

export interface Preset {
    id: string;
    label: string;
    weights: Record<DimensionId, number>;
}

export const PRESETS: readonly Preset[] = [
    {
        id: "balanced",
        label: "Balanced",
        weights: {
            protocol: 1,
            bindings: 1,
            ros_sim: 1,
            docs: 1,
            firmware: 1,
            support: 1,
            reliability: 1,
        },
    },
    {
        id: "ros2",
        label: "ROS 2 shop",
        weights: {
            protocol: 1,
            bindings: 1.5,
            ros_sim: 3,
            docs: 1,
            firmware: 1,
            support: 1.5,
            reliability: 2,
        },
    },
    {
        id: "python",
        label: "Python hobbyist",
        weights: {
            protocol: 0.5,
            bindings: 3,
            ros_sim: 0.5,
            docs: 3,
            firmware: 1,
            support: 2,
            reliability: 1,
        },
    },
    {
        id: "embedded",
        label: "Embedded",
        weights: {
            protocol: 3,
            bindings: 1.5,
            ros_sim: 0.5,
            docs: 1.5,
            firmware: 3,
            support: 1,
            reliability: 2,
        },
    },
    {
        id: "rl-sim",
        label: "RL / sim-first",
        weights: {
            protocol: 1.5,
            bindings: 2,
            ros_sim: 3,
            docs: 1,
            firmware: 1,
            support: 1,
            reliability: 2,
        },
    },
];

// Keyword themes that tag a forum post with a dimension. A post that hits
// none is not about the SDK and is dropped.
export const THEME_RULES: readonly { dimension: DimensionId; pattern: string }[] = [
    {
        dimension: "protocol",
        pattern:
            "\\b(protocols?|can ?bus|can-fd|canopen|ethercat|rs-?485|undocumented|reverse[- ]engineer(ed|ing)?)\\b",
    },
    {
        dimension: "bindings",
        pattern:
            "\\b(python|c\\+\\+|rust (crate|library|bindings)|librar(y|ies)|bindings?|sdk|api|(ros|linux|python|software|own) drivers?)(\\b|\\s)",
    },
    {
        dimension: "ros_sim",
        pattern:
            "\\b(ros|ros ?2|ros2_control|urdf|mjcf|mujoco|isaac sim|gazebo|simulat(ion|or|ed))\\b",
    },
    {
        dimension: "docs",
        pattern:
            "\\b(docs|documentation|manuals?|datasheets?|tutorials?|example code|code examples?|sample code)\\b",
    },
    {
        dimension: "firmware",
        pattern: "\\b(firmware|bootloader|brick(ed)?|calibrat(e|ion|ing))\\b",
    },
    {
        dimension: "support",
        pattern:
            "\\b((customer|tech(nical)?) support|support (team|ticket|forum)|forums?|discord|community)\\b",
    },
    {
        dimension: "reliability",
        pattern:
            "\\b(timeouts?|bus[- ]?off|jitter|dropouts?|unreliable|disconnect(s|ed|ing)?|latency)\\b",
    },
];

// Licences approved by the Open Source Initiative.
export const OSI: ReadonlySet<string> = new Set([
    "Apache-2.0",
    "MPL-2.0",
    "LGPL-3.0",
    "LGPL-2.1",
    "AGPL-3.0",
    "GPL-3.0",
    "GPL-2.0",
    "MIT",
    "BSD-3-Clause",
    "BSD-2-Clause",
    "Unlicense",
]);
