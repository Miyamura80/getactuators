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

// Entry price for robots sold at a public price, cheapest first. Ranged
// prices use the low end, the cheapest way into the robot.
function bars(metric: (r: Robot, p: number) => number): BarItem[] {
    return ROBOTS.filter((r) => r.price_usd != null)
        .map((r) => ({ r, v: metric(r, r.price_usd as number) }))
        .sort((a, b) => a.v - b.v)
        .map(({ r, v }) => ({
            id: r.id,
            name: r.name,
            value: v,
            display: usd(v),
            flag: r.country_flag,
            color: KIND_COLOR[r.kind],
        }));
}

export function RobotCostCharts() {
    const cards = [
        {
            key: "price",
            title: "Price",
            sub: "Entry USD · log scale · lower is cheaper",
            items: bars((_, p) => p),
        },
        {
            key: "per-dof",
            title: "Price per DOF",
            sub: "Entry USD per degree of freedom · log scale",
            items: bars((r, p) => p / r.dof),
        },
    ];
    const unpriced = ROBOTS.filter((r) => r.price_usd == null).map((r) => r.name);
    return (
        <>
            <Legend
                entries={[
                    { name: "Humanoid", color: KIND_COLOR.humanoid },
                    { name: "Robot arm", color: KIND_COLOR.robot_arm },
                ]}
            />
            <div className="highlights robot-costs">
                {cards.map((c) => (
                    <section className="hi-card" key={c.key}>
                        <div className="hi-head">
                            <BrandGlyph className="hi-tag" />
                            <div>
                                <h3>{c.title}</h3>
                                <p>{c.sub}</p>
                            </div>
                        </div>
                        <div className="hi-chart">
                            <BarChart items={c.items} log onSelect={(id) => navigate(`/robots#${id}`)} />
                        </div>
                    </section>
                ))}
            </div>
            {unpriced.length > 0 && (
                <p className="robot-costs-note">Quote only, not charted: {unpriced.join(", ")}.</p>
            )}
        </>
    );
}
