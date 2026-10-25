import { type ActuatorType, type Humanoid, humanoidBom, humanoidTotals } from "../../../../src/humanoids";
import { reeSplit } from "../../../../src/humanoids/magnet";

// Rare-earth grams per element, derived only from the magnet mass estimates
// and the grade composition in src/humanoids/magnet.ts.

export const ELEMENTS = ["nd", "pr", "dy", "tb"] as const;
export type Element = (typeof ELEMENTS)[number];

export const ELEMENT_NAME: Record<Element, string> = {
    nd: "neodymium",
    pr: "praseodymium",
    dy: "dysprosium",
    tb: "terbium",
};
export const ELEMENT_SYMBOL: Record<Element, string> = { nd: "Nd", pr: "Pr", dy: "Dy", tb: "Tb" };

// Warm metal tones, distinct in lightness, away from the actuator palette.
export const ELEMENT_COLOR: Record<Element, string> = {
    nd: "#c99a6b",
    pr: "#ead6b4",
    dy: "#8f7a66",
    tb: "#f6f1e8",
};

export type Grams = Record<Element, { mid: number; lo: number; hi: number }>;

export const sum = (g: Grams, k: "mid" | "lo" | "hi") => ELEMENTS.reduce((n, el) => n + g[el][k], 0);

// Element grams for a magnet mass range given in kg.
function gramsOf(rangeKg: readonly [number, number]): Grams {
    const s = reeSplit([rangeKg[0] * 1000, rangeKg[1] * 1000]);
    const g = {} as Grams;
    for (const el of ELEMENTS) {
        const [lo, hi] = s[el];
        g[el] = { lo, hi, mid: (lo + hi) / 2 };
    }
    return g;
}

export interface DesignGrams {
    key: string;
    label: string;
    type: ActuatorType;
    count: number;
    grams: Grams;
}

// One row per actuator design, from the same grouping as the BOM donut's
// magnet view (without folding small designs into Other), so the two
// lists cannot drift.
export function gramsByDesign(h: Humanoid): DesignGrams[] {
    return humanoidBom(h, "magnet", Number.POSITIVE_INFINITY)
        .slices.filter((s) => s.category === "actuator")
        .map((s) => ({ key: s.key, label: s.label, type: s.type, count: s.count, grams: gramsOf(s.range) }))
        .sort((a, b) => sum(b.grams, "mid") - sum(a.grams, "mid"));
}

// Whole-robot grams, from the same totals the stats panel shows.
export function robotGrams(h: Humanoid): Grams {
    const t = humanoidTotals(h).reeKg;
    const g = {} as Grams;
    for (const el of ELEMENTS) {
        const s = t[el];
        g[el] = { mid: s.value * 1000, lo: (s.range?.[0] ?? s.value) * 1000, hi: (s.range?.[1] ?? s.value) * 1000 };
    }
    return g;
}

export const gramText = (g: number) => `${Math.round(g).toLocaleString("en-US")} g`;

// A tidy axis: step of 1, 2, 2.5 or 5 x 10^n giving about `parts` ticks.
export function niceAxis(x: number, parts = 3): { max: number; ticks: number[] } {
    const raw = Math.max(x, 1) / parts;
    const p = 10 ** Math.floor(Math.log10(raw));
    const step = ([1, 2, 2.5, 5, 10].find((k) => k * p >= raw) ?? 10) * p;
    const n = Math.max(1, Math.ceil(x / step));
    return { max: n * step, ticks: Array.from({ length: n + 1 }, (_, i) => i * step) };
}
