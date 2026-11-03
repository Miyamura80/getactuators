import { useState } from "react";
import { SDK_PATH, actuatorUsage, brandUsage } from "../../../../src/open-source";

const TOP = 12;

// Which actuators the open-source world builds on: joints per actuator model
// (or brand). Each bar is a button that filters the robots to its users.
export function UsageChart({ selected, onSelect }: { selected: string | null; onSelect: (key: string | null) => void }) {
    const [by, setBy] = useState<"model" | "brand">("model");
    const rows =
        by === "model"
            ? actuatorUsage().map((u) => ({ key: u.key, label: u.name, sub: u.brand, joints: u.joints, robots: u.robots.length, catalog: u.actuatorId }))
            : brandUsage().map((u) => ({ key: `brand:${u.brand}`, label: u.brand, sub: "", joints: u.joints, robots: u.robots.length, catalog: null }));
    const shown = rows.slice(0, TOP);
    const max = shown[0]?.joints ?? 1;
    return (
        <div className="os-usage">
            <div className="os-toggle" role="group" aria-label="Group bars by">
                {(["model", "brand"] as const).map((b) => (
                    <button
                        key={b}
                        type="button"
                        aria-pressed={by === b}
                        onClick={() => {
                            setBy(b);
                            onSelect(null);
                        }}
                    >
                        {b === "model" ? "Model" : "Brand"}
                    </button>
                ))}
            </div>
            <ol className="os-bars">
                {shown.map((r) => (
                    <li key={r.key}>
                        <button
                            type="button"
                            className={selected === r.key ? "is-on" : undefined}
                            aria-pressed={selected === r.key}
                            onClick={() => onSelect(selected === r.key ? null : r.key)}
                        >
                            <span className="os-bar-label">
                                {r.label}
                                {r.sub && <small>{r.sub}</small>}
                            </span>
                            <span className="os-bar-track">
                                <span className={`os-bar${r.catalog ? " is-catalog" : ""}`} style={{ width: `${(r.joints / max) * 100}%` }} />
                            </span>
                            <span className="os-bar-value">
                                {r.joints} <small>in {r.robots}</small>
                            </span>
                        </button>
                    </li>
                ))}
            </ol>
            <p className="os-note">
                Filled bars are in the <a href="/actuators">catalog</a>; outlined ones are unlisted. SDK quality per brand:{" "}
                <a href={SDK_PATH}>SDK ratings</a>.
            </p>
        </div>
    );
}
