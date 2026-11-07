import { HUMANOIDS } from "../humanoids";
import { humanoidBom } from "../humanoids/bom";
import type { NamedCluster } from "./map";
import { priceAt } from "./metals/prices";
import type { Sourced } from "./sourced";

// Fixtures for the map and flow kits on /lab/supply-chain. Every number comes
// from a cited dataset; the cluster boxes are plain geography.

export const LAB_CLUSTERS: NamedCluster[] = [
    {
        id: "yangtze-delta",
        label: "Yangtze River Delta",
        bbox: [29.4, 118.6, 32.6, 122.4],
    },
    { id: "baotou", label: "Baotou", bbox: [40.2, 109.4, 41.1, 110.6] },
    { id: "kanto-koshin", label: "Kanto & Koshin", bbox: [35.2, 138.0, 36.7, 140.2] },
];

export interface LabFlow {
    nodes: { id: string; label: string }[];
    links: { source: string; target: string; value: number }[];
}

export const LAB_FLOW_ROBOT = "berkeley-humanoid-lite";

// Berkeley Humanoid Lite's cost BOM (the /humanoids dataset, itself cited)
// as a flow: parts into actuators or the rest of the robot, then the robot.
export function labRobotFlow(): LabFlow {
    const h = HUMANOIDS.find((x) => x.id === LAB_FLOW_ROBOT);
    if (!h) return { nodes: [], links: [] };
    const bom = humanoidBom(h, "cost");
    const nodes = [
        ...bom.slices.map((s) => ({
            id: s.key,
            label: s.category === "actuator" ? `${s.count} × ${s.label}` : s.label,
        })),
        { id: "actuators", label: "Actuators" },
        { id: "rest", label: "Rest of robot" },
        { id: "robot", label: h.name },
    ];
    const links = [
        ...bom.slices.map((s) => ({
            source: s.key,
            target: s.category === "actuator" ? "actuators" : "rest",
            value: s.value,
        })),
        { source: "actuators", target: "robot", value: bom.actuators.value },
        ...(bom.rest
            ? [{ source: "rest", target: "robot", value: bom.rest.value }]
            : []),
    ];
    return { nodes, links };
}

// Tesla's FY2024 total gross margin, for the margin badge.
export const LAB_TESLA_MARGIN: Sourced<number> = {
    value: 0.179,
    unit: "fraction",
    sources: ["tesla-10k-2024"],
    asOf: "2024",
    confidence: "reported",
    note: "Total gross profit $17,450M on total revenues $97,690M.",
};

// Neodymium oxide to metal, per kg of metal: a step multiplier for the
// idiot-index badge. Nd2O3 is 85.7% Nd by mass, so 1 kg of metal takes
// 1.166 kg of oxide.
const OXIDE_PER_METAL = 1.166;

export interface NdStep {
    oxide: Sourced<number>;
    metal: Sourced<number>;
    multiplier: Sourced<number>;
}

export function labNdStep(month = "2026-09"): NdStep | null {
    const oxide = priceAt("nd-oxide", month);
    const metal = priceAt("nd-metal-fob", month);
    if (!oxide || !metal) return null;
    const contained = oxide.value.value * OXIDE_PER_METAL;
    const sources = [...new Set([...oxide.value.sources, ...metal.value.sources])];
    return {
        oxide: {
            value: Math.round(contained),
            unit: "USD",
            sources: oxide.value.sources,
            asOf: oxide.value.asOf,
            confidence: "modeled",
            note: `${OXIDE_PER_METAL} kg of Nd oxide at $${oxide.value.value}/kg (FOB China${oxide.carried ? `, the ${oxide.date} average carried forward` : ""}).`,
        },
        metal: metal.value,
        multiplier: {
            value: metal.value.value / contained,
            sources,
            asOf: metal.value.asOf,
            confidence: "modeled",
            note: `Nd metal FOB price over the oxide it contains. ${oxide.carried ? `The oxide price is the ${oxide.date} average, so part of the step is the 2026 price rise.` : ""}`.trim(),
        },
    };
}
