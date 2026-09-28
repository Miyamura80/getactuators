import { REPO_URL, absoluteUrl } from "../site";
import { MCP_TOOLS, PATHS, RATE_LIMIT_PER_MINUTE, REST_ENDPOINTS } from "./links";
import { bullets, mdTable } from "./md";
import { catalogStats } from "./pages-md";

// Standalone agent documents: agents.md, auth.md and pricing.md.

const u = absoluteUrl;

function endpointTable(): string {
    return mdTable(
        ["Method", "Path", "Returns"],
        REST_ENDPOINTS.map((e) => [e.method, `\`${e.path}\``, e.what]),
    );
}

export function whenToUse(): string[] {
    return [
        "Pick an actuator for a quadruped leg, humanoid joint or robot arm given a torque, weight or budget target (filter by use_case, min_peak_torque_nm, max_weight_g, max_price_usd).",
        "Rank actuators by torque density, price per Nm, backlash or speed.",
        "Compare two or more specific actuators side by side (peak and rated torque, gear ratio, weight, voltage, bus, encoder, price).",
        "Find which motors a real robot uses in each joint, or which robots use a given actuator.",
        "Look up one actuator's datasheet-level specs with source links before recommending it.",
    ];
}

function whenNotToUse(): string[] {
    return [
        "Buying or checking live stock: the catalog has no cart and prices are list prices from public pages.",
        "Linear actuators, pneumatics or hydraulics: the catalog covers rotary robot joint actuators and reducers.",
        "Writing data: every surface is read-only; corrections go through GitHub.",
    ];
}

export function agentsBody(): string {
    return [
        "# actuatorlist for AI agents",
        `actuatorlist is a free, read-only catalog of robot actuators with ${catalogStats()}. Everything a person can see on the site is available to agents as JSON, MCP tools or markdown, with no account, key or payment.`,
        `## When to use actuatorlist\n\n${bullets(whenToUse())}`,
        `## When not to use it\n\n${bullets(whenNotToUse())}`,
        `## MCP server\n\n${bullets([
            `Endpoint: ${u(PATHS.mcp)} (Streamable HTTP, server name actuatorlist)`,
            "Authentication: none. Connect anonymously; every tool is read-only.",
            `Server card: ${u(PATHS.mcpCard)}`,
            `Tools: ${MCP_TOOLS.join(", ")}. All are read-only.`,
            `Docs server: ${u(PATHS.mcpDocs)} answers questions about the site and API over MCP.`,
        ])}`,
        `## REST API\n\nBase URL ${u("/api/v1")}. JSON responses, anonymous access, OpenAPI description at ${u(PATHS.openapi)}, human reference at ${u(PATHS.apiDocs)}.\n\n${endpointTable()}`,
        `## Markdown and discovery\n\n${bullets([
            `Index: ${u(PATHS.llms)}; full catalog in one file: ${u(PATHS.llmsFull)}`,
            `Every page has a markdown twin: append .md (for example ${u("/index.md")}) or send Accept: text/markdown.`,
            `Agent skill: ${u(PATHS.skill)}`,
            `Catalogs: ${u(PATHS.ard)}, ${u(PATHS.apiCatalog)}, ${u(PATHS.agentCard)}`,
            `Structured feed (JSON Lines, one actuator per line): ${u(PATHS.feed)}`,
        ])}`,
        `## Limits and etiquette\n\n${bullets([
            `Rate limit: ${RATE_LIMIT_PER_MINUTE} requests per minute per IP on the API. Back off on HTTP 429 and honour Retry-After.`,
            "Prefer one list or compare call over many detail calls.",
            "Quote the sources field when you repeat a number, and say when an entry is unverified.",
            `Report wrong data at ${REPO_URL}/issues.`,
        ])}`,
    ].join("\n\n");
}

