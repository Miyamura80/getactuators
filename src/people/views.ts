import { resolveBrand } from "../brands";
import { ACTUATORS } from "../catalog";
import { HUMANOIDS } from "../humanoids";
import { SUPPLY_CHAIN_PAGES_LIVE } from "../public-navigation";
import { getCountryPage } from "../supply-chain/country-pages";
import { PEOPLE_DOMAINS, type PeopleDomain } from "./directory";
import { DIRECTORY, type DirectoryPerson, ORGS, type OrgId } from "./index";
import type { Org } from "./types";

// Derived views of the /people directory shared by the page, the markdown
// twin, the REST API and the MCP tool: affiliations, links into the rest of
// the site, people per country and the people-to-org network.

export const ALTS_PATH = "/alts";

// Main affiliation first, then the others, without repeats.
export function affiliations(p: DirectoryPerson): Org[] {
    const ids: OrgId[] = [p.orgId, ...(p.alsoOrgIds ?? [])];
    return [...new Set(ids)].map((id) => ORGS[id]);
}

// The org's logo image: its own record (assets.json), else the brand
// registry's self-hosted mark. Null means draw a monogram.
export function orgLogoUrl(org: Org): string | null {
    return (
        org.logo?.path ??
        (org.brandId ? resolveBrand(org.brandId)?.logo : undefined) ??
        null
    );
}

// Whether the logo needs a white disc behind it: opaque JPEGs (white
// background baked in) and dark marks the brand registry flags for a light
// tile. Transparent light marks sit on the dark disc instead.
export function orgLogoOnLight(org: Org): boolean {
    const url = orgLogoUrl(org);
    if (!url) return false;
    if (/\.jpe?g$/.test(url)) return true;
    return org.brandId ? resolveBrand(org.brandId)?.tile === "light" : false;
}

// Everyone listed with this org as main or other affiliation.
export function peopleAt(orgId: string): DirectoryPerson[] {
    return DIRECTORY.filter((p) => affiliations(p).some((o) => o.id === orgId));
}

export interface CrossLink {
    href: string;
    label: string;
}

function orgLinks(org: Org): CrossLink[] {
    const out: CrossLink[] = [];
    const page = org.country ? getCountryPage(org.country) : undefined;
    if (page) out.push({ href: page.path, label: `${page.name} supply chain` });
    const humanoid = HUMANOIDS.find((h) => h.id === org.humanoidId);
    if (humanoid)
        out.push({
            href: `/humanoids?robot=${humanoid.id}`,
            label: `${humanoid.name} joint map`,
        });
    if (org.brandId) {
        const first = ACTUATORS.find((a) => resolveBrand(a.brand)?.id === org.brandId);
        if (first)
            out.push({
                href: `/actuators/${encodeURIComponent(first.id)}`,
                label: `${org.name} in the catalog`,
            });
    }
    if (org.alts && SUPPLY_CHAIN_PAGES_LIVE.has(ALTS_PATH))
        out.push({ href: ALTS_PATH, label: "Alternatives to NdFeB" });
    return out;
}

// Links from a person's affiliations into the rest of the site: the country
// page, the humanoid joint map, catalog actuators and /alts (when live).
export function crossLinks(p: DirectoryPerson): CrossLink[] {
    const byHref = new Map<string, CrossLink>();
    for (const l of affiliations(p).flatMap(orgLinks))
        if (!byHref.has(l.href)) byHref.set(l.href, l);
    return [...byHref.values()];
}

export function peopleIn(domain: PeopleDomain | null): DirectoryPerson[] {
    return domain ? DIRECTORY.filter((p) => p.domain === domain) : DIRECTORY;
}

export function domainCounts(): Record<PeopleDomain, number> {
    return Object.fromEntries(
        PEOPLE_DOMAINS.map((d) => [d, peopleIn(d).length]),
    ) as Record<PeopleDomain, number>;
}

