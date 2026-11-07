import { useEffect, useMemo, useState } from "react";
import { BOM_AS_OF, BOM_CASES, BOM_PATH, bomCasePath, caseWithNode } from "../../../../../src/supply-chain/bom";
import { idiotText } from "../../../../../src/supply-chain/bom/format";
import { usesOf } from "../../../../../src/supply-chain/bom/used-in";
import { ValueSankey } from "../../../components/flows/ValueSankey";
import { PublicFooter } from "../../../components/PublicFooter";
import { PublicHeader } from "../../../components/PublicHeader";
import { FootnotesProvider } from "../../../components/supply-chain/footnotes";
import { SourcedValue } from "../../../components/supply-chain/SourcedValue";
import { SourcesSection } from "../../../components/supply-chain/SourcesSection";
import { readSelection } from "../../../lib/supply-chain-selection";
import { BomUses } from "./BomUses";
import { MarginBar } from "./MarginBar";
import { caseModel, topSankey } from "./model";
import { money, usdText } from "./PartPanel";

const TITLE = "What an actuator is really made of";

// /bom: the three teardowns side by side. #node=<id> (the link from a
// /manufacturing step) forwards to the first case with that node.
export function BomIndex({ menuOpen }: { menuOpen: boolean }) {
    const models = useMemo(() => BOM_CASES.map(caseModel), []);
    const [compare, setCompare] = useState(false);
    useEffect(() => {
        const node = readSelection(window.location.hash, "node");
        const c = node ? caseWithNode(node) : undefined;
        if (c && node) window.location.replace(`${bomCasePath(c.slug)}#node=${encodeURIComponent(node)}`);
    }, []);
    useEffect(() => {
        const prev = document.title;
        document.title = "Bill of materials";
        return () => { document.title = prev; };
    }, []);
    const max = Math.max(...BOM_CASES.map((c) => c.price.value));
    return <div className="tool-page bm-page">
        <PublicHeader path={BOM_PATH} initialOpen={menuOpen} />
        <FootnotesProvider>
            <main className="tool-main">
                <header className="tool-head bm-head">
                    <p className="tool-kicker">Supply chain · Bill of materials · as of {BOM_AS_OF}</p>
                    <h1>{TITLE}</h1>
                    <p className="tool-lede">Three actuators taken apart, part by part: what each costs, the raw material inside, how it is made, who makes it and who keeps the price.</p>
                </header>
                <ol className="bm-grid">
                    {models.map(({ c, metrics }) => {
                        const root = metrics.get(c.root.id);
                        return <li key={c.slug} className="bm-card">
                            <a className="bm-card-link" href={bomCasePath(c.slug)}>
                                <span className="bm-card-kicker">{c.short}</span>
                                <span className="bm-card-name">{c.name}</span>
                            </a>
                            <BomUses uses={usesOf(c)} compact max={4} />
                            <dl className="bm-stats is-card">
                                <div><dt>Price</dt><dd><SourcedValue value={c.price} format={usdText} /></dd></div>
                                <div><dt>Raw material</dt><dd><span className="sc-num">{money(root?.raw ?? 0)}</span></dd></div>
                                <div><dt>Idiot index</dt><dd><b className="bm-idiot">{root?.idiot ? idiotText(root.idiot) : "n/a"}</b></dd></div>
                            </dl>
                            <p className="bm-card-take">{c.takeaway}</p>
                            <MarginBar c={c} compact />
                        </li>;
                    })}
                </ol>
                <section className="bm-sec-block" aria-labelledby="bm-compare-h">
                    <div className="bm-sec-head">
                        <h2 id="bm-compare-h">Flows at one scale</h2>
                        <button type="button" className="bm-toggle-one" aria-pressed={compare} onClick={() => setCompare((v) => !v)}>{compare ? "Hide" : "Compare"}</button>
                    </div>
                    <p className="bm-sub">The parts each actuator is built from, drawn against the most expensive case so band widths compare across actuators.</p>
                    {compare ? <div className="bm-compare">
                        {models.map((m) => {
                            const f = topSankey(m);
                            return <div key={m.c.slug} className="bm-compare-one">
                                <h3><a href={bomCasePath(m.c.slug)}>{m.c.short}</a></h3>
                                <ValueSankey nodes={f.nodes} links={f.links} label={m.c.name} format={money} valueMax={max} height={260} orientation="horizontal" />
                            </div>;
                        })}
                    </div> : null}
                </section>
                <details className="bm-method">
                    <summary>How to read this</summary>
                    <ul>
                        <li><b>Idiot index</b> The price over the cost of the raw material inside: Musk's test for how much a part is marked up over its metal.</li>
                        <li><b>Who keeps the price</b> Each named or typical maker's gross profit on what it sells into the actuator. The rest pays for labour, energy, machines and margins we cannot name.</li>
                        <li><b>Estimates</b> Most part costs are models from published shares of an actuator's cost, and bought-in chips use distributor prices for comparable parts; every figure links to its source.</li>
                        <li><b>Photos</b> Robots and actuators that use each design, from the site's own catalog photos. A drawn placeholder marks a robot the site has no photo of.</li>
                    </ul>
                </details>
                <p className="bm-foot"><a href={`${BOM_PATH}.md`}>Read as a table</a> · <a href="/api/v1/bom">Get the data</a></p>
                <SourcesSection />
            </main>
        </FootnotesProvider>
        <PublicFooter />
    </div>;
}
