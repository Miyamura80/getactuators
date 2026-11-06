import { actuatorBenchmarks, benchmarkList } from "@/api/benchmarks";
import { findCountry } from "@/api/countries";
import { brandCounts, findActuator, findRobot, useCaseCounts } from "@/api/handlers";
import type { ApiContext } from "@/api/http";
import { API_OPERATIONS, apiIndexData } from "@/api/surface";
import { absoluteUrl } from "../../site";
import { actuatorBody, robotSection } from "../catalog-md";
import { PATHS } from "../links";
import { bullets, mdLink, mdTable, mdText } from "../md";
import { countryBody } from "../supply-chain/country";
import { getAlt, listAlts } from "./alts";
import {
    benchmarkRuns,
    compareActuators,
    getOpenRobot,
    listActuators,
    listCategories,
    listCountries,
    listOpenRobots,
    listRobots,
    namedCounts,
    sdkBrandBody,
    sdkScores,
} from "./catalog";
import { getHumanoid, getPerson, listHumanoids, listPeople } from "./humanoids";
import {
    getMetal,
    getMetalPrices,
    getProcess,
    listMetals,
    listProcesses,
} from "./materials";
import { apiMarkdownPath, filterSummary } from "./shared";
import {
    getCompany,
    getPolicy,
    listCompanies,
    listPolicy,
    listSites,
} from "./supply-chain";

export { apiMarkdownPath };

// Markdown twins of the REST API's GET endpoints (/api.md, /api/v1/*.md, or
// Accept: text/markdown). Each renderer reads the same data function as the
// JSON handler, so filters, validation errors and pagination match exactly.
// Every document opens with its H1 and ends with a pointer to the JSON.
// Domain renderers live next to this file; every GET operation must have one
// (tests/server/api-markdown.test.ts enforces it).

type Renderer = (ctx: ApiContext) => string;

function apiIndex(): string {
    const index = apiIndexData();
    // Link the twins that need no input (no path param, no required ids).
    const withTwin = new Set(
        API_OPERATIONS.filter(
            (op) =>
                op.method === "GET" &&
                !op.pathParam &&
                op.operationId !== "compare_actuators" &&
                hasApiMarkdown(op.operationId),
        ).map((op) => op.path),
    );
    const rows = index.endpoints.map((e) => [
        e.method,
        e.method === "GET" && withTwin.has(e.path)
            ? mdLink(e.path, absoluteUrl(apiMarkdownPath(e.path)))
            : mdText(e.path),
        mdText(e.summary),
    ]);
    return [
        `# ${mdText(index.name)} ${index.version}`,
        mdText(index.description),
        bullets([
            `Auth: ${index.auth}`,
            `Developer docs: ${index.docs} (markdown: ${absoluteUrl(PATHS.apiDocsMd)})`,
            `OpenAPI 3.1: ${index.openapi}`,
            `MCP server: ${index.mcp}`,
            "Every GET endpoint has a markdown twin: append .md to the path (query string kept) or send Accept: text/markdown.",
        ]),
        `## Endpoints\n\n${mdTable(["Method", "Path", "Summary"], rows)}`,
    ].join("\n\n");
}

const RENDERERS: Record<string, Renderer> = {
    get_api_index: apiIndex,
    list_actuators: listActuators,
    compare_actuators: compareActuators,
    get_actuator: (ctx) => actuatorBody(findActuator(ctx)),
    list_robots: listRobots,
    get_robot: (ctx) => robotSection(findRobot(ctx), 1),
    list_categories: listCategories,
    list_brands: () => namedCounts("Actuator brands", "brand", brandCounts()),
    list_use_cases: () => namedCounts("Use-case tags", "use_case", useCaseCounts()),
    list_companies: listCompanies,
    get_company: getCompany,
    list_sites: listSites,
    list_metals: listMetals,
    get_metal: getMetal,
    get_metal_prices: getMetalPrices,
    list_policy_measures: listPolicy,
    get_policy_measure: getPolicy,
    list_processes: listProcesses,
    get_process: getProcess,
    list_alt_technologies: listAlts,
    get_alt_technology: getAlt,
    list_humanoids: listHumanoids,
    get_humanoid: getHumanoid,
    list_open_robots: listOpenRobots,
    get_open_robot: getOpenRobot,
    list_benchmarks: (ctx) =>
        benchmarkRuns(`Measured runs${filterSummary(ctx.url)}`, benchmarkList(ctx)),
    get_actuator_benchmarks: (ctx) =>
        benchmarkRuns(
            `Measured runs: ${mdText(ctx.params.id ?? "")}`,
            actuatorBenchmarks(ctx),
        ),
    list_countries: listCountries,
    get_country: (ctx) => countryBody(findCountry(ctx)),
    list_sdk_scores: sdkScores,
    get_sdk_score: sdkBrandBody,
    list_people: listPeople,
    get_person: getPerson,
};

export function hasApiMarkdown(operationId: string): boolean {
    return operationId in RENDERERS;
}

// Markdown for one GET operation, given the context of its JSON URL. Throws
// the same ApiErrors as the JSON handler (404, invalid parameter, cursor).
export function apiMarkdown(operationId: string, ctx: ApiContext): string {
    const render = RENDERERS[operationId];
    if (!render) throw new Error(`no markdown twin for ${operationId}`);
    const jsonUrl = absoluteUrl(`${ctx.url.pathname}${ctx.url.search}`);
    const body = render(ctx)
        .split("\n\n")
        .filter((block) => block.trim() !== "")
        .join("\n\n");
    return `${body}\n\n## JSON\n\nThis is the markdown twin of ${jsonUrl}. Request that URL for the same data as JSON; the schema is in ${absoluteUrl(PATHS.openapi)}.\n`;
}
