import { countryName } from "../../../../src/country-flag";
import { normalizeShares, type ShareKey, type Shares } from "../../../../src/supply-chain/concentration";
import { percent } from "../../../../src/supply-chain/format";
import type { Sourced } from "../../../../src/supply-chain/sourced";
import { Flag } from "../Flag";
import { COUNTRY_COLOR, COUNTRY_FALLBACK, OTHER_COLOR } from "./country-colors";
import { FootnoteRef } from "./SourcedValue";

export interface StageShareRowInput {
    id: string;
    label: string;
    shares: Shares;
    // Citation for the stage.
    source?: Pick<Sourced<unknown>, "sources" | "asOf" | "confidence" | "note">;
}

const CELLS = 100;
const nameOf = (key: ShareKey) => (key === "other" ? "Other" : countryName(key));
const colorOf = (key: ShareKey) => (key === "other" ? OTHER_COLOR : COUNTRY_COLOR[key] ?? COUNTRY_FALLBACK);

// Whole cells per key that add up to exactly 100 (largest remainder),
// countries largest first and "other" last.
export function waffleCells(shares: Shares): { key: ShareKey; share: number; cells: number }[] {
    const { countries, other } = normalizeShares(shares);
    const parts = [
        ...countries.map((c) => ({ key: c.country as ShareKey, share: c.share })),
        ...(other > 0.0005 ? [{ key: "other" as ShareKey, share: other }] : []),
    ];
    const raw = parts.map((p) => ({ ...p, cells: Math.floor(p.share * CELLS), rest: (p.share * CELLS) % 1 }));
    let left = CELLS - raw.reduce((t, p) => t + p.cells, 0);
    for (const p of [...raw].sort((a, b) => b.rest - a.rest)) {
        if (left <= 0) break;
        p.cells += 1;
        left -= 1;
    }
    return raw.map(({ key, share, cells }) => ({ key, share, cells }));
}

// Country share of each supply-chain stage as 100 cells, one per percent:
// the canonical "where is the chokepoint" visual. A legend under each grid
// gives every country its colour, flag and share. Cells fill in on mount
// unless the visitor prefers reduced motion.
export function WaffleGrid({ rows }: { rows: StageShareRowInput[] }) {
    return <div className="sc-waffles">
        {rows.map((row) => {
            const parts = waffleCells(row.shares);
            const cells = parts.flatMap((p) => Array.from({ length: p.cells }, () => p));
            return <figure key={row.id} className="sc-waffle">
                <figcaption>
                    <span>{row.label}</span>
                    {row.source ? <FootnoteRef {...row.source} /> : null}
                </figcaption>
                <div className="sc-waffle-grid" role="img"
                    aria-label={`${row.label}: ${parts.map((p) => `${nameOf(p.key)} ${percent(p.share)}`).join(", ")}`}>
                    {cells.map((p, i) => <span key={i} title={`${nameOf(p.key)} ${percent(p.share)}`}
                        style={{ background: colorOf(p.key), animationDelay: `${i * 8}ms` }} />)}
                </div>
                <ul className="sc-waffle-legend">
                    {parts.map((p) => <li key={p.key} className={p.key === "other" ? "is-other" : undefined}>
                        <i style={{ background: colorOf(p.key) }} aria-hidden="true" />
                        {p.key === "other" ? <span className="sc-waffle-other">Other</span> : <Flag code={p.key} />}
                        <b>{percent(p.share)}</b>
                    </li>)}
                </ul>
            </figure>;
        })}
    </div>;
}
