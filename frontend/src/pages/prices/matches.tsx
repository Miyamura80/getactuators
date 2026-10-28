import { useState } from "react";
import { CountryFlag } from "../../components/CountryFlag";
import { CATEGORY_MAP, type CategorySlug } from "../../types";
import type { Listing } from "./listings";
import { classColor, pct, perNmText, usd } from "./shared";
import { SparkSvg } from "./Sparkline";

// The ranked answer: actuators meeting the spec, cheapest per N·m first.
// The name links to the catalog page; the $/Nm cell selects the actuator
// for the whole page (?actuator=). Once per-actuator history clears its
// gate, that cell also carries the price sparkline.

const FIRST = 10;

function Row({ l, rank, selected, spark, onPick, onHover }: {
    l: Listing;
    // 1-based place in the ranking; null when the spec filters it out.
    rank: number | null;
    selected: boolean;
    // Left edge of the shared sparkline span; undefined hides sparklines.
    spark: string | undefined;
    onPick: () => void;
    onHover: (id: string) => void;
}) {
    const cls = CATEGORY_MAP[l.a.category as CategorySlug];
    return <li className={`pr-match${selected ? " is-sel" : ""}${rank === 1 ? " is-best" : ""}`} data-id={l.a.id}
        onMouseEnter={() => onHover(l.a.id)} onMouseLeave={() => onHover("")}>
        <span className="pr-rank">{rank === null ? "out" : String(rank).padStart(2, "0")}</span>
        <a className="pr-name" href={`/actuators/${encodeURIComponent(l.a.id)}`}>{l.a.name}</a>
        <span className="pr-meta">
            <span>{l.a.brand}</span>
            <span className="pr-cls"><i style={{ background: classColor(l.a.category) }} aria-hidden="true" />{cls?.label ?? l.a.category}</span>
            <CountryFlag country={l.a.country} />
        </span>
        <span className="pr-num pr-tq">{l.torque} Nm</span>
        <span className="pr-num pr-price">{usd(l.price)}</span>
        <button type="button" className="pr-sel-btn" aria-pressed={selected}
            aria-label={`${selected ? "Clear selection of" : "Select"} ${l.a.name}, ${perNmText(l.perNm)}`} onClick={onPick}>
            <span className="pr-pernm">{perNmText(l.perNm)}</span>
            {spark !== undefined && l.points.length ? <SparkSvg points={l.points} from={spark} width={64} height={18} /> : null}
            {spark !== undefined && l.change !== null ? <span className={`pr-chg${l.change < 0 ? " is-down" : ""}`}>{pct(l.change)}</span> : null}
        </button>
    </li>;
}

export function Matches({ ranked, focus, selected, spark, onPick, onHover }: {
    ranked: Listing[];
    // The selected actuator's listing, wherever it ranks (or if it is out).
    focus: Listing | null;
    selected: string;
    spark: string | undefined;
    onPick: (id: string) => void;
    onHover: (id: string) => void;
}) {
    const [all, setAll] = useState(false);
    const shown = all ? ranked : ranked.slice(0, FIRST);
    // The selection stays in view: pinned above the list when the spec
    // filters it out or it ranks below the first ten.
    const pinned = focus && !shown.includes(focus) ? focus : null;
    const toggle = (id: string) => onPick(selected === id ? "" : id);
    const row = (l: Listing, rank: number | null) => <Row key={l.a.id} l={l} rank={rank} selected={selected === l.a.id}
        spark={spark} onPick={() => toggle(l.a.id)} onHover={onHover} />;
    return <div className="pr-matches">
        {ranked.length || pinned
            ? <ol className="pr-match-list">
                {pinned ? row(pinned, ranked.includes(pinned) ? ranked.indexOf(pinned) + 1 : null) : null}
                {shown.map((l, i) => row(l, i + 1))}
            </ol>
            : null}
        {ranked.length
            ? null
            : <p className="pr-empty">Nothing in the catalog meets this spec. Loosen the budget or the torque.</p>}
        {shown.length < ranked.length
            ? <button type="button" className="pr-more" onClick={() => setAll(true)}>Show all {ranked.length}</button>
            : null}
    </div>;
}
