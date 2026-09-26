import { type ApiHandler, endpoint, unknownEndpoint } from "@/api/http";
import { API_INDEX, API_OPERATIONS, OPENAPI_DOC } from "@/api/surface";
import type { Route } from "../types";

// Public read-only REST API (/api, /api/v1/*, /openapi.json). Routes are
// generated from the operation list so the spec and the server always agree.

function groupByPath(): Map<string, Partial<Record<"GET" | "POST", ApiHandler>>> {
    const byPath = new Map<string, Partial<Record<"GET" | "POST", ApiHandler>>>();
    for (const op of API_OPERATIONS) {
        byPath.set(op.path, { ...byPath.get(op.path), [op.method]: op.handler });
    }
    return byPath;
}

const operationRoutes: Route[] = [...groupByPath()].map(([path, methods]) => ({
    path,
    handler: endpoint(methods),
}));

// Aliases for the index and the spec.
const aliasRoutes: Route[] = [
    { path: "/api/", handler: endpoint({ GET: API_INDEX.handler }) },
    { path: "/api/v1", handler: endpoint({ GET: API_INDEX.handler }) },
    { path: "/api/v1/", handler: endpoint({ GET: API_INDEX.handler }) },
    { path: "/api/openapi.json", handler: endpoint({ GET: OPENAPI_DOC.handler }) },
];

// Any other /api/* path (up to 8 segments) is a JSON 404, never the SPA shell.
// Must stay last: routes are tried in order and these match everything.
const catchAllRoutes: Route[] = Array.from({ length: 8 }, (_, depth) => ({
    path: `/api${Array.from({ length: depth + 1 }, (_, i) => `/:p${i}`).join("")}`,
    handler: unknownEndpoint,
}));

export const routes: Route[] = [...operationRoutes, ...aliasRoutes, ...catchAllRoutes];
