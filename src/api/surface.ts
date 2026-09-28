import { SITE_DESCRIPTION, absoluteUrl } from "@/server/site";
import { json } from "./http";
import { buildOpenApi } from "./openapi";
import { OPERATIONS, type Operation } from "./operations";
import { ApiIndexSchema, OpenApiDocSchema } from "./schemas";

// Discovery operations (/api index, /openapi.json) plus the complete list that
// routes, docs and the spec are generated from.

let specCache: string | null = null;

export function openApiText(): string {
    specCache ??= JSON.stringify(buildOpenApi(API_OPERATIONS), null, 2);
    return specCache;
}

const API_INDEX: Operation = {
    operationId: "get_api_index",
    method: "GET",
    path: "/api",
    summary: "API index",
    description:
        "Machine-readable entry point: every endpoint with its method and summary, plus links to the docs, the OpenAPI document and the MCP server.",
    response: ApiIndexSchema,
    errors: [],
    example: "/api",
    handler: () => json(apiIndexData()),
};

// Body of the /api index (JSON), also rendered as its markdown twin.
export function apiIndexData() {
    return {
        name: "actuatorlist API",
        version: "v1",
        description: SITE_DESCRIPTION,
        auth: "none (public, anonymous, read-only)",
        docs: absoluteUrl("/docs/api"),
        openapi: absoluteUrl("/openapi.json"),
        mcp: absoluteUrl("/mcp"),
        endpoints: API_OPERATIONS.map((op) => ({
            method: op.method,
            path: op.path,
            summary: op.summary,
        })),
    };
}

const OPENAPI_DOC: Operation = {
    operationId: "get_openapi_spec",
    method: "GET",
    path: "/openapi.json",
    summary: "OpenAPI document",
    description: "This OpenAPI 3.1 description of the API (also at /api/openapi.json).",
    response: OpenApiDocSchema,
    errors: [],
    example: "/openapi.json",
    handler: () =>
        new Response(openApiText(), {
            headers: { "Content-Type": "application/json; charset=utf-8" },
        }),
};

export const API_OPERATIONS: readonly Operation[] = [
    API_INDEX,
    OPENAPI_DOC,
    ...OPERATIONS,
];

export { API_INDEX, OPENAPI_DOC };
