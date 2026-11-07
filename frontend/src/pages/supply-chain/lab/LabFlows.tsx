import { useMemo, useState } from "react";
import { activeLinks, getCompany } from "../../../../../src/supply-chain/registry";
import { LAB_STAGE_SHARES } from "../../../../../src/supply-chain/lab-fixtures";
import { LAB_TESLA_MARGIN, labNdStep, labRobotFlow } from "../../../../../src/supply-chain/lab-kit";
import { NodeBadge, type NodeBadgeProps } from "../../../components/flows/NodeBadge";
import { ProcessStepChip } from "../../../components/flows/ProcessStepChip";
import { type GraphNode, SupplyGraph } from "../../../components/flows/SupplyGraph";
import { type FlowNode, ValueSankey } from "../../../components/flows/ValueSankey";

const shareOf = (stage: string) => LAB_STAGE_SHARES.find((r) => r.id === stage)?.shares;

// Badges the lab attaches to graph cards: the stage's country concentration
// where a cited share exists, and Tesla's reported margin.
function badgesFor(companyId: string, stage: string | undefined): NodeBadgeProps[] {
    const shares = stage ? shareOf(stage) : undefined;
    return [
        ...(shares ? [{ kind: "concentration" as const, shares }] : []),
        ...(companyId === "tesla" ? [{ kind: "margin" as const, value: LAB_TESLA_MARGIN }] : []),
    ];
}

function graph(): { nodes: GraphNode[]; edges: { from: string; to: string; label: string; confidence: "reported" | "estimated" | "modeled" }[] } {
    const links = activeLinks();
    const ids = [...new Set(links.flatMap((l) => [l.from, l.to]))];
    const nodes = ids.flatMap((id) => {
        const c = getCompany(id);
        if (!c) return [];
        const supplies = links.some((l) => l.from === id);
        const stage = supplies ? c.stages.find((s) => shareOf(s)) ?? c.stages.at(-1) : c.stages.at(-1);
        return [{ id, name: c.name, country: c.hqCountry, stage, badges: badgesFor(id, stage) }];
    });
    return { nodes, edges: links.map((l) => ({ from: l.from, to: l.to, label: l.what, confidence: l.confidence })) };
}

// Flow kit demo: a value-added Sankey (one robot's cost BOM), a one-step
// Sankey with the idiot-index badge, the company graph, and the badge and
// step-chip vocabulary.
export function LabFlows() {
    const [picked, setPicked] = useState<string | null>(null);
    const robot = useMemo(() => labRobotFlow(), []);
    const robotNodes: FlowNode[] = useMemo(() => robot.nodes.map((n) => (n.id === "actuators" ? { ...n, steps: ["sintering", "winding"] } : n)), [robot]);
    const nd = useMemo(() => labNdStep(), []);
    const g = useMemo(() => graph(), []);
    return <>
        <div className="sc-lab-flows">
            <ValueSankey label="Berkeley Humanoid Lite, cost BOM" nodes={robotNodes} links={robot.links} selectedId={picked} onSelectNode={(id) => setPicked(picked === id ? null : id)} />
            {nd ? <ValueSankey
                label="1 kg of neodymium metal"
                height={200}
                nodes={[
                    { id: "oxide", label: "Nd oxide, 1.17 kg" },
                    { id: "reduction", label: "Reduction to metal" },
                    { id: "metal", label: "Nd metal, 1 kg", badges: [{ kind: "idiot-index", value: nd.multiplier }] },
                ]}
                links={[
                    { source: "oxide", target: "metal", value: nd.oxide.value },
                    { source: "reduction", target: "metal", value: Math.max(0, nd.metal.value - nd.oxide.value) },
                ]}
            /> : null}
        </div>
        <SupplyGraph label="Current supply links between registry companies" nodes={g.nodes} edges={g.edges} />
        <div className="sc-lab-badges">
            {nd ? <NodeBadge kind="idiot-index" value={nd.multiplier} /> : null}
            <NodeBadge kind="margin" value={LAB_TESLA_MARGIN} />
            {LAB_STAGE_SHARES.map((r) => <NodeBadge key={r.id} kind="concentration" shares={r.shares} />)}
            <ProcessStepChip stepId="sintering" />
            <ProcessStepChip stepId="strip-casting" />
        </div>
    </>;
}
