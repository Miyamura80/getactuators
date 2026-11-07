import { BORON_FRACTION, GBD_DY, TOTAL_RE_FRACTION } from "../metals/grades";
import type { Sourced } from "../sourced";
import { MAGNET_SERIES, NDFEB_DENSITY, getCommodity } from "./commodities";
import type { BomNode } from "./types";

// Builders shared by the case files: masses modeled from part geometry,
// magnet rare-earth content from the /metals grade recipe, and component
// costs modeled as a cited share of the case price.

const PI = Math.PI;
// Grams to 0.1 g, or to the milligram below a gram (chip dies, encoder magnets).
const round1 = (n: number) =>
    n < 1 ? Math.round(n * 1000) / 1000 : Math.round(n * 10) / 10;

// Volumes in cm3 from millimetre dimensions.
export const ringCm3 = (outer: number, inner: number, length: number): number =>
    (PI * (outer * outer - inner * inner) * length) / 1000;
export const discCm3 = (radius: number, length: number): number =>
    ringCm3(radius, 0, length);

export interface Volume {
    cm3: number;
    // Share of the envelope that is solid material (teeth, slots, balls).
    fill?: number;
    // How the envelope was taken, for the note: "ring r 7-14.5 mm, 36 mm".
    how: string;
}

// A ring (tube) or disc envelope, radii and length in mm.
export const ring = (
    outer: number,
    inner: number,
    length: number,
    fill?: number,
): Volume => ({
    cm3: ringCm3(outer, inner, length),
    how: `Ring r ${inner} to ${outer} mm, ${length} mm long`,
    ...(fill !== undefined ? { fill } : {}),
});
export const disc = (radius: number, length: number, fill?: number): Volume => ({
    cm3: discCm3(radius, length),
    how: `Disc r ${radius} mm, ${length} mm thick`,
    ...(fill !== undefined ? { fill } : {}),
});
// Copper on a circuit board: two 35 micron layers over the board's face.
export const boardCopper = (radius: number): Volume => ({
    cm3: discCm3(radius, 0.07),
    how: `Two 35 um copper layers on a board r ${radius} mm`,
});
// Silicon in packaged chips: die area x 0.3 mm thickness.
export const dieSilicon = (mm2: number): Volume => ({
    cm3: (mm2 * 0.3) / 1000,
    how: `${mm2} mm2 of silicon die, 0.3 mm thick`,
});

// /manufacturing magnet chain steps (src/supply-chain/processes/magnet.ts).
export const MAGNET_STEPS = [
    "strip-casting",
    "hydrogen-decrepitation",
    "jet-milling",
    "field-pressing",
    "sintering",
    "grain-boundary-diffusion",
    "machining",
    "coating",
    "magnetising",
    "inspection",
];
const NDPR_STEPS = [
    "open-pit-mining",
    "beneficiation",
    "cracking",
    "solvent-extraction",
    "precipitation",
    "electrolysis",
];
const DY_STEPS = ["ionic-clay-leaching", "heavy-separation", "calciothermic-reduction"];

// Grams of a commodity in a modeled volume. The geometry is our model of the
// part, sized to the case's teardown or listing (`sources`).
export function gramsOf(
    seriesId: string,
    v: Volume,
    sources: string[],
): Sourced<number> {
    const c = getCommodity(seriesId);
    const rho = c?.density ?? NDFEB_DENSITY;
    const fill = v.fill ?? 1;
    return {
        value: round1(v.cm3 * fill * rho.value),
        unit: "g",
        sources: [...new Set([...sources, ...rho.sources])],
        asOf: "2026",
        confidence: "modeled",
        note: `${v.how}${fill < 1 ? `, ${Math.round(fill * 100)}% solid` : ""}, at ${rho.value} g/cm3.`,
    };
}

export function material(
    id: string,
    label: string,
    seriesId: string,
    massG: Sourced<number>,
    extra: Partial<BomNode> = {},
): BomNode {
    return {
        id,
        label,
        kind: "material",
        material: { seriesId, massG },
        sources: massG.sources,
        ...extra,
    };
}

// A commodity leaf weighed from a modeled volume.
export function weighed(
    id: string,
    label: string,
    seriesId: string,
    v: Volume,
    sources: string[],
    extra: Partial<BomNode> = {},
): BomNode {
    return material(id, label, seriesId, gramsOf(seriesId, v, sources), extra);
}

