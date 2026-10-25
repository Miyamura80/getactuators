import type { Confidence, SourceId } from "./sourced";

// Who sells what to whom. Used by country arcs and BOM graphs. A link marked
// "estimated" rests on press reports the buyer has not confirmed.

export interface SupplyLink {
    from: string;
    to: string;
    what: string;
    sources: SourceId[];
    confidence: Confidence;
    note?: string;
}

export const SUPPLY_LINKS: SupplyLink[] = [
    {
        from: "mp-materials",
        to: "shenghe-resources",
        what: "Rare earth concentrate (offtake)",
        sources: ["mp-10q-q1-2025", "alcircle-crg-shenghe-2026"],
        confidence: "reported",
        note: "MP halted shipments to China in April 2025.",
    },
    {
        from: "china-northern-rare-earth",
        to: "jl-mag",
        what: "Rare earth raw materials (long-term agreement)",
        sources: ["jlmag-about"],
        confidence: "reported",
    },
    {
        from: "china-rare-earth-group",
        to: "jl-mag",
        what: "Rare earth raw materials (long-term agreement)",
        sources: ["jlmag-about"],
        confidence: "reported",
    },
    {
        from: "hyundai-mobis",
        to: "boston-dynamics",
        what: "Actuators for the production Atlas humanoid",
        sources: ["mobis-boston-dynamics-2026"],
        confidence: "reported",
    },
    {
        from: "nabtesco",
        to: "fanuc",
        what: "RV precision reduction gears",
        sources: ["bloomberg-japangov-robots"],
        confidence: "reported",
    },
    {
        from: "nabtesco",
        to: "yaskawa",
        what: "RV precision reduction gears",
        sources: ["bloomberg-japangov-robots"],
        confidence: "reported",
    },
    {
        from: "leaderdrive",
        to: "ubtech",
        what: "Harmonic reducers",
        sources: ["gasgoo-leaderdrive-ipo-2026"],
        confidence: "reported",
    },
    {
        from: "leaderdrive",
        to: "agibot",
        what: "Harmonic reducers",
        sources: ["gasgoo-leaderdrive-ipo-2026"],
        confidence: "reported",
    },
    {
        from: "tuopu-group",
        to: "tesla",
        what: "Optimus actuator assemblies",
        sources: ["cnevpost-optimus-audits-2026"],
        confidence: "estimated",
        note: "Supplier audits and orders reported by Chinese media; Tesla has not confirmed.",
    },
];
