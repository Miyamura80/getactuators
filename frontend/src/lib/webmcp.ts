// WebMCP: expose read-only catalog tools to in-browser AI agents.
//
// WebMCP lets a page declare callable tools so an agent driving the browser
// calls structured functions instead of scraping the DOM. Chrome ships it as
// `document.modelContext.registerTool(tool, { signal })` (origin trial, Chrome
// 149 to 156); `navigator.modelContext` was the earlier home and is deprecated
// from Chromium 150, so it is only a trailing fallback here. Browsers without
// either get nothing: registration is feature-detected and never touches the UI.
//
// Every tool answers from the in-bundle dataset (the same JSON the pages
// render), so there is no network call and nothing to keep in sync.

import type { Actuator, CategorySlug } from "../types";
import { CATEGORIES } from "../types";
import { AGENT_CLIENTS, MCP_URL, SERVER_NAME, findClient } from "./agent-clients";
import { COLUMN_MAP } from "./columns";
import { ACTUATORS } from "./data";
import { DEFAULT_FILTERS, applyFilters } from "./filter";
import { navigate } from "./router";
import { ROBOTS, motorCount, resolveJoints } from "./robots";
import { type Arm, MAX_LINKS, MIN_LINKS, armReport, validArm } from "../../../src/engineering/arm-torque";
import { JOINTS, humanoidJointRequirements } from "../../../src/server/agent/humanoid-joints";

type Args = Record<string, unknown>;

interface ToolResult {
    content: { type: "text"; text: string }[];
    structuredContent?: unknown;
    isError?: boolean;
}

export interface WebMcpTool {
    name: string;
    title?: string;
    description: string;
    inputSchema: Record<string, unknown>;
    annotations?: { readOnlyHint?: boolean };
    execute: (args: Args) => Promise<ToolResult>;
}

interface ModelContext {
    registerTool?: (tool: WebMcpTool, options?: { signal?: AbortSignal }) => unknown;
    provideContext?: (init: { tools: WebMcpTool[] }) => unknown;
}

const SITE = "https://actuatorlist.com";
const MAX_LIMIT = 50;

export function result(data: unknown, isError = false): ToolResult {
    return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        structuredContent: data,
        ...(isError ? { isError } : {}),
    };
}

function str(v: unknown): string {
    return typeof v === "string" ? v.trim() : "";
}

function numOrNull(v: unknown): number | null {
    return typeof v === "number" && Number.isFinite(v) ? v : null;
}

// Compact record for list results; get_actuator returns the full row.
function summarize(a: Actuator) {
    return {
        id: a.id,
        name: a.name,
        brand: a.brand,
        category: a.category,
        peak_torque_nm: a.peak_torque_nm,
        rated_torque_nm: a.rated_torque_nm,
        weight_g: a.weight_g,
        torque_density_nm_per_kg: a.torque_density_nm_per_kg,
        price_usd: a.price_usd,
        url: `${SITE}/actuators/${encodeURIComponent(a.id)}`,
    };
}

export interface SearchArgs {
    query?: string;
    category?: string;
    min_peak_torque_nm?: number;
    max_weight_g?: number;
    max_price_usd?: number;
    sort_by?: string;
    sort_dir?: "asc" | "desc";
    limit?: number;
}