// People per country of their main affiliation (ISO alpha-2).
export function peopleByCountry(people = DIRECTORY): Record<string, number> {
    const out: Record<string, number> = {};
    for (const p of people) {
        const c = ORGS[p.orgId].country;
        if (c) out[c] = (out[c] ?? 0) + 1;
    }
    return out;
}

// Organisations ranked by how many listed people they connect (main or other
// affiliation): the clusters the network shows.
export function orgHubs(min = 2): { org: Org; people: DirectoryPerson[] }[] {
    const by = new Map<string, DirectoryPerson[]>();
    for (const p of DIRECTORY)
        for (const o of affiliations(p)) by.set(o.id, [...(by.get(o.id) ?? []), p]);
    return [...by]
        .filter(([, ps]) => ps.length >= min)
        .map(([id, people]) => ({ org: ORGS[id as OrgId], people }))
        .sort(
            (a, b) =>
                b.people.length - a.people.length ||
                a.org.name.localeCompare(b.org.name),
        );
}

export interface NetNode {
    id: string;
    kind: "person" | "org";
    label: string;
    domain?: PeopleDomain;
    degree: number;
    x: number;
    y: number;
}

export interface NetEdge {
    from: string;
    to: string;
    main: boolean;
}

// Stable pseudo-random in [0, 1) from a string, so the layout never changes
// between renders or between server and browser.
function unit(s: string): number {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return ((h >>> 0) % 10000) / 10000;
}

// Each domain pulls its people towards one corner, so the four groups read
// as regions and shared orgs sit between them.
const ANCHOR: Record<PeopleDomain, [number, number]> = {
    research: [0.27, 0.3],
    industry: [0.73, 0.3],
    magnets: [0.27, 0.72],
    policy: [0.73, 0.72],
};

interface Layout {
    x: number[];
    y: number[];
    k: number;
}
interface Forces {
    dx: number[];
    dy: number[];
}

const at = (a: number[], i: number) => a[i] as number;

// Repulsion k^2 / d between every pair, along the unit vector.
function repel({ x, y, k }: Layout): Forces {
    const n = x.length;
    const dx = new Array<number>(n).fill(0);
    const dy = new Array<number>(n).fill(0);
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const vx = at(x, i) - at(x, j);
            const vy = at(y, i) - at(y, j);
            const f = (k * k) / Math.max(vx * vx + vy * vy, 0.0001);
            dx[i] = at(dx, i) + vx * f;
            dy[i] = at(dy, i) + vy * f;
            dx[j] = at(dx, j) - vx * f;
            dy[j] = at(dy, j) - vy * f;
        }
    }
    return { dx, dy };
}

// Spring d^2 / k along each affiliation.
function attract({ x, y, k }: Layout, springs: [number, number][], { dx, dy }: Forces) {
    for (const [a, b] of springs) {
        const vx = at(x, a) - at(x, b);
        const vy = at(y, a) - at(y, b);
        const f = Math.hypot(vx, vy) / k;
        dx[a] = at(dx, a) - vx * f;
        dy[a] = at(dy, a) - vy * f;
        dx[b] = at(dx, b) + vx * f;
        dy[b] = at(dy, b) + vy * f;
    }
}

// Add each node's anchor pull, then step at most `temp` along the net force.
function move(
    { x, y }: Layout,
    { dx, dy }: Forces,
    pulls: { x: number; y: number; g: number }[],
    temp: number,
) {
    pulls.forEach((p, i) => {
        const fx = at(dx, i) + (p.x - at(x, i)) * p.g;
        const fy = at(dy, i) + (p.y - at(y, i)) * p.g;
        const m = Math.max(Math.hypot(fx, fy), 0.01);
        x[i] = at(x, i) + (fx / m) * Math.min(m, temp);
        y[i] = at(y, i) + (fy / m) * Math.min(m, temp);
    });
}

const clamp = (v: number, max: number) => Math.min(max, Math.max(0, v));

