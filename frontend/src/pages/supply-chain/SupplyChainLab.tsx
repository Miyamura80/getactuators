import { useEffect } from "react";
import { PublicHeader } from "../../components/PublicHeader";
import { PublicFooter } from "../../components/PublicFooter";
import { ConcentrationBadge } from "../../components/supply-chain/ConcentrationBadge";
import { ConfidenceLegend } from "../../components/supply-chain/ConfidenceLegend";
import { FootnotesProvider } from "../../components/supply-chain/footnotes";
import { SourcedValue } from "../../components/supply-chain/SourcedValue";
import { SourcesSection } from "../../components/supply-chain/SourcesSection";
import { StageShareBar } from "../../components/supply-chain/StageShareBar";
import { COMPANIES, SEGMENTS, SEGMENT_LABEL } from "../../../../src/supply-chain/companies";
import { LEVELS } from "../../../../src/supply-chain/concentration";
import { LAB_MINING_HHI, LAB_PATH, LAB_STAGE_SHARES, LAB_SYNTHETIC_SHARES } from "../../../../src/supply-chain/lab-fixtures";
import { getCompany, linksOf, sitesOf } from "../../../../src/supply-chain/registry";
import type { Sourced } from "../../../../src/supply-chain/sourced";
import "../tools.css";
import "../../components/supply-chain/supply-chain.css";
import "./lab.css";

const TITLE = "Supply-chain kit";

const THRESHOLD: Record<(typeof LEVELS)[number], string> = {
    monopolized: "top ≥ 70%",
    concentrated: "HHI ≥ 2,500",
    moderate: "HHI 1,500-2,499",
    distributed: "HHI < 1,500",
};

function readouts(): { label: string; value: Sourced<number> }[] {
    const pick = (label: string, v: Sourced<number> | undefined) => (v ? [{ label, value: v }] : []);
    return [
        ...pick("MP Materials revenue", getCompany("mp-materials")?.revenue),
        ...pick("Northern Rare Earth revenue", getCompany("china-northern-rare-earth")?.revenue),
        ...pick("JL MAG Baotou project", sitesOf("jl-mag").find((s) => s.capacity)?.capacity),
        ...pick("Rare earth mining HHI", LAB_MINING_HHI),
    ];
}

// Hidden QA page: every shared supply-chain component, rendered with cited
// fixtures. Noindex; not in the sitemap or llms.txt.
export function SupplyChainLab({ menuOpen = false }: { menuOpen?: boolean }) {
    useEffect(() => {
        const prev = document.title;
        document.title = TITLE;
        return () => { document.title = prev; };
    }, []);
    return <div className="tool-page sc-lab">
        <PublicHeader path={LAB_PATH} initialOpen={menuOpen} supplyChainPreview />
        <FootnotesProvider>
            <main className="tool-main">
                <header className="tool-head">
                    <p className="tool-kicker">Lab · not indexed</p>
                    <h1>Supply-chain kit</h1>
                </header>

                <section className="sc-lab-sec" aria-labelledby="sc-lab-conc">
                    <h2 id="sc-lab-conc"><span>01</span>Concentration</h2>
                    <StageShareBar rows={[
                        ...LAB_STAGE_SHARES.map((r) => ({
                            id: r.id,
                            label: r.label,
                            shares: r.shares.value,
                            source: r.shares,
                        })),
                        ...LAB_SYNTHETIC_SHARES.map((r) => ({ ...r, tag: "synthetic" })),
                    ]} />
                    <ul className="sc-lab-levels">
                        {LEVELS.map((level) => <li key={level}>
                            <ConcentrationBadge level={level} />
                            <span>{THRESHOLD[level]}</span>
                        </li>)}
                    </ul>
                </section>

                <section className="sc-lab-sec" aria-labelledby="sc-lab-cite">
                    <h2 id="sc-lab-cite"><span>02</span>Citations</h2>
                    <ConfidenceLegend />
                    <dl className="sc-lab-readouts">
                        {readouts().map((r) => <div key={r.label}>
                            <dt>{r.label}</dt>
                            <dd><SourcedValue value={r.value} /></dd>
                        </div>)}
                    </dl>
                </section>

                <section className="sc-lab-sec" aria-labelledby="sc-lab-reg">
                    <h2 id="sc-lab-reg"><span>03</span>Registry</h2>
                    <div className="sc-lab-segments">
                        {SEGMENTS.map((seg) => <section key={seg}>
                            <h3>{SEGMENT_LABEL[seg]}</h3>
                            <ul>
                                {COMPANIES.filter((c) => c.segment === seg).map((c) => {
                                    const links = linksOf(c.id);
                                    const n = links.supplies.length + links.buys.length;
                                    return <li key={c.id}>
                                        <span className="sc-cc">{c.hqCountry}</span>
                                        <span className="sc-lab-name">{c.name}</span>
                                        <span className="sc-lab-meta" title={`${sitesOf(c.id).length} sites, ${n} supply links`}>
                                            {sitesOf(c.id).length}
                                            <svg viewBox="0 0 10 10" aria-hidden="true"><path d="M5 1.2a2.8 2.8 0 0 1 2.8 2.8C7.8 6 5 8.8 5 8.8S2.2 6 2.2 4A2.8 2.8 0 0 1 5 1.2Z" /></svg>
                                            {n > 0 ? <>{n}<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M1 5h7M5.5 2.5 8 5 5.5 7.5" /></svg></> : null}
                                        </span>
                                    </li>;
                                })}
                            </ul>
                        </section>)}
                    </div>
                </section>

                <SourcesSection />
            </main>
        </FootnotesProvider>
        <PublicFooter />
    </div>;
}
