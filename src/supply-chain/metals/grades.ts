import { NDFEB_PER_HUMANOID } from "../perspective";
import type { Sourced } from "../sourced";

// What a sintered NdFeB magnet is made of, by temperature grade. The grade
// suffix (none, M, H, SH, UH, EH) sets the minimum coercivity, and the
// dysprosium that buys it substitutes for part of the neodymium, so total
// rare earth stays near 32% while Dy rises with the grade.

export const GRADE_IDS = ["n", "m", "h", "sh", "uh", "eh"] as const;
export type GradeId = (typeof GRADE_IDS)[number];

export interface MagnetGrade {
    id: GradeId;
    // Suffix as printed on a grade, e.g. N42SH.
    suffix: string;
    // Typical use, from the same source as the Dy figure.
    use: string;
    // Dy by weight with all of it added to the starting alloy.
    dy: Sourced<number>;
}

const ARNOLD = ["arnold-dysprosium-2015"];

function dy(value: number, range?: [number, number], note?: string): Sourced<number> {
    return {
        value,
        unit: "fraction",
        sources: ARNOLD,
        asOf: "2015",
        confidence: range ? "estimated" : "reported",
        note:
            note ??
            "Typical Dy for conventionally alloyed magnets, 1985 to 2011. Grain boundary diffusion now needs less.",
        ...(range ? { range } : {}),
    };
}

export const MAGNET_GRADES: MagnetGrade[] = [
    {
        id: "n",
        suffix: "none",
        use: "Hard drives, sensors, toys",
        dy: dy(0, [0, 0.005], "Under 0.5% Dy, conventionally alloyed."),
    },
    { id: "m", suffix: "M", use: "Sensors, holding", dy: dy(0.014) },
    { id: "h", suffix: "H", use: "General motors, wind generators", dy: dy(0.028) },
    { id: "sh", suffix: "SH", use: "High-performance motors", dy: dy(0.042) },
    { id: "uh", suffix: "UH", use: "Super high-performance motors", dy: dy(0.065) },
    {
        id: "eh",
        suffix: "EH / AH",
        use: "EV traction drives",
        dy: dy(0.0975, [0.085, 0.11], "8.5 to 11% Dy, conventionally alloyed."),
    },
];

// Diffusing Dy into finished magnets (grain boundary diffusion) cuts it.
export const GBD_DY: { grade: GradeId; dy: Sourced<number> }[] = [
    {
        grade: "sh",
        dy: {
            value: 0.02,
            unit: "fraction",
            sources: ARNOLD,
            asOf: "2015",
            confidence: "estimated",
            note: "About 2% with grain boundary diffusion, down from 4+%.",
        },
    },
    {
        grade: "eh",
        dy: {
            value: 0.045,
            unit: "fraction",
            sources: ARNOLD,
            asOf: "2015",
            confidence: "estimated",
            range: [0.04, 0.05],
            note: "4 to 5% with grain boundary diffusion, down from 8 to 11%.",
        },
    },
];

// Total rare earth in the alloy: Nd + Pr + Dy (+ Tb).
export const TOTAL_RE_FRACTION: Sourced<number> = {
    value: 0.32,
    unit: "fraction",
    sources: ARNOLD,
    asOf: "2015",
    confidence: "estimated",
    note: "Neo magnets contain about 32% total rare earth.",
};

export const BORON_FRACTION: Sourced<number> = {
    value: 0.01,
    unit: "fraction",
    sources: ["jda-ndfeb-composition"],
    asOf: "2023",
    confidence: "reported",
    note: "Boron is about 1% of the magnet by weight.",
};

export const TB_FRACTION: Sourced<number> = {
    value: 0.005,
    unit: "fraction",
    range: [0, 0.01],
    sources: ["jda-ndfeb-composition"],
    asOf: "2023",
    confidence: "estimated",
    note: "Example recipe: 0 to 1% Tb.",
};

// Neodymium's share of the NdPr that goes into magnets.
export const ND_IN_NDPR: Sourced<number> = {
    value: 0.775,
    unit: "fraction",
    range: [0.75, 0.8],
    sources: ["rem-nd-price-2026"],
    asOf: "2026",
    confidence: "estimated",
    note: "NdPr is about 75 to 80% Nd and 20 to 25% Pr by weight.",
};

