import type { Robot } from "../../types";
import { hours, usdShort } from "../../lib/format";
import { KIND_COLOR, liftRatio, ROBOTS, runtimeHours } from "../../lib/robots";
import { navigate } from "../../lib/router";
import { BarChart } from "../BarChart";
import type { BarItem } from "../BarChart";
import { BrandGlyph } from "../BrandGlyph";
import { Legend } from "../Legend";
import { RobotPareto } from "./RobotPareto";

interface BarSpec {
    metric: (r: Robot) => number | null;
    fmt: (v: number) => string;
    dir: "asc" | "desc";
    // Bar label, when it must say more than the robot's name.
    label?: (r: Robot) => string;
}

// Bars for every robot the metric covers, sorted by value; the robots it
// skips are named under the chart instead of silently dropped.
function bars({ metric, fmt, dir, label = (r) => r.name }: BarSpec): { items: BarItem[]; skipped: string[] } {
    const rows = ROBOTS.map((r) => ({ r, v: metric(r) }));
    const items = rows
        .filter((x): x is { r: Robot; v: number } => x.v != null)
        .sort((a, b) => (dir === "asc" ? a.v - b.v : b.v - a.v))
        .map(({ r, v }) => ({
            id: r.id,
            name: label(r),
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
        skip: "Price not published",
        ...bars({ metric: (r) => r.price_usd, fmt: usdShort, dir: "asc" }),
    },
    {
        key: "per-dof",
        title: "Price per DOF",
        sub: "Entry USD per degree of freedom · log scale",
        log: true,
        skip: "Price not published",
        ...bars({ metric: (r) => (r.price_usd == null || !r.dof ? null : r.price_usd / r.dof), fmt: usdShort, dir: "asc" }),
    },
    {
        key: "runtime",
        title: "Runtime",
        sub: "Hours per charge, maker's best figure · higher is better",
        log: false,
        skip: "Mains-powered or not published",
        ...bars({ metric: runtimeHours, fmt: hours, dir: "desc" }),
    },
    {
        key: "lift",
        title: "Payload ÷ own weight",
        sub: "How much it lifts per kg of robot · higher is better",
        log: false,
        skip: "Payload or weight not published",
        ...bars({
            metric: liftRatio,
            fmt: (v) => v.toFixed(2),
            dir: "desc",
            label: (r) => (r.payload_basis === "whole_body" ? `${r.name} (whole body)` : r.name),
        }),
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
            <RobotPareto />
        </>
    );
}