// Filter + sort through the same helper the /actuators list view uses, so an agent sees
// the order a visitor would. Numeric bounds drop rows with unknown values.
export function searchActuators(args: SearchArgs) {
    const category = CATEGORIES.some((c) => c.slug === args.category)
        ? (args.category as CategorySlug)
        : null;
    const sortKey =
        args.sort_by && COLUMN_MAP[args.sort_by] ? args.sort_by : DEFAULT_FILTERS.sortKey;
    const rows = applyFilters(ACTUATORS, {
        search: str(args.query),
        categories: new Set(category ? [category] : []),
        useCases: new Set(),
        countries: new Set(),
        sortKey,
        sortDir: args.sort_dir === "asc" ? "asc" : "desc",
    }).filter((a) => {
        const minT = numOrNull(args.min_peak_torque_nm);
        const maxW = numOrNull(args.max_weight_g);
        const maxP = numOrNull(args.max_price_usd);
        if (minT != null && !(a.peak_torque_nm != null && a.peak_torque_nm >= minT))
            return false;
        if (maxW != null && !(a.weight_g != null && a.weight_g <= maxW)) return false;
        if (maxP != null && !(a.price_usd != null && a.price_usd <= maxP)) return false;
        return true;
    });
    const limit = Math.min(Math.max(Math.floor(numOrNull(args.limit) ?? 10), 1), MAX_LIMIT);
    return { total: rows.length, results: rows.slice(0, limit).map(summarize) };
}

export function getActuator(id: string): Actuator | null {
    return ACTUATORS.find((a) => a.id === id) ?? null;
}

export function compareActuators(ids: string[]) {
    const found = ids.map(getActuator).filter((a): a is Actuator => a != null);
    const missing = ids.filter((id) => !getActuator(id));
    return { actuators: found, missing };
}

export function listRobots(query?: string) {
    const terms = str(query).toLowerCase().split(/\s+/).filter(Boolean);
    return ROBOTS.filter((r) => {
        const hay = `${r.name} ${r.brand} ${r.summary}`.toLowerCase();
        return terms.every((t) => hay.includes(t));
    }).map((r) => ({
        id: r.id,
        name: r.name,
        brand: r.brand,
        dof: r.dof,
        actuator_count: motorCount(r),
        joints: resolveJoints(r).map((j) => ({
            role: j.role,
            count: j.count,
            motor: j.motor.name,
            actuator_id: j.motor.actuator_id,
        })),
        url: `${SITE}/robots#${encodeURIComponent(r.id)}`,
    }));
}

// Arm model from untyped tool arguments, or an error message for the agent.
export function armFromArgs(args: Args): Arm | string {
    const links = Array.isArray(args.links) ? args.links : [];
    if (links.length < MIN_LINKS || links.length > MAX_LINKS) return `links: ${MIN_LINKS} to ${MAX_LINKS} items`;
    const arm: Arm = {
        payload: numOrNull(args.payload_kg) ?? 0,
        comFraction: numOrNull(args.com_fraction) ?? 0.5,
        links: links.map((raw, i) => {
            const l = (raw ?? {}) as Args;
            return {
                length: numOrNull(l.length_m) ?? 0,
                mass: numOrNull(l.mass_kg) ?? 0,
                actuatorMass: i === links.length - 1 ? 0 : (numOrNull(l.actuator_mass_kg) ?? 0),
            };
        }),
    };
    return validArm(arm) ? arm : "Lengths must be above 0, masses 0 or more, com_fraction 0 to 1";
}

// Shortlist rows carry site paths; tool results give absolute URLs.
function absoluteRows<T extends { page_path: string }>(rows: T[]) {
    return rows.map(({ page_path, ...c }) => ({ ...c, page_url: `${SITE}${page_path}` }));
}

// armReport with absolute URLs, as every other tool result here returns.
export function armResult(arm: Arm) {
    const report = armReport(arm);
    return {
        assumptions: report.assumptions,
        joints: report.joints.map((j) => ({
            ...j,
            shortlist: absoluteRows(j.shortlist),
        })),
        calculator_url: `${SITE}${report.calculator_path}`,
    };
}

