import { useLayoutEffect, useRef } from "react";
import { PublicHeader } from "../components/PublicHeader";
import { ComparisonHub } from "../components/ComparisonHub";
import { PublicFooter } from "../components/PublicFooter";
import { ActuatorThumb } from "../components/ActuatorThumb";
import { EngineeringEvidencePanel } from "../components/EngineeringEvidencePanel";
import { CompanyLogo } from "../components/CompanyLogo";
import { compareEvent, selectedIds, useCompareSelection } from "../lib/compare-selection";
import { ACTUATORS } from "../lib/data";
import { COMPARE_SPECS, comparisonCaveats } from "../../../src/catalog/compare";

export function Compare({ menuOpen = false }: { menuOpen?: boolean }) {
    const selection = useCompareSelection();
    // Until the hook restores the URL selection, render it straight from the URL
    // so a shared link does not flash the hub over the server-rendered comparison.
    const rows = selection.ready
        ? selection.rows
        : selectedIds(window.location.search).flatMap(id => ACTUATORS.filter(a => a.id === id));
    const status = useRef<HTMLParagraphElement>(null);
    const remainingRemove = useRef<HTMLButtonElement>(null);
    const recoverAfterRemoval = useRef(false);
    useLayoutEffect(() => {
        if (!recoverAfterRemoval.current || selection.rows.length !== 1) return;
        recoverAfterRemoval.current = false;
        status.current?.scrollIntoView({ block: "start" });
        remainingRemove.current?.focus({ preventScroll: true });
    }, [selection.rows.length]);
    const remove = (id: string) => {
        const next = selection.ids.filter(value => value !== id);
        recoverAfterRemoval.current = next.length === 1;
        selection.update(next);
        compareEvent("update", next);
    };
    return <div className="compare-page">
        <PublicHeader path="/compare" initialOpen={menuOpen} />
        <main>
            <h1>Compare actuators</h1>
            <p>Share this URL. Unknown means not documented, not zero. No winner is implied.</p>
            {rows.length > 0 && <a href={`/actuators${window.location.search}`}>Change picks in the gallery</a>}
            {rows.length === 0 && <ComparisonHub />}
            {rows.length < 2 && <p ref={status} role="status">Pick 2–4 actuators in the gallery. A missing or invalid selection is not compared.</p>}
            <div className="compare-products">
                {rows.map(a => <article key={a.id}>
                    <a href={`/actuators/${a.id}`}><div className="compare-photo"><ActuatorThumb actuator={a} /></div><h2>{a.name}</h2></a>
                    <p className="compare-brand with-logo"><CompanyLogo name={a.brand} size={20} />{a.brand}</p>
                    {!a.image_url && <p>Photo unavailable: schematic only</p>}
                    <a href={`/actuators/${a.id}`}>Catalog and sources</a>
                    <button ref={rows.length === 1 ? remainingRemove : undefined} type="button" aria-label={`Remove ${a.name}`} onClick={() => remove(a.id)}>Remove</button>
                    <EngineeringEvidencePanel id={a.id} compact />
                </article>)}
            </div>
            {rows.length >= 2 && <div className="compare-spec-scroll" role="region" aria-label="Comparison specifications" tabIndex={0}>
                <table className="compare-specs">
                    <caption>Catalog values: verify exact revision and conditions</caption>
                    <thead><tr><th scope="col">Specification</th>{rows.map(a => <th scope="col" key={a.id}>{a.name}</th>)}</tr></thead>
                    <tbody>{COMPARE_SPECS.map(spec => <tr key={spec.label}><th scope="row">{spec.label}</th>{rows.map(a => <td key={a.id}>{spec.display(a)}</td>)}</tr>)}</tbody>
                </table>
            </div>}
            {rows.length > 0 && <div className="compare-caveats">{comparisonCaveats(rows).map(note => <p key={note}>{note}</p>)}</div>}
            <p>Sensor bits are not loaded accuracy. CAD geometry is not a calibrated simulation model. Thermal duty and efficiency require matched operating conditions.</p>
        </main>
        <PublicFooter />
    </div>;
}
