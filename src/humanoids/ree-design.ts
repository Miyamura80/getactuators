import { humanoidBom } from "./bom";
import { REE_FRACTION, reeSplit } from "./magnet";
import { REE_METAL_PRICE } from "./ree-prices";
import type { ActuatorType, Humanoid, Ree } from "./types";

// Rare earth per actuator design: element grams from the magnet mass
// estimate (composition rule in ./magnet), and their raw-metal value at the
// prices in ./ree-prices. Not a magnet or actuator price.

export const REE_ELEMENTS = ["nd", "pr", "dy", "tb"] as const;

export interface Span {
    lo: number;
    mid: number;
    hi: number;
}

export interface DesignRee {
    key: string;
    label: string;
    type: ActuatorType;
    count: number;
    grams: Ree<Span>;
    usd: Ree<Span>;
}

// Mid: the magnet estimate at the middle grade fraction (the magnet range is
// not symmetric about its estimate when the motor class is uncertain).
function gramsOf(valueKg: number, rangeKg: readonly [number, number]): Ree<Span> {
    const s = reeSplit([rangeKg[0] * 1000, rangeKg[1] * 1000]);
    const out = {} as Ree<Span>;
    for (const el of REE_ELEMENTS) {
        const [lo, hi] = s[el];
        const f = REE_FRACTION[el];
        out[el] = { lo, hi, mid: (valueKg * 1000 * (f[0] + f[1])) / 2 };
    }
    return out;
}

// Grams x US$/kg / 1000: low grams at the low price, high at the high.
export function metalValue(g: Ree<Span>): Ree<Span> {
    const out = {} as Ree<Span>;
    for (const el of REE_ELEMENTS) {
        const p = REE_METAL_PRICE[el];
        const [pLo, pHi] = p.range ?? [p.value, p.value];
        out[el] = {
            lo: (g[el].lo * pLo) / 1000,
            mid: (g[el].mid * p.value) / 1000,
            hi: (g[el].hi * pHi) / 1000,
        };
    }
    return out;
}

export const spanTotal = (r: Ree<Span>, k: keyof Span) =>
    REE_ELEMENTS.reduce((n, el) => n + r[el][k], 0);

// One row per actuator design, from the BOM's magnet grouping (every design,
// none folded into Other), largest first.
export function reeByDesign(h: Humanoid): DesignRee[] {
    return humanoidBom(h, "magnet", Number.POSITIVE_INFINITY)
        .slices.filter((s) => s.category === "actuator")
        .map((s) => {
            const grams = gramsOf(s.value, s.range);
            return {
                key: s.key,
                label: s.label,
                type: s.type,
                count: s.count,
                grams,
                usd: metalValue(grams),
            };
        })
        .sort((a, b) => spanTotal(b.grams, "mid") - spanTotal(a.grams, "mid"));
}