export const ARM_INPUT_SCHEMA = {
    type: "object",
    properties: {
        links: {
            type: "array",
            minItems: MIN_LINKS,
            maxItems: MAX_LINKS,
            description: "From the base outward",
            items: {
                type: "object",
                properties: {
                    length_m: { type: "number", exclusiveMinimum: 0 },
                    mass_kg: { type: "number", minimum: 0 },
                    actuator_mass_kg: {
                        type: "number",
                        minimum: 0,
                        description: "Actuator at this link's far end; ignored on the last link",
                    },
                },
                required: ["length_m", "mass_kg"],
            },
        },
        payload_kg: { type: "number", minimum: 0, description: "Payload plus gripper at the tip" },
        com_fraction: { type: "number", minimum: 0, maximum: 1, description: "Link mass position, default 0.5" },
    },
    required: ["links", "payload_kg"],
};

const CATEGORY_ENUM = CATEGORIES.map((c) => c.slug);
const ID_SCHEMA = { type: "string", description: "Actuator id, as returned by search_actuators" };

export function buildTools(): WebMcpTool[] {
    return [
        {
            name: "search_actuators",
            title: "Search actuators",
            description:
                "Search the actuatorlist catalog of robot actuators. Filter by free text, category, minimum peak torque, maximum weight or price; sort by a spec. Returns compact rows with ids.",
            annotations: { readOnlyHint: true },
            inputSchema: {
                type: "object",
                properties: {
                    query: { type: "string", description: "Words matched against name, brand, notes" },
                    category: { type: "string", enum: CATEGORY_ENUM },
                    min_peak_torque_nm: { type: "number" },
                    max_weight_g: { type: "number" },
                    max_price_usd: { type: "number" },
                    sort_by: {
                        type: "string",
                        enum: Object.keys(COLUMN_MAP),
                        description: "Defaults to torque_density_nm_per_kg",
                    },
                    sort_dir: { type: "string", enum: ["asc", "desc"] },
                    limit: { type: "integer", minimum: 1, maximum: MAX_LIMIT },
                },
            },
            async execute(args) {
                return result(searchActuators(args as SearchArgs));
            },
        },
        {
            name: "get_actuator",
            title: "Get actuator",
            description: "Full spec sheet for one actuator, including source links.",
            annotations: { readOnlyHint: true },
            inputSchema: { type: "object", properties: { id: ID_SCHEMA }, required: ["id"] },
            async execute(args) {
                const a = getActuator(str(args.id));
                return a ? result(a) : result({ error: `No actuator with id "${str(args.id)}"` }, true);
            },
        },
        {
            name: "compare_actuators",
            title: "Compare actuators",
            description: "Full specs for 2 to 10 actuators side by side.",
            annotations: { readOnlyHint: true },
            inputSchema: {
                type: "object",
                properties: {
                    ids: { type: "array", items: ID_SCHEMA, minItems: 2, maxItems: 10 },
                },
                required: ["ids"],
            },
            async execute(args) {
                const ids = Array.isArray(args.ids) ? args.ids.map(str).slice(0, 10) : [];
                return result(compareActuators(ids));
            },
        },
        {
            name: "list_robots",
            title: "List robots",
            description:
                "Robots in the catalog with the actuator behind each joint. Optional text filter.",
            annotations: { readOnlyHint: true },
            inputSchema: {
                type: "object",
                properties: { query: { type: "string" } },
            },
            async execute(args) {
                return result({ robots: listRobots(str(args.query)) });
            },
        },
        {
            name: "open_actuator_page",
            title: "Open actuator page",
            description: "Navigate this tab to an actuator's detail page so the user can see it.",
            annotations: { readOnlyHint: true },
            inputSchema: { type: "object", properties: { id: ID_SCHEMA }, required: ["id"] },
            async execute(args) {
                const a = getActuator(str(args.id));
                if (!a) return result({ error: `No actuator with id "${str(args.id)}"` }, true);
                navigate(`/actuators/${encodeURIComponent(a.id)}`);
                return result({ opened: `${SITE}/actuators/${encodeURIComponent(a.id)}` });
            },
        },
        {
            name: "calculate_arm_holding_torque",
            title: "Robot arm holding torque",
            description:
                "Static holding moment (N·m) at each pitch joint of a 2 to 4 link arm held horizontal, from link lengths, masses, actuator masses and payload, with catalog actuators per joint and a calculator URL. Gravity only.",
            annotations: { readOnlyHint: true },
            inputSchema: ARM_INPUT_SCHEMA,
            async execute(args) {
                const arm = armFromArgs(args);
                return typeof arm === "string" ? result({ error: arm }, true) : result(armResult(arm));
            },
        },
        {
            name: "get_humanoid_joint_requirements",
            title: "Humanoid joint requirements",
            description:
                "Static torque estimate (N·m) per humanoid joint for a stated hypothetical 50 kg robot, with pose, arithmetic and catalog actuators that reach it (rated fits before peak-only). Omit joint for all seven.",
            annotations: { readOnlyHint: true },
            inputSchema: {
                type: "object",
                properties: { joint: { type: "string", enum: JOINTS.map((j) => j.id) } },
            },
            async execute(args) {
                const id = str(args.joint);
                if (id && !JOINTS.some((j) => j.id === id)) {
                    return result({ error: `Unknown joint "${id}"`, joints: JOINTS.map((j) => j.id) }, true);
                }
                const data = humanoidJointRequirements(id || undefined);
                return result({
                    ...data,
                    joints: data.joints.map(({ section_path, shortlist, ...j }) => ({
                        ...j,
                        section_url: `${SITE}${section_path}`,
                        shortlist: absoluteRows(shortlist),
                    })),
                    guide_url: `${SITE}${data.guide_path}`,
                });
            },
        },
        {
            name: "get_mcp_install",
            title: "Get MCP install instructions",
            description:
                "How to add the actuatorlist MCP server (anonymous, streamable HTTP) to an AI client: a deep link or the command/config to use.",
            annotations: { readOnlyHint: true },
            inputSchema: {
                type: "object",
                properties: {
                    client: { type: "string", enum: AGENT_CLIENTS.map((c) => c.id) },
                },
            },
            async execute(args) {
                const c = findClient(str(args.client));
                const base = { server_name: SERVER_NAME, mcp_url: MCP_URL, auth: "none" };
                if (!c) return result({ ...base, clients: AGENT_CLIENTS.map((x) => x.id) });
                return result({
                    ...base,
                    client: c.id,
                    effort: c.effort,
                    install_url: c.installUrl,
                    snippet: c.snippet,
                    steps: c.steps,
                    note: c.note,
                });
            },
        },
    ];
}

