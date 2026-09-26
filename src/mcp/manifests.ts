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

// Pre-connection discovery documents, built from the live tool list:
// /.well-known/mcp/server-card.json (server card, a superset of the MCP
// registry server.json shape) and /.well-known/mcp.json (endpoint index).

export const MCP_URL = absoluteUrl(MCP_PATH);
export const DOCS_MCP_URL = absoluteUrl(`${MCP_PATH}/docs`);
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
        title: "getactuators",
        displayName: "getactuators",
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
        _meta: {
            "io.modelcontextprotocol.registry/publisher-provided": {
                docsServerUrl: DOCS_MCP_URL,
                docsTools: DOCS_TOOLS.map((t) => t.name),
            },
        },
    };
}

export function mcpDiscovery() {
    const auth = { type: "none", description: "Anonymous and read-only; no key." };
    return {
        name: SERVER_NAME,
        description: SERVER_DESCRIPTION,
        servers: [
            {
                name: SERVER_NAME,
                title: "getactuators catalog",
                url: MCP_URL,
                transport: "streamable-http",
                serverCard: absoluteUrl("/.well-known/mcp/server-card.json"),
                authentication: auth,
                tools: CATALOG_TOOLS.map((t) => t.name),
            },
            {
                name: DOCS_SERVER_NAME,
                title: "getactuators documentation",
                url: DOCS_MCP_URL,
                transport: "streamable-http",
                authentication: auth,
                tools: DOCS_TOOLS.map((t) => t.name),
            },
        ],
        documentation: absoluteUrl("/llms.txt"),
        website: SITE_URL,
        repository: REPO_URL,
    };
}
