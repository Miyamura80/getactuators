import type { GalleryGrouping } from "../../../../src/catalog/gallery";
import type { Actuator } from "../../types";
import { ACTUATORS } from "../../lib/data";
import { filtersToQuery, type FilterState } from "../../lib/filter";

// Finder-style views of the one catalog page. Gallery is the prerendered
// default; List is the sortable spec table that used to live at /all.
export type CatalogView = "gallery" | "list";

const VIEW_KEY = "actuatorlist:view";

// The last view a visitor picked, used when the URL does not name one.
export function storedView(): CatalogView | null {
    try {
        const v = window.localStorage.getItem(VIEW_KEY);
        return v === "list" || v === "gallery" ? v : null;
    } catch {
        return null;
    }
}

export function rememberView(view: CatalogView): void {
    try {
        window.localStorage.setItem(VIEW_KEY, view);
    } catch {
        // Private windows and blocked storage just lose the preference.
    }
}

export function viewFromQuery(search: string): CatalogView {
    const v = new URLSearchParams(search).get("view");
    if (v === "list" || v === "gallery") return v;
    return storedView() ?? "gallery";
}

export function groupingFromQuery(search: string): GalleryGrouping {
    return new URLSearchParams(search).get("by") === "application" ? "application" : "type";
}

export function actuatorFromQuery(search: string): Actuator | null {
    const id = new URLSearchParams(search).get("sel");
    return id ? (ACTUATORS.find((a) => a.id === id) ?? null) : null;
}

export interface CatalogUrlState {
    filters: FilterState;
    view: CatalogView;
    by: GalleryGrouping;
    selected: Actuator | null;
}

// Build the page URL from page state, so a single writer owns these keys.
// filtersToQuery drops defaults; ?compare and unknown keys pass through
// untouched and the hash is kept (filtering must not scroll-reset).
export function buildUrl({ filters, view, by, selected }: CatalogUrlState): string {
    const params = new URLSearchParams(window.location.search);
    for (const key of ["q", "cat", "use", "country", "sort", "dir", "sel", "view", "by"]) params.delete(key);
    new URLSearchParams(filtersToQuery(filters)).forEach((value, key) => params.set(key, value));
    if (view === "list") params.set("view", "list");
    if (by === "application") params.set("by", by);
    if (selected) params.set("sel", selected.id);
    const q = params.toString();
    return `${window.location.pathname}${q ? `?${q}` : ""}${window.location.hash}`;
}
