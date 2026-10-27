import { countryFlag, countryName } from "../../../../../src/country-flag";
import { SUPPLY_CHAIN_PAGES_LIVE } from "../../../../../src/public-navigation";
import { formatSourced } from "../../../../../src/supply-chain/format";
import {
    MEASURE_STATUS_LABEL,
    MEASURE_TYPE_LABEL,
    POLICY_LANE_LABEL,
    type PolicyMeasure,
    lastChange,
    laneOf,
} from "../../../../../src/supply-chain/policy";
import { STAGE_LABEL, type Stage } from "../../../../../src/supply-chain/stages";
import { FootnoteRef, SourcedValue } from "../../../components/supply-chain/SourcedValue";
import { TypeGlyph } from "./glyphs";

// The detail card for the measure in focus: what it does, where and when,
// its status history as a strip, and the links out to /metals and the
// country page.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2025-04-04" -> "4 Apr 2025"; "2025-04" -> "Apr 2025".
export function fmtDate(d: string): string {
    const [y, m, day] = d.split("-");
    if (!m) return y ?? d;
    const month = MONTHS[Number(m) - 1] ?? m;
    return day ? `${Number(day)} ${month} ${y}` : `${month} ${y}`;
}

const COUNTRY_PAGE: Record<string, string> = { JP: "/japan", CN: "/china", KR: "/korea", US: "/us" };
const METAL_STAGES: readonly Stage[] = ["mining", "separation", "metal-alloy", "magnet"];

function metalsLink(m: PolicyMeasure): string | null {
    if (m.metals) return `/metals?event=${m.metals.eventId}#prices`;
    if (!m.stages.some((s) => METAL_STAGES.includes(s))) return null;
    const month = (m.effective ?? lastChange(m)).slice(0, 7);
    return `/metals?at=${month}#prices`;
}

function where(m: PolicyMeasure): string {
    if (m.jurisdiction === "EU" || m.jurisdiction === "INTL") return POLICY_LANE_LABEL[m.jurisdiction];
    return `${countryFlag(m.jurisdiction)} ${countryName(m.jurisdiction)}`;
}

export function MeasureCard({ measure: m, onClose }: { measure: PolicyMeasure; onClose: () => void }) {
    const metals = metalsLink(m);
    const country = COUNTRY_PAGE[m.jurisdiction];
    const countryLive = country && SUPPLY_CHAIN_PAGES_LIVE.has(country) ? country : null;
    const dates = [
        ["Announced", m.announced],
        ["Effective", m.effective],
        ["Ends", m.expires],
    ].filter((d): d is [string, string] => Boolean(d[1]));
    return <article className="pl-card" aria-labelledby="pl-card-title" data-measure={m.id} data-lane={laneOf(m)}>
        <header className="pl-card-head">
            <TypeGlyph type={m.type} status={m.status} size={28} />
            <div>
                <p className="pl-card-kicker">{where(m)} · {m.issuer}</p>
                <h3 id="pl-card-title">{m.title}</h3>
            </div>
            <button type="button" className="pl-close" aria-label="Close" onClick={onClose}>
                <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" /></svg>
            </button>
        </header>
        <p className="pl-card-summary">{m.summary}<FootnoteRef sources={m.sources} asOf={lastChange(m)} confidence="reported" /></p>
        <dl className="pl-card-facts">
            <div><dt>Type</dt><dd>{MEASURE_TYPE_LABEL[m.type]}</dd></div>
            <div><dt>Status</dt><dd className={`pl-status pl-status-${m.status}`}>{MEASURE_STATUS_LABEL[m.status]}</dd></div>
            {dates.map(([k, v]) => <div key={k}><dt>{k}</dt><dd className="pl-mono">{fmtDate(v)}</dd></div>)}
            {m.amountUsd
                ? <div><dt>Amount</dt><dd><SourcedValue value={m.amountUsd} format={formatSourced} /></dd></div>
                : null}
        </dl>
        <ul className="pl-chips" aria-label="Stages hit">
            {m.stages.map((s) => <li key={s}>{STAGE_LABEL[s]}</li>)}
        </ul>
        {m.hsCodes || m.elements || m.companiesAffected
            ? <dl className="pl-card-more">
                {m.elements ? <div><dt>Elements</dt><dd className="pl-mono">{m.elements.join(" ")}</dd></div> : null}
                {m.hsCodes ? <div><dt>HS codes</dt><dd className="pl-mono">{m.hsCodes.join(", ")}</dd></div> : null}
                {m.companiesAffected ? <div><dt>Companies</dt><dd>{m.companiesAffected.join(", ")}</dd></div> : null}
            </dl>
            : null}
        <ol className="pl-history" aria-label="Status history">
            {m.statusHistory.map((c, i) => <li key={`${c.date}-${i}`} className={`pl-status-${c.status}`}>
                <span className="pl-mono">{fmtDate(c.date)}</span>
                <b>{MEASURE_STATUS_LABEL[c.status]}</b>
                {c.note ? <span>{c.note}</span> : null}
                <FootnoteRef sources={c.sources} asOf={c.date} confidence="reported" />
            </li>)}
        </ol>
        {metals || countryLive
            ? <nav className="pl-card-links" aria-label="Related">
                {metals ? <a href={metals}>Magnet metal prices at this date →</a> : null}
                {countryLive ? <a href={countryLive}>{countryName(m.jurisdiction)} supply chain →</a> : null}
            </nav>
            : null}
    </article>;
}
