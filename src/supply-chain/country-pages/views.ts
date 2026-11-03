import { z } from "zod";
import { concentration } from "../concentration";
import { MEASURE_STATUSES, MEASURE_TYPES, measuresForCountry } from "../policy";
import { measureUrl } from "../policy/views";
import { STAGES } from "../stages";
import {
    companyOut,
    companyView,
    linkOut,
    linkView,
    refs,
    siteOut,
    siteView,
    sourceRefOut,
    sourced,
    sourcedOut,
} from "../views";
import {
    COUNTRY_AS_OF,
    type CountryPage,
    LIVE_COUNTRY_PAGES,
    clusterSites,
    countryCompanies,
    countryLinks,
    countrySites,
    coverage,
    worldShares,
} from "./index";

// Wire shape of a country page for REST (/api/v1/countries) and MCP
// (get_country): the registry filtered to one country plus its stage shares,
// clusters and policies. Server side only (zod).

const coverageOut = z.object({
    companies: z.number(),
    sites: z.number(),
    links: z.number(),
});

const stageOut = z.object({
    stage: z.enum(STAGES),
    of: z.string().describe("What the share is a share of."),
    share: sourcedOut.nullable().describe("This country's share, a fraction 0..1."),
    gap: z
        .object({ text: z.string(), sources: z.array(sourceRefOut) })
        .nullable()
        .describe("Set when no public source splits the stage by country."),
    world_leader: z
        .object({ country: z.string(), share: z.number() })
        .nullable()
        .describe("The leading country worldwide at this stage, from /metals data."),
});

const clusterOut = z.object({
    id: z.string(),
    label: z.string(),
    blurb: z.string(),
    bbox: z
        .tuple([z.number(), z.number(), z.number(), z.number()])
        .describe("[minLat, minLon, maxLat, maxLon]."),
    site_ids: z.array(z.string()),
});

const policyRefOut = z.object({
    id: z.string(),
    title: z.string(),
    type: z.enum(MEASURE_TYPES),
    status: z.enum(MEASURE_STATUSES),
    url: z
        .string()
        .describe("Deep link on /policy; full record at /api/v1/policy/{id}."),
});

export const countryOut = z.object({
    code: z.string().describe("ISO 3166 alpha-2 code."),
    slug: z.string(),
    name: z.string(),
    url: z.string(),
    as_of: z.string(),
    lede: z.string(),
    coverage: coverageOut,
    stage_shares: z.array(stageOut),
    clusters: z.array(clusterOut),
    policies: z.array(policyRefOut).describe("The country's measures, newest first."),
    companies: z
        .array(companyOut)
        .describe("Headquartered in the country or with a site there."),
    sites: z.array(siteOut).describe("Sites in the country, any owner."),
    links: z
        .array(linkOut)
        .describe("Current supply links with at least one end among `companies`."),
});

export const countryListOut = z.object({
    as_of: z.string(),
    results: z.array(
        z.object({
            code: z.string(),
            slug: z.string(),
            name: z.string(),
            url: z.string(),
            coverage: coverageOut,
        }),
    ),
});

export function countryView(p: CountryPage): z.input<typeof countryOut> {
    const sites = countrySites(p.code);
    return {
        code: p.code,
        slug: p.slug,
        name: p.name,
        url: p.path,
        as_of: COUNTRY_AS_OF,
        lede: p.lede,
        coverage: coverage(p.code),
        stage_shares: p.stages.map((s) => {
            const world = worldShares(s.stage);
            const top = world ? concentration(world.value)?.top : undefined;
            return {
                stage: s.stage,
                of: s.of,
                share: sourced(s.share),
                gap: s.gap ? { text: s.gap.text, sources: refs(s.gap.sources) } : null,
                world_leader: top ? { country: top.country, share: top.share } : null,
            };
        }),
        clusters: p.clusters.map((c) => ({
            id: c.id,
            label: c.label,
            blurb: c.blurb,
            bbox: c.bbox,
            site_ids: clusterSites(c, sites).map((s) => s.id),
        })),
        policies: measuresForCountry(p.code).map((m) => ({
            id: m.id,
            title: m.title,
            type: m.type,
            status: m.status,
            url: measureUrl(m),
        })),
        companies: countryCompanies(p.code).map(companyView),
        sites: sites.map(siteView),
        links: countryLinks(p.code).map(linkView),
    };
}

export function countryListView(): z.input<typeof countryListOut> {
    return {
        as_of: COUNTRY_AS_OF,
        results: LIVE_COUNTRY_PAGES.map((p) => ({
            code: p.code,
            slug: p.slug,
            name: p.name,
            url: p.path,
            coverage: coverage(p.code),
        })),
    };
}
