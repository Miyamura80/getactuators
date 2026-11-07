import type { ReactNode } from "react";
import { BOM_KIND_LABEL, type BomNode, materialLabel, materialPrice, materialTotals } from "../../../../../src/supply-chain/bom";
import { idiotText } from "../../../../../src/supply-chain/bom/format";
import { formatValue } from "../../../../../src/supply-chain/format";
import { chainOfStep } from "../../../../../src/supply-chain/processes";
import { getCompany } from "../../../../../src/supply-chain/registry";
import { CONFIDENCE_LABEL, type Sourced } from "../../../../../src/supply-chain/sourced";
import { NodeBadge } from "../../../components/flows/NodeBadge";
import { ProcessStepChip, stepLabel } from "../../../components/flows/ProcessStepChip";
import { StageShareBar } from "../../../components/flows/StageShareBar";
import { Flag } from "../../../components/Flag";
import { FootnoteRef, SourcedValue } from "../../../components/supply-chain/SourcedValue";
import { type CaseModel, materialLeaves, stageSharesFor } from "./model";

// The selected part: what it costs, what it is made of, who makes it and how
// it is made. With nothing selected it shows the whole actuator.

export const money = (n: number): string => (n < 1 ? `$${n.toFixed(2)}` : n < 100 ? `$${n.toFixed(1)}` : formatValue(n, "USD"));
// "$769 ($437-1,100)": a cited US$ figure with its range spelled out.
export const usdText = (v: Sourced<number>): string => (v.range ? `${money(v.value)} (${money(v.range[0])}-${money(v.range[1])})` : money(v.value));
const gramsText = (g: number): string => (g < 1 ? `${g.toFixed(2)} g` : `${Math.round(g)} g`);

function Row({ label, children }: { label: string; children: ReactNode }) {
    return <div className="bm-row"><dt>{label}</dt><dd>{children}</dd></div>;
}

const ATTRIBUTION: Record<string, string> = {
    reported: "named by the maker",
    estimated: "named by analysts or press",
    modeled: "typical maker, stands in",
};

function Makers({ node, onCompany }: { node: BomNode; onCompany: (id: string) => void }) {
    const makers = (node.makerIds ?? []).flatMap((id) => {
        const c = getCompany(id);
        return c ? [c] : [];
    });
    const alts = (node.alternateMakerIds ?? []).flatMap((id) => {
        const c = getCompany(id);
        return c ? [c] : [];
    });
    if (makers.length === 0 && alts.length === 0 && !node.makerNote) return null;
    return <section className="bm-sec" aria-label="Maker">
        <h4>Maker</h4>
        {makers.map((c) => <p key={c.id} className="bm-maker">
            <button type="button" className="bm-link" onClick={() => onCompany(c.id)}><Flag code={c.hqCountry} decorative /> {c.name}</button>
            {c.grossMargin ? <NodeBadge kind="margin" value={c.grossMargin} /> : null}
            {node.makerConfidence ? <span className={`bm-tag is-${node.makerConfidence}`}>{ATTRIBUTION[node.makerConfidence]}</span> : null}
        </p>)}
        {node.makerNote ? <p className="bm-note">{node.makerNote}</p> : null}
        {alts.length ? <p className="bm-alts"><span>Also makes it</span>{alts.map((c) => <button key={c.id} type="button" className="bm-chip" onClick={() => onCompany(c.id)}><Flag code={c.hqCountry} decorative /> {c.name}</button>)}</p> : null}
    </section>;
}

function Steps({ ids }: { ids: readonly string[] }) {
    if (ids.length === 0) return null;
    return <section className="bm-sec" aria-label="How it is made">
        <h4>How it is made</h4>
        <p className="bm-steps">{ids.map((id) => <ProcessStepChip key={id} stepId={id} label={chainOfStep(id)?.steps.find((x) => x.id === id)?.label ?? stepLabel(id)} />)}</p>
    </section>;
}

