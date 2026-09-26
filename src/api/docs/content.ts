import { REPO_URL, SITE_URL, absoluteUrl } from "@/server/site";
import { DEPRECATION_POLICY, openApiPath, queryParameters } from "../openapi";
import type { Operation } from "../operations";
import { ERROR_CODES, type ErrorCode } from "../problem";
import { RATE_LIMIT, RATE_WINDOW_S } from "../rate-limit";
import { API_OPERATIONS } from "../surface";

// The developer guide as structured blocks, rendered to both HTML (/docs/api)
// and Markdown (/docs/api.md). Endpoint sections come from API_OPERATIONS.

export type Block =
    | { kind: "h2" | "h3"; text: string; id: string }
    | { kind: "p"; text: string }
    | { kind: "code"; text: string; lang: string }
    | { kind: "list"; items: string[] }
    | { kind: "table"; head: string[]; rows: string[][]; rowIds?: string[] };

export const DOCS_TITLE = "getactuators API";
export const DOCS_DESCRIPTION =
    "Free, read-only REST API for robot actuator and robot specs: endpoints, curl examples, pagination, errors, rate limits and versioning.";
export const DOCS_UPDATED = "2026-09-26";

const h2 = (text: string, id: string): Block => ({ kind: "h2", text, id });
const p = (text: string): Block => ({ kind: "p", text });
const sh = (text: string): Block => ({ kind: "code", text, lang: "bash" });

export function curlFor(op: Operation): string {
    const url = `${SITE_URL}${op.example}`;
    if (op.method === "GET") return `curl -s "${url}"`;
    return [
        `curl -s -X ${op.method} "${url}" \\`,
        `  -H "Content-Type: application/json" \\`,
        `  -d '${op.exampleBody ?? "{}"}'`,
    ].join("\n");
}

function operationBlocks(op: Operation): Block[] {
    const blocks: Block[] = [
        { kind: "h3", text: `${op.method} ${openApiPath(op.path)}`, id: op.operationId },
        p(`**${op.summary}.** ${op.description} Operation id: \`${op.operationId}\`.`),
    ];
    const rows: string[][] = [];
    if (op.pathParam) {
        rows.push([`\`${op.pathParam.name}\``, "path, required", op.pathParam.description]);
    }
    for (const q of op.query ? queryParameters(op.query) : []) {
        const where = q.required ? "query, required" : "query";
        rows.push([`\`${String(q.name)}\``, where, String(q.description ?? "")]);
    }
    if (rows.length) blocks.push({ kind: "table", head: ["Parameter", "In", "Description"], rows });
    blocks.push(sh(curlFor(op)));
    return blocks;
}

const ERROR_HINTS: Record<ErrorCode, string> = {
    invalid_parameter: "A query parameter has the wrong type or value; see `errors[]`.",
    invalid_cursor: "The cursor is malformed or was issued for other filters.",
    invalid_json: "The POST body is not JSON.",
    not_found: "No actuator or robot with that id.",
    unknown_endpoint: "The path is not part of the API.",
    method_not_allowed: "Wrong HTTP method; the `Allow` header lists valid ones.",
    unsupported_media_type: "POST bodies must be `application/json`.",
    validation_failed: "The JSON body does not match the schema; see `errors[]`.",
    rate_limited: "Slow down and retry after `Retry-After` seconds.",
    internal_error: "Server bug; retry, then report it on GitHub.",
};

const PROBLEM_EXAMPLE = JSON.stringify(
    {
        type: absoluteUrl("/docs/api#error-not-found"),
        title: "Resource not found",
        status: 404,
        detail: 'No actuator with id "nope".',
        code: "not_found",
        hint: "Ids are slugs; list valid ones with GET /api/v1/actuators?q=<search>.",
        instance: "/api/v1/actuators/nope",
        docs: absoluteUrl("/docs/api#errors"),
    },
    null,
    2,
);

