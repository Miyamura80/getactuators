import { ACTUATORS, ROBOTS, ROBOT_MOTORS } from "./index";
import type { Actuator, CategorySlug, Robot, RobotMotor } from "./types";

// Shared filtering/sorting used by the REST API and MCP tools so both
// surfaces answer the same question the same way.

export const SORTABLE_FIELDS = [
    "peak_torque_nm",
    "rated_torque_nm",
    "max_speed_rpm",
    "weight_g",
    "torque_density_nm_per_kg",
    "price_usd",
    "price_per_nm",
    "backlash_arcmin",
    "name",
] as const;

export type SortField = (typeof SORTABLE_FIELDS)[number];

export interface ActuatorQuery {
    q?: string;
    category?: CategorySlug;
    brand?: string;
    use_case?: string;
    min_peak_torque_nm?: number;
    max_weight_g?: number;
    max_price_usd?: number;
    backdrivable?: boolean;
    integrated_driver?: boolean;
    sort?: SortField;
    order?: "asc" | "desc";
}

function matchesText(a: Actuator, q: string): boolean {
    const hay = [a.id, a.name, a.brand, a.category, ...a.use_cases, a.notes ?? ""]
        .join(" ")
        .toLowerCase();
    return q
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .every((term) => hay.includes(term));
}

function atMost(value: number | null, max: number | undefined): boolean {
    return max === undefined || (value !== null && value <= max);
}

function atLeast(value: number | null, min: number | undefined): boolean {
    return min === undefined || (value !== null && value >= min);
}

function matches(a: Actuator, f: ActuatorQuery): boolean {
    if (f.q && !matchesText(a, f.q)) return false;
    if (f.category && a.category !== f.category) return false;
    if (f.brand && a.brand.toLowerCase() !== f.brand.toLowerCase()) return false;
    if (f.use_case && !a.use_cases.includes(f.use_case)) return false;
    if (f.backdrivable !== undefined && a.backdrivable !== f.backdrivable) return false;
    if (
        f.integrated_driver !== undefined &&
        a.integrated_driver !== f.integrated_driver
    )
        return false;
    return (
        atLeast(a.peak_torque_nm, f.min_peak_torque_nm) &&
        atMost(a.weight_g, f.max_weight_g) &&
        atMost(a.price_usd, f.max_price_usd)
    );
}

function compare(a: Actuator, b: Actuator, field: SortField, dir: number): number {
    if (field === "name") return a.name.localeCompare(b.name) * dir;
    const av = a[field];
    const bv = b[field];
    // Unknown values always sort last, whatever the direction.
    if (av === null && bv === null) return a.id.localeCompare(b.id);
    if (av === null) return 1;
    if (bv === null) return -1;
    return (av - bv) * dir || a.id.localeCompare(b.id);
}

// Deterministic: ties and the default order fall back to id, which keeps
// cursor pagination stable.
export function queryActuators(f: ActuatorQuery = {}): Actuator[] {
    const out = ACTUATORS.filter((a) => matches(a, f));
    const field = f.sort;
    if (!field) return out.sort((a, b) => a.id.localeCompare(b.id));
    const dir = f.order === "asc" ? 1 : -1;
    return out.sort((a, b) => compare(a, b, field, dir));
}

export function listBrands(): string[] {
    return [...new Set(ACTUATORS.map((a) => a.brand))].sort();
}

export function listUseCases(): string[] {
    return [...new Set(ACTUATORS.flatMap((a) => a.use_cases))].sort();
}

export interface ResolvedJoint {
    role: string;
    count: number;
    motor: RobotMotor;
}

// Join a robot's joints to the motor table, dropping unknown motor keys.
export function resolveJoints(robot: Robot): ResolvedJoint[] {
    const out: ResolvedJoint[] = [];
    for (const j of robot.joints) {
        const motor = ROBOT_MOTORS[j.motor];
        if (motor) out.push({ role: j.role, count: j.count, motor });
    }
    return out;
}

// Robots whose joints use this actuator (via RobotMotor.actuator_id).
export function robotsUsingActuator(actuatorId: string): Robot[] {
    return ROBOTS.filter((r) =>
        resolveJoints(r).some((j) => j.motor.actuator_id === actuatorId),
    );
}
