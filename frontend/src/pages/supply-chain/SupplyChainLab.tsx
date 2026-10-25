import { useEffect } from "react";
import { PublicHeader } from "../../components/PublicHeader";
import { PublicFooter } from "../../components/PublicFooter";
import { ConfidenceLegend } from "../../components/supply-chain/ConfidenceLegend";
import { FootnotesProvider } from "../../components/supply-chain/footnotes";
import { MarketShareList } from "../../components/supply-chain/MarketShareList";
import { SourcedValue } from "../../components/supply-chain/SourcedValue";
import { SourcesSection } from "../../components/supply-chain/SourcesSection";
import { CompetitorEquivalents } from "../../components/supply-chain/CompetitorEquivalents";
import { ScaleLadder } from "../../components/supply-chain/ScaleLadder";
import { UnitTranslation } from "../../components/supply-chain/UnitTranslation";
import { WaffleGrid } from "../../components/supply-chain/WaffleGrid";
import { COMPANIES, SEGMENTS, SEGMENT_LABEL } from "../../../../src/supply-chain/companies";
import { LAB_MINING_HHI, LAB_PATH, LAB_STAGE_SHARES } from "../../../../src/supply-chain/lab-fixtures";
import { marketOf } from "../../../../src/supply-chain/market-share";
import {
    EVS_PER_YEAR,
    EFFECTIVE_COMPETITORS,
    EQUIVALENT_METHOD_SOURCES,
    HIGHLY_CONCENTRATED_EQUIVALENT,
    HUMANOIDS_PER_YEAR,
    HUMANOIDS_SHIPPED_2025,
    MAGNET_CAPACITY,
    NDFEB_PER_EV,
    NDFEB_PER_HUMANOID,
    REVENUE_LADDER,
} from "../../../../src/supply-chain/perspective";
import { getCompany, sitesOf } from "../../../../src/supply-chain/registry";
import type { Sourced } from "../../../../src/supply-chain/sourced";
import "../tools.css";
import "../../components/supply-chain/supply-chain.css";
import "../../components/supply-chain/perspective.css";
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
                    <WaffleGrid rows={LAB_STAGE_SHARES.map((r) => ({ id: r.id, label: r.label, shares: r.shares.value, source: r.shares }))} />
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

                <section className="sc-lab-sec" aria-labelledby="sc-lab-persp">
                    <h2 id="sc-lab-persp"><span>03</span>Perspective</h2>
                    <div className="sc-lab-variants">
                        <section className="sc-lab-variant" id="perspective-a">
                            <h3><b>A</b>Scale ladder · revenue</h3>
                            <ScaleLadder points={REVENUE_LADDER} />
                        </section>
                        <section className="sc-lab-variant" id="perspective-b">
                            <h3><b>B</b>What it buys · magnets</h3>
                            <UnitTranslation
                                label="JL MAG Baotou project"
                                quantity={MAGNET_CAPACITY}
                                per={1_000_000}
                                rows={[
                                    { id: "humanoid", label: "Humanoids / yr", icon: "humanoid", perUnit: NDFEB_PER_HUMANOID, result: HUMANOIDS_PER_YEAR },
                                    { id: "ev", label: "Electric cars / yr", icon: "car", perUnit: NDFEB_PER_EV, result: EVS_PER_YEAR },
                                ]}
                                benchmark={{ label: "Humanoids shipped, 2025", icon: "humanoid", value: HUMANOIDS_SHIPPED_2025 }}
                            />
                        </section>
                        <section className="sc-lab-variant" id="perspective-d">
                            <h3><b>D</b>Effective competitors</h3>
                            <CompetitorEquivalents markets={EFFECTIVE_COMPETITORS} threshold={HIGHLY_CONCENTRATED_EQUIVALENT} methodSources={EQUIVALENT_METHOD_SOURCES} />
                        </section>
                    </div>
                </section>

                <section className="sc-lab-sec" aria-labelledby="sc-lab-reg">
                    <h2 id="sc-lab-reg"><span>04</span>Registry · market share</h2>
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
