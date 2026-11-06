import { useCallback, useMemo, useState } from "react";
import { DIRECTORY, DOMAIN_LABEL, ORGS, type Org, type OrgId, PEOPLE_DOMAINS, type PeopleDomain, initials } from "../../../../src/people";
import { countryName } from "../../../../src/country-flag";
import { type NetNode, PERSON_RADIUS, netRadius, orgLogoOnLight, orgLogoUrl, peopleNetwork } from "../../../../src/people/views";
import { LOGO_TOKEN } from "../../components/CompanyLogo";

const W = 960;
const H = 620;

export type Selection = { kind: "person" | "org" | "country"; id: string } | null;

const orgOfNode = (n: NetNode) => ORGS[n.id.slice(4) as OrgId];

// Org logos resolved like CompanyLogo (own file, self-hosted mark, then the
// provider when a token is set). A URL that fails to load, such as a
// provider 404, is remembered so that org falls back to its monogram.
export function useOrgLogos() {
    const [failed, setFailed] = useState<ReadonlySet<string>>(() => new Set());
    const url = useCallback((org: Org, size: number) => {
        const u = orgLogoUrl(org, size, LOGO_TOKEN);
        return u && !failed.has(u) ? u : null;
    }, [failed]);
    const fail = useCallback((u: string) => setFailed((s) => (s.has(u) ? s : new Set(s).add(u))), []);
    return { url, fail };
}

// Plain clicks open the panel; modifier or middle clicks keep the link's
// default, so the deep link can open in a new tab.
const isPlainClick = (e: React.MouseEvent) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

export function DomainLegend() {
    return <ul className="pp-legend" aria-label="Domains">
        {PEOPLE_DOMAINS.map((d) => <li key={d}><i className={`pp-dot pp-${d}`} aria-hidden="true" />{DOMAIN_LABEL[d]}</li>)}
    </ul>;
}

// A logo clipped to a circle on a white disc with a neutral ring, so the
// opaque JPEG backgrounds read the same on dark and light themes. Without a
// logo the org's initials stand in.
function OrgMark({ n, logo, light, onFail }: { n: NetNode; logo: string | null; light: boolean; onFail: (url: string) => void }) {
    const r = netRadius(n);
    const clip = `pp-clip-${n.id.slice(4)}`;
    return <>
        <circle className={logo && light ? "pp-org-disc" : "pp-org-mono"} cx={n.x} cy={n.y} r={r} />
        {logo ? <>
            <clipPath id={clip}><circle cx={n.x} cy={n.y} r={r - 1} /></clipPath>
            <image href={logo} x={n.x - r * 0.82} y={n.y - r * 0.82} width={r * 1.64} height={r * 1.64} clipPath={`url(#${clip})`} preserveAspectRatio="xMidYMid meet" onError={() => onFail(logo)} />
        </> : <text className="pp-org-initials" x={n.x} y={n.y} dy="0.35em" textAnchor="middle" style={{ fontSize: r * 0.62 }}>{initials(n.label)}</text>}
        <circle className="pp-org-ring" cx={n.x} cy={n.y} r={r} />
    </>;
}

