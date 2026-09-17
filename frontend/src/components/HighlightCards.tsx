import type { Actuator } from "../types";
import { colorForBrand } from "../lib/brands";
import { BarChart } from "./BarChart";
import type { BarItem } from "./BarChart";

interface Props {
    actuators: Actuator[];
    onSelect: (id: string) => void;
}

function topBy(
    list: Actuator[],
    metric: (a: Actuator) => number | null,
    dir: "desc" | "asc",
    n: number,
): Actuator[] {
    return list
        .filter((a) => metric(a) != null)
        .sort((a, b) => {
            const va = metric(a) as number;
            const vb = metric(b) as number;
            return dir === "desc" ? vb - va : va - vb;
        })
        .slice(0, n);
}

function toItems(list: Actuator[], metric: (a: Actuator) => number, fmt: (v: number) => string): BarItem[] {
    return list.map((a) => ({
        id: a.id,
        name: a.name,
        value: metric(a),
        display: fmt(metric(a)),
        flag: a.country_flag,
        color: colorForBrand(a.brand),
    }));
}

export function HighlightCards({ actuators, onSelect }: Props) {
    const density = toItems(
        topBy(actuators, (a) => a.torque_density_nm_per_kg, "desc", 10),
        (a) => a.torque_density_nm_per_kg as number,
        (v) => `${Math.round(v)}`,
    );
    const peak = toItems(
        topBy(actuators, (a) => a.peak_torque_nm, "desc", 10),
        (a) => a.peak_torque_nm as number,
        (v) => `${Math.round(v)}`,
    );
    const value = toItems(
        topBy(actuators, (a) => a.price_per_nm, "asc", 10),
        (a) => a.price_per_nm as number,
        (v) => `$${v.toFixed(1)}`,
    );

    const cards = [
        {
            key: "density",
            title: "Torque density",
            sub: "Peak N·m per kg · higher is better",
            items: density,
        },
        {
            key: "peak",
            title: "Peak torque",
            sub: "Output N·m · higher is better",
            items: peak,
        },
        {
            key: "value",
            title: "Value",
            sub: "USD per peak N·m · lower is better",
            items: value,
        },
    ];

    return (
        <div className="highlights">
            {cards.map((c) => (
                <section className="hi-card" key={c.key}>
                    <div className="hi-head">
                        <span className="hi-tag" />
                        <div>
                            <h3>{c.title}</h3>
                            <p>{c.sub}</p>
                        </div>
                    </div>
                    <div className="hi-chart">
                        <BarChart items={c.items} onSelect={onSelect} />
                    </div>
                </section>
            ))}
        </div>
    );
}
