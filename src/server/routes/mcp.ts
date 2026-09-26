import { createDocsServer } from "@/mcp/docs-server";
import { createMcpEndpoint } from "@/mcp/http";
import { mcpDiscovery, serverCard } from "@/mcp/manifests";
import { createCatalogServer } from "@/mcp/server";
import type { Route } from "../types";

// Public MCP surfaces (Streamable HTTP, anonymous, read-only) and their
// discovery manifests.

const catalogEndpoint = createMcpEndpoint(createCatalogServer);
const docsEndpoint = createMcpEndpoint(createDocsServer);

const manifest = (body: unknown) => () =>
    Response.json(body, {
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=3600",
        },
    });

export const routes: Route[] = [
    { path: "/mcp", handler: (req) => catalogEndpoint(req) },
    { path: "/mcp/docs", handler: (req) => docsEndpoint(req) },
    {
        method: "GET",
        path: "/.well-known/mcp/server-card.json",
        handler: manifest(serverCard()),
    },
    { method: "GET", path: "/.well-known/mcp.json", handler: manifest(mcpDiscovery()) },
    { method: "GET", path: "/.well-known/mcp", handler: manifest(mcpDiscovery()) },
];
