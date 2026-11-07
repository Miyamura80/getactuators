import type { Sourced } from "../sourced";

// Cited price history of the magnet metals, US$ per kg. This is the single
// source of commodity prices for the site: /metals draws it and /bom costs
// raw material with priceAt(). Long-run points are USGS annual averages and
// year-end ranges; 2026 points are monthly Shanghai Metals Market (SMM)
// readings. No point is interpolated: a month without a reading carries the
// last one forward and says so.

export type PriceMarket = "cn-domestic" | "fob-china" | "lme";
export type PriceBasis = "annual-average" | "year-end" | "spot";
export type PriceForm = "oxide" | "metal" | "alloy";

export const MARKET_LABEL: Record<PriceMarket, string> = {
    "cn-domestic": "China domestic",
    "fob-china": "Export, FOB China",
    lme: "LME cash",
};

export const BASIS_LABEL: Record<PriceBasis, string> = {
    "annual-average": "annual average",
    "year-end": "year-end",
    spot: "reading",
};

export interface PricePoint {
    // "YYYY" for an annual average, "YYYY-MM-DD" for a reading.
    date: string;
    basis: PriceBasis;
    value: Sourced<number>;
}

export interface PriceSeries {
    id: string;
    label: string;
    // Element, or "ndpr" for the Nd-Pr blend magnets are made from.
    element: "nd" | "pr" | "ndpr" | "dy" | "tb" | "sm" | "co";
    form: PriceForm;
    market: PriceMarket;
    unit: "USD/kg";
    points: PricePoint[];
}

const UNIT = "USD/kg";

function point(
    date: string,
    basis: PriceBasis,
    value: number,
    sources: string[],
    note: string,
    confidence: Sourced<number>["confidence"] = "reported",
    range?: [number, number],
): PricePoint {
    return {
        date,
        basis,
        value: {
            value,
            unit: UNIT,
            sources,
            asOf: date.length === 4 ? date : date.slice(0, 7),
            confidence,
            note,
            ...(range ? { range } : {}),
        },
    };
}

// USGS Mineral Commodity Summaries, three editions.
const MCS16 = ["usgs-mcs-2016-ree"];
const MCS21 = ["usgs-mcs-2021-ree"];

// Year-end price range 2011-2015 (MCS 2016, Metal-Pages); the midpoint is drawn.
function yearEnds(lowHigh: [number, number][]): PricePoint[] {
    return lowHigh.map(([lo, hi], i) =>
        point(
            `${2011 + i}-12-31`,
            "year-end",
            (lo + hi) / 2,
            MCS16,
            `Year-end range $${lo} to $${hi}/kg (Metal-Pages); midpoint drawn.`,
            "estimated",
            [lo, hi],
        ),
    );
}

// Annual averages for five consecutive years from one edition; the last year
// of an edition is the USGS estimate for the year just ended.
function averages(
    first: number,
    values: number[],
    sources: string[],
    note: string,
): PricePoint[] {
    return values.map((v, i) => {
        const last = i === values.length - 1;
        return point(
            String(first + i),
            "annual-average",
            v,
            sources,
            last ? `${note} Estimate for the year.` : note,
            last ? "estimated" : "reported",
        );
    });
}

const ARGUS_21 = "Annual average (Argus); basis not stated in this edition.";
const ARGUS_26 = "Annual average, free on board China (Argus).";
const HEAVY_26 = "Annual average, free on board China (Argus, Asian Metal).";

function smm(
    readings: [string, number][],
    sources: string[],
    note: string,
): PricePoint[] {
    return readings.map(([date, v]) => point(date, "spot", v, sources, note));
}

const SMM_CN = "SMM domestic China benchmark, VAT excluded.";
const SMM_FOB = "SMM FOB China export price.";
const ND = ["rem-nd-price-2026"];
const DY = ["rem-dy-price-2026"];
const TB = ["rem-tb-price-2026"];

