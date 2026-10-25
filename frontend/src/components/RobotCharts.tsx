import type { Robot, RobotKind } from "../types";
import { ROBOTS } from "../lib/robots";
import { navigate } from "../lib/router";
import { BarChart } from "./BarChart";
import type { BarItem } from "./BarChart";
import { BrandGlyph } from "./BrandGlyph";
import { Legend } from "./Legend";

// Same hues as the robot-type cards on the home page.
const KIND_COLOR: Record<RobotKind, string> = {
    humanoid: "hsl(262 60% 66%)",
    robot_arm: "hsl(210 70% 62%)",
};

function usd(v: number): string {
    return v >= 10_000 ? `$${Math.round(v / 1000)}k` : v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${Math.round(v)}`;
}

export function hours(v: number): string {
    return `${Number.isInteger(v) ? v : v.toFixed(1)} h`;
}

// Payload as a share of the robot's own mass, or null when either is missing.
export function liftRatio(r: Robot): number | null {
    return r.payload_kg != null && r.weight_kg ? r.payload_kg / r.weight_kg : null;
}

// Bars for every robot the metric covers, sorted by value; the robots it
// skips are named under the chart instead of silently dropped.
function bars(
    metric: (r: Robot) => number | null,
    fmt: (v: number) => string,
    dir: "asc" | "desc",
): { items: BarItem[]; skipped: string[] } {
    const rows = ROBOTS.map((r) => ({ r, v: metric(r) }));
    const items = rows
        .filter((x): x is { r: Robot; v: number } => x.v != null)
        .sort((a, b) => (dir === "asc" ? a.v - b.v : b.v - a.v))
        .map(({ r, v }) => ({
            id: r.id,
            name: r.name,
            value: v,
            display: fmt(v),
            flag: r.country_flag,
            color: KIND_COLOR[r.kind],
        }));
    return { items, skipped: rows.filter((x) => x.v == null).map((x) => x.r.name) };
}

// Ranged prices use the low end, the cheapest way into the robot.
const CARDS = [
    {
        key: "price",
        title: "Price",
        sub: "Entry USD · log scale · lower is cheaper",
        log: true,
        skip: "Quote only",
        ...bars((r) => r.price_usd, usd, "asc"),
    },
    {
        key: "per-dof",
        title: "Price per DOF",
        sub: "Entry USD per degree of freedom · log scale",
        log: true,
        skip: "Quote only",
        ...bars((r) => (r.price_usd == null ? null : r.price_usd / r.dof), usd, "asc"),
    },
    {
        key: "runtime",
        title: "Runtime",
        sub: "Hours per charge, maker's best figure · higher is better",
        log: false,
        skip: "Mains-powered or not published",
        ...bars((r) => (r.power === "battery" ? (r.runtime_h ?? null) : null), hours, "desc"),
    },
    {
        key: "lift",
        title: "Payload ÷ own weight",
        sub: "How much it lifts per kg of robot · higher is better",
        log: false,
        skip: "Payload or weight not published",
        ...bars(liftRatio, (v) => v.toFixed(2), "desc"),
    },
];

export function RobotCharts() {
    return (
        <>
            <Legend
                entries={[
                    { name: "Humanoid", color: KIND_COLOR.humanoid },
                    { name: "Robot arm", color: KIND_COLOR.robot_arm },
                ]}
            />
            <div className="highlights robot-costs">
                {CARDS.map((c) => (
                    <section className="hi-card" key={c.key}>
                        <div className="hi-head">
                            <BrandGlyph className="hi-tag" />
                            <div>
                                <h3>{c.title}</h3>
                                <p>{c.sub}</p>
                            </div>
                        </div>
                        <div className="hi-chart">
                            <BarChart
                                items={c.items}
                                log={c.log}
                                onSelect={(id) => navigate(`/robots#${id}`)}
                            />
                        </div>
                        {c.skipped.length > 0 && (
                            <p className="robot-costs-note">
                                {c.skip}: {c.skipped.join(", ")}.
                            </p>
                        )}
                    </section>
                ))}
            </div>
        </>
    );
}
