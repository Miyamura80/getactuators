import { useEffect, useRef } from "react";
import {
    type AltMetrics,
    type AltTech,
    type DeploymentStatus,
    FAMILY_LABEL,
    MAGNET_USE_LABEL,
    MILESTONE_KINDS,
    MILESTONE_LABEL,
    deploymentsOf,
    slicesOf,
} from "../../../../../src/supply-chain/alts";
import { getCompany } from "../../../../../src/supply-chain/registry";
import type { Sourced } from "../../../../../src/supply-chain/sourced";
import { FootnoteRef, SourcedValue } from "../../../components/supply-chain/SourcedValue";
import { ExplodeScene, ProcessLoop } from "../../../three";
import { FamilyGlyph, MilestoneShape } from "./glyphs";
import { FAMILY_KEY, stageOf } from "./landscape-model";

// The zoomed-in view of one technology: how it works (3D), the cited
// figures, its three readiness milestones (gaps shown as gaps) and the
// deployments we can date. Over the chart on desktop, a bottom sheet on a
// phone.

const METRIC_LABEL: Record<keyof AltMetrics, string> = {
    efficiency: "Efficiency",
    specificPower: "Specific power",
    torqueDensity: "Torque density",
    costPerNm: "Cost per Nm",
    reeIntensityKgPerKw: "Rare earth per kW",
};

const STATUS_LABEL: Record<DeploymentStatus, string> = {
    shipping: "Shipping",
    pilot: "Pilot",
    demo: "Demo",
    retired: "Retired",
};

function Scene({ t }: { t: AltTech }) {
    if (t.scene.kind === "loop") return <ProcessLoop key={t.id} loop={t.scene.spec} />;
    const s = t.scene.spec;
    return <ExplodeScene key={t.id} id={s.id} title={s.title} parts={s.parts} stagger={s.stagger} drive="slider" defaultExplode={0.6} />;
}

function Track({ t }: { t: AltTech }) {
    return <ol className="al-track" aria-label="Milestones">
        {MILESTONE_KINDS.map((k) => {
            const m = t.milestones.find((x) => x.kind === k);
            return <li key={k} className={m ? (m.announced ? "is-announced" : "is-on") : "is-gap"}>
                <svg viewBox="-8 -8 16 16" aria-hidden="true"><g className="al-ms"><MilestoneShape kind={k} size={5} /></g></svg>
                <span className="al-label">{MILESTONE_LABEL[k]}</span>
                {m ? <>
                    <b><SourcedValue value={m.year} format={(v) => `${m.announced ? "target " : ""}${v.value}`} /></b>
                    <span className="al-track-what">{m.label}</span>
                </> : <span className="al-track-what">No dated source</span>}
            </li>;
        })}
    </ol>;
}

export function FocusCard({ t, origin, onClose }: { t: AltTech; origin: { x: number; y: number }; onClose: () => void }) {
    const closeRef = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        closeRef.current?.focus({ preventScroll: true });
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);
    const players = t.players.flatMap((p) => getCompany(p.companyId)?.name ?? []);
    const metrics = (Object.keys(METRIC_LABEL) as (keyof AltMetrics)[]).flatMap((k) => {
        const v = t.metrics[k];
        return v ? [{ label: METRIC_LABEL[k], value: v as Sourced<number> }] : [];
    });
    const deployments = deploymentsOf(t.id);
    const slices = slicesOf(t.id);
    return <div className={`al-card al-f-${FAMILY_KEY[t.family]}`} role="dialog" aria-modal="false" aria-labelledby="al-card-h"
        style={{ transformOrigin: `${origin.x}% ${origin.y}%` }}>
        <header className="al-card-head">
            <svg viewBox="-8 -8 16 16" aria-hidden="true" className="al-card-glyph"><FamilyGlyph family={t.family} /></svg>
            <div>
                <p className="al-label">{FAMILY_LABEL[t.family]}</p>
                <h3 id="al-card-h">{t.name}</h3>
            </div>
            <button ref={closeRef} type="button" className="al-close" onClick={onClose} aria-label="Back to the landscape">
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" /></svg>
            </button>
        </header>
        <div className="al-card-body">
            <div className="al-card-stage"><Scene t={t} /></div>
            <div className="al-card-side">
                <p className="al-card-principle">{t.principle}<FootnoteRef sources={t.sources} asOf={t.trl.asOf} confidence="reported" /></p>
                <dl className="al-figs">
                    <div><dt>TRL</dt><dd><SourcedValue value={t.trl} /> <span className="al-dim">{stageOf(t.trl.value)}</span></dd></div>
                    <div><dt>Magnets</dt><dd>{MAGNET_USE_LABEL[t.magnets]}</dd></div>
                    {metrics.map((f) => <div key={f.label}><dt>{f.label}</dt><dd><SourcedValue value={f.value} /></dd></div>)}
                    {t.facts.slice(0, 3).map((f) => <div key={f.label}><dt>{f.label}</dt><dd><SourcedValue value={f.value} /></dd></div>)}
                    {slices.map((s) => <div key={s.id}><dt>Market sized</dt><dd><SourcedValue value={s.revenueUsd} /> <span className="al-dim">{s.label}, one report</span></dd></div>)}
                    {players.length ? <div><dt>Who</dt><dd>{players.join(", ")}</dd></div> : null}
                </dl>
                <Track t={t} />
                <p className="al-label al-dep-h">Deployments we can date</p>
                {deployments.length ? <ul className="al-deps">
                    {deployments.map((d) => <li key={d.id} className={`is-${d.status}`}>
                        <span className={`al-status is-${d.status}`}>{STATUS_LABEL[d.status]}</span>
                        <time>{d.date}</time>
                        <span className="al-dep-what">{d.product}<span className="al-dim"> · {d.org}{d.location ? `, ${d.location.place}` : ""}</span></span>
                        <FootnoteRef sources={d.sources} asOf={d.date} confidence="reported" />
                    </li>)}
                </ul> : <p className="al-gap">None cited yet.</p>}
                <a className="al-link-out" href={`/api/v1/alts/${t.id}`}>Data for {t.short}</a>
            </div>
        </div>
    </div>;
}
