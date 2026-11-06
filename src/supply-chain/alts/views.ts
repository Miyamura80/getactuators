import { z } from "zod";
import { getCompany } from "../registry";
import { refs, sourceRefOut, sourced, sourcedOut } from "../views";
import {
    ALTS_AS_OF,
    ALTS_PATH,
    ALT_FAMILIES,
    ALT_TECHS,
    type AltTech,
    COMPANY_TYPES,
    DEPLOYMENT_STATUSES,
    type Deployment,
    END_MARKETS,
    MAGNET_USES,
    MILESTONE_KINDS,
    type MarketSlice,
    deploymentsOf,
    slicesOf,
} from "./index";

// Wire shape of /alts for REST and MCP: snake_case, nulls for unknowns,
// sources inline. Server side only (zod).

const sourcedOrNull = sourcedOut.nullable();

const milestoneOut = z.object({
    kind: z.enum(MILESTONE_KINDS),
    label: z.string(),
    year: sourcedOut.describe(
        "Earliest dated public evidence we cite; the event may be earlier.",
    ),
    announced: z.boolean().describe("True for a target that has not happened yet."),
});

const marketOut = z.object({
    id: z.string(),
    label: z.string().describe("What the publisher sized."),
    tech_ids: z.array(z.string()),
    revenue_usd: sourcedOut,
    cagr: sourcedOut.describe(
        "Forecast compound annual growth as a fraction per year.",
    ),
    end_market: z
        .enum(END_MARKETS)
        .describe("Our classification of the largest end market."),
});

const deploymentOut = z.object({
    id: z.string(),
    tech_id: z.string(),
    org: z.string(),
    company_id: z.string().nullable(),
    product: z.string(),
    date: z.string().describe("Date of the public source, ISO or YYYY-MM or YYYY."),
    status: z.enum(DEPLOYMENT_STATUSES),
    place: z.string().nullable(),
    country: z.string().nullable(),
    lat: z.number().nullable(),
    lon: z.number().nullable(),
    sources: z.array(sourceRefOut),
});

export const altTechOut = z.object({
    id: z.string(),
    url: z.string().describe("Deep link: /alts?tech={id}."),
    family: z.enum(ALT_FAMILIES),
    name: z.string(),
    principle: z.string(),
    magnets: z
        .enum(MAGNET_USES)
        .describe(
            "none, ferrite, iron-nitride, permanent, motor (set by its pump motor) or drive-motor (a transmission: depends on the motor that drives it).",
        ),
    trl: sourcedOut.describe(
        "Technology readiness 1..9: our reading of the cited evidence (modeled).",
    ),
    milestones: z.array(milestoneOut),
    players: z.array(
        z.object({
            company_id: z
                .string()
                .describe("Supply-chain registry id (GET /api/v1/companies/{id})."),
            name: z.string(),
            country: z.string(),
            company_type: z.enum(COMPANY_TYPES),
        }),
    ),
    efficiency: sourcedOrNull.describe("Fraction 0..1."),
    specific_power_w_per_kg: sourcedOrNull,
    torque_density_nm_per_kg: sourcedOrNull,
    cost_usd_per_nm: sourcedOrNull,
    ree_intensity_kg_per_kw: sourcedOrNull.describe(
        "Rare earth content; 0 where the source says the design uses none.",
    ),
    facts: z.array(z.object({ label: z.string(), value: sourcedOut })),
    markets: z
        .array(marketOut)
        .describe("Published market sizes that include this technology."),
    deployments: z.array(deploymentOut),
    scene_id: z.string().describe("3D scene id; poster at /posters/{id}.png."),
    sources: z.array(sourceRefOut),
});

export const altTechListOut = z.object({
    as_of: z.string(),
    count: z.number(),
    results: z.array(altTechOut),
});

export const altTechUrl = (id: string): string => `${ALTS_PATH}?tech=${id}`;

export function marketView(s: MarketSlice): z.input<typeof marketOut> {
    return {
        id: s.id,
        label: s.label,
        tech_ids: s.techIds,
        revenue_usd: sourced(s.revenueUsd) as z.input<typeof sourcedOut>,
        cagr: sourced(s.cagr) as z.input<typeof sourcedOut>,
        end_market: s.endMarket,
    };
}

export function deploymentView(d: Deployment): z.input<typeof deploymentOut> {
    return {
        id: d.id,
        tech_id: d.techId,
        org: d.org,
        company_id: d.companyId ?? null,
        product: d.product,
        date: d.date,
        status: d.status,
        place: d.location?.place ?? null,
        country: d.location?.country ?? null,
        lat: d.location?.lat ?? null,
        lon: d.location?.lon ?? null,
        sources: refs(d.sources),
    };
}

export function altTechView(t: AltTech): z.input<typeof altTechOut> {
    return {
        id: t.id,
        url: altTechUrl(t.id),
        family: t.family,
        name: t.name,
        principle: t.principle,
        magnets: t.magnets,
        trl: sourced(t.trl) as z.input<typeof sourcedOut>,
        milestones: t.milestones.map((m) => ({
            kind: m.kind,
            label: m.label,
            year: sourced(m.year) as z.input<typeof sourcedOut>,
            announced: m.announced,
        })),
        players: t.players.flatMap((p) => {
            const c = getCompany(p.companyId);
            return c
                ? [
                      {
                          company_id: c.id,
                          name: c.name,
                          country: c.hqCountry,
                          company_type: p.companyType,
                      },
                  ]
                : [];
        }),
        efficiency: sourced(t.metrics.efficiency),
        specific_power_w_per_kg: sourced(t.metrics.specificPower),
        torque_density_nm_per_kg: sourced(t.metrics.torqueDensity),
        cost_usd_per_nm: sourced(t.metrics.costPerNm),
        ree_intensity_kg_per_kw: sourced(t.metrics.reeIntensityKgPerKw),
        facts: t.facts.map((f) => ({
            label: f.label,
            value: sourced(f.value) as z.input<typeof sourcedOut>,
        })),
        markets: slicesOf(t.id).map(marketView),
        deployments: deploymentsOf(t.id).map(deploymentView),
        scene_id: t.scene.spec.id,
        sources: refs(t.sources),
    };
}

export function altTechListView(family?: string): z.input<typeof altTechListOut> {
    const techs = ALT_TECHS.filter((t) => !family || t.family === family);
    return { as_of: ALTS_AS_OF, count: techs.length, results: techs.map(altTechView) };
}
