import { useReducer, useState } from "react";
import type { DataGrade } from "../../../../src/humanoids";
import { navigate, useLocationKey } from "../../lib/router";
import { type FleetState, fleetSearch, parseFleet, queryFleet, ROWS, type SortKey } from "./fleet-query";
import { Flag } from "../../components/Flag";
import { MixBar } from "./Totals";

const COLS: { key: SortKey; label: string; num?: boolean }[] = [
    { key: "name", label: "Robot" },
    { key: "dof", label: "DOF", num: true },
    { key: "actuators", label: "Actuators", num: true },
    { key: "magnet", label: "Magnet kg", num: true },
    { key: "ree", label: "REE kg", num: true },
    { key: "bom", label: "Actuator BOM $", num: true },
    { key: "price", label: "Price", num: true },
    { key: "data", label: "Data", num: true },
];

const GRADE_DOTS: Record<DataGrade, number> = { reported: 3, mixed: 2, estimated: 1 };
const usd = (n: number | null) => (n === null ? "n/a" : `$${(n / 1000).toFixed(n % 1000 ? 1 : 0)}k`);
const TOP = [...ROWS].sort((a, b) => b.t.magnetMassKg.value - a.t.magnetMassKg.value)[0];

function Confidence({ share, grade }: { share: number; grade: DataGrade }) {
    const pct = Math.round(share * 100);
    const tip = `${pct}% of joint fields (actuator type, peak torque or force) come from maker data, URDFs or spec pages; the rest are estimated. Magnet mass is always estimated.`;
    return (
        <span className={`hm-meter is-${grade}`} title={tip} role="img" aria-label={`${grade} data: ${tip}`}>
            {[1, 2, 3].map((i) => (
                <i key={i} className={i <= GRADE_DOTS[grade] ? "on" : undefined} />
            ))}
            <span>{grade}</span>
        </span>
    );
}

function pageList(page: number, pages: number): (number | "gap")[] {
    if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
    const out: (number | "gap")[] = [1];
    for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) out.push(i);
    if ((out[1] as number) > 2) out.splice(1, 0, "gap");
    if (page + 1 < pages - 1) out.push("gap");
    out.push(pages);
    return out;
}

export function FleetTable({ active, onPick }: { active: string; onPick: (id: string) => void }) {
    useLocationKey();
    const [, bump] = useReducer((x: number) => x + 1, 0);
    const state = parseFleet(window.location.search);
    const [open, setOpen] = useState(() => Boolean(state.q || state.page > 1));
    const result = queryFleet(state);
    const isOpen = open || Boolean(state.q) || state.page > 1;

    // Sort and page changes are history entries (back steps through them);
    // typing replaces the entry so each keystroke is not one.
    const go = (next: FleetState) => navigate(`${window.location.pathname}${fleetSearch(window.location.search, next)}#fleet`);
    const search = (q: string) => {
        const url = `${window.location.pathname}${fleetSearch(window.location.search, { ...state, q, page: 1 })}${window.location.hash}`;
        window.history.replaceState(window.history.state, "", url);
        bump();
    };
    const sortBy = (key: SortKey) => {
        const dir = state.sort.key === key ? (state.sort.dir === 1 ? -1 : 1) : key === "name" ? 1 : -1;
        go({ ...state, sort: { key, dir }, page: 1 });
    };

    return (
        <details className="hm-fleet" id="fleet" open={isOpen} onToggle={(e) => setOpen(e.currentTarget.open)}>
            <summary>
                <span className="hm-fleet-t">Fleet ({ROWS.length})</span>
                {TOP && (
                    <span className="hm-fleet-hint">
                        Most magnet: {TOP.h.name}, {TOP.t.magnetMassKg.value.toFixed(2)} kg
                    </span>
                )}
            </summary>
            <div className="hm-fleet-bar">
                <label className="hm-search">
                    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                        <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M10.5 10.5 14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <input
                        type="search"
                        value={state.q}
                        placeholder="Robot, maker, country or actuator type"
                        aria-label="Search the fleet"
                        onChange={(e) => search(e.target.value)}
                    />
                </label>
                <span className="hm-fleet-n" aria-live="polite">
                    {result.total} of {ROWS.length}
                </span>
            </div>
            <div className="hm-table">
                <table>
                    <thead>
                        <tr>
                            <Th c={COLS[0]!} state={state} onClick={sortBy} />
                            <th className="hm-mixcol">Mix</th>
                            {COLS.slice(1).map((c) => (
                                <Th key={c.key} c={c} state={state} onClick={sortBy} />
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {result.rows.map(({ h, t, ree, bom, bomOut, conf }) => (
                            <tr key={h.id} className={h.id === active ? "is-active" : undefined}>
                                <td>
                                    <button type="button" onClick={() => onPick(h.id)}>
                                        {h.name}
                                    </button>
                                    <span className="hm-brand">
                                        {h.brand} · <Flag code={h.country} />
                                    </span>
                                </td>
                                <td className="hm-mixcol">
                                    <MixBar totals={t} compact />
                                </td>
                                <td className="num">{h.dof ?? "n/a"}</td>
                                <td className="num">{t.actuators}</td>
                                <td className="num">{t.magnetMassKg.value.toFixed(2)}</td>
                                <td className="num">{ree.toFixed(2)}</td>
                                <td className="num">
                                    {usd(bom)}
                                    {bomOut > 0 && (
                                        <sup className="hm-out" title={`${bomOut} actuators have no defensible unit cost and are not counted`}>
                                            +
                                        </sup>
                                    )}
                                </td>
                                <td className="num">{usd(h.price_usd)}</td>
                                <td className="num">
                                    <Confidence share={conf.share} grade={conf.grade} />
                                </td>
                            </tr>
                        ))}
                        {result.total === 0 && (
                            <tr>
                                <td colSpan={COLS.length + 1} className="hm-empty">
                                    No robot matches "{state.q}".{" "}
                                    <button type="button" onClick={() => search("")}>
                                        Clear search
                                    </button>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {result.pages > 1 && (
                <nav className="hm-pager" aria-label="Fleet pages">
                    <button type="button" disabled={result.page === 1} onClick={() => go({ ...state, page: result.page - 1 })}>
                        Prev
                    </button>
                    {pageList(result.page, result.pages).map((p, i) =>
                        p === "gap" ? (
                            <span key={`gap-${i}`}>…</span>
                        ) : (
                            <button
                                key={p}
                                type="button"
                                aria-current={p === result.page ? "page" : undefined}
                                aria-label={`Page ${p}`}
                                onClick={() => go({ ...state, page: p })}
                            >
                                {p}
                            </button>
                        ),
                    )}
                    <button type="button" disabled={result.page === result.pages} onClick={() => go({ ...state, page: result.page + 1 })}>
                        Next
                    </button>
                </nav>
            )}
        </details>
    );
}

function Th({ c, state, onClick }: { c: (typeof COLS)[number]; state: FleetState; onClick: (k: SortKey) => void }) {
    const on = state.sort.key === c.key;
    const dir = state.sort.dir;
    return (
        <th className={c.num ? "num" : undefined} aria-sort={on ? (dir === 1 ? "ascending" : "descending") : "none"}>
            <button type="button" onClick={() => onClick(c.key)}>
                {c.label}
                <span aria-hidden="true">{on ? (dir === 1 ? " ▲" : " ▼") : ""}</span>
            </button>
        </th>
    );
}
