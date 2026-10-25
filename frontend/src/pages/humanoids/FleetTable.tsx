import { useMemo, useState } from "react";
import {
    HUMANOIDS,
    type Humanoid,
    type HumanoidTotals,
    humanoidTotals,
    reeTotalKg,
} from "../../../../src/humanoids";
import { MixBar } from "./Totals";

interface Row {
    h: Humanoid;
    t: HumanoidTotals;
    ree: number;
}

type Key = "name" | "dof" | "actuators" | "magnet" | "ree" | "price" | "reported";

const COLS: { key: Key; label: string; num?: boolean }[] = [
    { key: "name", label: "Robot" },
    { key: "dof", label: "DOF", num: true },
    { key: "actuators", label: "Actuators", num: true },
    { key: "magnet", label: "Magnet kg", num: true },
    { key: "ree", label: "REE kg", num: true },
    { key: "price", label: "Price", num: true },
    { key: "reported", label: "Types reported", num: true },
];

function value(r: Row, k: Key): number | string | null {
    switch (k) {
        case "name":
            return r.h.name.toLowerCase();
        case "dof":
            return r.h.dof;
        case "actuators":
            return r.t.actuators;
        case "magnet":
            return r.t.magnetMassKg.value;
        case "ree":
            return r.ree;
        case "price":
            return r.h.price_usd;
        case "reported":
            return r.t.reportedShare;
    }
}

const usd = (n: number | null) => (n === null ? "n/a" : `$${(n / 1000).toFixed(n % 1000 ? 1 : 0)}k`);

export function FleetTable({ active, onPick }: { active: string; onPick: (id: string) => void }) {
    const [sort, setSort] = useState<{ key: Key; dir: 1 | -1 }>({ key: "magnet", dir: -1 });
    const rows = useMemo(() => {
        const all: Row[] = HUMANOIDS.map((h) => {
            const t = humanoidTotals(h);
            return { h, t, ree: reeTotalKg(t).value };
        });
        return all.sort((a, b) => {
            const x = value(a, sort.key);
            const y = value(b, sort.key);
            if (x === null) return y === null ? 0 : 1;
            if (y === null) return -1;
            return (x < y ? -1 : x > y ? 1 : 0) * sort.dir;
        });
    }, [sort]);
    const click = (key: Key) =>
        setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === "name" ? 1 : -1 }));
    return (
        <div className="hm-table">
            <table>
                <thead>
                    <tr>
                        {COLS.slice(0, 1).map((c) => (
                            <Th key={c.key} c={c} sort={sort} onClick={click} />
                        ))}
                        <th className="hm-mixcol">Mix</th>
                        {COLS.slice(1).map((c) => (
                            <Th key={c.key} c={c} sort={sort} onClick={click} />
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map(({ h, t, ree }) => (
                        <tr key={h.id} className={h.id === active ? "is-active" : undefined}>
                            <td>
                                <button type="button" onClick={() => onPick(h.id)}>
                                    {h.name}
                                </button>
                                <span className="hm-brand">{h.brand}</span>
                            </td>
                            <td className="hm-mixcol">
                                <MixBar totals={t} compact />
                            </td>
                            <td className="num">{h.dof ?? "n/a"}</td>
                            <td className="num">{t.actuators}</td>
                            <td className="num">{t.magnetMassKg.value.toFixed(2)}</td>
                            <td className="num">{ree.toFixed(2)}</td>
                            <td className="num">{usd(h.price_usd)}</td>
                            <td className="num">{Math.round(t.reportedShare * 100)}%</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function Th({
    c,
    sort,
    onClick,
}: {
    c: (typeof COLS)[number];
    sort: { key: Key; dir: 1 | -1 };
    onClick: (k: Key) => void;
}) {
    const on = sort.key === c.key;
    return (
        <th className={c.num ? "num" : undefined} aria-sort={on ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
            <button type="button" onClick={() => onClick(c.key)}>
                {c.label}
                <span aria-hidden="true">{on ? (sort.dir === 1 ? " ▲" : " ▼") : ""}</span>
            </button>
        </th>
    );
}