// A part made of one material: a component over one weighed leaf, whose id
// is the part's id plus the material's suffix ("sun-gear-steel").
export function piece(
    id: string,
    label: string,
    leaf: { label: string; seriesId: string; v: Volume; suffix?: string },
    sources: string[],
    extra: Partial<BomNode> = {},
): BomNode {
    const suffix =
        leaf.suffix ?? getCommodity(leaf.seriesId)?.id.split("-").pop() ?? "metal";
    return {
        id,
        label,
        kind: "component",
        sources,
        ...extra,
        children: [
            weighed(`${id}-${suffix}`, leaf.label, leaf.seriesId, leaf.v, sources),
        ],
    };
}

// A packaged chip: its die as the only raw material, priced when a listing
// for it (or a comparable part) is given.
export function chip(
    id: string,
    label: string,
    dieMm2: number,
    sources: string[],
    extra: Partial<BomNode> = {},
): BomNode {
    return piece(
        id,
        label,
        {
            label: "Silicon die",
            seriesId: "silicon",
            v: dieSilicon(dieMm2),
            suffix: "die",
        },
        sources,
        { route: CHIP_ROUTE, inferred: true, ...extra },
    );
}

// Mass of magnet in a modeled volume (sintered NdFeB).
export function magnetGrams(v: Volume, sources: string[]): Sourced<number> {
    const fill = v.fill ?? 1;
    return {
        value: round1(v.cm3 * fill * NDFEB_DENSITY.value),
        unit: "g",
        sources: [...new Set([...sources, ...NDFEB_DENSITY.sources])],
        asOf: "2026",
        confidence: "modeled",
        note: `${v.how}${fill < 1 ? `, ${Math.round(fill * 100)}% covered by magnet` : ""}, at ${NDFEB_DENSITY.value} g/cm3.`,
    };
}

const SH_GBD = GBD_DY.find((g) => g.grade === "sh")?.dy;

// The raw materials in a magnet of `magnet` grams: an SH-grade recipe with
// grain-boundary-diffused Dy, the grade robot motors run hot enough to need.
// NdPr is total rare earth less Dy; iron is the remainder after boron.
export function magnetContent(prefix: string, magnet: Sourced<number>): BomNode[] {
    const dyFrac = SH_GBD?.value ?? 0.02;
    const ndprFrac = TOTAL_RE_FRACTION.value - dyFrac;
    const ironFrac = 1 - TOTAL_RE_FRACTION.value - BORON_FRACTION.value;
    const part = (
        frac: number,
        sources: readonly string[],
        what: string,
    ): Sourced<number> => ({
        value: round1(magnet.value * frac),
        unit: "g",
        sources: [...new Set([...magnet.sources, ...sources])],
        asOf: magnet.asOf,
        confidence: "modeled",
        note: `${Math.round(frac * 1000) / 10}% ${what} of ${magnet.value} g magnet (SH grade, Dy by grain boundary diffusion).`,
    });
    const typical =
        "A typical producer stands in: no actuator maker discloses where its rare earths come from.";
    return [
        material(
            `${prefix}-ndpr`,
            "NdPr metal",
            MAGNET_SERIES.ndpr,
            part(
                ndprFrac,
                [...TOTAL_RE_FRACTION.sources, ...(SH_GBD?.sources ?? [])],
                "NdPr",
            ),
            {
                makerIds: ["china-northern-rare-earth"],
                makerConfidence: "modeled",
                makerNote: typical,
                alternateMakerIds: ["shenghe-resources", "mp-materials", "lynas"],
                processStepIds: NDPR_STEPS,
            },
        ),
        material(
            `${prefix}-dy`,
            "Dy metal",
            MAGNET_SERIES.dy,
            part(dyFrac, SH_GBD?.sources ?? [], "Dy"),
            {
                makerIds: ["china-rare-earth-group"],
                makerConfidence: "modeled",
                makerNote: typical,
                processStepIds: DY_STEPS,
            },
        ),
        material(
            `${prefix}-iron`,
            "Iron",
            "carbon-steel",
            part(
                ironFrac,
                [...TOTAL_RE_FRACTION.sources, ...BORON_FRACTION.sources],
                "iron (priced as steel)",
            ),
        ),
    ];
}

