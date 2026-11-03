import {
    type BrandSummary,
    CAPABILITIES,
    CAPABILITY_LABEL,
    DIMENSION_SHORT,
    timelineFor,
} from "../../../../src/sdk";
import { painPoints } from "../../../../src/sdk/evidence";
import { EvidenceItem } from "./Evidence";

const W = 640;
const H = 150;
const MID = 80;

// 5. Sentiment timeline: positive claims per month above the line, negative
// below, for the focused brand. A post can carry claims on several dimensions,
// so these count claims, not posts. Empty months are left as gaps.
export function SdkTimeline({ brand }: { brand: BrandSummary }) {
    const months = timelineFor(brand.brand.id);
    if (!months.length) return <p className="sdk-muted">No dated claims for {brand.brand.name} yet.</p>;
    const first = months[0]?.month ?? "";
    const last = months.at(-1)?.month ?? "";
    const idx = (m: string) => {
        const [y, mo] = m.split("-").map(Number);
        const [y0, m0] = first.split("-").map(Number);
        return ((y ?? 0) - (y0 ?? 0)) * 12 + ((mo ?? 1) - (m0 ?? 1));
    };
    const span = Math.max(1, idx(last) + 1);
    const bw = Math.max(2, (W - 20) / span - 1);
    const max = Math.max(1, ...months.map((m) => Math.max(m.positive, m.negative)));
    const h = (n: number) => (n / max) * (MID - 12);
    return <figure className="sdk-timeline">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Monthly positive and negative claims about ${brand.brand.name}, ${first} to ${last}`}>
            <line className="sdk-grid" x1={10} x2={W - 10} y1={MID} y2={MID} />
            {months.map((m) => {
                const x = 10 + (idx(m.month) / span) * (W - 20);
                return <g key={m.month} data-month={m.month}>
                    <title>{`${m.month}: ${m.positive} positive, ${m.negative} negative claims`}</title>
                    {m.positive ? <rect className="sdk-pos" x={x} width={bw} y={MID - h(m.positive)} height={h(m.positive)} /> : null}
                    {m.negative ? <rect className="sdk-neg" x={x} width={bw} y={MID} height={h(m.negative)} /> : null}
                </g>;
            })}
            <text className="sdk-tick" x={10} y={H - 4}>{first}</text>
            <text className="sdk-tick" x={W - 10} y={H - 4} textAnchor="end">{last}</text>
        </svg>
    </figure>;
}

// 6. Pain-point clusters: the brand's most repeated complaints by theme.
export function SdkPainPoints({ brand }: { brand: BrandSummary }) {
    const pains = painPoints(brand.brand.id);
    if (!pains.length) return <p className="sdk-muted">No recurring complaints found for {brand.brand.name}.</p>;
    return <ul className="sdk-pains">
        {pains.map((p) => <li key={`${p.dimension}-${p.theme}`}>
            <details>
                <summary>
                    <b>{p.theme.replace(/-/g, " ")}</b>
                    <span>{DIMENSION_SHORT[p.dimension]} · {p.count} post{p.count === 1 ? "" : "s"}</span>
                </summary>
                <ol className="sdk-evs">{p.examples.map((e) => <EvidenceItem key={e.id} e={e} />)}</ol>
            </details>
        </li>)}
    </ul>;
}

const MARK = { official: "●", community: "○", none: "" } as const;

// 7. Capability matrix: what ships for each brand, by the maker or the community.
export function SdkCapabilities({ rows }: { rows: BrandSummary[] }) {
    return <div className="sdk-heat-wrap">
        <table className="sdk-caps">
            <thead>
                <tr><th scope="col">Brand</th>{CAPABILITIES.map((c) => <th key={c} scope="col">{CAPABILITY_LABEL[c]}</th>)}</tr>
            </thead>
            <tbody>
                {rows.map((s) => <tr key={s.brand.id}>
                    <th scope="row">{s.brand.name}</th>
                    {CAPABILITIES.map((c) => {
                        const st = s.capabilities[c];
                        return <td key={c} className={`sdk-cap-${st}`} aria-label={`${CAPABILITY_LABEL[c]}: ${st === "none" ? "none found" : st}`}>{MARK[st]}</td>;
                    })}
                </tr>)}
            </tbody>
        </table>
        <p className="sdk-legend"><span>● maker</span><span>○ community only</span><span>blank: none found</span></p>
    </div>;
}
