import {
    ACTUATOR_TYPE_LABEL,
    dataConfidence,
    type DataGrade,
    HUMANOIDS,
    type Humanoid,
    type HumanoidTotals,
    humanoidTotals,
    reeTotalKg,
} from "../../../../src/humanoids";

// Fleet table state lives in the URL: ?q= (search), ?sort= (column, "-" for
// descending), ?page= (1-based). Defaults are left out of the URL.

export const PAGE_SIZE = 10;
export const SORT_KEYS = ["name", "dof", "actuators", "magnet", "ree", "price", "data"] as const;
export type SortKey = (typeof SORT_KEYS)[number];
export interface Sort {
    key: SortKey;
    dir: 1 | -1;
}
export const DEFAULT_SORT: Sort = { key: "magnet", dir: -1 };

export interface Row {
    h: Humanoid;
    t: HumanoidTotals;
    ree: number;
    conf: { share: number; grade: DataGrade };
    hay: string;
}

export const ROWS: Row[] = HUMANOIDS.map((h) => {
    const t = humanoidTotals(h);
    const types = Object.keys(t.actuatorCountByType) as (keyof typeof ACTUATOR_TYPE_LABEL)[];
    const hay = [h.name, h.brand, h.country, ...types, ...types.map((k) => ACTUATOR_TYPE_LABEL[k])]
        .join(" ")
        .toLowerCase();
    return { h, t, ree: reeTotalKg(t).value, conf: dataConfidence(h), hay };
});

export interface FleetState {
    q: string;
    sort: Sort;
    page: number;
}

export function parseFleet(search: string): FleetState {
    const p = new URLSearchParams(search);
    const raw = p.get("sort") ?? "";
    const key = raw.replace(/^-/, "") as SortKey;
    const sort = SORT_KEYS.includes(key) ? { key, dir: raw.startsWith("-") ? -1 : 1 } as Sort : DEFAULT_SORT;
    const page = Math.max(1, Number.parseInt(p.get("page") ?? "1", 10) || 1);
    return { q: p.get("q") ?? "", sort, page };
}

// The page URL with fleet state applied on top of the current query string.
export function fleetSearch(current: string, s: FleetState): string {
    const p = new URLSearchParams(current);
    const set = (k: string, v: string | null) => (v ? p.set(k, v) : p.delete(k));
    set("q", s.q.trim() ? s.q : null);
    const isDefault = s.sort.key === DEFAULT_SORT.key && s.sort.dir === DEFAULT_SORT.dir;
    set("sort", isDefault ? null : `${s.sort.dir === -1 ? "-" : ""}${s.sort.key}`);
    set("page", s.page > 1 ? String(s.page) : null);
    const q = p.toString();
    return q ? `?${q}` : "";
}

function value(r: Row, k: SortKey): number | string | null {
    switch (k) {
        case "name":
            return r.h.name.toLowerCase();
        case "dof":
            return r.h.dof;
        case "actuators":
            return r.t.actuators;
        case "magnet":
            return r.t.magnetMassKg.value;
        case "ree":
            return r.ree;
        case "price":
            return r.h.price_usd;
        case "data":
            return r.conf.share;
    }
}

export function queryFleet(s: FleetState): { rows: Row[]; total: number; page: number; pages: number } {
    const terms = s.q.toLowerCase().split(/\s+/).filter(Boolean);
    const hits = ROWS.filter((r) => terms.every((t) => r.hay.includes(t)));
    const sorted = [...hits].sort((a, b) => {
        const x = value(a, s.sort.key);
        const y = value(b, s.sort.key);
        // Unknown values sink regardless of direction.
        if (x === null) return y === null ? 0 : 1;
        if (y === null) return -1;
        return (x < y ? -1 : x > y ? 1 : 0) * s.sort.dir;
    });
    const pages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    const page = Math.min(s.page, pages);
    return { rows: sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), total: sorted.length, page, pages };
}
