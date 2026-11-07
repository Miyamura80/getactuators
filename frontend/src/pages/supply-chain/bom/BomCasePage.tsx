import { useCallback, useEffect, useMemo, useState } from "react";
import {
    BOM_AS_OF,
    BOM_CASES,
    BOM_PATH,
    type BomCase,
    bomCasePath,
    caseScene,
    flatten,
    partFor,
} from "../../../../../src/supply-chain/bom";
import { idiotText } from "../../../../../src/supply-chain/bom/format";
import { heroOf, usesOf } from "../../../../../src/supply-chain/bom/used-in";
import { CompanyDrawer } from "../../../components/flows/CompanyDrawer";
import { SupplyGraph } from "../../../components/flows/SupplyGraph";
import { ValueSankey } from "../../../components/flows/ValueSankey";
import { PublicFooter } from "../../../components/PublicFooter";
import { PublicHeader } from "../../../components/PublicHeader";
import { FootnotesProvider } from "../../../components/supply-chain/footnotes";
import { SourcedValue } from "../../../components/supply-chain/SourcedValue";
import { SourcesSection } from "../../../components/supply-chain/SourcesSection";
import { useSupplyChainSelection } from "../../../lib/supply-chain-selection";
import { ExplodeScene } from "../../../three";
import { BomHeroImage, SameDesign, UsedInLine } from "./BomUses";
import { MarginBar } from "./MarginBar";
import { SANKEY_DEPTH, caseModel, graphModel, makerOf, sankeyModel, shownAs } from "./model";
import { PartPanel, gramsText, money, usdText } from "./PartPanel";

// /bom/<slug>: one teardown in three linked views. Selecting a part in the
// 3D explode, the Sankey or the company graph selects it in the other two
// and opens it in the part panel; the selection lives in #node=<id>.

