import { STAGES, type Stage } from "../../../../../src/supply-chain/stages";
import {
    MEASURE_STATUSES,
    MEASURE_TYPES,
    type MeasureStatus,
    type MeasureType,
} from "../../../../../src/supply-chain/policy/types";

// /policy keeps its filters in the query and the open measure in the hash, so
// any view links: /policy?type=export-control&stage=magnet#measure=cn-mofcom-2025-18

export interface PolicyFilters {
    types: MeasureType[];
    stage: Stage | null;
    statuses: MeasureStatus[];
}

export const ALL_FILTERS: PolicyFilters = {
    types: [...MEASURE_TYPES],
    stage: null,
    statuses: [...MEASURE_STATUSES],
};

function list<T extends string>(all: readonly T[], raw: string | null): T[] {
    if (!raw) return [...all];
    const picked = raw.split(",").filter((v): v is T => (all as readonly string[]).includes(v));
    return picked.length > 0 ? all.filter((v) => picked.includes(v)) : [...all];
}

export function readFilters(search: string): PolicyFilters {
    const q = new URLSearchParams(search);
    const stage = q.get("stage");
    return {
        types: list(MEASURE_TYPES, q.get("type")),
        stage: (STAGES as readonly string[]).includes(stage ?? "") ? (stage as Stage) : null,
        statuses: list(MEASURE_STATUSES, q.get("status")),
    };
}

// Full sets stay out of the URL; unrelated params are kept.
export function writeFilters(search: string, f: PolicyFilters): string {
    const q = new URLSearchParams(search);
    for (const key of ["type", "stage", "status"]) q.delete(key);
    if (f.types.length < MEASURE_TYPES.length) q.set("type", f.types.join(","));
    if (f.stage) q.set("stage", f.stage);
    if (f.statuses.length < MEASURE_STATUSES.length) q.set("status", f.statuses.join(","));
    const out = q.toString().replace(/%2C/g, ",");
    return out ? `?${out}` : "";
}

export function readMeasure(hash: string): string | null {
    const m = /^#measure=([a-z0-9-]+)$/.exec(hash);
    return m?.[1] ?? null;
}
