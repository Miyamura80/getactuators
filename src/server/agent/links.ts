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
    apiDocs: "/docs/api",
    apiDocsMd: "/docs/api.md",
    mcp: "/mcp",
    mcpDocs: "/mcp/docs",
    mcpCard: "/.well-known/mcp/server-card.json",
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

// Tools exposed by the product MCP server (routes/mcp.ts).
export const MCP_TOOLS: readonly string[] = [
    "search_actuators",
    "get_actuator",
    "compare_actuators",
    "recommend_actuators",
    "list_actuator_categories",
    "list_brands",
    "list_robots",
    "get_robot",
    "find_robots_using_actuator",
];

export const RATE_LIMIT_PER_MINUTE = 120;
