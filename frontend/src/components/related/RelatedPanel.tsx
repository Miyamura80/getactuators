import type { Actuator } from "../../../../src/catalog/types";
import { type RelatedLink, humanoidLinks, patentLinks } from "../../../../src/related/actuator";
import "./related-panel.css";

// "Related" on an actuator page: the humanoids that put this actuator in a
// joint, and the patent landscape for its design. The humanoid list is
// absent when no tracked humanoid uses the actuator.
export function RelatedPanel({ actuator }: { actuator: Actuator }) {
    const humanoids = humanoidLinks(actuator.id);
    const patents = patentLinks(actuator.category);
    return <section className="related-panel" aria-label={`Related to ${actuator.name}`}>
        <h2>Related</h2>
        <div className="related-grid">
            {humanoids.length > 0 ? <Group title="In humanoids" links={humanoids} /> : null}
            <Group title="Patents since 2010" links={patents} />
        </div>
    </section>;
}

function Group({ title, links }: { title: string; links: RelatedLink[] }) {
    return <div>
        <h3>{title}</h3>
        <ul>{links.map((l) => <li key={l.href}><a href={l.href}>{l.label}</a>{l.detail ? <span>{l.detail}</span> : null}</li>)}</ul>
    </div>;
}
