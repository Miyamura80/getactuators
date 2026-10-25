import { HUMANOIDS_AS_OF } from "./build";
import type { Confidence, Sourced } from "./sourced";
import type { Humanoid } from "./types";

// The rest of a robot's bill of materials (everything that is not a joint
// actuator), only where a cited full-robot BOM exists. No category is ever
// filled in from a list price: prices include margin.

export interface RestPart {
    key: string;
    label: string;
    value: Sourced<number>;
    // True when the source gives a total but no categories.
    lumped?: boolean;
}

function part(
    key: string,
    label: string,
    value: number,
    range: readonly [number, number],
    confidence: Confidence,
    sources: string[],
    note: string,
    lumped = false,
): RestPart {
    return {
        key,
        label,
        value: {
            value,
            unit: "USD",
            sources,
            asOf: HUMANOIDS_AS_OF,
            confidence,
            range: [range[0], range[1]],
            note,
        },
        ...(lumped ? { lumped } : {}),
    };
}

const BHL = ["bhl-irz", "bhl-rdworld"];
const exact = (v: number) => [v, v] as const;

// Berkeley Humanoid Lite: the paper's Table III, $4,312 in all, as itemized
// by IRZ. "Other" is the remainder of the published total.
const BHL_REST = [
    part(
        "compute",
        "Compute & electronics",
        197,
        exact(197),
        "reported",
        BHL,
        "Intel N95 mini PC $129 and four USB-CAN adapters $68.",
    ),
    part(
        "structure",
        "Printed structure",
        200.1,
        exact(200.1),
        "reported",
        BHL,
        "All printed components together.",
    ),
    part(
        "grippers",
        "Grippers",
        72,
        exact(72),
        "reported",
        BHL,
        "Two grippers, outside the joint map.",
    ),
    part("battery", "Battery", 70, exact(70), "reported", BHL, "6S battery."),
    part(
        "other",
        "Wiring, fasteners & other",
        4312 - 3512 - 197 - 200.1 - 72 - 70,
        exact(4312 - 3512 - 197 - 200.1 - 72 - 70),
        "reported",
        BHL,
        "Remainder of the $4,312 total after the itemized parts and the paper's $3,512 of actuators.",
    ),
];

// Optimus: Huibo's 135k CNY hardware BOM leaves 14k CNY after actuators and
// hands; Morgan Stanley's ~$55k BOM puts actuators at 56%. Neither splits the
// remainder into categories.
const OPTIMUS_REST = [
    part(
        "rest",
        "All other parts (not itemized)",
        14000 / 7.2,
        [14000 / 7.2, 55000 * 0.44],
        "estimated",
        ["huibo-optimus-bom", "ms-optimus-bom"],
        "Battery, compute, sensors and structure together: Huibo's remainder (14k CNY) up to 44% of Morgan Stanley's $55k BOM. Not broken into categories.",
        true,
    ),
];

const REST: Record<string, RestPart[]> = {
    "berkeley-humanoid-lite": BHL_REST,
    "tesla-optimus": OPTIMUS_REST,
};

export function restOfRobotCost(h: Humanoid): RestPart[] {
    return REST[h.id] ?? [];
}

// Rest of the robot's mass: published weight minus the actuator mass, when
// the robot's weight is known and exceeds it.
export function restOfRobotMass(
    h: Humanoid,
    actuators: { value: number; range: readonly [number, number] },
): RestPart[] {
    if (!h.weight_kg || actuators.value >= h.weight_kg) return [];
    const w = h.weight_kg;
    const lo = Math.max(0, w - actuators.range[1]);
    const hi = Math.max(0, w - actuators.range[0]);
    return [
        {
            key: "rest",
            label: "Rest of robot",
            value: {
                value: w - actuators.value,
                unit: "kg",
                sources: h.sources,
                asOf: HUMANOIDS_AS_OF,
                confidence: "modeled",
                range: [lo, hi],
                note: `Published weight ${w} kg minus the actuator mass counted here.`,
            },
        },
    ];
}
