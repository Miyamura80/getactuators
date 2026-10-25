import { countryName } from "../../../../src/country-flag";
import { normalizeShares, type ShareKey } from "../../../../src/supply-chain/concentration";
import { percent } from "../../../../src/supply-chain/format";
import { Flag } from "../Flag";
import { COUNTRY_COLOR, COUNTRY_FALLBACK, OTHER_COLOR } from "./country-colors";
import { FootnoteRef } from "./SourcedValue";
import type { StageShareRowInput } from "./StageShareBar";

const CELLS = 100;

// Whole cells per key that add up to exactly 100 (largest remainder).
export function waffleCells(shares: StageShareRowInput["shares"]): { key: ShareKey; share: number; cells: number }[] {
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

// Perspective C: each stage as 100 cells, one per percent, so a share reads
// as area. Cells fill in on mount unless the visitor prefers reduced motion.
export function WaffleGrid({ rows }: { rows: StageShareRowInput[] }) {
    return <div className="sc-waffles">
        {rows.map((row) => {
            const parts = waffleCells(row.shares);
            const cells = parts.flatMap((p) => Array.from({ length: p.cells }, () => p.key));
            const top = parts[0];
            return <figure key={row.id} className="sc-waffle">
                <figcaption>
                    <span>{row.label}</span>
                    {row.source ? <FootnoteRef {...row.source} /> : null}
                </figcaption>
                <div className="sc-waffle-grid" role="img"
                    aria-label={`${row.label}: ${parts.map((p) => `${p.key === "other" ? "Other" : countryName(p.key)} ${percent(p.share)}`).join(", ")}`}>
                    {cells.map((key, i) => <span key={i} style={{
                        background: key === "other" ? OTHER_COLOR : COUNTRY_COLOR[key] ?? COUNTRY_FALLBACK,
                        animationDelay: `${i * 8}ms`,
                    }} />)}
                </div>
                {top && top.key !== "other" ? <p className="sc-waffle-top">
                    <Flag code={top.key} /> <b>{percent(top.share)}</b>
                </p> : null}
            </figure>;
        })}
    </div>;
}