function NodeBody({ m, node, onSelect, onCompany }: { m: CaseModel; node: BomNode; onSelect: (id: string) => void; onCompany: (id: string) => void }) {
    const x = m.metrics.get(node.id);
    const count = x?.count ?? 1;
    const grams = node.material ? node.material.massG.value * count : undefined;
    const price = node.material ? materialPrice(node.material.seriesId, m.c.month) : null;
    const shares = stageSharesFor(node);
    const kids = node.children ?? [];
    return <>
        <dl className="bm-figs">
            {node.unitCost ? <Row label="Unit cost"><SourcedValue value={node.unitCost} format={usdText} /></Row> : node.kind !== "material" ? <Row label="Unit cost"><span className="bm-gap">not public</span></Row> : null}
            {count > 1 ? <Row label="In one actuator">{count}</Row> : null}
            {node.material ? <Row label="Mass"><SourcedValue value={node.material.massG} format={() => gramsText(grams ?? 0)} /></Row> : null}
            {price ? <Row label="Price per kg"><SourcedValue value={price.price} /></Row> : null}
            <Row label="Raw material">{money((x?.raw ?? 0) * count)}</Row>
            {x?.idiot ? <Row label="Idiot index"><NodeBadge kind="idiot-index" value={x.idiot} cite={false} /></Row> : null}
            {x?.step ? <Row label="Step markup"><span className="sc-num">{idiotText(x.step)}</span></Row> : null}
        </dl>
        {node.note ? <p className="bm-note">{node.note}</p> : null}
        {node.references?.length ? <section className="bm-sec" aria-label="Cross-checks">
            <h4>Cross-checks</h4>
            <dl className="bm-figs">{node.references.map((r) => <Row key={r.label} label={r.label}><SourcedValue value={r.value} format={usdText} /></Row>)}</dl>
        </section> : null}
        <Makers node={node} onCompany={onCompany} />
        <Steps ids={node.processStepIds ?? []} />
        {shares ? <section className="bm-sec" aria-label="Where this stage happens"><h4>Where this stage happens</h4><StageShareBar shares={shares} label="Country shares of this stage" /></section> : null}
        {kids.length ? <section className="bm-sec" aria-label="Inside">
            <h4>Inside</h4>
            <ul className="bm-kids">{kids.map((k) => {
                const kx = m.metrics.get(k.id);
                return <li key={k.id}><button type="button" className="bm-link" onClick={() => onSelect(k.id)}>{k.label}{k.qty && k.qty > 1 ? ` x${k.qty}` : ""}</button><span className="sc-num">{kx?.cost !== null && kx?.cost !== undefined ? money(kx.cost * (k.qty ?? 1)) : "n/a"}</span></li>;
            })}</ul>
        </section> : null}
        <p className="bm-src">Structure: <FootnoteRef sources={node.sources} asOf={m.c.month} confidence={node.inferred ? "estimated" : "reported"} note={node.inferred ? "Layout or geometry inferred, not seen in a teardown." : undefined} /></p>
    </>;
}

function MaterialBody({ m, seriesId, onSelect }: { m: CaseModel; seriesId: string; onSelect: (id: string) => void }) {
    const total = materialTotals(m.c).find((t) => t.seriesId === seriesId);
    const price = materialPrice(seriesId, m.c.month);
    const leaves = materialLeaves(m, seriesId);
    return <>
        <dl className="bm-figs">
            <Row label="In one actuator">{gramsText(total?.grams ?? 0)} <span className="sc-tag">model</span></Row>
            {price ? <Row label="Price per kg"><SourcedValue value={price.price} /></Row> : null}
            {price?.carried ? <Row label="Reading">carried forward</Row> : null}
            <Row label="Cost">{money(total?.cost ?? 0)}</Row>
        </dl>
        <section className="bm-sec" aria-label="Used in">
            <h4>Used in</h4>
            <ul className="bm-kids">{leaves.map((l) => <li key={l.id}><button type="button" className="bm-link" onClick={() => onSelect(l.id)}>{l.label}</button><span className="sc-num">{gramsText((l.material?.massG.value ?? 0) * (m.metrics.get(l.id)?.count ?? 1))}</span></li>)}</ul>
        </section>
    </>;
}

export function PartPanel({ m, selected, onSelect, onCompany }: {
    m: CaseModel;
    selected: string | null;
    onSelect: (id: string | null) => void;
    onCompany: (id: string) => void;
}) {
    const node = selected ? m.byId.get(selected) : undefined;
    const series = !node && selected?.startsWith("m-") ? selected.slice(2) : null;
    const target = node ?? m.c.root;
    const title = series ? materialLabel(series) : target.label;
    const kind = series ? "Raw material" : BOM_KIND_LABEL[target.kind];
    return <aside className="bm-panel" aria-label="Selected part" aria-live="polite">
        <header>
            <p className="bm-kicker">{kind}{target.inferred && !series ? <span className="bm-tag" title="Layout or geometry inferred, not seen in a teardown">inferred</span> : null}{!node && !series ? " · whole actuator" : ""}</p>
            <h3>{title}</h3>
            {node && node.id !== m.c.root.id ? <button type="button" className="bm-clear" onClick={() => onSelect(null)}>Show whole actuator</button> : null}
        </header>
        {series ? <MaterialBody m={m} seriesId={series} onSelect={onSelect} /> : <NodeBody m={m} node={target} onSelect={onSelect} onCompany={onCompany} />}
        {node?.unitCost && node.unitCost.confidence !== "reported" ? <p className="bm-conf">{CONFIDENCE_LABEL[node.unitCost.confidence]}: {node.unitCost.note}</p> : null}
    </aside>;
}
