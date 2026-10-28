import {
    OPEN_ROBOT_TYPES,
    OPEN_SOURCE_PATH,
    type OpenRobotType,
    getOpenRobot,
} from "../../../../src/open-source";

// /open-source keeps the picked robot, the type filter, the actuator filter
// (from the usage chart) and the usage grouping in the URL.

export type UsageBy = "model" | "brand";

export interface OpenSourceState {
    robot: string | null;
    type: OpenRobotType | null;
    uses: string | null;
    by: UsageBy;
}

export function readState(): OpenSourceState {
    const q = new URLSearchParams(window.location.search);
    const type = q.get("type");
    return {
        robot: getOpenRobot(q.get("robot") ?? "")?.id ?? null,
        type: (OPEN_ROBOT_TYPES as readonly string[]).includes(type ?? "") ? (type as OpenRobotType) : null,
        uses: q.get("uses") || null,
        by: q.get("by") === "brand" ? "brand" : "model",
    };
}

export function writeState(s: OpenSourceState): void {
    const q = new URLSearchParams(window.location.search);
    const set = (k: string, v: string | null) => (v ? q.set(k, v) : q.delete(k));
    set("robot", s.robot);
    set("type", s.type);
    set("uses", s.uses);
    set("by", s.by === "brand" ? "brand" : null);
    const qs = q.toString();
    window.history.replaceState(
        window.history.state,
        "",
        `${OPEN_SOURCE_PATH}${qs ? `?${qs}` : ""}${window.location.hash}`,
    );
}
