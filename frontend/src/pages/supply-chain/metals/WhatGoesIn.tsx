import { percentDigits } from "../../../../../src/supply-chain/format";
import {
    GRADE_IDS,
    type GradeId,
    MAGNET_GRADES,
    gradeComposition,
    humanoidElementMass,
} from "../../../../../src/supply-chain/metals/grades";
import { METAL_CLASS_LABEL, METALS, type MetalId } from "../../../../../src/supply-chain/metals/elements";
import type { Sourced } from "../../../../../src/supply-chain/sourced";
import { FootnoteRef, SourcedValue } from "../../../components/supply-chain/SourcedValue";

// 1. What goes in: six element tiles, the grade's composition as one bar and
// what one humanoid's magnets hold.

const share = (s: Sourced<number>) =>
    s.range ? `${percentDigits(s.range[0])}-${percentDigits(s.range[1])}` : percentDigits(s.value);

const grams = (s: Sourced<number>) =>
    s.range ? `${s.range[0]}-${s.range[1]} g` : `${s.value} g`;

const PARTS = [
    { key: "ndpr", label: "Nd+Pr", className: "mt-part-ndpr" },
    { key: "dy", label: "Dy", className: "mt-part-dy" },
    { key: "boron", label: "B", className: "mt-part-b" },
    { key: "iron", label: "Fe+", className: "mt-part-fe" },
] as const;

export function WhatGoesIn({ element, grade, onElement, onGrade }: {
    element: MetalId;
    grade: GradeId;
    onElement: (id: MetalId) => void;
    onGrade: (id: GradeId) => void;
}) {
    const picked = METALS.find((m) => m.id === element) ?? METALS[0]!;
    const comp = gradeComposition(grade);
    const mass = humanoidElementMass(grade);
    const g = MAGNET_GRADES.find((x) => x.id === grade)!;
    return <div className="mt-in">
        <div className="mt-tiles" role="group" aria-label="Element">
            {METALS.map((m) => <button key={m.id} type="button" data-element={m.id}
                className={`mt-tile mt-tile-${m.class}${m.id === element ? " is-on" : ""}`}
                aria-pressed={m.id === element} onClick={() => onElement(m.id)}>
                <b>{m.symbol}</b>
                <span>{m.name}</span>
                <i>{m.magnet}</i>
            </button>)}
        </div>
        <p className="mt-role">
            <b>{picked.name}</b> · {METAL_CLASS_LABEL[picked.class].toLowerCase()} · {picked.role}
            <FootnoteRef sources={picked.sources} asOf="2026" confidence="reported" />
        </p>

        <figure className="mt-comp">
            <figcaption>
                <span>Sintered NdFeB by weight</span>
                <span className="mt-seg" role="group" aria-label="Temperature grade">
                    {GRADE_IDS.map((id) => {
                        const x = MAGNET_GRADES.find((m) => m.id === id)!;
                        return <button key={id} type="button" aria-pressed={id === grade}
                            className={id === grade ? "is-on" : undefined} onClick={() => onGrade(id)}>
                            {x.suffix === "none" ? "N" : x.suffix.split(" ")[0]}
                        </button>;
                    })}
                </span>
            </figcaption>
            <div className="mt-bar" role="img"
                aria-label={PARTS.map((p) => `${p.label} ${share(comp[p.key])}`).join(", ")}>
                {PARTS.map((p) => <span key={p.key} className={p.className}
                    style={{ width: `${Math.max(comp[p.key].value, 0.004) * 100}%` }} />)}
            </div>
            <ul className="mt-bar-legend">
                {PARTS.map((p) => <li key={p.key}>
                    <i className={p.className} aria-hidden="true" />
                    <span>{p.label}</span>
                    <SourcedValue value={comp[p.key]} format={share} />
                </li>)}
            </ul>
            <p className="mt-note">{g.use}</p>
        </figure>

        <dl className="mt-humanoid">
            <dt>One humanoid, {g.suffix === "none" ? "N" : g.suffix} grade</dt>
            {(["nd", "pr", "dy"] as const).map((k) => <dd key={k}>
                <span>{k === "nd" ? "Nd" : k === "pr" ? "Pr" : "Dy"}</span>
                <SourcedValue value={mass[k]} format={grams} />
            </dd>)}
            <dd className="mt-more"><a href="/humanoids">Per joint, 21 robots</a></dd>
        </dl>
    </div>;
}