// A component cost modeled as a cited share of the case price.
export function shareOfPrice(
    price: Sourced<number>,
    share: number,
    sources: string[],
    what: string,
): Sourced<number> {
    const [lo, hi] = price.range ?? [price.value, price.value];
    return {
        value: Math.round(price.value * share),
        unit: "USD",
        range: [Math.round(lo * share), Math.round(hi * share)],
        sources,
        asOf: price.asOf,
        confidence: "modeled",
        note: `${Math.round(share * 1000) / 10}% of the case price: ${what}`,
    };
}

// A part cost modeled as a cited share of what the assembler spends: the
// case price less the assembler's gross margin. Analysts' cost shares split
// the parts an assembler buys, so they apply to its cost of goods, and the
// gap to the price is the assembler's gross profit.
export function shareOfCost(
    price: Sourced<number>,
    assemblerMargin: Sourced<number>,
    share: number,
    sources: string[],
    what: string,
): Sourced<number> {
    const cogs = 1 - assemblerMargin.value;
    const s = shareOfPrice(
        price,
        share * cogs,
        [...sources, ...assemblerMargin.sources],
        what,
    );
    return {
        ...s,
        note: `${Math.round(share * 1000) / 10}% of the assembler's cost (the price less its ${Math.round(assemblerMargin.value * 1000) / 10}% gross margin): ${what}`,
    };
}

// A bought-in part priced from a distributor or marketplace listing, US$.
// Listings are for the same or a comparable part, never the actuator
// maker's contract price, so they are `estimated` at best.
export function listed(
    value: number,
    range: [number, number] | undefined,
    sources: string[],
    asOf: string,
    note: string,
    confidence: "estimated" | "modeled" = "estimated",
): Sourced<number> {
    return {
        value,
        unit: "USD",
        ...(range ? { range } : {}),
        sources,
        asOf,
        confidence,
        note,
    };
}

// SMM's NdFeB N52(Ce) blank quote, 7 August 2026: US$32.82 to 34.13 per kg.
const BLANK_USD_KG: [number, number] = [32.82, 34.13];
const r2 = (n: number) => Math.round(n * 100) / 100;

// A magnet's grams at the N52(Ce) blank price, as a cross-check.
export function blankReference(magnet: Sourced<number>): {
    label: string;
    value: Sourced<number>;
} {
    const [lo, hi] = BLANK_USD_KG;
    const kg = magnet.value / 1000;
    return {
        label: "Same mass as N52 blank",
        value: {
            value: r2((kg * (lo + hi)) / 2),
            unit: "USD",
            range: [r2(kg * lo), r2(kg * hi)],
            sources: ["smm-ndfeb-blank-2026-08", ...magnet.sources],
            asOf: "2026-08",
            confidence: "estimated",
            note: `${magnet.value} g at SMM's N52(Ce) blank quote of US$${lo} to ${hi}/kg. Blanks swap some Nd for cerium, carry no Dy and are not yet cut, coated or magnetised, so a finished SH-grade segment costs more. The quote sits below our NdPr and Dy content at the case month.`,
        },
    };
}

// Usual routes from raw material to finished part, in our words.
export const GEAR_ROUTE = ["Cut bar", "Turn blank", "Hob teeth", "Carburise", "Grind"];
export const RING_GEAR_ROUTE = ["Forge ring", "Turn", "Shape teeth", "Nitride"];
export const LAMINATION_ROUTE = ["Slit coil", "Stamp sheets", "Stack and bond"];
export const WINDING_ROUTE = ["Draw wire", "Enamel", "Wind coils", "Impregnate"];
export const BEARING_ROUTE = [
    "Forge rings",
    "Turn",
    "Harden",
    "Grind races",
    "Fit balls",
];
export const CAST_ROUTE = ["Die-cast", "CNC machine", "Anodise"];
export const TURNED_ROUTE = ["Cut bar", "CNC turn", "Heat-treat"];
export const BOARD_ROUTE = ["Laminate", "Drill", "Plate", "Etch"];
export const CHIP_ROUTE = ["Wafer fab", "Dice", "Package", "Test"];
export const FASTENER_ROUTE = ["Cold-head", "Roll thread", "Heat-treat", "Plate"];
export const SCREW_ROUTE = [
    "Cut bar",
    "Turn",
    "Rough thread",
    "Induction harden",
    "Grind thread",
];
