import { COMPANIES, type Company, type Segment } from "./companies";
import type { CountryCode } from "./countries";
import { SUPPLY_LINKS, type SupplyLink } from "./links";
import { SITES, type Site } from "./sites";
import type { Stage } from "./stages";

// Read accessors over the registry. Pages and tools call these instead of
// filtering the raw arrays inline, so a later index or cache lands in one place.

export const SUPPLY_CHAIN_AS_OF = "October 2026";

const companyById = new Map(COMPANIES.map((c) => [c.id, c]));

export function getCompany(id: string): Company | undefined {
    return companyById.get(id);
}

export function companiesIn(country: CountryCode): Company[] {
    return COMPANIES.filter((c) => c.hqCountry === country);
}

export function sitesOf(companyId: string): Site[] {
    return SITES.filter((s) => s.companyId === companyId);
}

export function linksOf(companyId: string): {
    supplies: SupplyLink[];
    buys: SupplyLink[];
} {
    return {
        supplies: SUPPLY_LINKS.filter((l) => l.from === companyId),
        buys: SUPPLY_LINKS.filter((l) => l.to === companyId),
    };
}

export interface CompanyFilter {
    country?: string;
    stage?: string;
    segment?: string;
}

export function findCompanies({
    country,
    stage,
    segment,
}: CompanyFilter = {}): Company[] {
    return COMPANIES.filter(
        (c) =>
            (!country || c.hqCountry === country.toUpperCase()) &&
            (!stage || c.stages.includes(stage as Stage)) &&
            (!segment || c.segment === (segment as Segment)),
    ).sort((a, b) => a.id.localeCompare(b.id));
}

export interface SiteFilter {
    country?: string;
    stage?: string;
    company?: string;
    kind?: string;
}

export function findSites({ country, stage, company, kind }: SiteFilter = {}): Site[] {
    return SITES.filter(
        (s) =>
            (!country || s.country === country.toUpperCase()) &&
            (!stage || s.stages.includes(stage as Stage)) &&
            (!company || s.companyId === company) &&
            (!kind || s.kind === kind),
    ).sort((a, b) => a.id.localeCompare(b.id));
}
