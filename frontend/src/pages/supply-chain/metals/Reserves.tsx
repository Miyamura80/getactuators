import { countryName } from "../../../../../src/country-flag";
import { formatValue } from "../../../../../src/supply-chain/format";
import {
    type ReserveCommodity,
    type ReserveRow,
    reserveTable,
    yearsOfSupply,
} from "../../../../../src/supply-chain/metals/reserves";
import type { Sourced } from "../../../../../src/supply-chain/sourced";
import { Flag } from "../../../components/Flag";
import { SourcedValue } from "../../../components/supply-chain/SourcedValue";

// 3. How much is left: per country, 2025 mine output against reserves on
// one log scale, and the years reserves last at the current rate. The
// biggest producers show first; the rest fold away.

const SHOWN = 6;
const years = (s: Sourced<number>) => `${Math.round(s.value).toLocaleString("en-US")} yr`;
const tons = (s: Sourced<number>) => formatValue(s.value, "t");

// Width on a log axis from 100 t to the largest value, as a percentage.
function logWidth(v: number, max: number): number {
    if (v <= 0) return 0;
    const lo = Math.log10(100);
    return Math.max(2, ((Math.log10(Math.max(v, 100)) - lo) / (Math.log10(max) - lo)) * 100);
}

function Row({ r, max }: { r: ReserveRow; max: number }) {
    const y = yearsOfSupply(r);
    return <li data-country={r.country}>
        <span className="mt-res-name">
            {r.country === "other" ? <span>Other</span> : <Flag code={r.country} />}
            {r.country === "other" ? null : <span className="mt-res-cn">{countryName(r.country)}</span>}
        </span>
        <span className="mt-res-bars" aria-hidden="true">
            <span className="mt-res-prod" style={{ width: `${logWidth(r.production2025.value, max)}%` }} />
            <span className="mt-res-left" style={{ width: `${logWidth(r.reserves?.value ?? 0, max)}%` }} />
        </span>
        <span className="mt-res-num"><SourcedValue value={r.production2025} format={tons} /></span>
        <span className="mt-res-num">{r.reserves ? <SourcedValue value={r.reserves} format={tons} /> : <span title="USGS reports NA">NA</span>}</span>
        <span className="mt-res-num">{y ? <SourcedValue value={y} format={years} /> : ""}</span>
    </li>;
}

export function Reserves({ commodity, onCommodity }: {
    commodity: ReserveCommodity;
    onCommodity: (c: ReserveCommodity) => void;
}) {
    const t = reserveTable(commodity);
    const max = Math.max(...t.rows.map((r) => r.reserves?.value ?? 0), ...t.rows.map((r) => r.production2025.value));
    const head = <li className="mt-res-head" aria-hidden="true">
        <span />
        <span className="mt-res-key"><i className="mt-res-prod" />mined 2025 <i className="mt-res-left" />reserves</span>
        <span>Mined</span><span>Reserves</span><span>Years</span>
    </li>;
    return <div className="mt-res">
        <div className="mt-controls">
            <span className="mt-seg" role="group" aria-label="Commodity">
                {(["ree", "co"] as const).map((c) => <button key={c} type="button" aria-pressed={c === commodity}
                    className={c === commodity ? "is-on" : undefined} onClick={() => onCommodity(c)}>
                    {c === "ree" ? "Rare earths" : "Cobalt"}</button>)}
            </span>
            <span className="mt-note">{t.basis} · log scale</span>
        </div>
        <ul className="mt-res-list">
            {head}
            {t.rows.slice(0, SHOWN).map((r) => <Row key={r.country} r={r} max={max} />)}
            <li className="mt-res-world">
                <span className="mt-res-name">World</span>
                <span />
                <span className="mt-res-num"><SourcedValue value={t.world.production2025} format={tons} /></span>
                <span className="mt-res-num"><SourcedValue value={t.world.reserves} format={tons} /></span>
                <span />
            </li>
        </ul>
        <details className="mt-more-rows">
            <summary>{t.rows.length - SHOWN} more countries</summary>
            <ul className="mt-res-list">
                {t.rows.slice(SHOWN).map((r) => <Row key={r.country} r={r} max={max} />)}
            </ul>
        </details>
    </div>;
}
