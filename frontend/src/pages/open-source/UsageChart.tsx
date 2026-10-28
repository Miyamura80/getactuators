import { useMemo } from "react";
import {
    OPEN_ROBOTS,
    actuatorUsage,
    brandUsage,
    getOpenRobot,
} from "../../../../src/open-source";
import type { UsageBy } from "./url-state";

// Joint count per actuator model (or brand) across every open robot. A bar
// is a filter: picking it narrows the gallery to the robots that use it.

interface Bar {
    key: string;
    label: string;
    sub: string;
    joints: number;
    robots: string[];
    listed: boolean;
}

const MAX_BARS = 14;

function bars(by: UsageBy): Bar[] {
    if (by === "brand") {
        return brandUsage(OPEN_ROBOTS).map((u) => ({
            key: u.key,
            label: u.brand,
            sub: `${u.robots.length} robot${u.robots.length === 1 ? "" : "s"}`,
            joints: u.joints,
            robots: u.robots,
            listed: true,
        }));
    }
    return actuatorUsage(OPEN_ROBOTS).map((u) => ({
        key: u.key,
        label: u.name,
        sub: `${u.brand}${u.actuatorId ? "" : " · not in catalog"}`,
        joints: u.joints,
        robots: u.robots,
        listed: u.actuatorId !== null,
    }));
}

export function UsageChart({
    by,
    active,
    onBy,
    onPick,
}: {
    by: UsageBy;
    active: string | null;
    onBy: (by: UsageBy) => void;
    onPick: (key: string | null) => void;
}) {
    const rows = useMemo(() => bars(by).slice(0, MAX_BARS), [by]);
    const max = Math.max(1, ...rows.map((r) => r.joints));
    return (
        <div className="os-usage">
            <div className="os-seg" role="group" aria-label="Group bars by">
                {(["model", "brand"] as const).map((b) => (
                    <button key={b} type="button" aria-pressed={by === b} className={by === b ? "is-on" : undefined} onClick={() => onBy(b)}>
                        {b === "model" ? "By model" : "By brand"}
                    </button>
                ))}
            </div>
            <ol className="os-bars">
                {rows.map((r) => {
                    const on = active === r.key;
                    const names = r.robots.map((id) => getOpenRobot(id)?.name ?? id).join(", ");
                    return (
                        <li key={r.key}>
                            <button
                                type="button"
                                className={`os-bar${on ? " is-on" : ""}${r.listed ? "" : " is-unlisted"}`}
                                aria-pressed={on}
                                data-key={r.key}
                                title={`${r.joints} joints: ${names}`}
                                onClick={() => onPick(on ? null : r.key)}
                            >
                                <span className="os-bar-label">
                                    <b>{r.label}</b>
                                    <small>{r.sub}</small>
                                </span>
                                <span className="os-bar-track">
                                    <span className="os-bar-fill" style={{ width: `${(r.joints / max) * 100}%` }} />
                                </span>
                                <span className="os-bar-num">{r.joints}</span>
                            </button>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}
