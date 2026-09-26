import { ACTUATORS, CATEGORIES, ROBOTS, getActuator, getRobot } from "@/catalog";
import { listBrands, listUseCases, queryActuators } from "@/catalog/query";
import { type ApiContext, json } from "./http";
import { paginate } from "./pagination";
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

export function listActuators({ url }: ApiContext): Response {
    const { limit, cursor, ...filters } = parseQuery(ActuatorListParams, url);
    const page = paginate(queryActuators(filters), limit, cursor, filters);
    return json({ ...page, data: page.data.map(serializeActuator) });
}

function notFound(kind: string, id: string, listPath: string): ApiError {
    return new ApiError("not_found", {
        detail: `No ${kind} with id "${id}".`,
        hint: `Ids are slugs; list valid ones with GET ${listPath}?q=<search>.`,
    });
}

export function getActuatorById({ params }: ApiContext): Response {
    const id = params.id ?? "";
    const a = getActuator(id);
    if (!a) throw notFound("actuator", id, "/api/v1/actuators");
    return json(serializeActuatorDetail(a));
}

function compareIds(ids: string[]): Response {
    const data = ids.map((id) => {
        const a = getActuator(id);
        return { id, found: Boolean(a), actuator: a ? serializeActuator(a) : null };
    });
    return json({ data, not_found: data.filter((d) => !d.found).map((d) => d.id) });
}

export function compareActuatorsGet({ url }: ApiContext): Response {
    const { ids } = parseQuery(CompareQueryParams, url);
    const list = ids
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    try {
        return compareIds(parseCompareIds({ ids: list }));
    } catch (err) {
        if (!(err instanceof ApiError)) throw err;
        throw new ApiError("invalid_parameter", {
            ...err.init,
            hint: `Pass ?ids=a,b,c with 1 to ${MAX_COMPARE_IDS} ids.`,
        });
    }
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
    return compareIds(parseCompareIds(body));
}

export function listRobots({ url }: ApiContext): Response {
    const { limit, cursor, ...filters } = parseQuery(RobotListParams, url);
    const q = filters.q?.toLowerCase().split(/\s+/).filter(Boolean) ?? [];
    const brand = filters.brand?.toLowerCase();
    const items = ROBOTS.filter((r) => {
        if (brand && r.brand.toLowerCase() !== brand) return false;
        const hay = [r.id, r.name, r.brand, r.summary].join(" ").toLowerCase();
        return q.every((t) => hay.includes(t));
    }).sort((a, b) => a.id.localeCompare(b.id));
    const page = paginate(items, limit, cursor, filters);
    return json({ ...page, data: page.data.map(serializeRobot) });
}

export function getRobotById({ params }: ApiContext): Response {
    const id = params.id ?? "";
    const r = getRobot(id);
    if (!r) throw notFound("robot", id, "/api/v1/robots");
    return json(serializeRobotDetail(r));
}

function countBy(key: (a: (typeof ACTUATORS)[number]) => string[]) {
    const counts = new Map<string, number>();
    for (const a of ACTUATORS)
        for (const k of key(a)) counts.set(k, (counts.get(k) ?? 0) + 1);
    return counts;
}

export function listCategories(): Response {
    const counts = countBy((a) => [a.category]);
    return json({
        data: CATEGORIES.map((c) => ({
            ...c,
            actuator_count: counts.get(c.slug) ?? 0,
        })),
    });
}

export function listBrandsHandler(): Response {
    const counts = countBy((a) => [a.brand]);
    return json({
        data: listBrands().map((name) => ({
            name,
            actuator_count: counts.get(name) ?? 0,
        })),
    });
}

export function listUseCasesHandler(): Response {
    const counts = countBy((a) => a.use_cases);
    return json({
        data: listUseCases().map((name) => ({
            name,
            actuator_count: counts.get(name) ?? 0,
        })),
    });
}
