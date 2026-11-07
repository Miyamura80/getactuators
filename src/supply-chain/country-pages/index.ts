import { COMPANIES, type Company } from "../companies";
import type { Shares } from "../concentration";
import { type SupplyLink, linkKind } from "../links";
import type { Admin1Country, NamedCluster } from "../map";
import { METAL_STAGES, type MetalStage, STAGE_SHARES } from "../metals/stage-shares";
import { activeLinks } from "../registry";
import { SITES, type Site } from "../sites";
import type { Sourced } from "../sourced";
import { CHINA_PAGE } from "./china";
import { JAPAN_PAGE } from "./japan";
import { KOREA_PAGE } from "./korea";
import type { CountryContent, CountryRegion, CountryStage } from "./types";
import { US_PAGE } from "./us";

// The country page template's data: one entry per planned country, the
// registry filtered to it, and the coverage gate that decides whether a
// country is routed, listed in the menu and linked from other maps. Adding
// a country is data only: write ./<country>.ts and grow the registry until
// it passes the gate (docs/supply-chain.md, "Adding a country").

export type {
    CountryCluster,
    CountryContent,
    CountryHub,
    CountryRegion,
    CountryRegions,
    CountryStage,
} from "./types";

export const COUNTRY_SLUGS = ["japan", "china", "korea", "us"] as const;
export type CountrySlug = (typeof COUNTRY_SLUGS)[number];

export const COUNTRY_OF: Record<CountrySlug, Admin1Country> = {
    japan: "JP",
    china: "CN",
    korea: "KR",
    us: "US",
};

// Page content per country; a country without content never goes live.
const CONTENT: Partial<Record<CountrySlug, CountryContent>> = {
    japan: JAPAN_PAGE,
    korea: KOREA_PAGE,
    china: CHINA_PAGE,
    us: US_PAGE,
};

// A country page ships once its dataset reaches these counts. `links` counts
// every current link (supply, investment, partnership); `supplyLinks` only
// those where parts or materials change hands, so a country cannot reach the
// gate on ties alone.
export const COVERAGE_TARGET = {
    companies: 40,
    sites: 80,
    links: 30,
    supplyLinks: 15,
} as const;

export const COUNTRY_AS_OF = "November 2026";

export const countryPath = (slug: CountrySlug) => `/${slug}`;

// Companies headquartered in the country or with a site there.
export function countryCompanies(code: Admin1Country): Company[] {
    const withSite = new Set(
        SITES.filter((s) => s.country === code).map((s) => s.companyId),
    );
    return COMPANIES.filter((c) => c.hqCountry === code || withSite.has(c.id));
}

export function countrySites(code: Admin1Country): Site[] {
    return SITES.filter((s) => s.country === code);
}

// Current links (any kind) with at least one end among the country's companies.
export function countryLinks(code: Admin1Country): SupplyLink[] {
    const ids = new Set(countryCompanies(code).map((c) => c.id));
    return activeLinks().filter((l) => ids.has(l.from) || ids.has(l.to));
}

export interface Coverage {
    companies: number;
    sites: number;
    links: number;
    supplyLinks: number;
}

export function coverage(code: Admin1Country): Coverage {
    return {
        companies: countryCompanies(code).length,
        sites: countrySites(code).length,
        links: countryLinks(code).length,
        supplyLinks: countryLinks(code).filter((l) => linkKind(l) === "supply").length,
    };
}

export function passesGate(c: Coverage, target: Coverage = COVERAGE_TARGET): boolean {
    return (
        c.companies >= target.companies &&
        c.sites >= target.sites &&
        c.links >= target.links &&
        c.supplyLinks >= target.supplyLinks
    );
}

export interface CountryPage extends CountryContent {
    slug: CountrySlug;
    path: string;
}

function pageOf(slug: CountrySlug): CountryPage | null {
    const content = CONTENT[slug];
    return content ? { ...content, slug, path: countryPath(slug) } : null;
}

// The bar a country must clear: its own `gate` when its data issue set one.
export const gateOf = (page: CountryContent): Coverage => page.gate ?? COVERAGE_TARGET;

// Country pages with content that pass the coverage gate, in menu order.
export const LIVE_COUNTRY_PAGES: CountryPage[] = COUNTRY_SLUGS.flatMap((slug) => {
    const page = pageOf(slug);
    return page && passesGate(coverage(page.code), gateOf(page)) ? [page] : [];
});

export const LIVE_COUNTRY_PATHS: string[] = LIVE_COUNTRY_PAGES.map((p) => p.path);

// A live page by slug ("japan") or ISO code ("JP"), any case.
export function getCountryPage(key: string): CountryPage | undefined {
    const k = key.toLowerCase();
    return LIVE_COUNTRY_PAGES.find((p) => p.slug === k || p.code.toLowerCase() === k);
}

// The world's country shares at a stage, from the shared metals stage-share
// data (light rare earths), for the concentration badge. Null for stages the
// dataset does not cover or leaves as a gap.
export function worldShares(stage: CountryStage["stage"]): Sourced<Shares> | null {
    if (!(METAL_STAGES as readonly string[]).includes(stage)) return null;
    const entry = STAGE_SHARES.nd[stage as MetalStage];
    return entry.kind === "shares" ? entry.shares : null;
}

// The sites inside a named cluster's box.
export function clusterSites(c: NamedCluster, sites: readonly Site[]): Site[] {
    const [minLat, minLon, maxLat, maxLon] = c.bbox;
    return sites.filter(
        (s) => s.lat >= minLat && s.lat <= maxLat && s.lon >= minLon && s.lon <= maxLon,
    );
}

// The page's zoomable regions that hold sites, each with its sites, in
// list order (alphabetical for /us). Empty when the page has no regions.
export function regionSites(
    page: CountryContent,
): { region: CountryRegion; sites: Site[] }[] {
    const sites = countrySites(page.code);
    return (page.regions?.list ?? []).flatMap((region) => {
        const inside = sites.filter((s) => s.admin1 === region.name);
        return inside.length ? [{ region, sites: inside }] : [];
    });
}

// Every stage-share record the citation audit walks.
export function countryStageRecords(): CountryStage[] {
    return Object.values(CONTENT).flatMap((c) => c?.stages ?? []);
}
