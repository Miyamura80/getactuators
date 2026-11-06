import {
    ALT_FAMILIES,
    ALT_TECHS,
    type AltFamily,
    type AltTech,
    type MagnetUse,
    type Milestone,
    deploymentsOf,
} from "../../../../../src/supply-chain/alts";

// Geometry of the readiness landscape. x is TRL 1..9 (our reading of the
// cited evidence), y is what the actuator does for magnets, from the data's
// `magnets` field. Columns with no technology stay narrow so the crowded
// TRL 9 column gets the room; layout is computed from every technology so
// toggling a family never moves the others.

export const W = 1072;
export const GUTTER = 120;
export const ROW = 32;
export const BAND_PAD = 14;
export const TOP = 22;
export const AXIS_H = 46;
const EMPTY_COL = 34;

export const BASELINE_ID = "ndfeb";

export interface Band {
    id: string;
    label: string;
    sub: string;
    uses: MagnetUse[];
}

// Top to bottom: most rare earth to none.
export const BANDS: Band[] = [
    { id: "permanent", label: "Permanent", sub: "NdFeB today", uses: ["permanent"] },
    { id: "motor", label: "Set by motor", sub: "pump or drive motor", uses: ["motor", "drive-motor"] },
    { id: "re-free", label: "RE-free magnet", sub: "ferrite, FeN", uses: ["ferrite", "iron-nitride"] },
    { id: "none", label: "No magnets", sub: "zero rare earth", uses: ["none"] },
];

export const bandOf = (m: MagnetUse): Band => BANDS.find((b) => b.uses.includes(m)) ?? BANDS[BANDS.length - 1];

export const STAGES: { label: string; from: number; to: number }[] = [
    { label: "Lab", from: 1, to: 3 },
    { label: "Prototype", from: 4, to: 6 },
    { label: "Pilot", from: 7, to: 8 },
    { label: "Production", from: 9, to: 9 },
];

export const stageOf = (trl: number): string => STAGES.find((s) => trl >= s.from && trl <= s.to)?.label ?? "";

export const FAMILY_KEY: Record<AltFamily, string> = {
    "ree-free-motor": "motor",
    "artificial-muscle": "muscle",
    hydraulic: "hydraulic",
    transmission: "transmission",
};

// Node radius by the number of dated deployments we cite (not by any
// market estimate). Zero is drawn hollow and dashed.
export const radiusFor = (deployments: number): number => 7 + Math.min(deployments, 3) * 2.5;

export interface Node {
    id: string;
    tech?: AltTech;
    x: number;
    y: number;
    r: number;
    deployments: number;
}

export interface Column {
    trl: number;
    x: number;
    w: number;
    sub: number;
    empty: boolean;
}

export interface Layout {
    columns: Column[];
    bands: { band: Band; y: number; h: number }[];
    nodes: Node[];
    height: number;
    plotBottom: number;
    subW: number;
}

interface Item {
    id: string;
    tech?: AltTech;
    // Family, or "baseline" for the NdFeB marker.
    group: string;
    band: string;
}

function items(techs: readonly AltTech[]): Item[] {
    const order = (t: AltTech) => ALT_FAMILIES.indexOf(t.family);
    return [
        { id: BASELINE_ID, group: "baseline", band: "permanent" },
        ...[...techs].sort((a, b) => order(a) - order(b)).map((t) => ({ id: t.id, tech: t, group: t.family, band: bandOf(t.magnets).id })),
    ];
}

// Within one TRL column, families get their own sub-column unless they
// never share a band, so a crowded column reads as family stacks.
function packColumn(col: Item[]): Map<string, number> {
    const groups = [...new Set(col.map((i) => i.group))];
    const bandsOf = (g: string) => new Set(col.filter((i) => i.group === g).map((i) => i.band));
    const slots: Set<string>[] = [];
    const out = new Map<string, number>();
    for (const g of groups) {
        const mine = bandsOf(g);
        let k = slots.findIndex((used) => ![...mine].some((b) => used.has(b)));
        if (k < 0) {
            k = slots.length;
            slots.push(new Set());
        }
        for (const b of mine) slots[k].add(b);
        out.set(g, k);
    }
    return out;
}

