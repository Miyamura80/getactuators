import {
    actuatorPage,
    brandCounts,
    categoryCounts,
    compareQuery,
    findActuator,
    findRobot,
    robotPage,
    useCaseCounts,
} from "@/api/handlers";
import type { ApiContext } from "@/api/http";
import type { Page } from "@/api/pagination";
import { API_OPERATIONS, apiIndexData } from "@/api/surface";
import { absoluteUrl } from "../site";
import { actuatorBody, actuatorTable, robotSection } from "./catalog-md";
import { PATHS } from "./links";
import { bullets, mdLink, mdTable, mdText, num, usd } from "./md";

// Markdown twins of the REST API's GET endpoints (/api.md, /api/v1/*.md, or
// Accept: text/markdown). Each renderer reads the same data function as the
// JSON handler, so filters, validation errors and pagination match exactly.
// Every document opens with its H1 and ends with a pointer to the JSON.

type Renderer = (ctx: ApiContext) => string;

// The markdown twin of an API URL: `.md` on the path, query string kept.
export function apiMarkdownPath(path: string, query = ""): string {
    const q = query && !query.startsWith("?") ? `?${query}` : query;
    return `${path.replace(/\/$/, "")}.md${q}`;
}

function filterSummary(url: URL): string {
    const parts = [...url.searchParams]
        .filter(([k]) => k !== "cursor" && k !== "limit")
        .map(([k, v]) => `${k}=${v}`);
    return parts.length > 0 ? `: ${mdText(parts.join(", "))}` : "";
}

function pageSummary(page: Page<unknown>, url: URL, noun: string): string {
    const { total, has_more, next_cursor } = page.pagination;
    if (page.data.length === 0) return `No ${noun} match this query (total ${total}).`;
    const lines = [`${page.data.length} of ${total} matching ${noun} on this page.`];
    if (has_more && next_cursor) {
        const next = new URLSearchParams(url.searchParams);
        next.set("cursor", next_cursor);
        const q = `?${next.toString()}`;
        lines.push(
            `Next page: ${mdLink("markdown", absoluteUrl(apiMarkdownPath(url.pathname, q)))}, ${mdLink("JSON", absoluteUrl(`${url.pathname}${q}`))}.`,
        );
    }
    return lines.join(" ");
}

function apiIndex(): string {
    const index = apiIndexData();
    // Link the twins that need no input (no path param, no required ids).
    const withTwin = new Set(
        API_OPERATIONS.filter(
            (op) =>
                op.method === "GET" &&
                !op.pathParam &&
                op.operationId !== "compare_actuators" &&
                hasApiMarkdown(op.operationId),
        ).map((op) => op.path),
    );
    const rows = index.endpoints.map((e) => [
        e.method,
        e.method === "GET" && withTwin.has(e.path)
            ? mdLink(e.path, absoluteUrl(apiMarkdownPath(e.path)))
            : mdText(e.path),
        mdText(e.summary),
    ]);
    return [
        `# ${mdText(index.name)} ${index.version}`,
        mdText(index.description),
        bullets([
            `Auth: ${index.auth}`,
            `Developer docs: ${index.docs} (markdown: ${absoluteUrl(PATHS.apiDocsMd)})`,
            `OpenAPI 3.1: ${index.openapi}`,
            `MCP server: ${index.mcp}`,
            "Every GET endpoint has a markdown twin: append .md to the path (query string kept) or send Accept: text/markdown.",
        ]),
        `## Endpoints\n\n${mdTable(["Method", "Path", "Summary"], rows)}`,
    ].join("\n\n");
}

function listActuators(ctx: ApiContext): string {
    const page = actuatorPage(ctx);
    return [
        `# Actuators${filterSummary(ctx.url)}`,
        pageSummary(page, ctx.url, "actuators"),
        page.data.length > 0 ? actuatorTable(page.data) : "",
    ].join("\n\n");
}

