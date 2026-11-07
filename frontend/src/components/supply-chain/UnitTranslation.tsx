import type { ReactNode } from "react";
import { formatSourced, formatValue } from "../../../../src/supply-chain/format";
import type { Sourced } from "../../../../src/supply-chain/sourced";
import { SourcedValue } from "./SourcedValue";

export type IsotypeIcon = "humanoid" | "car";

export interface TranslationRow {
    id: string;
    label: string;
    icon: IsotypeIcon;
    perUnit: Sourced<number>;
    result: Sourced<number>;
}

const ICONS: Record<IsotypeIcon, ReactNode> = {
    humanoid: <><circle cx="12" cy="4.5" r="2.5" /><path d="M8 9.5h8v6h-1.5V22h-2v-6.5h-1V22h-2v-6.5H8z" /></>,
    car: <path d="M3 15.5V12l2.2-4.2A2 2 0 0 1 7 6.7h10a2 2 0 0 1 1.8 1.1L21 12v3.5h-2a2.2 2.2 0 0 1-4.4 0H9.4A2.2 2.2 0 0 1 5 15.5zM6.3 11.5h11.4l-1.4-3H7.7z" />,
};

function Icon({ kind, fill, outline = false }: { kind: IsotypeIcon; fill: number; outline?: boolean }) {
    return <span className={`sc-iso${outline ? " is-range" : ""}`}>
        <svg viewBox="0 0 24 24" aria-hidden="true" className="sc-iso-ghost">{ICONS[kind]}</svg>
        {fill > 0 ? <span className="sc-iso-fill" style={{ width: `${Math.min(1, fill) * 100}%` }}>
            <svg viewBox="0 0 24 24" aria-hidden="true">{ICONS[kind]}</svg>
        </span> : null}
    </span>;
}

// One row of icons, each worth `per` units: solid up to the low estimate,
// outlined across the range up to the high estimate.
function Isotype({ kind, value, per }: { kind: IsotypeIcon; value: Sourced<number>; per: number }) {
    const [low, high] = value.range ?? [value.value, value.value];
    const n = Math.ceil(high / per);
    return <span className="sc-iso-row" role="img" aria-label={`${formatSourced(value)}, one icon per ${per.toLocaleString("en-US")}`}>
        {Array.from({ length: n }, (_, i) => {
            const fill = Math.max(0, Math.min(1, low / per - i));
            return <Icon key={i} kind={kind} fill={fill} outline={fill < 1} />;
        })}
    </span>;
}

// Perspective B: a physical quantity translated into things people know,
// drawn as isotype rows with a multiplier, against a real-world benchmark.
export function UnitTranslation({ label, quantity, rows, per, benchmark }: {
    label: string;
    quantity: Sourced<number>;
    rows: TranslationRow[];
    per: number;
    benchmark?: { label: string; icon: IsotypeIcon; value: Sourced<number> };
}) {
    return <div className="sc-units">
        <div className="sc-units-head">
            <span className="sc-units-label">{label}</span>
            <span className="sc-units-qty"><SourcedValue value={quantity} /></span>
        </div>
        <div className="sc-units-rows">
            {rows.map((r) => <div key={r.id} className="sc-units-row">
                <span className="sc-units-name">
                    <b>{r.label}</b>
                    <span>at <SourcedValue value={r.perUnit} /> each</span>
                </span>
                <Isotype kind={r.icon} value={r.result} per={per} />
                <span className="sc-units-result"><SourcedValue value={r.result} /></span>
            </div>)}
            {benchmark ? <div className="sc-units-row is-benchmark">
                <span className="sc-units-name"><b>{benchmark.label}</b></span>
                <span className="sc-iso-row"><Icon kind={benchmark.icon} fill={benchmark.value.value / per} /></span>
                <span className="sc-units-result"><SourcedValue value={benchmark.value} /></span>
            </div> : null}
        </div>
        <p className="sc-units-key">1 icon = {formatValue(per, "units")}</p>
    </div>;
}
