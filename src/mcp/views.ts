import { ACTUATORS, ROBOTS, getActuator, getRobot } from "@/catalog";
import type { Actuator, Robot } from "@/catalog";
import { resolveJoints } from "@/catalog/query";
import { absoluteUrl } from "@/server/site";
import { ToolInputError } from "./tool";

// Projections from catalog records to the shapes MCP tools return.

export function actuatorPageUrl(id: string): string {
    return absoluteUrl(`/actuators/${encodeURIComponent(id)}`);
}

export function actuatorSummary(a: Actuator) {
    return {
        id: a.id,
        name: a.name,
        brand: a.brand,
        category: a.category,
        use_cases: a.use_cases,
        peak_torque_nm: a.peak_torque_nm,
        rated_torque_nm: a.rated_torque_nm,
        max_speed_rpm: a.max_speed_rpm,
        weight_g: a.weight_g,
        torque_density_nm_per_kg: a.torque_density_nm_per_kg,
        price_usd: a.price_usd,
        price_per_nm: a.price_per_nm,
        gear_ratio: a.gear_ratio,
        backlash_arcmin: a.backlash_arcmin,
        backdrivable: a.backdrivable,
        integrated_driver: a.integrated_driver,
        verified: a.verified,
        page_url: actuatorPageUrl(a.id),
    };
}

export function actuatorFull(a: Actuator) {
    return { ...a, page_url: actuatorPageUrl(a.id) };
}

export function robotActuatorIds(r: Robot): string[] {
    const ids = resolveJoints(r)
        .map((j) => j.motor.actuator_id)
        .filter((id): id is string => id !== null);
    return [...new Set(ids)];
}

export function robotSummary(r: Robot) {
    return {
        id: r.id,
        name: r.name,
        brand: r.brand,
        country: r.country,
        dof: r.dof,
        payload_kg: r.payload_kg,
        reach_mm: r.reach_mm,
        weight_kg: r.weight_kg,
        price_usd: r.price_usd,
        price_max_usd: r.price_max_usd,
        product_url: r.product_url,
        summary: r.summary,
        actuator_ids: robotActuatorIds(r),
    };
}

// Closest ids for an unknown one, so the error tells the model what to try.
function suggest(id: string, ids: readonly string[]): string[] {
    const terms = id
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(Boolean);
    return ids.filter((x) => terms.some((t) => x.includes(t))).slice(0, 5);
}

function notFound(kind: string, id: string, ids: readonly string[], tool: string) {
    const close = suggest(id, ids);
    const hint = close.length ? ` Close matches: ${close.join(", ")}.` : "";
    return new ToolInputError(
        `No ${kind} with id '${id}'.${hint} Use ${tool} to find valid ids.`,
    );
}

export function requireActuator(id: string): Actuator {
    const a = getActuator(id);
    if (!a) {
        throw notFound(
            "actuator",
            id,
            ACTUATORS.map((x) => x.id),
            "search_actuators",
        );
    }
    return a;
}

export function requireRobot(id: string): Robot {
    const r = getRobot(id);
    if (!r)
        throw notFound(
            "robot",
            id,
            ROBOTS.map((x) => x.id),
            "list_robots",
        );
    return r;
}
