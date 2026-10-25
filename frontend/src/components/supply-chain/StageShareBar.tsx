import { normalizeShares, type ShareKey, type Shares } from "../../../../src/supply-chain/concentration";
import { countryName } from "../../../../src/country-flag";
import { percent } from "../../../../src/supply-chain/format";
import type { Sourced } from "../../../../src/supply-chain/sourced";
import { Flag } from "../Flag";
import { FootnoteRef } from "./SourcedValue";

// Country colour for share segments. Bright on black, never the status red
// or green; the unattributed rest is one grey "Other".
const COUNTRY_COLOR: Partial<Record<ShareKey, string>> = {
    CN: "#ff922b",
    US: "#4dabf7",
    JP: "#f783ac",
    KR: "#9775fa",
    AU: "#ffd43b",
    MM: "#a9e34b",
    TH: "#38d9a9",
};
const FALLBACK = "#8b95a1";

export interface StageShareRowInput {
    id: string;
    label: string;
    shares: Shares;
    // Citation for the row.
    source?: Pick<Sourced<unknown>, "sources" | "asOf" | "confidence" | "note">;
}

// Segments narrower than this carry no inline label (the title still does).
const LABEL_MIN = 0.09;
const nameOf = (key: ShareKey) => (key === "other" ? "Other" : countryName(key));

// One stacked bar per stage, countries largest first and "Other" last. The
// canonical "where is the chokepoint" visual: one wide segment says it all.
export function StageShareBar({ rows }: { rows: StageShareRowInput[] }) {
    return <div className="sc-stages" role="list">
        {rows.map((row) => {
            const { countries, other } = normalizeShares(row.shares);
            const segments = [
                ...countries.map((x) => ({ key: x.country as ShareKey, share: x.share })),
                ...(other > 0.0005 ? [{ key: "other" as ShareKey, share: other }] : []),
            ];
            const summary = segments.map((s) => `${nameOf(s.key)} ${percent(s.share)}`).join(", ");
            return <div className="sc-stage" role="listitem" key={row.id}>
                <div className="sc-stage-label">
                    <span>{row.label}</span>
                    {row.source ? <FootnoteRef {...row.source} /> : null}
                </div>
                <div className="sc-bar" role="img" aria-label={`${row.label}: ${summary}`}>
                    {segments.map((s) => <span key={s.key}
                        className={s.key === "other" ? "sc-seg sc-seg-other" : "sc-seg"}
                        title={`${nameOf(s.key)} ${percent(s.share)}`}
                        style={{ flexGrow: s.share, background: s.key === "other" ? undefined : COUNTRY_COLOR[s.key] ?? FALLBACK }}>
                        {s.share >= LABEL_MIN ? <span aria-hidden="true">
                            {s.key === "other" ? "Other" : <Flag code={s.key} decorative />} {percent(s.share)}
                        </span> : null}
                    </span>)}
                </div>
            </div>;
        })}
    </div>;
}
