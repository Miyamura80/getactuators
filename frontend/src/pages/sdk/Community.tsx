import { DIMENSIONS, type BrandScore, SDK_EVIDENCE, mentionTimeline, themeClusters } from "../../../../src/sdk";
import { EvidenceLink } from "./shared";

// 05 and 06: what developers say. Posts are tagged by keyword; polarity
// (positive / negative) needs the classifier to pass its gold set first, so
// until then the timeline counts mentions and the clusters are themes.

const classified = () => SDK_EVIDENCE.classifier.status === "ok";

export function Timeline({ brand }: { brand: BrandScore | null }) {
    const series = mentionTimeline(brand?.brand);
    const byYear = new Map<string, number>();
    for (const m of series) byYear.set(m.month.slice(0, 4), (byYear.get(m.month.slice(0, 4)) ?? 0) + m.count);
    const years = [...byYear.entries()];
    const max = Math.max(1, ...years.map(([, n]) => n));
    if (years.length === 0)
        return <p className="sdk-note">No forum posts collected for {brand?.name ?? "any brand"} yet.</p>;
    return <div className="sdk-timeline">
        <ol aria-label={`Forum posts per year${brand ? ` for ${brand.name}` : ""}`}>
            {years.map(([year, n]) => <li key={year} title={`${year}: ${n} post${n === 1 ? "" : "s"}`}>
                <span className="sdk-tl-bar" style={{ height: `${(n / max) * 100}%` }} />
                <span className="sdk-tl-n">{n}</span>
                <span className="sdk-tl-y">{year}</span>
            </li>)}
        </ol>
        <p className="sdk-note">{classified() ? "Positive and negative split by the classifier." : "Mentions only: polarity is not labelled until the classifier passes its gold set (see Method)."} Monthly counts are in the API.</p>
    </div>;
}

export function Themes({ brand }: { brand: BrandScore | null }) {
    if (!brand) return <p className="sdk-note">Pick a brand in the leaderboard to see what its posts discuss.</p>;
    const clusters = themeClusters(brand.brand);
    if (clusters.length === 0)
        return <p className="sdk-note">No SDK-related forum posts found for {brand.name} in the sources that could be reached.</p>;
    return <div className="sdk-themes">
        {clusters.map((c) => <details key={c.dimension} className="sdk-theme">
            <summary><span>{DIMENSIONS.find((d) => d.id === c.dimension)?.label}</span><b>{c.count}</b></summary>
            <ul>{c.examples.map((e) => <EvidenceLink key={e.id} e={e} />)}</ul>
        </details>)}
    </div>;
}
