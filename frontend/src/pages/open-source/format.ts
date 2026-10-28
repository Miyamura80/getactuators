import type { OpenRobot } from "../../../../src/open-source";

export function money(value: number, unit = "USD"): string {
    const digits = Number.isInteger(value) ? 0 : 2;
    const n = value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
    return unit === "USD" ? `$${n}` : `${n} ${unit}`;
}

export function costLabel(robot: OpenRobot): string {
    const c = robot.bomCost;
    if (!c) return "Cost not published";
    const prefix = c.note?.startsWith("Upper bound") ? "under " : c.confidence === "estimated" ? "~" : "";
    return `${prefix}${money(c.value, c.unit)}`;
}
