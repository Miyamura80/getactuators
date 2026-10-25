import { useEffect } from "react";
import { PublicHeader } from "../../components/PublicHeader";
import { PublicFooter } from "../../components/PublicFooter";
import { ConfidenceLegend } from "../../components/supply-chain/ConfidenceLegend";
import { FootnotesProvider } from "../../components/supply-chain/footnotes";
import { MarketShareList } from "../../components/supply-chain/MarketShareList";
import { SourcedValue } from "../../components/supply-chain/SourcedValue";
import { SourcesSection } from "../../components/supply-chain/SourcesSection";
import { LeaderBars } from "../../components/supply-chain/LeaderBars";
import { OutOfTen } from "../../components/supply-chain/OutOfTen";
import { PlayersToNinety } from "../../components/supply-chain/PlayersToNinety";
import { WithoutLeader } from "../../components/supply-chain/WithoutLeader";
import { ScaleLadder } from "../../components/supply-chain/ScaleLadder";
import { UnitTranslation } from "../../components/supply-chain/UnitTranslation";
import { WaffleGrid } from "../../components/supply-chain/WaffleGrid";
import { COMPANIES, SEGMENTS, SEGMENT_LABEL } from "../../../../src/supply-chain/companies";
import { LAB_MINING_HHI, LAB_PATH, LAB_STAGE_SHARES } from "../../../../src/supply-chain/lab-fixtures";
import { marketOf } from "../../../../src/supply-chain/market-share";
import {
    EVS_PER_YEAR,
    DOMINANCE_MARKETS,
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

function market(id: string) {
    const m = DOMINANCE_MARKETS.find((x) => x.id === id);
    if (!m) throw new Error(`no market ${id}`);
    return m;
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
                        <section className="sc-lab-variant" id="perspective-d1">
                            <h3><b>D1</b>Out of ten</h3>
                            <p className="sc-lab-headline">9 of every 10 magnets are made in China.</p>
                            <OutOfTen rows={[
                                { market: market("mining"), icon: "ore", item: "tonnes of ore" },
                                { market: market("separation"), icon: "flask", item: "tonnes of refined oxide" },
                                { market: market("magnet"), icon: "magnet", item: "magnets" },
                            ]} />
                        </section>
                        <section className="sc-lab-variant" id="perspective-d2">
                            <h3><b>D2</b>The leader's share</h3>
                            <p className="sc-lab-headline">China controls magnets more tightly than Google controls search.</p>
                            <LeaderBars markets={DOMINANCE_MARKETS} />
                        </section>
                        <section className="sc-lab-variant" id="perspective-d3">
                            <h3><b>D3</b>Who makes 90%</h3>
                            <p className="sc-lab-headline">One country makes 9 in 10 magnets; smartphones need 8 or more companies.</p>
                            <PlayersToNinety markets={DOMINANCE_MARKETS.filter((m) => m.id !== "humanoids")} />
                        </section>
                        <section className="sc-lab-variant" id="perspective-d4">
                            <h3><b>D4</b>If China stopped</h3>
                            <p className="sc-lab-headline">Without China, 94% of magnet supply disappears.</p>
                            <WithoutLeader markets={["mining", "separation", "magnet"].map(market)} />
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
