import { REPO_URL, SITE_URL, absoluteUrl } from "@/server/site";
import { z } from "zod";
import { API_VERSION } from "./http";
import type { Operation } from "./operations";
import { ERROR_CODES } from "./problem";
import { RATE_LIMIT, RATE_WINDOW_S } from "./rate-limit";
import { schemaRegistry } from "./schemas";

// OpenAPI 3.1 document generated from the operation list + the zod schemas. Nothing
// here is hand-maintained JSON: add an operation and it shows up automatically.

type Json = Record<string, unknown>;

export const DEPRECATION_POLICY =
    'Breaking changes ship only under a new path version (/api/v2). A deprecated operation keeps working for at least 6 months after it is marked: responses carry `Deprecation` (RFC 9745) and `Sunset` (RFC 8594) headers plus a `Link rel="deprecation"` to the changelog, and the operation is flagged `deprecated: true` here. Additive changes (new fields, endpoints, filters) can land at any time, so clients should ignore unknown fields.';

const REF = (name: string) => ({ $ref: `#/components/schemas/${name}` });

// Drop zod's per-schema `$schema`/`$id` and the safe-integer bounds it adds
// to `.int()`, which are noise for readers and function-calling converters.
function clean(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(clean);
    if (!value || typeof value !== "object") return value;
    const out: Json = {};
    for (const [k, v] of Object.entries(value)) {
        if (k === "$schema" || k === "$id") continue;
        if (
            (k === "minimum" || k === "maximum") &&
            Math.abs(Number(v)) === Number.MAX_SAFE_INTEGER
        )
            continue;
        out[k] = clean(v);
    }
    return out;
}

function componentSchemas(): Json {
    const { schemas } = z.toJSONSchema(schemaRegistry, {
        uri: (id) => `#/components/schemas/${id}`,
    });
    return clean(schemas) as Json;
}

function refFor(schema: z.ZodType): Json {
    const id = schemaRegistry.get(schema)?.id;
    if (!id) throw new Error("OpenAPI: response/body schemas must be registered");
    return REF(id);
}

export function queryParameters(schema: z.ZodObject): Json[] {
    const js = clean(z.toJSONSchema(schema, { io: "input" })) as {
        properties: Record<string, Json>;
        required?: string[];
    };
    return Object.entries(js.properties).map(([name, prop]) => {
        const { description, ...rest } = prop;
        return {
            name,
            in: "query",
            required: js.required?.includes(name) ?? false,
            description,
            schema: rest,
        };
    });
}

const RATE_HEADERS = [
    "RateLimit",
    "RateLimit-Policy",
    "X-RateLimit-Limit",
    "X-RateLimit-Remaining",
    "X-RateLimit-Reset",
];
const headerRefs = (names: string[]) =>
    Object.fromEntries(names.map((n) => [n, { $ref: `#/components/headers/${n}` }]));

function statusResponseName(status: number): string {
    return `Problem${status}`;
}

function operationObject(op: Operation, tag: string): Json {
    const parameters: Json[] = [];
    if (op.pathParam) {
        parameters.push({
            name: op.pathParam.name,
            in: "path",
            required: true,
            description: op.pathParam.description,
            schema: { type: "string", examples: [op.pathParam.example] },
        });
    }
    if (op.query) parameters.push(...queryParameters(op.query));
    if (op.method === "POST")
        parameters.push({ $ref: "#/components/parameters/IdempotencyKey" });
    const errors = [...new Set([...op.errors, 405, 429, 500])].sort();
    return {
        operationId: op.operationId,
        summary: op.summary,
        description: op.description,
        tags: [tag],
        ...(parameters.length ? { parameters } : {}),
        ...(op.body
            ? {
                  requestBody: {
                      required: true,
                      content: { "application/json": { schema: refFor(op.body) } },
                  },
              }
            : {}),
        responses: {
            "200": {
                description: "Success.",
                headers: headerRefs(["API-Version", ...RATE_HEADERS]),
                content: { "application/json": { schema: refFor(op.response) } },
            },
            ...Object.fromEntries(
                errors.map((s) => [
                    String(s),
                    { $ref: `#/components/responses/${statusResponseName(s)}` },
                ]),
            ),
        },
    };
}

function tagFor(path: string): string {
    if (
        path.includes("/robots") ||
        path.includes("/humanoids") ||
        path.includes("/open-robots")
    )
        return "robots";
    if (
        path.includes("/companies") ||
        path.includes("/sites") ||
        path.includes("/metal")
    )
        return "supply-chain";
    if (path.includes("/patents")) return "supply-chain";
    if (path.includes("/actuators") || path.includes("/benchmarks")) return "actuators";
    if (path.startsWith("/api/v1/")) return "taxonomy";
    return "meta";
}

