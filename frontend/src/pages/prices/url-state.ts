import { PRICES_PATH } from "../../../../src/prices/history";

// The one set of /prices query params: the buyer's spec
// (?nm=&budget=&class=&country=) and the actuator in focus (?actuator=),
// which the strip, the match list and the scatter all select and the catalog
// sparkline deep links to. The page keeps one Spec in state and writes it
// back here, so a search or a pick can be shared.

export interface Spec {
    // Required peak torque, N·m; null means any.
    nm: number | null;
    // Most the buyer will pay per unit, USD; null means any.
    budget: number | null;
    // Category slug, "" for every class.
    cls: string;
    // Maker's country, "" for anywhere.
    country: string;
    // The actuator in focus, "" for none (the page then shows the cheapest).
    actuator: string;
}

export const EMPTY_SPEC: Spec = { nm: null, budget: null, cls: "", country: "", actuator: "" };

// A positive number from user text or a query value, else null.
export function positive(v: string | null): number | null {
    const n = v === null || v.trim() === "" ? Number.NaN : Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
}

export function readSpec(search: string): Spec {
    const q = new URLSearchParams(search);
    return {
        nm: positive(q.get("nm")),
        budget: positive(q.get("budget")),
        cls: q.get("class") ?? "",
        country: q.get("country") ?? "",
        actuator: q.get("actuator") ?? "",
    };
}

// The page URL for a spec. Other query keys and the hash pass through.
export function specUrl(spec: Spec, search: string, hash = ""): string {
    const q = new URLSearchParams(search);
    const set = (key: string, v: string | number | null) => {
        if (v === null || v === "") q.delete(key);
        else q.set(key, String(v));
    };
    set("nm", spec.nm);
    set("budget", spec.budget);
    set("class", spec.cls);
    set("country", spec.country);
    set("actuator", spec.actuator);
    const s = q.toString();
    return `${PRICES_PATH}${s ? `?${s}` : ""}${hash}`;
}

export const filtered = (s: Spec) => s.nm !== null || s.budget !== null || s.cls !== "" || s.country !== "";
