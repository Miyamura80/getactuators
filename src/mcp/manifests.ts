import { REPO_URL, SITE_URL, absoluteUrl } from "@/server/site";
import { SUPPORTED_PROTOCOL_VERSIONS } from "@modelcontextprotocol/server";
import { COMPARE_VIEW_URI } from "./app/compare-view";
import { DOCS_SERVER_NAME, DOCS_TOOLS } from "./docs-server";
import {
    CATALOG_TOOLS,
    ICON_URL,
    MCP_PATH,
    REGISTRY_NAME,
    SERVER_DESCRIPTION,
    SERVER_NAME,
    SERVER_VERSION,
} from "./server";
import { type ToolDef, toolAnnotations } from "./tool";

// Pre-connection discovery documents, built from the registered tool lists:
// /.well-known/mcp/server-card.json (server card for the catalog server at
// /mcp, a superset of the MCP registry server.json shape), a separate card for
// the docs server, and /.well-known/mcp.json (endpoint index). The catalog
// server is the primary endpoint everywhere; the docs server is only ever
// listed as a secondary, related server so scanners that pick one MCP URL
// land on /mcp.

export const MCP_URL = absoluteUrl(MCP_PATH);
export const DOCS_MCP_URL = absoluteUrl(`${MCP_PATH}/docs`);
export const SERVER_CARD_PATH = "/.well-known/mcp/server-card.json";
export const DOCS_SERVER_CARD_PATH = "/.well-known/mcp/docs-server-card.json";
const PROTOCOL_VERSIONS = ["2026-07-28", ...SUPPORTED_PROTOCOL_VERSIONS];

const toolEntry = (t: ToolDef) => ({
    name: t.name,
    title: t.title,
    description: t.description,
    annotations: toolAnnotations(t.title),
});

export function serverCard() {
    return {
        $schema:
            "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json",
        name: REGISTRY_NAME,
        title: "actuatorlist",
        displayName: "actuatorlist",
        description: SERVER_DESCRIPTION,
        version: SERVER_VERSION,
        websiteUrl: SITE_URL,
        serverUrl: MCP_URL,
        repository: { url: REPO_URL, source: "github" },
        icons: [{ src: ICON_URL, mimeType: "image/svg+xml", sizes: ["any"] }],
        icon: ICON_URL,
        remotes: [{ type: "streamable-http", url: MCP_URL }],
        transport: { type: "streamable-http", url: MCP_URL },
        protocolVersion: PROTOCOL_VERSIONS[0],
        supportedProtocolVersions: PROTOCOL_VERSIONS,
        authentication: { required: false, type: "none" },
        capabilities: {
            tools: {},
            resources: {},
            extensions: { "io.modelcontextprotocol/ui": {} },
        },
        tools: CATALOG_TOOLS.map(toolEntry),
        resources: [
            { uri: "catalog://actuators", mimeType: "application/json" },
            { uri: "catalog://robots", mimeType: "application/json" },
            { uri: "catalog://categories", mimeType: "application/json" },
            { uriTemplate: "actuator://{id}", mimeType: "application/json" },
            { uriTemplate: "robot://{id}", mimeType: "application/json" },
            { uri: COMPARE_VIEW_URI, mimeType: "text/html;profile=mcp-app" },
        ],
        prompts: [],
    };
}

// Card for the secondary docs server (/mcp/docs). Linked from mcp.json and the
// ARD catalog as a related server, never as the primary endpoint.
export function docsServerCard() {
    return {
        $schema:
            "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json",
        name: `${REGISTRY_NAME}-docs`,
        title: "actuatorlist docs",
        displayName: "actuatorlist docs",
        description:
            "The actuatorlist site and API documentation over MCP. For catalog data, use the main server.",
        version: SERVER_VERSION,
        websiteUrl: SITE_URL,
        serverUrl: DOCS_MCP_URL,
        repository: { url: REPO_URL, source: "github" },
        icons: [{ src: ICON_URL, mimeType: "image/svg+xml", sizes: ["any"] }],
        remotes: [{ type: "streamable-http", url: DOCS_MCP_URL }],
        transport: { type: "streamable-http", url: DOCS_MCP_URL },
        protocolVersion: PROTOCOL_VERSIONS[0],
        supportedProtocolVersions: PROTOCOL_VERSIONS,
        authentication: { required: false, type: "none" },
        capabilities: { tools: {}, resources: {} },
        tools: DOCS_TOOLS.map(toolEntry),
        resources: [
            { uriTemplate: "docs://actuatorlist/{id}", mimeType: "text/markdown" },
        ],
        prompts: [],
        primaryServer: { url: MCP_URL, serverCard: absoluteUrl(SERVER_CARD_PATH) },
    };
}

export function mcpDiscovery() {
    const auth = { type: "none", description: "Anonymous and read-only; no key." };
    return {
        name: SERVER_NAME,
        description: SERVER_DESCRIPTION,
        url: MCP_URL,
        transport: "streamable-http",
        serverCard: absoluteUrl(SERVER_CARD_PATH),
        servers: [
            {
                name: SERVER_NAME,
                title: "actuatorlist catalog",
                url: MCP_URL,
                transport: "streamable-http",
                serverCard: absoluteUrl(SERVER_CARD_PATH),
                authentication: auth,
                tools: CATALOG_TOOLS.map((t) => t.name),
            },
        ],
        relatedServers: [
            {
                name: DOCS_SERVER_NAME,
                title: "actuatorlist documentation",
                url: DOCS_MCP_URL,
                transport: "streamable-http",
                serverCard: absoluteUrl(DOCS_SERVER_CARD_PATH),
                authentication: auth,
                tools: DOCS_TOOLS.map((t) => t.name),
            },
        ],
        documentation: absoluteUrl("/llms.txt"),
        website: SITE_URL,
        repository: REPO_URL,
    };
}
