import { type ReactNode, useEffect, useRef } from "react";
import {
    type AltMetrics,
    type AltTech,
    type DeploymentStatus,
    FAMILY_LABEL,
    MAGNET_USE_LABEL,
    MILESTONE_KINDS,
    MILESTONE_LABEL,
    type MagnetUse,
    deploymentsOf,
    getAltTech,
    slicesOf,
} from "../../../../../src/supply-chain/alts";
import { NDFEB_PER_HUMANOID } from "../../../../../src/supply-chain/perspective";
import { getCompany } from "../../../../../src/supply-chain/registry";
import { getSource } from "../../../../../src/supply-chain/sources";
import { Flag } from "../../../components/Flag";
import { FootnoteRef, SourcedValue } from "../../../components/supply-chain/SourcedValue";
import { ExplodeScene, ProcessLoop } from "../../../three";
import { FamilyGlyph, MilestoneShape, TodayMark } from "./glyphs";
import { BASELINE_ID, FAMILY_KEY, stageOf } from "./landscape-model";

// The spec card for one node: the 3D scene beside a spec sheet, then the
// three readiness milestones, the deployments we can date and the source
// publishers. Every metric stays on the sheet; one with no public figure is
// a dashed gap. Docked under the chart on desktop, a bottom sheet on a phone.

const SPEC: { key: keyof AltMetrics; label: string }[] = [
    { key: "efficiency", label: "Efficiency" },
    { key: "specificPower", label: "Specific power" },
    { key: "torqueDensity", label: "Torque density" },
    { key: "reeIntensityKgPerKw", label: "Rare earth per kW" },
    { key: "costPerNm", label: "Cost per Nm" },
];

const STATUS_LABEL: Record<DeploymentStatus, string> = { shipping: "Shipping", pilot: "Pilot", demo: "Demo", retired: "Retired" };

const MAGNET_ICON: Record<MagnetUse, string> = {
    none: "M5 12h14",
    ferrite: "M7 7h10v10H7z",
    "iron-nitride": "M12 5l7 7-7 7-7-7z",
    permanent: "M8 5v8a4 4 0 0 0 8 0V5",
    motor: "M12 4a8 8 0 1 0 .01 0M12 9v6M9 12h6",
    "drive-motor": "M12 4a8 8 0 1 0 .01 0M12 9v6M9 12h6",
};

function MagnetIcon({ use }: { use: MagnetUse }) {
    return <svg className="al-sp-mag" viewBox="0 0 24 24" aria-hidden="true"><path d={MAGNET_ICON[use]} /></svg>;
}

function Scene({ t }: { t: AltTech }) {
    if (t.scene.kind === "loop") return <ProcessLoop key={t.id} loop={t.scene.spec} />;
    const s = t.scene.spec;
    return <ExplodeScene key={t.id} id={s.id} title={s.title} parts={s.parts} stagger={s.stagger} drive="slider" defaultExplode={0.6} />;
}

function TrlBar({ value }: { value: number }) {
    return <span className="al-sp-trl" role="img" aria-label={`TRL ${value} of 9`}>
        {Array.from({ length: 9 }, (_, i) => <i key={i} className={i < value ? "is-on" : ""} />)}
    </span>;
}

