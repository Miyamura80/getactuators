import { countryName } from "../../../../../src/country-flag";
import { concentration } from "../../../../../src/supply-chain/concentration";
import { percent } from "../../../../../src/supply-chain/format";
import { METALS, type MetalId } from "../../../../../src/supply-chain/metals/elements";
import {
    METAL_STAGES,
    type MetalStage,
    STAGE_LABEL_FOR,
    stageEntry,
} from "../../../../../src/supply-chain/metals/stage-shares";
import { STAGE_LABEL } from "../../../../../src/supply-chain/stages";
import { Flag } from "../../../components/Flag";
import { FootnoteRef } from "../../../components/supply-chain/SourcedValue";
import { WaffleGrid } from "../../../components/supply-chain/WaffleGrid";

// 2. Where it comes from: one stage as a 100-cell waffle, or the whole chain
// stacked so the drift toward one country shows. A stage no source splits by
// country is drawn as a gap with what is known.

const labelOf = (metal: MetalId, stage: MetalStage) => STAGE_LABEL_FOR[metal][stage] ?? STAGE_LABEL[stage];

function Stage({ metal, stage }: { metal: MetalId; stage: MetalStage }) {
    const e = stageEntry(metal, stage);
    const label = labelOf(metal, stage);
    if (e.kind === "gap")
        return <figure className="mt-gap" data-stage={stage}>
            <figcaption>{label}</figcaption>
            <p>{e.text}<FootnoteRef sources={e.sources} asOf="2026" confidence="reported" /></p>
        </figure>;
    const c = concentration(e.shares.value);
    return <div className="mt-stage" data-stage={stage}>
        {c ? <p className="mt-top" aria-label={`Top country: ${countryName(c.top.country)} ${percent(c.top.share)}`}>
            <Flag code={c.top.country} /> <b>{percent(c.top.share)}</b>
        </p> : null}
        <WaffleGrid rows={[{ id: stage, label, shares: e.shares.value, source: e.shares }]} />
    </div>;
}

export function WhereFrom({ element, stage, chain, onElement, onStage, onChain }: {
    element: MetalId;
    stage: MetalStage;
    chain: boolean;
    onElement: (id: MetalId) => void;
    onStage: (s: MetalStage) => void;
    onChain: (on: boolean) => void;
}) {
    const stages = chain ? [...METAL_STAGES] : [stage];
    return <div className="mt-where">
        <div className="mt-controls">
            <span className="mt-seg" role="group" aria-label="Element">
                {METALS.map((m) => <button key={m.id} type="button" aria-pressed={m.id === element}
                    className={m.id === element ? "is-on" : undefined} onClick={() => onElement(m.id)}>{m.symbol}</button>)}
            </span>
            <span className="mt-seg" role="group" aria-label="Stage">
                {METAL_STAGES.map((s) => <button key={s} type="button" aria-pressed={!chain && s === stage}
                    className={!chain && s === stage ? "is-on" : undefined}
                    onClick={() => { onChain(false); onStage(s); }}>{labelOf(element, s)}</button>)}
            </span>
            <button type="button" className={`mt-chain${chain ? " is-on" : ""}`} aria-pressed={chain}
                onClick={() => onChain(!chain)}>Whole chain</button>
        </div>
        <div className={`mt-stages${chain ? " is-chain" : ""}`}>
            {stages.map((s) => <Stage key={`${element}-${s}`} metal={element} stage={s} />)}
        </div>
    </div>;
}
