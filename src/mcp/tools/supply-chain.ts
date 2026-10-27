import { SEGMENTS } from "@/supply-chain/companies";
import { METAL_IDS, getMetal } from "@/supply-chain/metals/elements";
import { getSeries } from "@/supply-chain/metals/prices";
import { METAL_STAGES } from "@/supply-chain/metals/stage-shares";
import {
    PRICE_SERIES_IDS,
    metalPricesOut,
    metalPricesView,
    metalSupplyOut,
    metalSupplyView,
} from "@/supply-chain/metals/views";
import { findCompanies, findSites, getCompany } from "@/supply-chain/registry";
import { SITE_KINDS } from "@/supply-chain/sites";
import { STAGES } from "@/supply-chain/stages";
import {
    companyDetailOut,
    companyDetailView,
    companyOut,
    companyView,
    siteOut,
    siteView,
} from "@/supply-chain/views";
import { z } from "zod";
import { limitSchema, offsetSchema } from "../schemas";
import { ToolInputError, defineTool } from "../tool";

// Generic reads over the supply-chain registry: the companies along the
// actuator chain (ore to robot) and their sites. Every number carries its
// sources, as-of date and confidence.

const country = z
    .string()
    .length(2)
    .optional()
    .describe("ISO 3166 alpha-2 country code, e.g. JP, CN, KR, US.");
const stage = z
    .enum(STAGES)
    .optional()
    .describe("Supply-chain stage, e.g. magnet or gearing.");

const listCompanies = defineTool({
    name: "list_companies",
    title: "List supply-chain companies",
    description:
        "List companies in the actuator supply chain (rare earth miners and refiners, magnet and motor makers, gear, screw and bearing makers, robot and actuator makers) with headquarters country, stages and segment. Filter by country, stage or segment. Revenue figures carry sources and confidence (reported, estimated or modeled).",
    input: z.object({
        country,
        stage,
        segment: z.enum(SEGMENTS).optional().describe("Industry segment."),
        limit: limitSchema(100, 50),
        offset: offsetSchema,
    }),
    output: z.object({
        total: z.number(),
        offset: z.number(),
        results: z.array(companyOut),
    }),
    run: ({ country, stage, segment, limit, offset }) => {
        const hits = findCompanies({ country, stage, segment });
        return {
            total: hits.length,
            offset,
            results: hits.slice(offset, offset + limit).map(companyView),
        };
    },
});

const getCompanyTool = defineTool({
    name: "get_company",
    title: "Get supply-chain company",
    description:
        "Return one supply-chain company by id with its sites (headquarters, plants, mines), who it supplies and who supplies it, each with citations. Find ids with list_companies.",
    input: z.object({
        id: z.string().min(1).max(120).describe("Company id, e.g. 'jl-mag'."),
    }),
    output: companyDetailOut,
    run: ({ id }) => {
        const c = getCompany(id);
        if (!c)
            throw new ToolInputError(
                `No company with id "${id}". List valid ids with list_companies.`,
            );
        return companyDetailView(c);
    },
});

const listSites = defineTool({
    name: "list_sites",
    title: "List supply-chain sites",
    description:
        "List physical sites (headquarters, plants, mines, refineries) of supply-chain companies with coordinates and their precision (site, city or region), what each makes and its status. Filter by country, stage, company id or kind.",
    input: z.object({
        country,
        stage,
        company: z.string().max(120).optional().describe("Company id."),
        kind: z.enum(SITE_KINDS).optional().describe("Site kind."),
        limit: limitSchema(100, 50),
        offset: offsetSchema,
    }),
    output: z.object({
        total: z.number(),
        offset: z.number(),
        results: z.array(siteOut),
    }),
    run: ({ country, stage, company, kind, limit, offset }) => {
        const hits = findSites({ country, stage, company, kind });
        return {
            total: hits.length,
            offset,
            results: hits.slice(offset, offset + limit).map(siteView),
        };
    },
});

const getMetalSupply = defineTool({
    name: "get_metal_supply",
    title: "Get magnet metal supply",
    description:
        "Who controls a magnet metal (nd, pr, dy, tb, sm, co) at each stage from mine to magnet: country shares with the top country and HHI, USGS mine production, reserves and years of supply by country, and the latest cited price per series. Pass stage to get one stage only. Stages with no public country split are marked gap.",
    input: z.object({
        element: z.enum(METAL_IDS).describe("Element id: nd, pr, dy, tb, sm or co."),
        stage: z
            .enum(METAL_STAGES)
            .optional()
            .describe("mining, separation, metal-alloy or magnet."),
    }),
    output: metalSupplyOut,
    run: ({ element, stage }) => {
        const metal = getMetal(element);
        if (!metal) throw new ToolInputError(`No metal "${element}".`);
        return metalSupplyView(metal, stage);
    },
});

const month = z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
    .optional();

const getMetalPrices = defineTool({
    name: "get_metal_prices",
    title: "Get magnet metal prices",
    description:
        "Cited price history in US$/kg for one series (USGS annual averages and year-end ranges back to 2011, monthly SMM readings in 2026, China domestic and FOB China export) with the events that moved it. Filter with from and to (YYYY-MM).",
    input: z.object({
        series: z.enum(PRICE_SERIES_IDS).describe("Price series id."),
        from: month.describe("First month, YYYY-MM."),
        to: month.describe("Last month, YYYY-MM."),
    }),
    output: metalPricesOut,
    run: ({ series, from, to }) => {
        const s = getSeries(series);
        if (!s) throw new ToolInputError(`No price series "${series}".`);
        return metalPricesView(s, from, to);
    },
});

export const supplyChainTools = [
    listCompanies,
    getCompanyTool,
    listSites,
    getMetalSupply,
    getMetalPrices,
];