function getModelContext(): ModelContext | null {
    const doc = (document as unknown as { modelContext?: ModelContext }).modelContext;
    const nav = (navigator as unknown as { modelContext?: ModelContext }).modelContext;
    return doc ?? nav ?? null;
}

// Tools that only make sense while one page is mounted (they drive its UI).
// Returns a cleanup that unregisters them; needs registerTool's AbortSignal.
export function registerPageTools(tools: WebMcpTool[]): () => void {
    const mc = typeof document === "undefined" ? null : getModelContext();
    if (!mc || typeof mc.registerTool !== "function") return () => {};
    const controller = new AbortController();
    try {
        for (const t of tools) mc.registerTool(t, { signal: controller.signal });
    } catch {
        // Same policy as registerWebMcp: never break the page.
    }
    return () => controller.abort();
}

let registered = false;

// Called once from main.tsx. Returns true when tools were handed to a browser.
export function registerWebMcp(): boolean {
    if (registered || typeof document === "undefined") return false;
    const mc = getModelContext();
    if (!mc) return false;
    const tools = buildTools();
    try {
        if (typeof mc.registerTool === "function") {
            for (const t of tools) mc.registerTool(t);
        } else if (typeof mc.provideContext === "function") {
            mc.provideContext({ tools });
        } else {
            return false;
        }
    } catch {
        // An experimental API that rejects a tool (duplicate name, schema
        // change between trial builds) must never break the page.
        return false;
    }
    registered = true;
    return true;
}
