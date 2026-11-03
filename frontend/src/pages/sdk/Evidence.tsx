import {
    DIMENSION_LABEL,
    FORUM_LABEL,
    SDK_AS_OF,
    type SdkDimension,
    type SdkEvidence,
    brandSummary,
    checksFor,
} from "../../../../src/sdk";
import { evidenceFor } from "../../../../src/sdk/evidence";
import { FootnoteRef } from "../../components/supply-chain/SourcedValue";
import { scoreText } from "./state";

const VALUE_LABEL = { 1: "Yes", 0.5: "Partly", 0: "No" } as const;

// The open cell's panel; the heatmap button points at it with aria-controls.
export const EVIDENCE_PANEL_ID = "sdk-evidence-panel";

export function EvidenceItem({ e }: { e: SdkEvidence }) {
    return <li className={`sdk-ev sdk-ev-${e.polarity}`}>
        <span className="sdk-ev-pol" aria-label={e.polarity}>{e.polarity === "positive" ? "+" : "−"}</span>
        <span className="sdk-ev-claim">{e.claim}</span>
        <a className="sdk-ev-link" href={e.url} rel="noopener nofollow" target="_blank">
            {FORUM_LABEL[e.forum]} · {e.venue} · {e.date}
        </a>
    </li>;
}

// Drill-down for one heatmap cell: the score split, the cited checks and every
// community claim behind it, each linked to its post.
export function EvidencePanel({ brand, dim, onClose }: {
    brand: string;
    dim: SdkDimension;
    onClose: () => void;
}) {
    const s = brandSummary(brand);
    if (!s) return null;
    const v = s.score.dimensions[dim];
    const checks = checksFor(brand).filter((c) => c.dimension === dim);
    const posts = evidenceFor(brand, dim);
    return <section id={EVIDENCE_PANEL_ID} className="sdk-panel" data-brand={brand} data-dim={dim} aria-label={`${s.brand.name}: ${DIMENSION_LABEL[dim]}`}>
        <header>
            <h3>{s.brand.name} · {DIMENSION_LABEL[dim]} <b>{scoreText(v?.score)}</b></h3>
            <button type="button" className="sdk-close" aria-label="Close evidence" onClick={onClose}>×</button>
        </header>
        <p className="sdk-split">
            Checks {v?.objective === null || v === undefined ? "n/a" : `${Math.round(v.objective)}%`} · Posts {v?.community === null || v === undefined ? "none" : `${Math.round(v.community)}% positive (${v.positive}+ / ${v.negative}−)`}
        </p>
        {checks.length ? <ul className="sdk-checks">
            {checks.map((c) => <li key={c.label} className={`sdk-check sdk-check-${String(c.value).replace(".", "")}`}>
                <span className="sdk-check-v">{VALUE_LABEL[c.value]}</span> {c.label}
                <FootnoteRef sources={c.sources} asOf={SDK_AS_OF} confidence="reported" />
            </li>)}
        </ul> : null}
        {posts.length
            ? <ol className="sdk-evs">{posts.map((e) => <EvidenceItem key={e.id} e={e} />)}</ol>
            : <p className="sdk-muted">No developer posts on this yet.</p>}
    </section>;
}
