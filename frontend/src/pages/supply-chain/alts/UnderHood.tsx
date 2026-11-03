import { ALT_FAMILIES, ALT_TECHS, type AltTech, FAMILY_LABEL, MAGNET_USE_LABEL, techsIn } from "../../../../../src/supply-chain/alts";
import { getCompany } from "../../../../../src/supply-chain/registry";
import { FootnoteRef, SourcedValue } from "../../../components/supply-chain/SourcedValue";
import { ExplodeScene, ProcessLoop } from "../../../three";

// How each alternative works inside: pick a family, then a technology; the
// stage shows one 3D scene (an explode you can pull apart, or a loop of the
// working principle) with the principle in one sentence beside it. Only one
// scene is live at a time; the rest stay as posters.

function Scene({ t }: { t: AltTech }) {
    if (t.scene.kind === "loop") return <ProcessLoop key={t.id} loop={t.scene.spec} />;
    const s = t.scene.spec;
    return <ExplodeScene key={t.id} id={s.id} title={s.title} parts={s.parts} stagger={s.stagger} drive="slider" defaultExplode={0.6} />;
}

export function UnderHood({ tech, onTech }: { tech: string | null; onTech: (id: string) => void }) {
    const t = (tech ? ALT_TECHS.find((x) => x.id === tech) : undefined) ?? ALT_TECHS[0];
    if (!t) return null;
    const players = t.players.flatMap((p) => {
        const c = getCompany(p.companyId);
        return c ? [c.name] : [];
    });
    return <div className="al-uh">
        <div className="al-uh-tabs" role="tablist" aria-label="Family">
            {ALT_FAMILIES.map((f) => <button key={f} type="button" role="tab" aria-selected={f === t.family}
                onClick={() => onTech(techsIn(f)[0]?.id ?? t.id)}>{FAMILY_LABEL[f]}</button>)}
        </div>
        <div className="al-uh-techs" role="radiogroup" aria-label="Technology">
            {techsIn(t.family).map((x) => <button key={x.id} type="button" role="radio" aria-checked={x.id === t.id}
                className="al-chip" onClick={() => onTech(x.id)}>{x.short}</button>)}
        </div>
        <div className="al-uh-body" role="tabpanel" aria-label={t.name}>
            <div className="al-uh-stage"><Scene t={t} /></div>
            <aside className="al-uh-side">
                <h3>{t.name}</h3>
                <p>{t.principle}<FootnoteRef sources={t.sources} asOf={t.trl.asOf} confidence="reported" /></p>
                <dl>
                    <div><dt>TRL</dt><dd><SourcedValue value={t.trl} /></dd></div>
                    <div><dt>Magnets</dt><dd>{MAGNET_USE_LABEL[t.magnets]}</dd></div>
                    {players.length ? <div><dt>Who</dt><dd>{players.join(", ")}</dd></div> : null}
                    {t.facts.slice(0, 2).map((f) => <div key={f.label}><dt>{f.label}</dt><dd><SourcedValue value={f.value} /></dd></div>)}
                </dl>
                <p className="al-note">Schematic: shows the principle, not one product's geometry.</p>
                <a className="al-link-out" href={`/api/v1/alts/${t.id}`}>Data for {t.short}</a>
            </aside>
        </div>
    </div>;
}
