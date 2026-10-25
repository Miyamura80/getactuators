import { useEffect } from "react";
import { PublicHeader } from "../../components/PublicHeader";
import { PublicFooter } from "../../components/PublicFooter";
import { ConfidenceLegend } from "../../components/supply-chain/ConfidenceLegend";
import { FootnotesProvider } from "../../components/supply-chain/footnotes";
import { MarketShareList } from "../../components/supply-chain/MarketShareList";
import { SourcedValue } from "../../components/supply-chain/SourcedValue";
import { SourcesSection } from "../../components/supply-chain/SourcesSection";
import { StageShareBar } from "../../components/supply-chain/StageShareBar";
import { COMPANIES, SEGMENTS, SEGMENT_LABEL } from "../../../../src/supply-chain/companies";
import { LAB_MINING_HHI, LAB_PATH, LAB_STAGE_SHARES } from "../../../../src/supply-chain/lab-fixtures";
import { marketOf } from "../../../../src/supply-chain/market-share";
import { getCompany, sitesOf } from "../../../../src/supply-chain/registry";
import type { Sourced } from "../../../../src/supply-chain/sourced";
import "../tools.css";
import "../../components/supply-chain/supply-chain.css";
import "./lab.css";

const TITLE = "Supply-chain kit";

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
                    <h2 id="sc-lab-conc"><span>01</span>Country share by stage</h2>
                    <StageShareBar rows={LAB_STAGE_SHARES.map((r) => ({
                        id: r.id,
                        label: r.label,
                        shares: r.shares.value,
                        source: r.shares,
                    }))} />
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
                    <h2 id="sc-lab-reg"><span>03</span>Registry · market share</h2>
                    <div className="sc-lab-segments">
                        {SEGMENTS.map((seg) => <section key={seg}>
                            <h3>{SEGMENT_LABEL[seg]}</h3>
                            <MarketShareList companies={COMPANIES.filter((c) => c.segment === seg)} market={marketOf(seg)} />
                        </section>)}
                    </div>
                </section>

                <SourcesSection />
            </main>
        </FootnotesProvider>
        <PublicFooter />
    </div>;
}
