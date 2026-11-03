import { insideCountry } from "../countries";
import { getCompany } from "../registry";
import { loopProblems, sceneProblems } from "../scenes/check";
import { DEPLOYMENTS } from "./deployments";
import { HYDRAULIC_TECHS, TRANSMISSION_TECHS } from "./drives";
import { MARKET_SLICES } from "./market";
import { MOTOR_TECHS } from "./motors";
import { MUSCLE_TECHS } from "./muscles";
import type { AltFamily, AltTech, Deployment, MarketSlice } from "./types";

// /alts: the alternatives to today's rare-earth electric actuator. Data only;
// zod wire shapes live in ./views (server side).

export { ALTS_PATH } from "./path";
export const ALTS_AS_OF = "November 2026";
// ISO date the /alts data last changed (Dataset dateModified).
export const ALTS_UPDATED = "2026-11-03";

export * from "./types";
export { DEPLOYMENTS } from "./deployments";
export { MARKET_SLICES } from "./market";

// Every technology, family by family, in page order.
export const ALT_TECHS: readonly AltTech[] = [
    ...MOTOR_TECHS,
    ...MUSCLE_TECHS,
    ...HYDRAULIC_TECHS,
    ...TRANSMISSION_TECHS,
];

export function getAltTech(id: string): AltTech | undefined {
    return ALT_TECHS.find((t) => t.id === id);
}

export function techsIn(family: AltFamily): AltTech[] {
    return ALT_TECHS.filter((t) => t.family === family);
}

export function deploymentsOf(techId: string): Deployment[] {
    return DEPLOYMENTS.filter((d) => d.techId === techId);
}

export function slicesOf(techId: string): MarketSlice[] {
    return MARKET_SLICES.filter((s) => s.techIds.includes(techId));
}

export function getSlice(id: string): MarketSlice | undefined {
    return MARKET_SLICES.find((s) => s.id === id);
}

export const MAX_PRINCIPLE_WORDS = 20;
export const MAX_MILESTONE_WORDS = 8;
export const MAX_SHORT_WORDS = 3;

const words = (s: string): number => s.trim().split(/\s+/).filter(Boolean).length;
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function techErrors(t: AltTech): string[] {
    const where = `alts ${t.id}`;
    const scene =
        t.scene.kind === "loop"
            ? loopProblems(t.scene.spec)
            : sceneProblems(t.scene.spec);
    const rules: [boolean, string][] = [
        [!KEBAB.test(t.id), "id is not kebab-case"],
        [
            words(t.principle) > MAX_PRINCIPLE_WORDS,
            `principle is over ${MAX_PRINCIPLE_WORDS} words`,
        ],
        [
            words(t.short) > MAX_SHORT_WORDS,
            `short name is over ${MAX_SHORT_WORDS} words`,
        ],
        [
            !(t.trl.value >= 1 && t.trl.value <= 9 && Number.isInteger(t.trl.value)),
            "TRL must be an integer 1..9",
        ],
        [t.sources.length === 0, "no sources"],
        ...t.milestones
            .filter((m) => words(m.label) > MAX_MILESTONE_WORDS)
            .map((m): [boolean, string] => [
                true,
                `milestone "${m.label}" is over ${MAX_MILESTONE_WORDS} words`,
            ]),
        ...t.players
            .filter((p) => !getCompany(p.companyId))
            .map((p): [boolean, string] => [true, `unknown company "${p.companyId}"`]),
        ...scene.map((s): [boolean, string] => [true, `scene: ${s}`]),
    ];
    return rules.filter(([bad]) => bad).map(([, msg]) => `${where}: ${msg}`);
}

function deploymentErrors(d: Deployment, ids: ReadonlySet<string>): string[] {
    const where = `alts deployment ${d.id}`;
    const l = d.location;
    const rules: [boolean, string][] = [
        [!ids.has(d.techId), `unknown technology "${d.techId}"`],
        [
            Boolean(d.companyId && !getCompany(d.companyId)),
            `unknown company "${d.companyId}"`,
        ],
        [
            Boolean(l && !insideCountry(l.country, l.lat, l.lon)),
            `${l?.lat},${l?.lon} is outside ${l?.country}`,
        ],
        [d.sources.length === 0, "no sources"],
    ];
    return rules.filter(([bad]) => bad).map(([, msg]) => `${where}: ${msg}`);
}

function referenceErrors(): string[] {
    const ids = new Set(ALT_TECHS.map((t) => t.id));
    const out: string[] = MARKET_SLICES.flatMap((s) =>
        s.techIds
            .filter((id) => !ids.has(id))
            .map((id) => `alts market ${s.id}: unknown technology "${id}"`),
    );
    out.push(...DEPLOYMENTS.flatMap((d) => deploymentErrors(d, ids)));
    const all = [
        ...ALT_TECHS.map((t) => t.id),
        ...MARKET_SLICES.map((s) => s.id),
        ...DEPLOYMENTS.map((d) => d.id),
    ];
    for (const id of new Set(all.filter((x, i) => all.indexOf(x) !== i)))
        out.push(`alts: duplicate id "${id}"`);
    return out;
}

// Integrity rules the citation audit reports.
export function altErrors(): string[] {
    return [...ALT_TECHS.flatMap(techErrors), ...referenceErrors()];
}

// The cited numbers of every technology, for the citation audit (scene
// geometry is layout, not data).
export function altTechRecords() {
    return ALT_TECHS.map((t) => ({
        id: t.id,
        trl: t.trl,
        milestones: t.milestones.map((m) => m.year),
        metrics: t.metrics,
        facts: t.facts.map((f) => f.value),
    }));
}

// Every scene, in page order, for the posters and the part library tests.
export const ALT_SCENES = ALT_TECHS.map((t) => t.scene);