function problemResponses(): Json {
    const byStatus = new Map<number, string[]>();
    for (const [code, { status }] of Object.entries(ERROR_CODES)) {
        byStatus.set(status, [...(byStatus.get(status) ?? []), code]);
    }
    return Object.fromEntries(
        [...byStatus].map(([status, codes]) => [
            statusResponseName(status),
            {
                description: `Problem details; \`code\` is one of: ${codes.join(", ")}.`,
                headers: headerRefs(
                    status === 429
                        ? ["Retry-After", ...RATE_HEADERS]
                        : status === 405
                          ? ["Allow"]
                          : [],
                ),
                content: { "application/problem+json": { schema: REF("Problem") } },
            },
        ]),
    );
}

function header(description: string, type = "string"): Json {
    return { description, schema: { type } };
}

const HEADERS: Json = {
    "API-Version": header("Major API version that served the request.", "string"),
    RateLimit: header('Remaining quota and reset, e.g. `"default";r=119;t=42`.'),
    "RateLimit-Policy": header(
        `Quota policy: \`"default";q=${RATE_LIMIT};w=${RATE_WINDOW_S}\`.`,
    ),
    "X-RateLimit-Limit": header("Requests allowed per window.", "integer"),
    "X-RateLimit-Remaining": header("Requests left in the current window.", "integer"),
    "X-RateLimit-Reset": header("Seconds until the window resets.", "integer"),
    "Retry-After": header("Seconds to wait before retrying.", "integer"),
    Allow: header("Methods supported by this path."),
};

// Router `:id` segments become OpenAPI `{id}` templates.
export const openApiPath = (path: string) => path.replace(/:(\w+)/g, "{$1}");

export function buildOpenApi(operations: readonly Operation[]): Json {
    const paths: Record<string, Json> = {};
    for (const op of operations) {
        const p = openApiPath(op.path);
        paths[p] = {
            ...paths[p],
            [op.method.toLowerCase()]: operationObject(op, tagFor(p)),
        };
    }
    return {
        openapi: "3.1.0",
        info: {
            title: "actuatorlist API",
            version: `${API_VERSION}.0.0`,
            summary:
                "Read-only REST API over the actuatorlist robot actuator and robot catalog.",
            description: `Free, anonymous, read-only access to every actuator and robot on ${SITE_URL}. No API key, no account, no writes: production is safe to call, so there is no separate sandbox.\n\n**Rate limits:** ${RATE_LIMIT} requests per ${RATE_WINDOW_S}s per client IP, reported in \`RateLimit\`/\`RateLimit-Policy\` and \`X-RateLimit-*\` headers; a 429 carries \`Retry-After\`.\n\n**Errors:** RFC 9457 \`application/problem+json\` with a stable \`code\`.\n\n**Versioning and deprecation:** ${DEPRECATION_POLICY}`,
            contact: { name: "actuatorlist on GitHub", url: `${REPO_URL}/issues` },
            license: { name: "MIT", identifier: "MIT" },
            "x-deprecation-policy": DEPRECATION_POLICY,
        },
        servers: [
            {
                url: SITE_URL,
                description: "Production. Read-only, so it doubles as the sandbox.",
            },
        ],
        security: [],
        tags: [
            {
                name: "actuators",
                description: "Actuator search, detail and comparison.",
            },
            { name: "robots", description: "Robots and the motors in their joints." },
            {
                name: "taxonomy",
                description: "Categories, brands and use cases for filters.",
            },
            { name: "meta", description: "Discovery: index and this document." },
            {
                name: "supply-chain",
                description:
                    "Companies, sites and magnet metals (supply, reserves, prices) along the actuator supply chain, with citations.",
            },
        ],
        externalDocs: { description: "Developer guide", url: absoluteUrl("/docs/api") },
        paths,
        components: {
            schemas: componentSchemas(),
            responses: problemResponses(),
            headers: HEADERS,
            parameters: {
                IdempotencyKey: {
                    name: "Idempotency-Key",
                    in: "header",
                    required: false,
                    description:
                        "Accepted for client compatibility; unnecessary because every operation is read-only and safe to retry.",
                    schema: { type: "string", maxLength: 255 },
                },
            },
            securitySchemes: {},
        },
        "x-authentication": {
            required: false,
            description: "No authentication. All operations are public and read-only.",
        },
        "x-rate-limit": {
            limit: RATE_LIMIT,
            window_seconds: RATE_WINDOW_S,
            scope: "client IP (first X-Forwarded-For hop)",
            headers: [...RATE_HEADERS, "Retry-After"],
        },
        "x-mcp-server": absoluteUrl("/mcp"),
    };
}
