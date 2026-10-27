import { COUNTRY_CODES, type CountryCode } from "../countries";
import { SOURCES } from "../sources";
import { STAGES, type Stage } from "../stages";
import { AU_MEASURES, JP_MEASURES, KR_MEASURES } from "./measures-asia";
import { CN_MEASURES } from "./measures-cn";
import { EU_MEASURES } from "./measures-eu";
import { INTL_MEASURES } from "./measures-intl";
import { US_MEASURES } from "./measures-us";
import {
    MEASURE_STATUSES,
    MEASURE_TYPES,
    type MeasureStatus,
    type PolicyMeasure,
} from "./types";

// /policy: every government or standards-body measure that touches the
// actuator chain. One dataset feeds /policy, the /metals price pins and the
// country page policy strips.

export * from "./types";

export const POLICY_PATH = "/policy";
export const POLICY_AS_OF = "2026-10-27";
export const POLICY_FEED_PATH = "/policy/feed.xml";

// Swimlanes, top to bottom. "OTHER" holds every country without its own lane.
export const POLICY_LANES = ["CN", "US", "EU", "JP", "KR", "OTHER", "INTL"] as const;
export type PolicyLane = (typeof POLICY_LANES)[number];

export const POLICY_LANE_LABEL: Record<PolicyLane, string> = {
    CN: "China",
    US: "United States",
    EU: "European Union",
    JP: "Japan",
    KR: "Korea",
    OTHER: "Others",
    INTL: "International",
};

export function laneOf(m: PolicyMeasure): PolicyLane {
    return (POLICY_LANES as readonly string[]).includes(m.jurisdiction)
        ? (m.jurisdiction as PolicyLane)
        : "OTHER";
}

// The first date a measure appears on the timeline.
export function startDate(m: PolicyMeasure): string {
    return m.announced ?? m.effective ?? m.statusHistory[0]?.date ?? "";
}

// The date of the latest status change.
export function lastChange(m: PolicyMeasure): string {
    return m.statusHistory.at(-1)?.date ?? startDate(m);
}

export const POLICY_MEASURES: PolicyMeasure[] = [
    ...CN_MEASURES,
    ...US_MEASURES,
    ...EU_MEASURES,
    ...JP_MEASURES,
    ...KR_MEASURES,
    ...AU_MEASURES,
    ...INTL_MEASURES,
].sort((a, b) => startDate(a).localeCompare(startDate(b)) || a.id.localeCompare(b.id));

const byId = new Map(POLICY_MEASURES.map((m) => [m.id, m]));

export function getMeasure(id: string): PolicyMeasure | undefined {
    return byId.get(id);
}

export interface MeasureFilter {
    jurisdiction?: string;
    type?: string;
    stage?: string;
    status?: string;
}

export function findMeasures(f: MeasureFilter = {}): PolicyMeasure[] {
    const j = f.jurisdiction?.toUpperCase();
    return POLICY_MEASURES.filter(
        (m) =>
            (!j || m.jurisdiction === j || (j === "OTHER" && laneOf(m) === "OTHER")) &&
            (!f.type || m.type === f.type) &&
            (!f.stage || m.stages.includes(f.stage as Stage)) &&
            (!f.status || m.status === f.status),
    );
}

// The policy strip on a country page: that country's measures, newest first.
export function measuresForCountry(code: CountryCode): PolicyMeasure[] {
    return POLICY_MEASURES.filter((m) => m.jurisdiction === code).sort((a, b) =>
        lastChange(b).localeCompare(lastChange(a)),
    );
}

// Every status change across the dataset, newest first: the feed.
export interface PolicyChange {
    measure: PolicyMeasure;
    index: number;
    date: string;
    status: MeasureStatus;
    note?: string;
}

export function policyChanges(): PolicyChange[] {
    return POLICY_MEASURES.flatMap((measure) =>
        measure.statusHistory.map((c, index) => ({
            measure,
            index,
            date: c.date,
            status: c.status,
            note: c.note,
        })),
    ).sort(
        (a, b) =>
            b.date.localeCompare(a.date) || a.measure.id.localeCompare(b.measure.id),
    );
}

export function countBy<K extends string>(
    keys: readonly K[],
    key: (m: PolicyMeasure) => K,
    measures: readonly PolicyMeasure[] = POLICY_MEASURES,
): Record<K, number> {
    const out = Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>;
    for (const m of measures) out[key(m)] += 1;
    return out;
}

const PRIMARY_KINDS = new Set(["government", "standards-body"]);
const sourceKind = new Map(SOURCES.map((s) => [s.id, s.kind]));
const words = (s: string) => s.trim().split(/\s+/).length;
const DATE = /^\d{4}(-\d{2}(-\d{2})?)?$/;

// Integrity rules the citation audit and tests enforce on the dataset.
export function measureErrors(
    m: PolicyMeasure,
    today = new Date().toISOString().slice(0, 10),
): string[] {
    const e: string[] = [];
    const at = `policy ${m.id}`;
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(m.id)) e.push(`${at}: id is not kebab-case`);
    if (!(MEASURE_TYPES as readonly string[]).includes(m.type))
        e.push(`${at}: bad type`);
    if (!(MEASURE_STATUSES as readonly string[]).includes(m.status))
        e.push(`${at}: bad status`);
    const lanes: readonly string[] = [...COUNTRY_CODES, "EU", "INTL"];
    if (!lanes.includes(m.jurisdiction)) e.push(`${at}: bad jurisdiction`);
    if (words(m.summary) > 60) e.push(`${at}: summary is ${words(m.summary)} words`);
    if (m.stages.length === 0) e.push(`${at}: no stages`);
    for (const s of m.stages)
        if (!(STAGES as readonly string[]).includes(s)) e.push(`${at}: bad stage ${s}`);
    if (!m.sources.some((id) => PRIMARY_KINDS.has(sourceKind.get(id) ?? "")))
        e.push(`${at}: no primary (government or standards body) source`);
    for (const d of [m.announced, m.effective, m.expires])
        if (d !== undefined && !DATE.test(d)) e.push(`${at}: bad date ${d}`);
    return [...e, ...historyErrors(m, today)];
}

// The status history: dated, sourced, oldest first, ending in the status.
function historyErrors(m: PolicyMeasure, today: string): string[] {
    const e: string[] = [];
    const at = `policy ${m.id}`;
    const h = m.statusHistory;
    if (h.length === 0) e.push(`${at}: empty statusHistory`);
    h.forEach((c, i) => {
        if (!DATE.test(c.date)) e.push(`${at}: bad status date ${c.date}`);
        if (c.date > today) e.push(`${at}: status date ${c.date} is in the future`);
        if (c.sources.length === 0) e.push(`${at}: status ${c.date} has no source`);
        const prev = h[i - 1];
        if (prev && prev.date > c.date)
            e.push(`${at}: statusHistory out of order at ${c.date}`);
    });
    if (h.length > 0 && h.at(-1)?.status !== m.status)
        e.push(`${at}: status ${m.status} differs from the latest change`);
    return e;
}

export function policyErrors(today?: string): string[] {
    const seen = new Set<string>();
    const errors = POLICY_MEASURES.flatMap((m) => measureErrors(m, today));
    for (const m of POLICY_MEASURES) {
        if (seen.has(m.id)) errors.push(`policy ${m.id}: duplicate id`);
        seen.add(m.id);
    }
    const events = POLICY_MEASURES.flatMap((m) => (m.metals ? [m.metals.eventId] : []));
    for (const id of new Set(events.filter((x, i) => events.indexOf(x) !== i)))
        errors.push(`policy: duplicate metals event id ${id}`);
    return errors;
}
