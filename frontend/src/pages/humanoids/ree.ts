import { type Humanoid, humanoidTotals, REE_ELEMENTS, type Span } from "../../../../src/humanoids";

// UI constants for the rare-earth chart. The grams and metal values per design
// come from src/humanoids/ree-design.ts.

export const ELEMENTS = REE_ELEMENTS;
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

export type Grams = Record<Element, Span>;

export const sum = (g: Grams, k: keyof Span) => ELEMENTS.reduce((n, el) => n + g[el][k], 0);

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
export const usdText = (v: number) => `$${v < 100 ? v.toFixed(v < 10 ? 2 : 1) : Math.round(v).toLocaleString("en-US")}`;

// A tidy axis maximum: step of 1, 2, 2.5 or 5 x 10^n, about `parts` steps.
export function niceMax(x: number, parts = 3): number {
    const raw = Math.max(x, 1e-6) / parts;
    const p = 10 ** Math.floor(Math.log10(raw));
    const step = ([1, 2, 2.5, 5, 10].find((k) => k * p >= raw) ?? 10) * p;
    return Math.max(1, Math.ceil(x / step)) * step;
}
