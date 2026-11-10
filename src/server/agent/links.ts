import { CATALOG_TOOLS } from "@/mcp/server";
import { SITE_URL } from "../site";

// Public URLs of every agent-facing surface, in one place so llms.txt, the
// manifests, Link headers and the tests all agree. Some are served by sibling
// route modules (REST API, MCP); this file only names them.

export const HOST = new URL(SITE_URL).host;

export const PATHS = {
    llms: "/llms.txt",
    llmsFull: "/llms-full.txt",
    sitemap: "/sitemap.xml",
    schemamap: "/schemamap.xml",
    feed: "/feeds/actuators.jsonl",
    openapi: "/openapi.json",
    apiIndex: "/api",
    apiBase: "/api/v1",
    apiDocs: "/docs/api",
    apiDocsMd: "/docs/api.md",
    mcp: "/mcp",
    mcpDocs: "/mcp/docs",
    mcpCard: "/.well-known/mcp/server-card.json",
    mcpDocsCard: "/.well-known/mcp/docs-server-card.json",
    apiCatalog: "/.well-known/api-catalog",
    ard: "/.well-known/ard.json",
    agentCard: "/.well-known/agent-card.json",
    skillsIndex: "/.well-known/agent-skills/index.json",
    skill: "/.well-known/agent-skills/actuatorlist/SKILL.md",
    agentsPage: "/agents",
    agentsMd: "/agents.md",
    authMd: "/auth.md",
    pricingMd: "/pricing.md",
    ogImage: "/og-image.png",
    ogStartups: "/og-startups.png",
    ogInvestors: "/og-investors.png",
} as const;

interface Endpoint {
    method: string;
    path: string;
    what: string;
}

// The REST API (served by the api route modules) is anonymous and read-only.
export const REST_ENDPOINTS: readonly Endpoint[] = [
    { method: "GET", path: "/api", what: "JSON index of every endpoint" },
    {
        method: "GET",
        path: "/api/v1/actuators",
        what: "Search and filter actuators (q, category, brand, use_case, min_peak_torque_nm, max_weight_g, max_price_usd, sort, order)",
    },
    {
        method: "GET",
        path: "/api/v1/actuators/{id}",
        what: "One actuator's full spec sheet",
    },
    {
        method: "GET",
        path: "/api/v1/actuators/compare?ids=a,b",
        what: "Side-by-side comparison (POST with a JSON body also works)",
    },
    {
        method: "GET",
        path: "/api/v1/robots",
        what: "Robots and the motors in each joint",
    },
    {
        method: "GET",
        path: "/api/v1/robots/{id}",
        what: "One robot with its joints resolved to motors",
    },
    { method: "GET", path: "/api/v1/categories", what: "Actuator categories" },
    { method: "GET", path: "/api/v1/brands", what: "Brands in the catalog" },
];

interface DataSurface {
    label: string;
    // The page; its markdown twin is the same path plus ".md".
    page: string;
    mcp: string;
    rest: string;
}

// MCP call and REST path for one live country page, shared by llms.txt and
// agents.md so the two documents cannot drift.
export function countryDataAccess(code: string): { mcp: string; rest: string } {
    return { mcp: `get_country("${code}")`, rest: `/api/v1/countries/${code}` };
}

// Supply-chain atlas and market-data pages, each with the MCP tools and REST
// endpoint that serve the same dataset. Country pages are added from the live
// country list where this is rendered.
export const DATA_SURFACES: readonly DataSurface[] = [
    {
        label: "Magnet metals",
        page: "/metals",
        mcp: "get_metal_supply, get_metal_prices",
        rest: "/api/v1/metals, /api/v1/metals/{element}, /api/v1/metal-prices/{series}",
    },
    {
        label: "Actuator chain policy",
        page: "/policy",
        mcp: "list_policy_measures",
        rest: "/api/v1/policy",
    },
    {
        label: "Bills of materials",
        page: "/bom",
        mcp: "list_bom_cases, get_bom",
        rest: "/api/v1/bom",
    },
    {
        label: "Manufacturing processes",
        page: "/manufacturing",
        mcp: "get_process",
        rest: "/api/v1/processes",
    },
    {
        label: "Rare-earth-free alternatives",
        page: "/alts",
        mcp: "list_alt_technologies, get_alt_technology",
        rest: "/api/v1/alts",
    },
    {
        label: "Humanoid joint map",
        page: "/humanoids",
        mcp: "get_humanoid_joints",
        rest: "/api/v1/humanoids",
    },
    {
        label: "Measured benchmarks",
        page: "/benchmarks",
        mcp: "get_benchmarks",
        rest: "/api/v1/benchmarks",
    },
    {
        label: "Trends over time",
        page: "/trends",
        mcp: "get_trends",
        rest: "/api/v1/trends",
    },
];

// Tools exposed by the catalog MCP server (routes/mcp.ts), read from the
// registered tool definitions so every manifest stays in sync with /mcp.
export const MCP_TOOLS: readonly string[] = CATALOG_TOOLS.map((t) => t.name);

export const RATE_LIMIT_PER_MINUTE = 120;