// People linked to their organisations: solid lines for the main
// affiliation, dashed for earlier or secondary ones. Org nodes are their
// logos; hover or focus shows a larger preview. Selecting a node opens its
// detail; the domain filter dims everyone else.
export function PeopleNetwork({ domain, selected, onSelect }: { domain: PeopleDomain | null; selected: Selection; onSelect: (s: Selection) => void }) {
    const { nodes, edges } = useMemo(() => peopleNetwork(W, H, DIRECTORY), []);
    const at = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
    const [hover, setHover] = useState<NetNode | null>(null);
    const logos = useOrgLogos();
    const selId = selected?.kind === "person" ? selected.id : selected?.kind === "org" ? `org:${selected.id}` : null;
    const lit = useMemo(() => {
        if (!selId) return null;
        const near = edges.filter((e) => e.from === selId || e.to === selId).flatMap((e) => [e.from, e.to]);
        return new Set([selId, ...near]);
    }, [selId, edges]);
    const inDomain = (n: NetNode) => {
        if (!domain) return true;
        if (n.kind === "person") return n.domain === domain;
        return edges.some((e) => e.to === n.id && at.get(e.from)?.domain === domain);
    };
    const dim = (n: NetNode) => !inDomain(n) || (lit !== null && !lit.has(n.id));
    const open = (n: NetNode) => (e: React.MouseEvent) => {
        if (!isPlainClick(e)) return;
        e.preventDefault();
        onSelect(n.kind === "person" ? { kind: "person", id: n.id } : { kind: "org", id: n.id.slice(4) });
    };
    const handlers = (n: NetNode) => ({
        onClick: open(n),
        onMouseEnter: () => setHover(n),
        onMouseLeave: () => setHover(null),
        onFocus: () => setHover(n),
        onBlur: () => setHover(null),
    });
    const tipOrg = hover?.kind === "org" ? orgOfNode(hover) : null;
    const tipLogo = tipOrg ? logos.url(tipOrg, 72) : null;
    return <figure className="pp-net">
        <div className="pp-net-plot">
        <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label="Network of people and their organisations">
            {edges.map((e) => {
                const a = at.get(e.from);
                const b = at.get(e.to);
                if (!a || !b) return null;
                const off = dim(a) || dim(b);
                return <line key={`${e.from}-${e.to}`} className={`pp-edge${e.main ? "" : " is-also"}${off ? " is-dim" : ""}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
            })}
            {nodes.filter((n) => n.kind === "org").map((n) => {
                const org = orgOfNode(n);
                return <a key={n.id} href={`?org=${org.id}`} className={`pp-node pp-orgnode${dim(n) ? " is-dim" : ""}${selId === n.id ? " is-on" : ""}`} aria-label={`${n.label}, ${n.degree} ${n.degree === 1 ? "person" : "people"}`} {...handlers(n)}>
                    <OrgMark n={n} logo={logos.url(org, 72)} light={orgLogoOnLight(org, logos.url(org, 72))} onFail={logos.fail} />
                </a>;
            })}
            {nodes.filter((n) => n.kind === "person").map((n) => <a key={n.id} href={`?p=${n.id}`} className={`pp-node pp-person pp-${n.domain}${dim(n) ? " is-dim" : ""}${selId === n.id ? " is-on" : ""}`} aria-label={`${n.label}, ${DOMAIN_LABEL[n.domain as PeopleDomain]}`} {...handlers(n)}>
                <circle cx={n.x} cy={n.y} r={PERSON_RADIUS} />
                <text x={n.x} y={n.y} dy="0.35em" textAnchor="middle">{initials(n.label)}</text>
            </a>)}
        </svg>
        {hover ? <div className="pp-tip" style={{ left: `${(hover.x / W) * 100}%`, top: `${(hover.y / H) * 100}%` }} role="tooltip">
            {tipOrg ? <>
                {tipLogo ? <img className={orgLogoOnLight(tipOrg, tipLogo) ? "is-light" : ""} src={tipLogo} alt="" width={72} height={72} onError={() => logos.fail(tipLogo)} /> : <span className="pp-tip-mono" aria-hidden="true">{initials(tipOrg.name)}</span>}
                <b>{tipOrg.name}</b>
                <span>{tipOrg.country ? countryName(tipOrg.country) : ""}{` · ${hover.degree} ${hover.degree === 1 ? "person" : "people"}`}</span>
            </> : <>
                <b>{hover.label}</b>
                <span>{DOMAIN_LABEL[hover.domain as PeopleDomain]}</span>
            </>}
        </div> : null}
        </div>
        <figcaption><DomainLegend /><span>Dashed: earlier or secondary affiliation</span></figcaption>
    </figure>;
}