// Push nodes i and j apart when closer than `gap`; true when they moved.
function pushApart(
    { x, y }: Layout,
    i: number,
    j: number,
    gap: number,
    w: number,
    h: number,
) {
    const vx = at(x, i) - at(x, j);
    const vy = at(y, i) - at(y, j);
    const d = Math.hypot(vx, vy);
    if (d >= gap) return false;
    const push = (gap - d) / 2 / Math.max(d, 0.01);
    const ux = d > 0 ? vx * push : gap / 2;
    const uy = d > 0 ? vy * push : 0;
    x[i] = clamp(at(x, i) + ux, w);
    y[i] = clamp(at(y, i) + uy, h);
    x[j] = clamp(at(x, j) - ux, w);
    y[j] = clamp(at(y, j) - uy, h);
    return true;
}

// Push apart any two nodes closer than `gap`, so node marks never overlap.
function separate(pos: Layout, gap: number, width: number, height: number) {
    for (let pass = 0; pass < 40; pass++) {
        let moved = false;
        for (let i = 0; i < pos.x.length; i++)
            for (let j = i + 1; j < pos.x.length; j++)
                moved = pushApart(pos, i, j, gap, width, height) || moved;
        if (!moved) return;
    }
}

// People and their orgs on a width x height canvas: a small, deterministic
// force layout (repulsion between all nodes, springs along affiliations, a
// pull towards the domain's anchor), then clamped inside the margins.
export function peopleNetwork(
    width: number,
    height: number,
    people = DIRECTORY,
): { nodes: NetNode[]; edges: NetEdge[] } {
    const edges: NetEdge[] = people.flatMap((p) =>
        affiliations(p).map((o, i) => ({
            from: p.id,
            to: `org:${o.id}`,
            main: i === 0,
        })),
    );
    const degree = new Map<string, number>();
    for (const e of edges) degree.set(e.to, (degree.get(e.to) ?? 0) + 1);
    const orgIds = [...new Set(edges.map((e) => e.to))];
    const nodes: NetNode[] = [
        ...people.map((p) => {
            const [ax, ay] = ANCHOR[p.domain];
            return {
                id: p.id,
                kind: "person" as const,
                label: p.name,
                domain: p.domain,
                degree: affiliations(p).length,
                x: (ax + (unit(p.id) - 0.5) * 0.3) * width,
                y: (ay + (unit(`${p.id}y`) - 0.5) * 0.3) * height,
            };
        }),
        ...orgIds.map((id) => ({
            id,
            kind: "org" as const,
            label: ORGS[id.slice(4) as OrgId].name,
            degree: degree.get(id) ?? 0,
            x: (0.2 + unit(id) * 0.6) * width,
            y: (0.2 + unit(`${id}y`) * 0.6) * height,
        })),
    ];
    const index = new Map(nodes.map((n, i) => [n.id, i]));
    const springs = edges.map(
        (e) => [index.get(e.from) ?? 0, index.get(e.to) ?? 0] as [number, number],
    );
    const pos: Layout = {
        x: nodes.map((p) => p.x),
        y: nodes.map((p) => p.y),
        k: Math.sqrt((width * height) / nodes.length) * 0.42,
    };
    const pulls = nodes.map((nd) => {
        const [ax, ay] = nd.domain ? ANCHOR[nd.domain] : [0.5, 0.5];
        // People pull to their domain's anchor, orgs gently to the centre.
        return { x: ax * width, y: ay * height, g: nd.domain ? 1.5 : 0.5 };
    });
    let temp = width / 10;
    for (let step = 0; step < 300; step++) {
        const f = repel(pos);
        attract(pos, springs, f);
        move(pos, f, pulls, temp);
        temp *= 0.985;
    }
    separate(pos, 30, width, height);
    const { x, y } = pos;
    const pad = 24;
    nodes.forEach((node, i) => {
        node.x =
            Math.round(Math.min(width - pad, Math.max(pad, x[i] as number)) * 10) / 10;
        node.y =
            Math.round(Math.min(height - pad, Math.max(pad, y[i] as number)) * 10) / 10;
    });
    return { nodes, edges };
}
