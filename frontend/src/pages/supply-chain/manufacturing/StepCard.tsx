import { useEffect, useMemo, useRef } from "react";
import { SUPPLY_CHAIN_PAGES_LIVE } from "../../../../../src/public-navigation";
import { getMetal } from "../../../../../src/supply-chain/metals/elements";
import {
    MANUFACTURING_AS_OF,
    type ProcessChain,
    type ProcessStep,
    neighbours,
    sharesOf,
} from "../../../../../src/supply-chain/processes";
import { PRODUCT_ID } from "../../../../../src/supply-chain/processes/layout";
import { getCompany } from "../../../../../src/supply-chain/registry";
import { STAGE_LABEL, type Stage } from "../../../../../src/supply-chain/stages";
import { ConcentrationBadge } from "../../../components/flows/ConcentrationBadge";
import { ProcessIconSvg, StageIconSvg } from "../../../components/flows/process-icons";
import { StageShareBar } from "../../../components/flows/StageShareBar";
import { SupplyGraph } from "../../../components/flows/SupplyGraph";
import { Flag } from "../../../components/Flag";
import { FootnoteRef, SourcedValue } from "../../../components/supply-chain/SourcedValue";
import { ExplodeScene, ProcessLoop } from "../../../three";

const BOM_LIVE = SUPPLY_CHAIN_PAGES_LIVE.has("/bom");

function CloseIcon() {
    return <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>;
}

function Arrow({ dir }: { dir: "prev" | "next" }) {
    return <svg viewBox="0 0 16 16" aria-hidden="true"><path d={dir === "next" ? "M6 3l5 5-5 5" : "M10 3L5 8l5 5"} /></svg>;
}

function BomLink({ id }: { id: string }) {
    const text = id.replace(/-/g, " ");
    return BOM_LIVE
        ? <a className="mf-chip" href={`/bom#node=${encodeURIComponent(id)}`}>BOM · {text}</a>
        : <span className="mf-chip is-soon" title="Bill of materials page coming soon">BOM · {text}</span>;
}

function WhoDoesIt({ step, stage, onCompany }: { step: ProcessStep; stage: Stage | undefined; onCompany: (id: string) => void }) {
    const companies = useMemo(() => step.companyIds.flatMap((id) => {
        const c = getCompany(id);
        return c ? [c] : [];
    }), [step.companyIds]);
    const nodes = useMemo(() => [
        ...companies.map((c) => ({ id: c.id, name: c.name, country: c.hqCountry, stage })),
        { id: step.id, name: step.label },
    ], [companies, step, stage]);
    const edges = useMemo(() => companies.map((c) => ({ from: c.id, to: step.id, label: step.outputs[0] })), [companies, step]);
    if (companies.length === 0) return null;
    return <section className="mf-card-sec" aria-label="Who does it">
        <h4>Who</h4>
        <ul className="mf-who">
            {companies.map((c) => <li key={c.id}>
                <button type="button" onClick={() => onCompany(c.id)}><Flag code={c.hqCountry} decorative /> {c.name}</button>
            </li>)}
        </ul>
        {companies.length > 1 ? <details className="mf-who-graph">
            <summary>Graph</summary>
            <SupplyGraph nodes={nodes} edges={edges} label={`Companies running ${step.label}`} onSelectNode={(id) => { if (id !== step.id) onCompany(id); }} />
        </details> : null}
    </section>;
}

export interface StepCardProps {
    chain: ProcessChain;
    stepId: string;
    onClose: () => void;
    onStep: (id: string) => void;
    onCompany: (id: string) => void;
    mode: "panel" | "sheet";
}