function compareActuators(ctx: ApiContext): string {
    const results = compareQuery(ctx);
    const found = results.flatMap((r) => (r.actuator ? [r.actuator] : []));
    const missing = results.filter((r) => !r.actuator).map((r) => mdText(r.id));
    return [
        "# Actuator comparison",
        `${found.length} of ${results.length} requested actuators found, in request order.`,
        found.length > 0 ? actuatorTable(found) : "",
        missing.length > 0 ? `## Not found\n\n${bullets(missing)}` : "",
    ].join("\n\n");
}

function listRobots(ctx: ApiContext): string {
    const page = robotPage(ctx);
    const rows = page.data.map((r) => [
        mdLink(
            r.name,
            absoluteUrl(apiMarkdownPath(`/api/v1/robots/${encodeURIComponent(r.id)}`)),
        ),
        mdText(r.brand),
        num(r.dof),
        num(r.payload_kg, "kg"),
        num(r.weight_kg, "kg", 2),
        usd(r.price_usd),
        String(r.joints.reduce((n, j) => n + j.count, 0)),
    ]);
    return [
        `# Robots${filterSummary(ctx.url)}`,
        pageSummary(page, ctx.url, "robots"),
        rows.length > 0
            ? mdTable(
                  ["Robot", "Brand", "DOF", "Payload", "Weight", "Price", "Joints"],
                  rows,
              )
            : "",
    ].join("\n\n");
}

function listCategories(): string {
    const rows = categoryCounts().map((c) => [
        mdLink(
            c.label,
            absoluteUrl(apiMarkdownPath("/api/v1/actuators", `category=${c.slug}`)),
        ),
        `\`${c.slug}\``,
        String(c.actuator_count),
        mdText(c.description),
    ]);
    return [
        "# Actuator categories",
        "Use a slug as the `category` filter on /api/v1/actuators.",
        mdTable(["Category", "Slug", "Actuators", "Description"], rows),
    ].join("\n\n");
}

function namedCounts(
    title: string,
    filter: string,
    list: { name: string; actuator_count: number }[],
): string {
    const rows = list.map((b) => [
        mdLink(
            b.name,
            absoluteUrl(
                apiMarkdownPath(
                    "/api/v1/actuators",
                    `${filter}=${encodeURIComponent(b.name)}`,
                ),
            ),
        ),
        String(b.actuator_count),
    ]);
    return [
        `# ${title}`,
        `Use a name as the \`${filter}\` filter on /api/v1/actuators.`,
        mdTable(["Name", "Actuators"], rows),
    ].join("\n\n");
}

const RENDERERS: Record<string, Renderer> = {
    get_api_index: apiIndex,
    list_actuators: listActuators,
    compare_actuators: compareActuators,
    get_actuator: (ctx) => actuatorBody(findActuator(ctx)),
    list_robots: listRobots,
    get_robot: (ctx) => robotSection(findRobot(ctx), 1),
    list_categories: listCategories,
    list_brands: () => namedCounts("Actuator brands", "brand", brandCounts()),
    list_use_cases: () => namedCounts("Use-case tags", "use_case", useCaseCounts()),
};

export function hasApiMarkdown(operationId: string): boolean {
    return operationId in RENDERERS;
}

// Markdown for one GET operation, given the context of its JSON URL. Throws
// the same ApiErrors as the JSON handler (404, invalid parameter, cursor).
export function apiMarkdown(operationId: string, ctx: ApiContext): string {
    const render = RENDERERS[operationId];
    if (!render) throw new Error(`no markdown twin for ${operationId}`);
    const jsonUrl = absoluteUrl(`${ctx.url.pathname}${ctx.url.search}`);
    const body = render(ctx)
        .split("\n\n")
        .filter((block) => block.trim() !== "")
        .join("\n\n");
    return `${body}\n\n## JSON\n\nThis is the markdown twin of ${jsonUrl}. Request that URL for the same data as JSON; the schema is in ${absoluteUrl(PATHS.openapi)}.\n`;
}
