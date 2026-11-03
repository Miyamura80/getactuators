import { useMemo } from "react";
import { DOMAIN_LABEL, type DirectoryPerson, PEOPLE_DOMAINS, type PeopleDomain } from "../../../../src/people";
import { type NetNode, peopleNetwork } from "../../../../src/people/views";

const W = 720;
const H = 520;

// Domain marks: shape and colour both carry the domain, so neither relies
// on the other.
export function DomainMark({ domain, x = 0, y = 0, r = 6 }: { domain: PeopleDomain; x?: number; y?: number; r?: number }) {
    const cls = `pp-mark pp-${domain}`;
    if (domain === "research") return <circle className={cls} cx={x} cy={y} r={r} />;
    if (domain === "industry") {
        const d = r * 1.35;
        return <path className={cls} d={`M${x} ${y - d}L${x + d} ${y}L${x} ${y + d}L${x - d} ${y}Z`} />;
    }
    if (domain === "magnets") return <path className={cls} d={`M${x} ${y - r * 1.15}L${x + r * 1.1} ${y + r * 0.8}H${x - r * 1.1}Z`} />;
    return <rect className={cls} x={x - r * 0.9} y={y - r * 0.9} width={r * 1.8} height={r * 1.8} />;
}

export function DomainLegend() {
    return <ul className="pp-legend" aria-label="Domains">
        {PEOPLE_DOMAINS.map((d) => <li key={d}>
            <svg width="14" height="14" viewBox="-7 -7 14 14" aria-hidden="true"><DomainMark domain={d} r={5} /></svg>
            {DOMAIN_LABEL[d]}
        </li>)}
        <li>
            <svg width="14" height="14" viewBox="-7 -7 14 14" aria-hidden="true"><rect className="pp-org" x={-4} y={-4} width={8} height={8} /></svg>
            Organisation
        </li>
    </ul>;
}

// People linked to their organisations: solid lines for the main
// affiliation, dashed for earlier or secondary ones. Organisations shared by
// two or more people are labelled; every node names itself on hover and in
// its accessible name, and a person node jumps to the card.
export function PeopleNetwork({ people, selected }: { people: DirectoryPerson[]; selected: string | null }) {
    const { nodes, edges } = useMemo(() => peopleNetwork(W, H, people), [people]);
    const at = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
    const lit = selected ? new Set([selected, ...edges.filter((e) => e.from === selected).map((e) => e.to)]) : null;
    const dim = (id: string) => (lit && !lit.has(id) ? " is-dim" : "");
    const org = (n: NetNode) => {
        const s = 4 + Math.min(n.degree, 6) * 1.5;
        return <g key={n.id} className={`pp-node${dim(n.id)}`}>
            <rect className="pp-org" x={n.x - s / 2} y={n.y - s / 2} width={s} height={s}><title>{`${n.label}: ${n.degree} ${n.degree === 1 ? "person" : "people"}`}</title></rect>
            {n.degree >= 2 ? <text className="pp-org-label" x={n.x} y={n.y - s / 2 - 5} textAnchor="middle">{n.label}</text> : null}
        </g>;
    };
    const person = (n: NetNode) => <a key={n.id} href={`#${n.id}`} className={`pp-node${dim(n.id)}${n.id === selected ? " is-on" : ""}`} aria-label={`${n.label}, ${DOMAIN_LABEL[n.domain as PeopleDomain]}`}>
        <title>{n.label}</title>
        <DomainMark domain={n.domain as PeopleDomain} x={n.x} y={n.y} />
    </a>;
    return <figure className="pp-net">
        <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label="Network of people and their organisations">
            {edges.map((e) => {
                const a = at.get(e.from);
                const b = at.get(e.to);
                if (!a || !b) return null;
                return <line key={`${e.from}-${e.to}`} className={`pp-edge${e.main ? "" : " is-also"}${lit && !(lit.has(e.from) && lit.has(e.to)) ? " is-dim" : ""}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
            })}
            {nodes.filter((n) => n.kind === "org").map(org)}
            {nodes.filter((n) => n.kind === "person").map(person)}
        </svg>
        <figcaption><DomainLegend /></figcaption>
    </figure>;
}