// The focused step: its looping 3D vignette (one live WebGL context; posters
// elsewhere), two or three cited numbers, who runs it, where the stage is
// concentrated, and links to /bom and /metals.
export function StepCard({ chain, stepId, onClose, onStep, onCompany, mode }: StepCardProps) {
    const ref = useRef<HTMLElement>(null);
    const step = chain.steps.find((s) => s.id === stepId);
    const ordered = chain.steps;
    const index = ordered.findIndex((s) => s.id === stepId);
    useEffect(() => {
        ref.current?.focus({ preventScroll: true });
    }, [stepId]);
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    if (stepId === PRODUCT_ID) {
        return <aside ref={ref} tabIndex={-1} className={`mf-card is-${mode}`} aria-label="Product">
            <header className="mf-card-head">
                <span className="mf-card-kicker">Product</span>
                <h3>Rotor segment</h3>
                <button type="button" className="mf-card-close" aria-label="Close" title="Close" onClick={onClose}><CloseIcon /></button>
            </header>
            {chain.productScene ? <ExplodeScene {...chain.productScene} className="mf-card-3d" defaultExplode={0.6} /> : null}
            <p className="mf-card-caption">{chain.product}.</p>
            {chain.productBomNodeId ? <div className="mf-links"><BomLink id={chain.productBomNodeId} /></div> : null}
        </aside>;
    }
    if (!step) return null;
    const cluster = chain.clusters.find((c) => c.id === step.cluster);
    const shares = sharesOf(step.shares);
    const { prev, next } = neighbours(chain, step.id);
    // neighbours() lists main-line steps first; the last step leads to the product.
    const prevId = prev[0];
    const nextId = next[0] ?? PRODUCT_ID;
    const label = (id: string | undefined) => (id === PRODUCT_ID ? "Rotor segment" : chain.steps.find((s) => s.id === id)?.label);
    return <aside ref={ref} tabIndex={-1} className={`mf-card is-${mode}`} aria-label={step.label} data-step={step.id}>
        <header className="mf-card-head">
            <span className="mf-card-kicker">{cluster ? <><StageIconSvg stage={cluster.stage} className="mf-stage-svg is-kicker" />{STAGE_LABEL[cluster.stage]}</> : ""} · {index + 1}/{ordered.length}</span>
            <h3>{step.label}</h3>
            <button type="button" className="mf-card-close" aria-label="Close" title="Close" onClick={onClose}><CloseIcon /></button>
        </header>
        {step.animation
            ? <ProcessLoop key={step.animation.id} loop={step.animation} className="mf-card-3d" />
            : <div className="mf-card-icon"><ProcessIconSvg icon={step.icon} /></div>}
        <p className="mf-card-caption">{step.caption}<FootnoteRef sources={step.sources} asOf={MANUFACTURING_AS_OF} confidence="reported" /></p>
        {step.keyNumbers.length ? <dl className="mf-numbers">
            {step.keyNumbers.map((k) => <div key={k.label}><dt>{k.label}</dt><dd><SourcedValue value={k.value} /></dd></div>)}
        </dl> : null}
        <p className="mf-io"><span>{step.inputs.join(" + ")}</span><Arrow dir="next" /><span>{step.outputs.join(" + ")}</span></p>
        <WhoDoesIt step={step} stage={cluster?.stage} onCompany={onCompany} />
        {shares ? <section className="mf-card-sec" aria-label="Where">
            <h4>Where <ConcentrationBadge shares={shares} /></h4>
            <StageShareBar shares={shares} label={`${cluster?.label ?? "Stage"} output by country`} />
        </section> : null}
        <div className="mf-links">
            {step.elementIds.map((e) => <a key={e} className="mf-chip" href={`/metals?element=${e}`}>{getMetal(e)?.symbol ?? e}</a>)}
            {step.bomNodeIds.map((id) => <BomLink key={id} id={id} />)}
        </div>
        <nav className="mf-card-nav" aria-label="Neighbouring steps">
            {prevId ? <button type="button" onClick={() => onStep(prevId)}><Arrow dir="prev" /><span>{label(prevId)}</span></button> : <span />}
            {nextId ? <button type="button" onClick={() => onStep(nextId)}><span>{label(nextId)}</span><Arrow dir="next" /></button> : null}
        </nav>
    </aside>;
}