function Head({ mark, title, sub, onClose }: { mark: ReactNode; title: string; sub: string; onClose: () => void }) {
    return <header className="al-sp-head">
        <svg className="al-sp-mark" viewBox="-14 -14 28 28" aria-hidden="true">{mark}</svg>
        <div>
            <h2 id="al-sp-h">{title}</h2>
            <p className="al-sp-sub">{sub}</p>
        </div>
        <button type="button" className="al-close" aria-label="Close" onClick={onClose}>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" /></svg>
        </button>
    </header>;
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

function Baseline({ onClose }: { onClose: () => void }) {
    return <div className="al-sp-body is-ref">
        <Head mark={<TodayMark r={8} />} title="NdFeB permanent magnet motor" sub="Today's baseline, for reference" onClose={onClose} />
        <dl className="al-sp-spec">
            <div><dt>Magnet per humanoid</dt><dd><SourcedValue value={NDFEB_PER_HUMANOID} /></dd></div>
            <div><dt>Magnets</dt><dd><MagnetIcon use="permanent" />Neodymium iron boron</dd></div>
        </dl>
        <p className="al-sp-sub"><a href="/metals">Where the rare earth comes from</a></p>
    </div>;
}

function Tech({ t, onClose }: { t: AltTech; onClose: () => void }) {
    const players = t.players.flatMap((p) => getCompany(p.companyId)?.name ?? []);
    const deps = deploymentsOf(t.id);
    const slices = slicesOf(t.id);
    return <div className="al-sp-body">
        <div className="al-sp-stage"><Scene t={t} /></div>
        <div className="al-sp-side">
            <Head mark={<g className="al-sp-glyph"><FamilyGlyph family={t.family} scale={1.6} /></g>} title={t.name} sub={FAMILY_LABEL[t.family]} onClose={onClose} />
            <p className="al-sp-principle">{t.principle}<FootnoteRef sources={t.sources} asOf={t.trl.asOf} confidence="reported" /></p>
            <dl className="al-sp-spec">
                <div><dt>Readiness</dt><dd><TrlBar value={t.trl.value} /><SourcedValue value={t.trl} format={(v) => `TRL ${v.value}`} /><span className="al-dim">{stageOf(t.trl.value)}</span></dd></div>
                <div><dt>Magnets</dt><dd><MagnetIcon use={t.magnets} />{MAGNET_USE_LABEL[t.magnets]}</dd></div>
                {SPEC.map((s) => {
                    const v = t.metrics[s.key];
                    return <div key={s.key} className={v ? "" : "is-gap"}><dt>{s.label}</dt><dd>{v ? <SourcedValue value={v} /> : "no public figure"}</dd></div>;
                })}
                {t.facts.map((f) => <div key={f.label}><dt>{f.label}</dt><dd><SourcedValue value={f.value} /></dd></div>)}
                {slices.map((s) => <div key={s.id}><dt>Market: {s.label}{s.techIds.length > 1 ? `, shared with ${s.techIds.length - 1} more` : ""}</dt>
                    <dd><SourcedValue value={s.revenueUsd} /><span className="al-dim">growing</span><SourcedValue value={s.cagr} /><span className="al-dim">/yr</span></dd></div>)}
                {slices.length === 0 ? <div className="is-gap"><dt>Market</dt><dd>no published size</dd></div> : null}
                {players.length ? <div><dt>Who</dt><dd>{players.join(", ")}</dd></div> : null}
            </dl>
        </div>
        <div className="al-sp-foot">
            <section className="al-sp-ms" aria-label="Milestones"><Track t={t} /></section>
            <section aria-label="Where it runs">
                <p className="al-label">Where it runs</p>
                {deps.length ? <ol className="al-sp-list">
                    {deps.map((d) => <li key={d.id} className={d.status === "retired" ? "is-retired" : ""}>
                        <span className={`al-status is-${d.status}`}>{STATUS_LABEL[d.status]}</span>
                        <span>
                            {d.product}<FootnoteRef sources={d.sources} asOf={d.date} confidence="reported" />
                            <span className="al-dim"> {d.location ? <Flag code={d.location.country} /> : null} {d.org}, {d.date}</span>
                        </span>
                    </li>)}
                </ol> : <p className="al-sp-gap">no dated deployment cited</p>}
            </section>
            <section aria-label="Sources">
                <p className="al-label">Sources</p>
                <ul className="al-sp-src">
                    {t.sources.map((id) => {
                        const s = getSource(id);
                        return <li key={id}>{s ? <a href={s.url} rel="noopener noreferrer" target="_blank">{s.publisher}</a> : id}</li>;
                    })}
                </ul>
                <a className="al-link-out" href={`/api/v1/alts/${t.id}`}>Data for {t.short}</a>
            </section>
        </div>
    </div>;
}

export function Card({ id, onClose }: { id: string; onClose: () => void }) {
    const ref = useRef<HTMLElement>(null);
    const close = useRef(onClose);
    close.current = onClose;
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") close.current();
        };
        // A click anywhere but the card or another node closes it.
        const onDown = (e: PointerEvent) => {
            const target = e.target as Element | null;
            if (!target || ref.current?.contains(target) || target.closest?.("[data-tech], .al-scrim, .al-fam, .sc-tip")) return;
            close.current();
        };
        window.addEventListener("keydown", onKey);
        document.addEventListener("pointerdown", onDown);
        return () => {
            window.removeEventListener("keydown", onKey);
            document.removeEventListener("pointerdown", onDown);
        };
    }, []);
    // On phones the card is a sheet over the ladder: move focus into it so
    // keyboard and screen-reader users are not left behind the overlay.
    useEffect(() => {
        if (typeof window.matchMedia === "function" && window.matchMedia("(max-width: 760px)").matches) ref.current?.focus({ preventScroll: true });
    }, []);
    const t = getAltTech(id);
    const fam = t ? ` al-f-${FAMILY_KEY[t.family]}` : " is-baseline";
    return <article ref={ref} className={`al-sp${fam}`} aria-labelledby="al-sp-h" tabIndex={-1}>
        {id === BASELINE_ID || !t ? <Baseline onClose={onClose} /> : <Tech t={t} onClose={onClose} />}
    </article>;
}