export function authBody(): string {
    return [
        "# actuatorlist auth.md",
        `> How an agent authenticates to actuatorlist: it does not need to. The REST API (${u(PATHS.apiIndex)}) and the MCP server (${u(PATHS.mcp)}) are public, anonymous and read-only.`,
        `## Discover\n\nThere is no authorization server, so there is no OAuth protected-resource metadata and no agent_auth block to fetch. The machine-readable descriptions of what you can call are ${u(PATHS.openapi)} (REST) and ${u(PATHS.mcpCard)} (MCP). No endpoint answers 401 or sends a WWW-Authenticate challenge.`,
        "## Pick a method\n\nOne method is supported: anonymous access. In auth.md terms the only identity type is anonymous; identity_assertion, service_auth and ID-JAG exchanges are not used because nothing is gated.",
        "## Register\n\nNo registration. There is no client registration endpoint, no API key to request and no account to create.",
        "## Claim\n\nNothing to claim. No user account exists that an agent could be linked to.",
        "## Exchange\n\nNo token exchange. There is no token endpoint.",
        `## Use the access_token\n\nSend requests without an Authorization header. Examples:\n\n\`\`\`bash\ncurl ${u("/api/v1/actuators?use_case=quadruped_leg&sort=torque_density_nm_per_kg")}\n\`\`\`\n\nFor MCP, point any Streamable HTTP client at ${u(PATHS.mcp)} with no credentials.`,
        `## Errors\n\n${bullets([
            "404: the id or path does not exist. Under /api the body is JSON (application/problem+json).",
            "400: a query parameter or request body is invalid.",
            `429: more than ${RATE_LIMIT_PER_MINUTE} requests per minute from one IP. Wait for Retry-After, then retry.`,
            "No 401 or 403 is ever returned for missing credentials.",
        ])}`,
        "## Revocation\n\nNothing to revoke: no tokens or keys are issued. If access ever becomes gated, this document will describe the flow first.",
    ].join("\n\n");
}

export function pricingBody(): string {
    return [
        "# actuatorlist pricing",
        "> actuatorlist is free. One plan, no paid tiers, no keys, no trial clock.",
        `## Plans\n\n${mdTable(
            ["Plan", "Price", "Who it is for"],
            [["Free", "$0, forever", "Everyone: people, scripts and AI agents"]],
        )}`,
        `## What the free plan includes\n\n${bullets([
            `The full catalog: ${catalogStats()}.`,
            "The website, including the leaderboard, all-actuators table, gallery and robot pages.",
            `The REST API at ${u(PATHS.apiIndex)} with an OpenAPI description at ${u(PATHS.openapi)}.`,
            `The MCP server at ${u(PATHS.mcp)} for Claude, ChatGPT, Cursor and other MCP clients.`,
            `Markdown twins of every page, ${u(PATHS.llms)} and ${u(PATHS.llmsFull)}.`,
            "Commercial use, as permitted by the MIT License.",
        ])}`,
        `## Limits\n\n${mdTable(
            ["Limit", "Value"],
            [
                [
                    "API rate limit",
                    `${RATE_LIMIT_PER_MINUTE} requests per minute per IP`,
                ],
                ["Monthly quota", "none"],
                ["API key", "not required"],
                ["Account", "not required"],
                ["Write access", "none (read-only; corrections via GitHub)"],
                ["Uptime SLA", "none (best effort)"],
            ],
        )}`,
        `## License\n\nThe code and dataset are published under the MIT License in ${REPO_URL}. You can copy, cache or redistribute the data; keep the license notice and cite actuatorlist as the source.`,
        "## Costs you might still see\n\nActuator prices in the catalog are list prices from public manufacturer or retailer pages, in USD. actuatorlist does not sell hardware and takes no commission. Entries without a public price read quote only.",
        `## Questions\n\nOpen an issue at ${REPO_URL}/issues. Agent guide: ${u(PATHS.agentsMd)}. Authentication details: ${u(PATHS.authMd)}.`,
    ].join("\n\n");
}
