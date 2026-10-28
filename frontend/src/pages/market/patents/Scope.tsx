import { type LandscapeSnapshot, technologySnapshot } from "../../../../../src/patents/landscape";
import { TECHNOLOGIES, getTechnology } from "../../../../../src/patents/technologies";

// 01. The technologies, one chip each with its family count, and the CPC
// codes that define the picked one behind a disclosure.
export function Scope({ tech, snapshot, onTech }: {
    tech: string;
    snapshot: LandscapeSnapshot;
    onTech: (id: string) => void;
}) {
    const t = getTechnology(tech);
    return <div className="pt-scope">
        <div className="pt-chips" role="group" aria-label="Technology">
            {TECHNOLOGIES.map((x) => {
                const n = technologySnapshot(x.id, snapshot)?.families;
                return <button key={x.id} type="button" className="pt-chip" data-tech={x.id}
                    aria-pressed={x.id === tech} onClick={() => onTech(x.id)}>
                    <span>{x.short}</span>
                    {n === undefined ? null : <b>{n.toLocaleString("en-US")}</b>}
                </button>;
            })}
        </div>
        {t ? <details className="pt-cpc">
            <summary>{t.label}: {t.cpc.length} CPC {t.cpc.length === 1 ? "code" : "codes"}</summary>
            <p>{t.description}</p>
            <ul>
                {t.cpc.map((c) => <li key={c.code}>
                    <code>{c.code}{c.match === "prefix" ? "*" : ""}</code>
                    <span>{c.title}</span>
                    <small>{c.rationale}{c.keywords ? ` Filter: ${c.keywords.join(", ")}.` : ""}</small>
                </li>)}
            </ul>
        </details> : null}
    </div>;
}
