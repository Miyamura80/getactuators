import { useId, useState } from "react";
import { formatSourced } from "../../../../src/supply-chain/format";
import { CONFIDENCE_LABEL, type Confidence, type Sourced, type SourceId } from "../../../../src/supply-chain/sourced";
import { getSource } from "../../../../src/supply-chain/sources";
import { footnoteAnchor, useFootnotes } from "./footnotes";

// Superscript footnote numbers for a set of sources. Hover, focus or tap
// opens a card with publisher, title, as-of date and confidence.
export function FootnoteRef({ sources, asOf, confidence, note }: {
    sources: readonly SourceId[];
    asOf: string;
    confidence: Confidence;
    note?: string;
}) {
    const footnotes = useFootnotes();
    const [open, setOpen] = useState(false);
    const tipId = useId();
    const numbers = sources.map((id) => footnotes.number(id));
    return <span className={`sc-ref${open ? " is-open" : ""}`} onMouseLeave={() => setOpen(false)}>
        <button type="button" aria-expanded={open} aria-describedby={tipId}
            aria-label={`Source ${numbers.join(", ")}`}
            onClick={() => setOpen((o) => !o)}
            onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}>
            <sup>{numbers.join(",")}</sup>
        </button>
        <span role="tooltip" id={tipId} className="sc-tip">
            {sources.map((id, i) => {
                const s = getSource(id);
                return <span key={id} className="sc-tip-src">
                    <b>{numbers[i]}</b>
                    <span>{s ? <><span className="sc-tip-pub">{s.publisher}</span>{s.title}</> : id}</span>
                </span>;
            })}
            <span className="sc-tip-meta">
                <span>As of {asOf}</span>
                <span className={`sc-conf sc-conf-${confidence}`}>{CONFIDENCE_LABEL[confidence]}</span>
            </span>
            {note ? <span className="sc-tip-note">{note}</span> : null}
            <a href={`#${footnoteAnchor(numbers[0] ?? 1)}`}>All sources</a>
        </span>
    </span>;
}

// A formatted number with its citation. Estimates read "~" with a dotted
// underline; models are dimmed and tagged; ranges read "12-18 kt".
export function SourcedValue({ value, format = formatSourced }: {
    value: Sourced<number>;
    format?: (v: Sourced<number>) => string;
}) {
    const c = value.confidence;
    return <span className={`sc-value sc-value-${c}`}>
        <span className="sc-num">{c === "estimated" ? "~" : ""}{format(value)}</span>
        {c === "modeled" ? <span className="sc-tag">model</span> : null}
        <FootnoteRef sources={value.sources} asOf={value.asOf} confidence={c} note={value.note} />
    </span>;
}
