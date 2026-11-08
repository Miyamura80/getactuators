import { useMemo } from "react";
import { type BomCase, marginCapture } from "../../../../../src/supply-chain/bom";
import { percentDigits } from "../../../../../src/supply-chain/format";
import { getCompany } from "../../../../../src/supply-chain/registry";
import { FootnoteRef } from "../../../components/supply-chain/SourcedValue";

// Who keeps the price: each part maker's gross profit on its slice, the raw
// material, and the rest (makers' costs and margins we cannot attribute), as
// one stacked bar of the price.

const TIER_COLORS = ["var(--bm-c1)", "var(--bm-c2)", "var(--bm-c3)", "var(--bm-c4)"];

export interface MarginSegment {
    key: string;
    label: string;
    share: number;
    color: string;
    companyId?: string;
    representative?: boolean;
}

export function marginSegments(c: BomCase): MarginSegment[] {
    const mc = marginCapture(c);
    const tiers = mc.tiers
        .filter((t) => !t.isMaterial)
        .sort((a, b) => b.share - a.share)
        .map((t, i): MarginSegment => ({
            key: t.nodeId,
            label: getCompany(t.companyId)?.name ?? t.companyId,
            share: t.share,
            color: TIER_COLORS[i % TIER_COLORS.length] ?? "var(--bm-c1)",
            companyId: t.companyId,
            representative: t.representative,
        }));
    return [
        ...tiers,
        { key: "raw", label: "Raw material", share: mc.raw / mc.price, color: "var(--bm-raw)" },
        { key: "other", label: "Costs and unattributed margins", share: mc.other / mc.price, color: "var(--bm-other)" },
    ];
}

const pct = (s: number) => (s > 0 && s < 0.01 ? percentDigits(s, 1) : percentDigits(s, 0));

export function MarginBar({ c, compact = false, onCompany }: { c: BomCase; compact?: boolean; onCompany?: (id: string) => void }) {
    const segs = useMemo(() => marginSegments(c), [c]);
    const summary = segs.map((s) => `${s.label} ${pct(s.share)}`).join(", ");
    return <figure className={`bm-margin${compact ? " is-compact" : ""}`}>
        <div className="bm-margin-bar" role="img" aria-label={`Share of the price: ${summary}`}>
            {segs.map((s) => <i key={s.key} style={{ width: `${Math.max(s.share > 0 ? 0.6 : 0, s.share * 100)}%`, background: s.color }} />)}
        </div>
        <figcaption>
            <ul>
                {segs.map((s) => {
                    const co = s.companyId ? getCompany(s.companyId) : undefined;
                    const name = co && onCompany
                        ? <button type="button" className="bm-link" onClick={() => onCompany(co.id)}>{s.label}</button>
                        : <span>{s.label}</span>;
                    return <li key={s.key}>
                        <i aria-hidden="true" style={{ background: s.color }} />
                        {name}
                        <b className="sc-num">{pct(s.share)}</b>
                        {s.representative ? <span className="bm-tag" title="Supplier not public: a typical listed maker stands in">typical</span> : null}
                        {!compact && co?.grossMargin ? <FootnoteRef sources={co.grossMargin.sources} asOf={co.grossMargin.asOf} confidence={co.grossMargin.confidence} note={co.grossMargin.note} /> : null}
                    </li>;
                })}
            </ul>
        </figcaption>
    </figure>;
}
