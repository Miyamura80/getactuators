import { concentration, normalizeShares, type ShareKey, type Shares } from "../../../../src/supply-chain/concentration";
import { countryName } from "../../../../src/supply-chain/countries";
import { percent } from "../../../../src/supply-chain/format";
import type { Sourced } from "../../../../src/supply-chain/sourced";
import { ConcentrationBadge } from "./ConcentrationBadge";
import { FootnoteRef } from "./SourcedValue";

// Country colour for share segments. Bright on black, never the status red
// or green; the unattributed rest is one grey "Other".
export const COUNTRY_COLOR: Partial<Record<ShareKey, string>> = {
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
    // Citation for the row, when the shares are data.
    source?: Pick<Sourced<unknown>, "sources" | "asOf" | "confidence" | "note">;
    // Shown in place of a citation, e.g. "synthetic".
    tag?: string;
}

// Segments narrower than this carry no inline label (the title still does).
const LABEL_MIN = 0.09;

// One stacked bar per stage, countries largest first and "Other" last, with
// the concentration badge at the right end. The canonical chokepoint visual.
export function StageShareBar({ rows }: { rows: StageShareRowInput[] }) {
    return <div className="sc-stages" role="list">
        {rows.map((row) => {
            const { countries, other } = normalizeShares(row.shares);
            const c = concentration(row.shares);
            const segments = [
                ...countries.map((x) => ({ key: x.country as ShareKey, share: x.share })),
                ...(other > 0.0005 ? [{ key: "other" as ShareKey, share: other }] : []),
            ];
            const summary = segments.map((s) => `${s.key === "other" ? "Other" : countryName(s.key)} ${percent(s.share)}`).join(", ");
            return <div className="sc-stage" role="listitem" key={row.id}>
                <div className="sc-stage-label">
                    <span>{row.label}</span>
                    {row.source ? <FootnoteRef {...row.source} /> : null}
                    {row.tag ? <span className="sc-tag">{row.tag}</span> : null}
                </div>
                <div className="sc-bar" role="img" aria-label={`${row.label}: ${summary}`}>
                    {segments.map((s) => <span key={s.key}
                        className={s.key === "other" ? "sc-seg sc-seg-other" : "sc-seg"}
                        title={`${s.key === "other" ? "Other" : countryName(s.key)} ${percent(s.share)}`}
                        style={{ flexGrow: s.share, background: s.key === "other" ? undefined : COUNTRY_COLOR[s.key] ?? FALLBACK }}>
                        {s.share >= LABEL_MIN ? <span>{s.key === "other" ? "Other" : s.key} {percent(s.share)}</span> : null}
                    </span>)}
                </div>
                <div className="sc-stage-badge">
                    {c ? <ConcentrationBadge level={c.level} top={c.top} hhi={c.hhi} /> : null}
                </div>
            </div>;
        })}
    </div>;
}