// One reading per month where published; 1 May 2026 is left out for Nd, NdPr
// and Dy because the source repeats the 1 April figure exactly.
export const PRICE_SERIES: PriceSeries[] = [
    {
        id: "ndpr-oxide",
        label: "NdPr oxide",
        element: "ndpr",
        form: "oxide",
        market: "fob-china",
        unit: UNIT,
        points: averages(2021, [92, 124, 75, 55, 69], ["usgs-mcs-2026-ree"], ARGUS_26),
    },
    {
        id: "nd-oxide",
        label: "Nd oxide",
        element: "nd",
        form: "oxide",
        market: "fob-china",
        unit: UNIT,
        points: [
            ...yearEnds([
                [190, 200],
                [75, 80],
                [65, 70],
                [56, 60],
                [37, 42],
            ]),
            point(
                "2012-01-01",
                "spot",
                195,
                ["usgs-mcs-2013-ree"],
                "Neodymium oxide began 2012 at $195/kg and fell to $80/kg by year-end.",
            ),
            ...averages(2016, [40, 50, 50, 45, 47], MCS21, ARGUS_21),
            ...averages(2021, [98, 134, 78, 56, 73], ["usgs-mcs-2026-ree"], ARGUS_26),
        ],
    },
    {
        id: "pr-oxide",
        label: "Pr oxide",
        element: "pr",
        form: "oxide",
        market: "fob-china",
        unit: UNIT,
        points: averages(2021, [93, 128, 76, 56, 74], ["usgs-mcs-2026-ree"], ARGUS_26),
    },
    {
        id: "dy-oxide",
        label: "Dy oxide",
        element: "dy",
        form: "oxide",
        market: "fob-china",
        unit: UNIT,
        points: [
            ...yearEnds([
                [1400, 1420],
                [600, 630],
                [440, 490],
                [320, 360],
                [215, 240],
            ]),
            ...averages(2016, [198, 187, 179, 239, 258], MCS21, ARGUS_21),
            ...averages(
                2021,
                [410, 382, 330, 257, 239],
                ["usgs-mcs-2026-ree-heavy"],
                HEAVY_26,
            ),
        ],
    },
    {
        id: "tb-oxide",
        label: "Tb oxide",
        element: "tb",
        form: "oxide",
        market: "fob-china",
        unit: UNIT,
        points: [
            ...yearEnds([
                [2800, 2820],
                [1200, 1300],
                [800, 850],
                [590, 640],
                [410, 490],
            ]),
            ...averages(2016, [415, 501, 455, 507, 628], MCS21, ARGUS_21),
            ...averages(
                2021,
                [1340, 2050, 1300, 812, 1010],
                ["usgs-mcs-2026-ree-heavy"],
                HEAVY_26,
            ),
        ],
    },
    {
        id: "sm-oxide",
        label: "Sm oxide",
        element: "sm",
        form: "oxide",
        market: "fob-china",
        unit: UNIT,
        points: averages(
            2021,
            [2.03, 3.34, 2.17, 2.01, 2.82],
            ["usgs-mcs-2026-ree"],
            ARGUS_26,
        ),
    },
    {
        id: "co-metal",
        label: "Cobalt metal",
        element: "co",
        form: "metal",
        market: "lme",
        unit: UNIT,
        // USGS reports $/lb; converted at 2.20462 lb/kg.
        points: [
            ...averages(
                2016,
                [11.57, 25.28, 32.94, 14.88, 14.0].map(perKg),
                ["usgs-mcs-2021-cobalt"],
                "LME cash annual average, converted from $/lb.",
            ),
            ...averages(
                2021,
                [23.17, 28.83, 15.48, 11.84, 15].map(perKg),
                ["usgs-mcs-2026-cobalt"],
                "LME cash annual average, converted from $/lb.",
            ),
        ],
    },
    {
        id: "nd-metal-cn",
        label: "Nd metal",
        element: "nd",
        form: "metal",
        market: "cn-domestic",
        unit: UNIT,
        points: smm(
            [
                ["2026-03-01", 117.27],
                ["2026-04-01", 124.87],
                ["2026-06-01", 121.95],
                ["2026-07-01", 145.88],
                ["2026-08-03", 145.48],
                ["2026-09-03", 141.79],
                ["2026-09-30", 140.88],
            ],
            ND,
            SMM_CN,
        ),
    },
    {
        id: "nd-metal-fob",
        label: "Nd metal",
        element: "nd",
        form: "metal",
        market: "fob-china",
        unit: UNIT,
        points: smm([["2026-09-30", 154]], ND, SMM_FOB),
    },
    {
        id: "ndpr-alloy-cn",
        label: "NdPr alloy",
        element: "ndpr",
        form: "alloy",
        market: "cn-domestic",
        unit: UNIT,
        points: smm(
            [
                ["2026-03-01", 108.64],
                ["2026-04-01", 126.16],
                ["2026-06-01", 109.55],
                ["2026-07-01", 133.02],
                ["2026-08-03", 133.67],
                ["2026-09-03", 131.02],
                ["2026-09-30", 133.44],
            ],
            ND,
            SMM_CN,
        ),
    },
    {
        id: "pr-metal-cn",
        label: "Pr metal",
        element: "pr",
        form: "metal",
        market: "cn-domestic",
        unit: UNIT,
        points: smm([["2026-09-30", 149.06]], ND, SMM_CN),
    },
    {
        id: "pr-metal-fob",
        label: "Pr metal",
        element: "pr",
        form: "metal",
        market: "fob-china",
        unit: UNIT,
        points: smm([["2026-09-30", 162]], ND, SMM_FOB),
    },
    {
        id: "dy-metal-cn",
        label: "Dy metal",
        element: "dy",
        form: "metal",
        market: "cn-domestic",
        unit: UNIT,
        points: smm(
            [
                ["2026-03-01", 191.08],
                ["2026-04-01", 220.93],
                ["2026-06-01", 208.68],
                ["2026-07-01", 261.63],
                ["2026-08-03", 231.35],
                ["2026-09-03", 239.12],
                ["2026-09-30", 233.55],
            ],
            DY,
            `${SMM_CN} 99% min.`,
        ),
    },
    {
        id: "tb-metal-cn",
        label: "Tb metal",
        element: "tb",
        form: "metal",
        market: "cn-domestic",
        unit: UNIT,
        points: smm(
            [
                ["2026-03-01", 803.96],
                ["2026-04-01", 970.18],
                ["2026-05-01", 789.79],
                ["2026-06-01", 969.69],
                ["2026-07-01", 1179.54],
                ["2026-08-03", 1094.68],
                ["2026-09-03", 1097.08],
                ["2026-09-30", 1074.34],
            ],
            TB,
            SMM_CN,
        ),
    },
    {
        id: "tb-metal-fob",
        label: "Tb metal",
        element: "tb",
        form: "metal",
        market: "fob-china",
        unit: UNIT,
        points: smm([["2026-09-30", 1532]], TB, SMM_FOB),
    },
];

