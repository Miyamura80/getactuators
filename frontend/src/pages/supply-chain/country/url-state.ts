import { useCallback } from "react";
import { SEGMENTS, type Segment } from "../../../../../src/supply-chain/companies";
import { navigate, useLocationKey } from "../../../lib/router";

// A country page keeps its view in the URL, so any view is a shareable link
// and the back button steps through selections:
// ?segment=magnets-motors&company=tdk&site=tdk-tokyo&cluster=kanto-hq
// A page with regions adds ?region=TX (?state=TX is read as the same).

const KEYS = ["segment", "company", "site", "cluster", "region"] as const;
type Key = (typeof KEYS)[number];

export interface CountryState {
    segment: Segment | null;
    company: string | null;
    site: string | null;
    cluster: string | null;
    region: string | null;
}

export function readCountryState(search: string): CountryState {
    const q = new URLSearchParams(search);
    const segment = q.get("segment");
    return {
        segment: (SEGMENTS as readonly string[]).includes(segment ?? "") ? (segment as Segment) : null,
        company: q.get("company"),
        site: q.get("site"),
        cluster: q.get("cluster"),
        region: (q.get("region") ?? q.get("state"))?.toUpperCase() || null,
    };
}

// `href` with the given keys set (a value) or removed (null); other query
// keys and the hash are kept.
export function withCountryState(href: string, patch: Partial<CountryState>): string {
    const url = new URL(href, "http://x");
    for (const k of KEYS) {
        if (!(k in patch)) continue;
        const v = patch[k as Key];
        if (v) url.searchParams.set(k, v);
        else url.searchParams.delete(k);
        if (k === "region") url.searchParams.delete("state");
    }
    return `${url.pathname}${url.search}${url.hash}`;
}

export function useCountryState(): CountryState & { set: (patch: Partial<CountryState>) => void } {
    useLocationKey();
    const current = typeof window === "undefined" ? "" : window.location.search;
    const set = useCallback((patch: Partial<CountryState>) => {
        navigate(withCountryState(window.location.href.slice(window.location.origin.length), patch), { keepScroll: true });
    }, []);
    return { ...readCountryState(current), set };
}