export interface GradeComposition {
    grade: GradeId;
    ndpr: Sourced<number>;
    dy: Sourced<number>;
    boron: Sourced<number>;
    // Iron plus minor additives (Co, Cu, Al), the remainder.
    iron: Sourced<number>;
}

function modeled(value: number, sources: string[], note: string): Sourced<number> {
    return {
        value,
        unit: "fraction",
        sources: [...new Set(sources)],
        asOf: "2015",
        confidence: "modeled",
        note,
    };
}

// Mass fractions of one grade: NdPr = total RE - Dy, iron is the remainder.
export function gradeComposition(id: GradeId): GradeComposition {
    const grade = MAGNET_GRADES.find((g) => g.id === id) ?? MAGNET_GRADES[0];
    if (!grade) throw new Error("no magnet grades");
    const ndpr = Math.round((TOTAL_RE_FRACTION.value - grade.dy.value) * 10000) / 10000;
    const iron =
        Math.round((1 - TOTAL_RE_FRACTION.value - BORON_FRACTION.value) * 1000) / 1000;
    return {
        grade: grade.id,
        ndpr: modeled(
            ndpr,
            [...TOTAL_RE_FRACTION.sources, ...grade.dy.sources],
            "About 32% total rare earth less this grade's Dy.",
        ),
        dy: grade.dy,
        boron: BORON_FRACTION,
        iron: modeled(
            iron,
            [...TOTAL_RE_FRACTION.sources, ...BORON_FRACTION.sources],
            "Remainder after rare earths and boron: iron with small Co, Cu and Al additions.",
        ),
    };
}

export interface ElementMass {
    nd: Sourced<number>;
    pr: Sourced<number>;
    dy: Sourced<number>;
}

// Grams of Nd, Pr and Dy in one humanoid's magnets for a grade: the
// published 2 to 4.5 kg of NdFeB per humanoid times the grade's fractions.
export function humanoidElementMass(id: GradeId): ElementMass {
    const c = gradeComposition(id);
    const [kgLo, kgHi] = NDFEB_PER_HUMANOID.range ?? [
        NDFEB_PER_HUMANOID.value,
        NDFEB_PER_HUMANOID.value,
    ];
    const [ndLo, ndHi] = ND_IN_NDPR.range ?? [ND_IN_NDPR.value, ND_IN_NDPR.value];
    const [dyLo, dyHi] = c.dy.range ?? [c.dy.value, c.dy.value];
    const g = (kg: number) => Math.round(kg * 1000);
    const grams = (
        value: number,
        range: [number, number],
        sources: string[],
        note: string,
    ): Sourced<number> => ({
        value: g(value),
        unit: "g",
        range: [g(range[0]), g(range[1])],
        sources: [...new Set([...NDFEB_PER_HUMANOID.sources, ...sources])],
        asOf: NDFEB_PER_HUMANOID.asOf,
        confidence: "modeled",
        note,
    });
    const ndpr = c.ndpr.value;
    const base = "2 to 4.5 kg of NdFeB per humanoid";
    return {
        nd: grams(
            NDFEB_PER_HUMANOID.value * ndpr * ND_IN_NDPR.value,
            [kgLo * ndpr * ndLo, kgHi * ndpr * ndHi],
            [...c.ndpr.sources, ...ND_IN_NDPR.sources],
            `${base} x NdPr share x 75 to 80% Nd.`,
        ),
        pr: grams(
            NDFEB_PER_HUMANOID.value * ndpr * (1 - ND_IN_NDPR.value),
            [kgLo * ndpr * (1 - ndHi), kgHi * ndpr * (1 - ndLo)],
            [...c.ndpr.sources, ...ND_IN_NDPR.sources],
            `${base} x NdPr share x 20 to 25% Pr.`,
        ),
        dy: grams(
            NDFEB_PER_HUMANOID.value * c.dy.value,
            [kgLo * dyLo, kgHi * dyHi],
            c.dy.sources,
            `${base} x this grade's Dy share.`,
        ),
    };
}