function perKg(usdPerLb: number): number {
    return Math.round(usdPerLb * 2.20462 * 100) / 100;
}

// The US Department of Defense floor under MP Materials' NdPr, 10 years
// from July 2025. A reference line, not a market price.
export const NDPR_PRICE_FLOOR: Sourced<number> = {
    value: 110,
    unit: UNIT,
    sources: ["mp-dod-partnership-2025"],
    asOf: "2025-07",
    confidence: "reported",
    note: "10-year DoD price floor for MP Materials' NdPr products, stockpiled or sold.",
};

export function getSeries(id: string): PriceSeries | undefined {
    return PRICE_SERIES.find((s) => s.id === id);
}

export interface PriceAt {
    seriesId: string;
    // The month asked for, YYYY-MM.
    month: string;
    date: string;
    basis: PriceBasis;
    value: Sourced<number>;
    // True when no point covers the month and the last earlier one is used.
    carried: boolean;
}

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

// The price of a series in a month: the last reading in that month, else that
// year's annual average, else the latest earlier point carried forward. Null
// for an unknown series, a malformed month or a month before the first point.
export function priceAt(seriesId: string, month: string): PriceAt | null {
    const s = getSeries(seriesId);
    if (!s || !MONTH.test(month)) return null;
    const year = month.slice(0, 4);
    const at = (p: PricePoint, carried: boolean): PriceAt => ({
        seriesId,
        month,
        date: p.date,
        basis: p.basis,
        value: p.value,
        carried,
    });
    const sorted = sortedPoints(s);
    const inMonth = sorted.filter((p) => p.date.length > 4 && p.date.startsWith(month));
    const last = inMonth.at(-1);
    if (last) return at(last, false);
    const annual = sorted.find((p) => p.basis === "annual-average" && p.date === year);
    if (annual) return at(annual, false);
    const before = sorted.filter((p) => periodEnd(p) < `${month}-32`).at(-1);
    return before ? at(before, true) : null;
}

// Last day a point speaks for: 31 Dec for an annual average, else its date.
function periodEnd(p: PricePoint): string {
    return p.date.length === 4 ? `${p.date}-12-31` : p.date;
}

export function sortedPoints(s: PriceSeries): PricePoint[] {
    return [...s.points].sort((a, b) => periodEnd(a).localeCompare(periodEnd(b)));
}

// Every point of a series between two months (inclusive), by period end.
export function pricesBetween(
    s: PriceSeries,
    from?: string,
    to?: string,
): PricePoint[] {
    return sortedPoints(s).filter((p) => {
        const end = periodEnd(p).slice(0, 7);
        return (!from || end >= from) && (!to || end <= to);
    });
}

// China domestic against the export price on the latest day both exist:
// how much more a buyer outside China pays.
export interface PriceSpread {
    element: PriceSeries["element"];
    label: string;
    date: string;
    domestic: Sourced<number>;
    export: Sourced<number>;
    premium: Sourced<number>;
}

export function priceSpreads(): PriceSpread[] {
    const out: PriceSpread[] = [];
    for (const cn of PRICE_SERIES.filter((s) => s.market === "cn-domestic")) {
        const fob = PRICE_SERIES.find(
            (s) =>
                s.market === "fob-china" &&
                s.element === cn.element &&
                s.form === cn.form,
        );
        if (!fob) continue;
        const dates = new Set(fob.points.map((p) => p.date));
        const both = sortedPoints(cn)
            .filter((p) => dates.has(p.date))
            .at(-1);
        const f = fob.points.find((p) => p.date === both?.date);
        if (!both || !f) continue;
        out.push({
            element: cn.element,
            label: cn.label,
            date: both.date,
            domestic: both.value,
            export: f.value,
            premium: {
                value: f.value.value / both.value.value - 1,
                unit: "fraction",
                sources: [...new Set([...both.value.sources, ...f.value.sources])],
                asOf: both.value.asOf,
                confidence: "modeled",
                note: "FOB China export price over the China domestic price, same day.",
            },
        });
    }
    return out;
}