export function docsBlocks(): Block[] {
    const codes = Object.keys(ERROR_CODES) as ErrorCode[];
    return [
        p(
            `A free, public, **read-only** REST API over every actuator and robot on [getactuators](${SITE_URL}/). JSON in, JSON out, no key required. The same data is available to AI agents over [MCP](${absoluteUrl("/mcp")}).`,
        ),
        h2("Quickstart", "quickstart"),
        sh(`curl -s "${SITE_URL}/api/v1/actuators?q=humanoid&limit=3"`),
        h2("Authentication", "authentication"),
        p("None. Every endpoint is anonymous: no API key, no OAuth, no account. Just call it."),
        h2("Base URL", "base-url"),
        p(`\`${SITE_URL}\`. All paths below are relative to it. CORS is open (\`Access-Control-Allow-Origin: *\`), so browsers can call it directly.`),
        h2("Sandbox and safety", "sandbox"),
        p("The API is read-only: no endpoint creates, changes or deletes anything, so production doubles as the sandbox and any call is safe to retry. `POST /api/v1/actuators/compare` accepts an `Idempotency-Key` header for client compatibility, but it is never needed."),
        h2("Endpoints", "endpoints"),
        {
            kind: "table",
            head: ["Method", "Path", "Summary"],
            rows: API_OPERATIONS.map((op) => [op.method, `\`${openApiPath(op.path)}\``, `[${op.summary}](#${op.operationId})`]),
        },
        ...API_OPERATIONS.flatMap(operationBlocks),
        h2("Pagination", "pagination"),
        p("List endpoints are cursor-paginated. Pass `limit` (1 to 100, default 25). Each response has `pagination: { next_cursor, has_more, total }`; repeat the same query with `cursor=<next_cursor>` until `has_more` is `false`. Cursors are opaque and tied to the filters they were issued for."),
        sh(`curl -s "${SITE_URL}/api/v1/actuators?limit=25&cursor=<next_cursor>"`),
        h2("Errors", "errors"),
        p("Every error is [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457) `application/problem+json` with a stable `code`, a `hint` on how to fix the request and, for validation errors, a per-field `errors` array. Unknown `/api/*` paths return a JSON 404, never an HTML page."),
        { kind: "code", text: PROBLEM_EXAMPLE, lang: "json" },
        {
            kind: "table",
            head: ["Code", "Status", "Meaning"],
            rows: codes.map((c) => [`\`${c}\``, String(ERROR_CODES[c].status), ERROR_HINTS[c]]),
            rowIds: codes.map((c) => `error-${c.replaceAll("_", "-")}`),
        },
        h2("Rate limits", "rate-limits"),
        p(`${RATE_LIMIT} requests per ${RATE_WINDOW_S} seconds per client IP. Every response reports the budget in the IETF \`RateLimit\` and \`RateLimit-Policy\` headers and in \`X-RateLimit-Limit\`, \`X-RateLimit-Remaining\` and \`X-RateLimit-Reset\` (seconds). Past the limit you get a 429 problem with \`Retry-After\`. Responses are cacheable for 5 minutes (\`Cache-Control: public, max-age=300\`).`),
        h2("Versioning and deprecation", "versioning"),
        p(`The major version is in the path (\`/api/v1\`) and echoed in the \`API-Version\` response header. ${DEPRECATION_POLICY}`),
        h2("Machine-readable resources", "resources"),
        {
            kind: "list",
            items: [
                `[OpenAPI 3.1 document](${absoluteUrl("/openapi.json")}) (also at \`/api/openapi.json\`); every operation has a snake_case \`operationId\` usable as a function-calling tool name.`,
                `[API index](${absoluteUrl("/api")}): JSON list of endpoints.`,
                `[MCP server](${absoluteUrl("/mcp")}): the same catalog as MCP tools, no auth.`,
                `[llms.txt](${absoluteUrl("/llms.txt")}): site overview for language models.`,
                `[This page as Markdown](${absoluteUrl("/docs/api.md")}).`,
                `[Source and issues on GitHub](${REPO_URL}).`,
            ],
        },
    ];
}
