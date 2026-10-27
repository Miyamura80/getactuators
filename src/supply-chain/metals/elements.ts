import type { SourceId } from "../sourced";

// The six metals that make an actuator's permanent magnet: NdFeB (Nd, Pr,
// with Dy and Tb for heat) and SmCo (Sm, Co). Ids are stable and used in
// URLs (?element=dy), so rename labels, never ids.

export const METAL_IDS = ["nd", "pr", "dy", "tb", "sm", "co"] as const;
export type MetalId = (typeof METAL_IDS)[number];

export type MetalClass = "light" | "heavy" | "transition";

export interface Metal {
    id: MetalId;
    symbol: string;
    name: string;
    // Light or heavy rare earth, or a transition metal (cobalt).
    class: MetalClass;
    magnet: "NdFeB" | "SmCo";
    // What the element does in the magnet, one line.
    role: string;
    sources: SourceId[];
}

export const METAL_CLASS_LABEL: Record<MetalClass, string> = {
    light: "Light rare earth",
    heavy: "Heavy rare earth",
    transition: "Transition metal",
};

const ARNOLD = ["arnold-dysprosium-2015"];
const JDA = ["jda-ndfeb-composition"];

export const METALS: Metal[] = [
    {
        id: "nd",
        symbol: "Nd",
        name: "Neodymium",
        class: "light",
        magnet: "NdFeB",
        role: "Forms the Nd2Fe14B phase that carries the magnetism.",
        sources: JDA,
    },
    {
        id: "pr",
        symbol: "Pr",
        name: "Praseodymium",
        class: "light",
        magnet: "NdFeB",
        role: "Mined and sold with Nd as NdPr; stands in for part of the Nd.",
        sources: [...JDA, ...ARNOLD],
    },
    {
        id: "dy",
        symbol: "Dy",
        name: "Dysprosium",
        class: "heavy",
        magnet: "NdFeB",
        role: "Keeps the magnet from demagnetizing when it runs hot.",
        sources: ARNOLD,
    },
    {
        id: "tb",
        symbol: "Tb",
        name: "Terbium",
        class: "heavy",
        magnet: "NdFeB",
        role: "Restores heat resistance like Dy, at about 4.6 times the price per kg.",
        sources: [...JDA, "rem-tb-price-2026"],
    },
    {
        id: "sm",
        symbol: "Sm",
        name: "Samarium",
        class: "light",
        magnet: "SmCo",
        role: "SmCo magnets lose less strength than NdFeB above about 150 °C.",
        sources: ARNOLD,
    },
    {
        id: "co",
        symbol: "Co",
        name: "Cobalt",
        class: "transition",
        magnet: "SmCo",
        role: "The other half of SmCo; also added to NdFeB to raise its Curie point.",
        sources: [...ARNOLD, ...JDA],
    },
];

export function getMetal(id: string): Metal | undefined {
    return METALS.find((m) => m.id === id.toLowerCase());
}
