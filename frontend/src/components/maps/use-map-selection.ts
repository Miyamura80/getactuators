import { useCallback } from "react";
import { navigate, useLocationKey } from "../../lib/router";

// Map selection lives in the URL so it is shareable and back-button
// friendly: `?company=jl-mag`, `?site=jlmag-baotou`, `?cluster=yangtze-delta`.

export const SELECTION_KEYS = ["company", "site", "cluster"] as const;
export type SelectionKey = (typeof SELECTION_KEYS)[number];
export type MapSelection = Record<SelectionKey, string | null>;

export function readSelection(search: string): MapSelection {
    const q = new URLSearchParams(search);
    return { company: q.get("company"), site: q.get("site"), cluster: q.get("cluster") };
}

// The URL for `href` with selection keys set (a value) or removed (null);
// other query keys and the hash are kept.
export function withSelection(href: string, patch: Partial<MapSelection>): string {
    const url = new URL(href, "http://x");
    for (const [k, v] of Object.entries(patch)) {
        if (v) url.searchParams.set(k, v);
        else url.searchParams.delete(k);
    }
    return `${url.pathname}${url.search}${url.hash}`;
}

export function useMapSelection(): MapSelection & { select: (patch: Partial<MapSelection>) => void } {
    useLocationKey();
    const current = typeof window === "undefined" ? "" : window.location.search;
    const select = useCallback((patch: Partial<MapSelection>) => {
        navigate(withSelection(window.location.href.slice(window.location.origin.length), patch), { keepScroll: true });
    }, []);
    return { ...readSelection(current), select };
}
