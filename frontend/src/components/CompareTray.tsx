import type { Actuator } from "../types";
import { ActuatorThumb } from "./ActuatorThumb";
import { compareEvent, compareHref } from "../lib/compare-selection";
export function CompareTray({ rows, remove, clear }: { rows: Actuator[]; remove: (id: string) => void; clear: () => void }) {
    if (!rows.length) return null;
    return <section className="pick-tray" aria-label="Selected actuators">
        <span aria-live="polite">{rows.length}/4 selected</span>
        <ul>{rows.map(a => <li key={a.id}><div className="pick-mini"><ActuatorThumb actuator={a} /></div><span>{a.name}</span><button type="button" aria-label={`Remove ${a.name}`} onClick={() => { remove(a.id); compareEvent("update", rows.filter(row => row.id !== a.id).map(row => row.id)); }}>×</button></li>)}</ul>
        <button type="button" onClick={() => { clear(); compareEvent("update", []); }}>Clear</button>
        {rows.length < 2 ? <button type="button" disabled>Compare</button> : <a className="primary" aria-label="Compare selected actuators" href={compareHref(rows.map(a => a.id))} onClick={e => { if (e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) compareEvent("open", rows.map(a => a.id)); }}>Compare</a>}
    </section>;
}