export function layout(techs: readonly AltTech[] = ALT_TECHS): Layout {
    const all = items(techs);
    const trls = Array.from({ length: 9 }, (_, i) => i + 1);
    const trlOf = (i: Item) => i.tech?.trl.value ?? 9;
    const packs = trls.map((trl) => packColumn(all.filter((i) => trlOf(i) === trl)));
    const subs = packs.map((p) => (p.size ? Math.max(...p.values()) + 1 : 0));
    const cellOf = (i: Item) => `${trlOf(i)}:${packs[trlOf(i) - 1].get(i.group) ?? 0}:${i.band}`;
    const cells = new Map<string, Item[]>();
    for (const i of all) cells.set(cellOf(i), [...(cells.get(cellOf(i)) ?? []), i]);
    const empties = subs.filter((s) => s === 0).length;
    const units = subs.reduce((a, b) => a + b, 0);
    const subW = (W - GUTTER - empties * EMPTY_COL) / Math.max(1, units);
    let x = GUTTER;
    const columns: Column[] = trls.map((trl, i) => {
        const sub = subs[i];
        const w = sub === 0 ? EMPTY_COL : sub * subW;
        const c = { trl, x, w, sub, empty: sub === 0 };
        x += w;
        return c;
    });
    let y = TOP;
    const bands = BANDS.map((band) => {
        const rows = Math.max(1, ...[...cells.entries()].filter(([k]) => k.endsWith(`:${band.id}`)).map(([, v]) => v.length));
        const h = rows * ROW + BAND_PAD;
        const b = { band, y, h };
        y += h;
        return b;
    });
    const nodes: Node[] = [];
    for (const [key, list] of cells) {
        const [trl, sub, bandId] = key.split(":");
        const col = columns[Number(trl) - 1];
        const b = bands.find((x) => x.band.id === bandId);
        if (!b) continue;
        const top = b.y + b.h / 2 - ((list.length - 1) * ROW) / 2;
        list.forEach((item, ri) => {
            const deployments = item.tech ? deploymentsOf(item.tech.id).length : 0;
            nodes.push({
                id: item.id,
                tech: item.tech,
                x: col.x + Number(sub) * subW + 16,
                y: top + ri * ROW,
                r: item.tech ? radiusFor(deployments) : 9,
                deployments,
            });
        });
    }
    return { columns, bands, nodes, height: y + AXIS_H, plotBottom: y, subW };
}

// Two lines when a name is long, split at the space nearest the middle.
export function splitLabel(s: string, max = 11): string[] {
    if (s.length <= max || !s.includes(" ")) return [s];
    const mid = s.length / 2;
    let best = -1;
    for (let i = 0; i < s.length; i++) if (s[i] === " " && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
    return [s.slice(0, best), s.slice(best + 1)];
}

// Time axis for milestones, broken at 1990 so the century of induction
// motors and cycloids does not squash the last thirty years.
export const YEAR_START = 1880;
export const YEAR_BREAK = 1990;
export const YEAR_END = 2030;
export const NOW = 2026;
const SPLIT = 0.18;

export function yearX(year: number, w: number, pad = 22): number {
    const y = Math.min(YEAR_END, Math.max(YEAR_START, year));
    const t =
        y < YEAR_BREAK
            ? ((y - YEAR_START) / (YEAR_BREAK - YEAR_START)) * SPLIT
            : SPLIT + ((y - YEAR_BREAK) / (YEAR_END - YEAR_BREAK)) * (1 - SPLIT);
    return pad + t * (w - 2 * pad);
}

export interface PlacedMilestone {
    tech: AltTech;
    m: Milestone;
    x: number;
    lane: number;
}

// Greedy lanes so markers in the same year stack instead of overprinting.
export function placeMilestones(techs: readonly AltTech[], w: number, gap = 12): { items: PlacedMilestone[]; lanes: number } {
    const all = techs
        .flatMap((tech) => tech.milestones.map((m) => ({ tech, m, x: yearX(m.year.value, w) })))
        .sort((a, b) => a.x - b.x);
    const ends: number[] = [];
    const items = all.map((p) => {
        let lane = ends.findIndex((e) => p.x - e >= gap);
        if (lane < 0) {
            lane = ends.length;
            ends.push(p.x);
        } else ends[lane] = p.x;
        return { ...p, lane };
    });
    return { items, lanes: Math.max(1, ends.length) };
}
