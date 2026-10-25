import { type CanonicalJoint, HUMANOIDS, type Humanoid, humanoidTotals, jointLabel } from "../../../../src/humanoids";
import { reeSplit } from "../../../../src/humanoids/magnet";

// Rare-earth grams per element, derived only from each joint's magnet mass
// estimate and the grade composition in src/humanoids/magnet.ts.

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

function emptyGrams(): Grams {
    return { nd: { mid: 0, lo: 0, hi: 0 }, pr: { mid: 0, lo: 0, hi: 0 }, dy: { mid: 0, lo: 0, hi: 0 }, tb: { mid: 0, lo: 0, hi: 0 } };
}

function addSplit(g: Grams, range: readonly [number, number]) {
    const s = reeSplit(range);
    for (const el of ELEMENTS) {
        const [lo, hi] = s[el];
        g[el].lo += lo;
        g[el].hi += hi;
        g[el].mid += (lo + hi) / 2;
    }
}

export const sum = (g: Grams, k: "mid" | "lo" | "hi") => ELEMENTS.reduce((n, el) => n + g[el][k], 0);

// Grams per canonical node.
export function gramsByNode(h: Humanoid): Map<CanonicalJoint, Grams> {
    const out = new Map<CanonicalJoint, Grams>();
    for (const j of h.joints) {
        const g = out.get(j.canonical) ?? emptyGrams();
        addSplit(g, j.magnetMassG.range ?? [j.magnetMassG.value, j.magnetMassG.value]);
        out.set(j.canonical, g);
    }
    return out;
}

// Grams per joint row, left and right merged ("Knee x2").
export function gramsByJoint(h: Humanoid): { label: string; sides: number; grams: Grams }[] {
    const rows = new Map<string, { label: string; sides: number; grams: Grams }>();
    for (const [node, g] of gramsByNode(h)) {
        const sided = /^[lr]-/.test(node);
        const raw = sided ? jointLabel(node).replace(/^(Left|Right) /, "") : jointLabel(node);
        const label = raw.charAt(0).toUpperCase() + raw.slice(1);
        const row = rows.get(label) ?? { label, sides: sided ? 2 : 1, grams: emptyGrams() };
        for (const el of ELEMENTS) {
            row.grams[el].lo += g[el].lo;
            row.grams[el].hi += g[el].hi;
            row.grams[el].mid += g[el].mid;
        }
        rows.set(label, row);
    }
    return [...rows.values()].sort((a, b) => sum(b.grams, "mid") - sum(a.grams, "mid"));
}

// Whole-robot grams, from the same totals the stats panel shows.
export function robotGrams(h: Humanoid): Grams {
    const t = humanoidTotals(h).reeKg;
    const g = emptyGrams();
    for (const el of ELEMENTS) {
        const s = t[el];
        g[el] = { mid: s.value * 1000, lo: (s.range?.[0] ?? s.value) * 1000, hi: (s.range?.[1] ?? s.value) * 1000 };
    }
    return g;
}

export function fleetGrams(): { h: Humanoid; grams: Grams }[] {
    return HUMANOIDS.map((h) => ({ h, grams: robotGrams(h) })).sort((a, b) => sum(b.grams, "mid") - sum(a.grams, "mid"));
}

export const gramText = (g: number) => `${Math.round(g).toLocaleString("en-US")} g`;

// A tidy axis: step of 1, 2, 2.5 or 5 x 10^n giving about four ticks.
export function niceAxis(x: number, parts = 4): { max: number; ticks: number[] } {
    const raw = Math.max(x, 1) / parts;
    const p = 10 ** Math.floor(Math.log10(raw));
    const step = ([1, 2, 2.5, 5, 10].find((k) => k * p >= raw) ?? 10) * p;
    const n = Math.max(1, Math.ceil(x / step));
    return { max: n * step, ticks: Array.from({ length: n + 1 }, (_, i) => i * step) };
}
