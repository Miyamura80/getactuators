import { BORON_FRACTION, GBD_DY, TOTAL_RE_FRACTION } from "../metals/grades";
import type { Sourced } from "../sourced";
import { MAGNET_SERIES, NDFEB_DENSITY, getCommodity } from "./commodities";
import type { BomNode } from "./types";

// Builders shared by the case files: masses modeled from part geometry,
// magnet rare-earth content from the /metals grade recipe, and component
// costs modeled as a cited share of the case price.

const PI = Math.PI;
const round1 = (n: number) => Math.round(n * 10) / 10;

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
