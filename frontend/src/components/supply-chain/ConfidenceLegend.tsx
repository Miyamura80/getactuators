import { CONFIDENCE_LABEL, CONFIDENCES } from "../../../../src/supply-chain/sourced";

const SAMPLE = { reported: "12 kt", estimated: "~12 kt", modeled: "12 kt" } as const;

// The three ways a number can look, shown once per page.
export function ConfidenceLegend() {
    return <ul className="sc-legend" aria-label="How numbers are marked">
        {CONFIDENCES.map((c) => <li key={c}>
            <span className={`sc-value sc-value-${c}`}>
                <span className="sc-num">{SAMPLE[c]}</span>
                {c === "modeled" ? <span className="sc-tag">model</span> : null}
            </span>
            <span className="sc-legend-label">{CONFIDENCE_LABEL[c]}</span>
        </li>)}
    </ul>;
}