export function BomCasePage({ c, menuOpen }: { c: BomCase; menuOpen: boolean }) {
    const m = useMemo(() => caseModel(c), [c]);
    const scene = useMemo(() => caseScene(c), [c]);
    const known = useCallback((id: string) => m.known.has(id), [m]);
    const [selected, select] = useSupplyChainSelection("node", known);
    const [hover, setHover] = useState<string | null>(null);
    const [mode, setMode] = useState<"cost" | "raw">("cost");
    const [company, setCompany] = useState<string | null>(null);
    const [every, setEvery] = useState(false);
    const depth = every ? Number.POSITIVE_INFINITY : SANKEY_DEPTH;
    const flow = useMemo(() => sankeyModel(m, mode, depth), [m, mode, depth]);
    const uses = useMemo(() => usesOf(c), [c]);
    const graph = useMemo(() => graphModel(m), [m]);
    useEffect(() => {
        const prev = document.title;
        document.title = `${c.name}: bill of materials`;
        return () => { document.title = prev; };
    }, [c]);
    const root = m.metrics.get(c.root.id);
    const pick = (id: string | null) => select(id && id !== selected ? id : null);
    // A company card selects the top-most node it makes.
    const pickCompany = (id: string) => {
        const node = [...m.byId.values()].find((n) => n.makerIds?.[0] === id);
        if (node) select(node.id);
    };
    const partSel = selected ? partFor(c, selected) : null;
    const partHover = hover ? partFor(c, hover) : null;
    const others = BOM_CASES.filter((x) => x.slug !== c.slug);
    return <div className="tool-page bm-page">
        <PublicHeader path={BOM_PATH} initialOpen={menuOpen} />
        <FootnotesProvider>
            <main className="tool-main">
                <header className="tool-head bm-head">
                    <div className="bm-head-grid">
                    <BomHeroImage hero={heroOf(c, uses)} size="head" />
                    <div>
                    <p className="tool-kicker"><a href={BOM_PATH}>Bill of materials</a> · as of {BOM_AS_OF}</p>
                    <h1>{c.name}</h1>
                    <p className="tool-lede">{c.subject}. {c.why}</p>
                    <dl className="bm-stats">
                        <div><dt>Price</dt><dd><SourcedValue value={c.price} format={usdText} /></dd></div>
                        <div><dt>Raw material</dt><dd><span className="sc-num">{money(root?.raw ?? 0)}</span></dd></div>
                        <div><dt>Idiot index</dt><dd><b className="bm-idiot">{root?.idiot ? idiotText(root.idiot) : "n/a"}</b></dd></div>
                    </dl>
                    <p className="bm-takeaway">{c.takeaway}</p>
                    <UsedInLine uses={uses} max={4} />
                    <UsedInLine uses={uses} relation="same-design" max={4} />
                    <SameDesign uses={uses} />
                    </div>
                    </div>
                    <nav className="bm-cases" aria-label="Other cases">{others.map((x) => <a key={x.slug} href={bomCasePath(x.slug)}>{x.short}</a>)}</nav>
                </header>

                <section className="bm-top" aria-label="Exploded view and selected part">
                    <div className="bm-explode">
                        <ExplodeScene id={scene.id} title={scene.title} parts={scene.parts} stagger={scene.stagger}
                            drive="both" selectedId={partSel} highlightId={partHover}
                            onSelectPart={(id) => select(id)} />
                        <p className="bm-hint">Click a part or a numbered chip. Geometry is our model, sized to the sources.</p>
                    </div>
                    <PartPanel m={m} selected={selected} onSelect={select} onCompany={setCompany} />
                </section>

                <section className="bm-sec-block" aria-labelledby="bm-flow-h">
                    <div className="bm-sec-head">
                        <h2 id="bm-flow-h">Where the money goes</h2>
                        <div className="bm-sec-tools">
                            <div className="bm-toggle" role="radiogroup" aria-label="Flow">
                                <button type="button" role="radio" aria-checked={mode === "cost"} onClick={() => setMode("cost")}>Cost</button>
                                <button type="button" role="radio" aria-checked={mode === "raw"} onClick={() => setMode("raw")}>Raw material only</button>
                            </div>
                            <button type="button" className="bm-toggle-one" aria-pressed={every} onClick={() => setEvery((v) => !v)}>Every part</button>
                        </div>
                    </div>
                    <p className="bm-sub">{mode === "cost" ? "Band width is US$: raw materials on the left, the price on the right. What each step adds enters from the left as labour, energy and overhead, and as its maker's gross profit." : "Only the raw material inside each part, at the same scale. The gap to the price is the idiot index."}{every ? "" : " Smaller parts are folded into their module; show every part to unfold them."}</p>
                    <ValueSankey key={mode} nodes={flow.nodes} links={flow.links} label={`${c.name}, ${mode === "cost" ? "cost" : "raw material"}`}
                        format={money} valueMax={c.price.value} height={540}
                        selectedId={selected && m.byId.has(selected) ? shownAs(m, selected, depth) : selected} onSelectNode={pick} onHoverNode={setHover} />
                    <details className="bm-nodes">
                        <summary>Every part, its cost and idiot index</summary>
                        <div className="bm-nodes-wrap">
                            <table>
                                <thead><tr><th scope="col">Part</th><th scope="col">Qty</th><th scope="col">Mass</th><th scope="col">Unit cost</th><th scope="col">Raw material</th><th scope="col">Idiot index</th></tr></thead>
                                <tbody>{flatten(c.root).filter((p) => p.node.kind !== "material").map(({ node, depth, count }) => {
                                    const x = m.metrics.get(node.id);
                                    return <tr key={node.id} className={node.id === selected ? "is-selected" : undefined}>
                                        <th scope="row" style={{ paddingLeft: 8 + depth * 12 }}><button type="button" className="bm-link" onClick={() => select(node.id)}>{node.label}</button></th>
                                        <td className="sc-num">{count}</td>
                                        <td className="sc-num">{gramsText((x?.mass ?? 0) * count)}</td>
                                        <td className="sc-num">{node.unitCost ? money(node.unitCost.value) : "n/a"}</td>
                                        <td className="sc-num">{money((x?.raw ?? 0) * count)}</td>
                                        <td className="sc-num">{x?.idiot ? idiotText(x.idiot) : "n/a"}</td>
                                    </tr>;
                                })}</tbody>
                            </table>
                        </div>
                    </details>
                </section>

                <section className="bm-sec-block" aria-labelledby="bm-chain-h">
                    <h2 id="bm-chain-h">Who makes it</h2>
                    <p className="bm-sub">Each maker once, linked to the maker it sells to. Dashed links are reported by analysts or stand in for a supplier that is not public.</p>
                    <SupplyGraph nodes={graph.nodes} edges={graph.edges} label={`Companies in the ${c.name}`}
                        selectedId={selected ? makerOf(m, selected) : null} onSelectNode={pickCompany} />
                </section>

                <section className="bm-sec-block" aria-labelledby="bm-margin-h">
                    <h2 id="bm-margin-h">Who keeps the price</h2>
                    <p className="bm-sub">Each maker's gross profit on what it sells into this actuator, as a share of the price. Company-wide margins, not product lines.</p>
                    <MarginBar c={c} onCompany={setCompany} />
                </section>

                <details className="bm-method">
                    <summary>Method</summary>
                    <ul>
                        <li><b>Price</b> {c.volumeAssumption}</li>
                        <li><b>Part costs</b> Cited where a source gives them; otherwise a published share of the price (less the assembler's margin where it is known), marked as a model. Bought-in chips and bearings use distributor listings for a comparable part. Parts with no public cost carry only their raw material.</li>
                        <li><b>Cost stack</b> A priced part's cost split into its raw material, what the tiers below added, its own labour, energy and overhead, and its maker's gross profit at the company's latest margin.</li>
                        <li><b>Routes</b> The usual steps from raw material to each part, in our words, not the maker's process sheet.</li>
                        <li><b>Mass</b> Modeled parts weigh {Math.round(root?.mass ?? 0)} g{c.massG ? ` against the published ${Math.round(c.massG.value)} g` : ""}.</li>
                        <li><b>Raw material</b> Grams from our model of each part's geometry times cited densities, priced at {c.month} with /metals for rare earths and cited readings for copper, aluminium, steels and silicon.</li>
                        <li><b>Idiot index</b> A part's cost over the raw material in it. The step markup is a part's cost over what its inputs cost, shown only when every input has a cost.</li>
                        <li><b>Makers</b> Named when a filing, the maker or the press says so. Where the supplier is not public, a typical listed maker of that part stands in for its margin.</li>
                    </ul>
                </details>
                <p className="bm-foot"><a href={`${bomCasePath(c.slug)}.md`}>Read as a table</a> · <a href={`/api/v1/bom/${c.slug}`}>Get the data</a>{c.actuatorId ? <> · <a href={`/actuators/${c.actuatorId}`}>Catalog entry</a></> : null}</p>
                <SourcesSection />
            </main>
            <CompanyDrawer companyId={company} onClose={() => setCompany(null)} />
        </FootnotesProvider>
        <PublicFooter />
    </div>;
}
