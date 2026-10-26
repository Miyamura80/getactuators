import { z } from "zod";
import { type Company, SEGMENTS } from "./companies";
import type { SupplyLink } from "./links";
import { linksOf, sitesOf } from "./registry";
import { SITE_KINDS, SITE_STATUSES, type Site } from "./sites";
import { CONFIDENCES, type Sourced } from "./sourced";
import { getSource } from "./sources";
import { STAGES } from "./stages";

// Wire shapes of the registry for the REST API and the MCP tools: snake_case,
// nulls for unknowns, and every number carrying its sources inline.

const sourceRefOut = z.object({
    id: z.string(),
    publisher: z.string(),
    title: z.string(),
    url: z.string(),
    kind: z.string(),
    accessed: z.string(),
});

const sourcedOut = z
    .object({
        value: z.number(),
        unit: z.string().nullable(),
        range: z.tuple([z.number(), z.number()]).nullable(),
        as_of: z.string().describe("ISO date, YYYY-MM or YYYY."),
        confidence: z.enum(CONFIDENCES).describe("reported, estimated or modeled."),
        note: z.string().nullable().describe("Method for estimated or modeled values."),
        sources: z.array(sourceRefOut),
    })
    .describe("A number with its provenance.");

export const companyOut = z.object({
    id: z.string().describe("Stable slug, e.g. `harmonic-drive-systems`."),
    name: z.string(),
    local_name: z.string().nullable(),
    hq_country: z.string().describe("ISO 3166 alpha-2 code."),
    segment: z.enum(SEGMENTS),
    stages: z.array(z.enum(STAGES)),
    ownership: z
        .object({
            kind: z.string(),
            ticker: z.string().nullable(),
            parent: z.string().nullable(),
        })
        .nullable(),
    revenue_usd: sourcedOut.nullable().describe("Latest fiscal year revenue in USD."),
    gross_margin: sourcedOut.nullable().describe("Gross margin as a fraction 0..1."),
    products: z.array(z.string()),
    url: z.string(),
    site_count: z.number(),
});

export const siteOut = z.object({
    id: z.string(),
    company_id: z.string(),
    kind: z.enum(SITE_KINDS),
    name: z.string(),
    country: z.string(),
    admin1: z.string().nullable().describe("Prefecture, province or state."),
    lat: z.number(),
    lon: z.number(),
    precision: z.enum(["site", "city", "region"]).describe("How exact lat/lon is."),
    makes: z.array(z.string()),
    stages: z.array(z.enum(STAGES)),
    capacity: sourcedOut.nullable(),
    opened: sourcedOut.nullable(),
    status: z.enum(SITE_STATUSES).nullable(),
    sources: z.array(sourceRefOut),
});

const linkOut = z.object({
    from: z.string(),
    to: z.string(),
    what: z.string(),
    confidence: z.enum(CONFIDENCES),
    note: z.string().nullable(),
    ended: z
        .string()
        .nullable()
        .describe("When the link stopped (YYYY-MM); null while it is active."),
    sources: z.array(sourceRefOut),
});

export const companyDetailOut = z.object({
    company: companyOut,
    sites: z.array(siteOut),
    supplies: z.array(linkOut).describe("Links where this company is the seller."),
    buys: z.array(linkOut).describe("Links where this company is the buyer."),
    sources: z.array(sourceRefOut).describe("Citations for profile facts."),
});

function refs(ids: readonly string[]) {
    return ids.flatMap((id) => {
        const s = getSource(id);
        return s
            ? [
                  {
                      id,
                      publisher: s.publisher,
                      title: s.title,
                      url: s.url,
                      kind: s.kind,
                      accessed: s.accessed,
                  },
              ]
            : [];
    });
}

function sourced(s: Sourced<number> | undefined): z.input<typeof sourcedOut> | null {
    if (!s) return null;
    return {
        value: s.value,
        unit: s.unit ?? null,
        range: s.range ?? null,
        as_of: s.asOf,
        confidence: s.confidence,
        note: s.note ?? null,
        sources: refs(s.sources),
    };
}

export function companyView(c: Company): z.input<typeof companyOut> {
    return {
        id: c.id,
        name: c.name,
        local_name: c.localName ?? null,
        hq_country: c.hqCountry,
        segment: c.segment,
        stages: c.stages,
        ownership: c.ownership
            ? {
                  kind: c.ownership.kind,
                  ticker: c.ownership.ticker ?? null,
                  parent: c.ownership.parent ?? null,
              }
            : null,
        revenue_usd: sourced(c.revenue),
        gross_margin: sourced(c.grossMargin),
        products: c.products ?? [],
        url: c.url,
        site_count: sitesOf(c.id).length,
    };
}

export function siteView(s: Site): z.input<typeof siteOut> {
    return {
        id: s.id,
        company_id: s.companyId,
        kind: s.kind,
        name: s.name,
        country: s.country,
        admin1: s.admin1 ?? null,
        lat: s.lat,
        lon: s.lon,
        precision: s.precision,
        makes: s.makes ?? [],
        stages: s.stages,
        capacity: sourced(s.capacity),
        opened: sourced(s.opened),
        status: s.status ?? null,
        sources: refs(s.sources),
    };
}

function linkView(l: SupplyLink): z.input<typeof linkOut> {
    return {
        from: l.from,
        to: l.to,
        what: l.what,
        confidence: l.confidence,
        note: l.note ?? null,
        ended: l.ended ?? null,
        sources: refs(l.sources),
    };
}

export function companyDetailView(c: Company): z.input<typeof companyDetailOut> {
    const links = linksOf(c.id);
    return {
        company: companyView(c),
        sites: sitesOf(c.id).map(siteView),
        supplies: links.supplies.map(linkView),
        buys: links.buys.map(linkView),
        sources: refs(c.sources ?? []),
    };
}
