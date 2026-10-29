import { countryName } from "../../../../src/country-flag";
import { concentration, type Shares } from "../../../../src/supply-chain/concentration";
import { percent } from "../../../../src/supply-chain/format";
import { isSourced, type Sourced } from "../../../../src/supply-chain/sourced";
import { Flag } from "../Flag";
import { COUNTRY_COLOR, COUNTRY_FALLBACK } from "../supply-chain/country-colors";
import { FootnoteRef } from "../supply-chain/SourcedValue";

// A compact metric chip for a flow node or company card:
//   idiot-index    finished cost over raw-material cost, "9.1x"
//   margin         gross margin, "38%"
//   concentration  the leading country's share of the stage, flag + meter
// A Sourced value keeps its confidence style and footnote.

export type NodeBadgeProps =
    | { kind: "idiot-index"; value: number | Sourced<number>; cite?: boolean }
    | { kind: "margin"; value: number | Sourced<number>; cite?: boolean }
    | { kind: "concentration"; shares: Shares | Sourced<Shares>; cite?: boolean };

type Cited = Pick<Sourced<unknown>, "sources" | "asOf" | "confidence" | "note">;

function unwrap<T>(v: T | Sourced<T>): { value: T; cited: Cited | null } {
    return isSourced(v) ? { value: (v as Sourced<T>).value, cited: v } : { value: v as T, cited: null };
}

export function idiotText(n: number): string {
    return `${n < 10 ? Number(n.toFixed(1)) : Math.round(n)}x`;
}

const IDIOT_GLYPH = <svg className="fk-badge-glyph" viewBox="0 0 12 12" aria-hidden="true"><path d="M1.5 11V8h3v3M7.5 11V2h3v9" /></svg>;
const MARGIN_GLYPH = <svg className="fk-badge-glyph" viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="4.6" /><path d="M6 6V1.4A4.6 4.6 0 0 1 10.6 6Z" className="is-fill" /></svg>;

export function NodeBadge(props: NodeBadgeProps) {
    const cite = props.cite ?? true;
    if (props.kind === "concentration") {
        const { value, cited } = unwrap(props.shares);
        const c = concentration(value);
        if (!c) return null;
        const { country, share } = c.top;
        const label = `${countryName(country)} ${percent(share)} of this stage`;
        return <span className={`fk-badge fk-badge-concentration${share >= 0.5 ? " is-dominant" : ""}${cited ? ` sc-value-${cited.confidence}` : ""}`} title={label}>
            <span className="fk-badge-body" role="img" aria-label={label}>
                <Flag code={country} decorative />
                <span className="fk-meter" aria-hidden="true"><i style={{ width: `${share * 100}%`, background: COUNTRY_COLOR[country] ?? COUNTRY_FALLBACK }} /></span>
                <span className="sc-num">{cited?.confidence === "estimated" ? "~" : ""}{percent(share)}</span>
            </span>
            {cite && cited ? <FootnoteRef {...cited} /> : null}
        </span>;
    }
    const { value, cited } = unwrap(props.value);
    const idiot = props.kind === "idiot-index";
    const text = idiot ? idiotText(value) : percent(value);
    const label = idiot ? `Idiot index ${text}: cost over raw-material cost` : `Gross margin ${text}`;
    return <span className={`fk-badge fk-badge-${props.kind}${cited ? ` sc-value-${cited.confidence}` : ""}`} title={label}>
        <span className="fk-badge-body" role="img" aria-label={label}>
            {idiot ? IDIOT_GLYPH : MARGIN_GLYPH}
            <span className="sc-num">{cited?.confidence === "estimated" ? "~" : ""}{text}</span>
        </span>
        {cited?.confidence === "modeled" ? <span className="sc-tag">model</span> : null}
        {cite && cited ? <FootnoteRef {...cited} /> : null}
    </span>;
}
