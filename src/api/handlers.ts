import {
    ACTUATORS,
    type Actuator,
    CATEGORIES,
    ROBOTS,
    type Robot,
    getActuator,
    getRobot,
} from "@/catalog";
import { listBrands, listUseCases, queryActuators } from "@/catalog/query";
import { type ApiContext, json } from "./http";
import { type Page, paginate } from "./pagination";
import {
    ActuatorListParams,
    CompareQueryParams,
    MAX_COMPARE_IDS,
    RobotListParams,
    parseCompareIds,
    parseQuery,
} from "./params";
import { ApiError } from "./problem";
import {
    serializeActuator,
    serializeActuatorDetail,
    serializeRobot,
    serializeRobotDetail,
} from "./serialize";

// Each GET operation is a data function (validated params, catalog records,
// pagination) plus a thin JSON handler. The markdown twins of the API
// (src/server/agent/api-md.ts) render the same data functions, so the two
// representations never disagree.

export function actuatorPage({ url }: ApiContext): Page<Actuator> {
    const { limit, cursor, ...filters } = parseQuery(ActuatorListParams, url);
    return paginate(queryActuators(filters), limit, cursor, filters);
}

export function listActuators(ctx: ApiContext): Response {
    const page = actuatorPage(ctx);
    return json({ ...page, data: page.data.map(serializeActuator) });
}

function notFound(kind: string, id: string, listPath: string): ApiError {
    return new ApiError("not_found", {
        detail: `No ${kind} with id "${id}".`,
        hint: `Ids are slugs; list valid ones with GET ${listPath}?q=<search>.`,
    });
}

export function findActuator({ params }: ApiContext): Actuator {
    const id = params.id ?? "";
    const a = getActuator(id);
    if (!a) throw notFound("actuator", id, "/api/v1/actuators");
    return a;
}

export function getActuatorById(ctx: ApiContext): Response {
    return json(serializeActuatorDetail(findActuator(ctx)));
}

interface CompareLookup {
    id: string;
    actuator: Actuator | undefined;
}

function lookup(ids: string[]): CompareLookup[] {
    return ids.map((id) => ({ id, actuator: getActuator(id) }));
}

function compareJson(found: CompareLookup[]): Response {
    const data = found.map(({ id, actuator }) => ({
        id,
        found: Boolean(actuator),
        actuator: actuator ? serializeActuator(actuator) : null,
    }));
    return json({ data, not_found: data.filter((d) => !d.found).map((d) => d.id) });
}

export function compareQuery({ url }: ApiContext): CompareLookup[] {
    const { ids } = parseQuery(CompareQueryParams, url);
    const list = ids
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    try {
        return lookup(parseCompareIds({ ids: list }));
    } catch (err) {
        if (!(err instanceof ApiError)) throw err;
        throw new ApiError("invalid_parameter", {
            ...err.init,
            hint: `Pass ?ids=a,b,c with 1 to ${MAX_COMPARE_IDS} ids.`,
        });
    }
}

export function compareActuatorsGet(ctx: ApiContext): Response {
    return compareJson(compareQuery(ctx));
}

export async function compareActuatorsPost({ req }: ApiContext): Promise<Response> {
    const type = req.headers.get("content-type") ?? "";
    if (!type.includes("application/json")) {
        throw new ApiError("unsupported_media_type", {
            detail: "The request body must be application/json.",
            hint: 'Set Content-Type: application/json and send {"ids": [...]}.',
        });
    }
    let body: unknown;
    try {
        body = await req.json();
    } catch {
        throw new ApiError("invalid_json", {
            detail: "The request body could not be parsed as JSON.",
            hint: 'Send a JSON object such as {"ids": ["robstride-02"]}.',
        });
    }
    return compareJson(lookup(parseCompareIds(body)));
}

export function robotPage({ url }: ApiContext): Page<Robot> {
    const { limit, cursor, ...filters } = parseQuery(RobotListParams, url);
    const q = filters.q?.toLowerCase().split(/\s+/).filter(Boolean) ?? [];
    const brand = filters.brand?.toLowerCase();
    const items = ROBOTS.filter((r) => {
        if (brand && r.brand.toLowerCase() !== brand) return false;
        const hay = [r.id, r.name, r.brand, r.summary].join(" ").toLowerCase();
        return q.every((t) => hay.includes(t));
    }).sort((a, b) => a.id.localeCompare(b.id));
    return paginate(items, limit, cursor, filters);
}

export function listRobots(ctx: ApiContext): Response {
    const page = robotPage(ctx);
    return json({ ...page, data: page.data.map(serializeRobot) });
}

export function findRobot({ params }: ApiContext): Robot {
    const id = params.id ?? "";
    const r = getRobot(id);
    if (!r) throw notFound("robot", id, "/api/v1/robots");
    return r;
}

export function getRobotById(ctx: ApiContext): Response {
    return json(serializeRobotDetail(findRobot(ctx)));
}

function countBy(key: (a: (typeof ACTUATORS)[number]) => string[]) {
    const counts = new Map<string, number>();
    for (const a of ACTUATORS)
        for (const k of key(a)) counts.set(k, (counts.get(k) ?? 0) + 1);
    return counts;
}

export function categoryCounts() {
    const counts = countBy((a) => [a.category]);
    return CATEGORIES.map((c) => ({ ...c, actuator_count: counts.get(c.slug) ?? 0 }));
}

export function listCategories(): Response {
    return json({ data: categoryCounts() });
}

interface NamedCount {
    name: string;
    actuator_count: number;
}

export function brandCounts(): NamedCount[] {
    const counts = countBy((a) => [a.brand]);
    return listBrands().map((name) => ({
        name,
        actuator_count: counts.get(name) ?? 0,
    }));
}

export function listBrandsHandler(): Response {
    return json({ data: brandCounts() });
}

export function useCaseCounts(): NamedCount[] {
    const counts = countBy((a) => a.use_cases);
    return listUseCases().map((name) => ({
        name,
        actuator_count: counts.get(name) ?? 0,
    }));
}

export function listUseCasesHandler(): Response {
    return json({ data: useCaseCounts() });
}
