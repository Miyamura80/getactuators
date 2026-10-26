import { useId } from "react";
import { formatSourced } from "../../../../src/supply-chain/format";
import { CONFIDENCE_LABEL, type Confidence, type Sourced, type SourceId } from "../../../../src/supply-chain/sourced";
import { getSource } from "../../../../src/supply-chain/sources";
import { footnoteAnchor, useFootnotes } from "./footnotes";

// Superscript footnote links for a set of sources. Hover or focus shows a
// card with publisher, title, as-of date and confidence; a click or tap
// jumps to the entry in <SourcesSection>, opening it if collapsed.
export function FootnoteRef({ sources, asOf, confidence, note }: {
    sources: readonly SourceId[];
    asOf: string;
    confidence: Confidence;
    note?: string;
}) {
    const footnotes = useFootnotes();
    const tipId = useId();
    const numbers = sources.map((id) => footnotes.number(id));
    return <span className="sc-ref">
        <sup>
            {numbers.map((n, i) => <span key={n}>{i > 0 ? "," : null}<a href={`#${footnoteAnchor(n)}`}
                aria-describedby={tipId} aria-label={`Source ${n}`}>{n}</a></span>)}
        </sup>
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
