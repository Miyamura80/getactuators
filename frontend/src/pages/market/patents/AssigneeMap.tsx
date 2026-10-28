import { type LandscapeSnapshot, assigneeMap } from "../../../../../src/patents/landscape";
import { COUNTRY_COLOR, COUNTRY_FALLBACK } from "../../../components/supply-chain/country-colors";

// 03. Top assignees as bubbles at their headquarters (registry companies) or
// their country's centre, sized by family count, on a plain lat/lon grid.

const W = 720;
const H = 330;
const x = (lon: number) => ((lon + 180) / 360) * W;
// 75N to 55S keeps the filing countries and drops the poles.
const y = (lat: number) => ((75 - lat) / 130) * H;

export function AssigneeMap({ tech, snapshot }: { tech: string; snapshot: LandscapeSnapshot }) {
    const points = assigneeMap([tech], snapshot);
    const max = Math.max(1, ...points.map((p) => p.families));
    const r = (n: number) => 3 + Math.sqrt(n / max) * 22;
    return <div className="pt-map">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Top ${points.length} assignees by headquarters`}>
            {[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map((lon) =>
                <line key={`m${lon}`} x1={x(lon)} x2={x(lon)} y1={0} y2={H} className="pt-grid" />)}
            {[60, 30, 0, -30].map((lat) =>
                <line key={`p${lat}`} x1={0} x2={W} y1={y(lat)} y2={y(lat)} className="pt-grid" />)}
            {[...points].sort((a, b) => b.families - a.families).map((p) =>
                <circle key={p.key} cx={x(p.lon)} cy={y(p.lat)} r={r(p.families)} data-key={p.key}
                    className={`pt-bubble${p.precision === "country" ? " is-approx" : ""}`}
                    fill={COUNTRY_COLOR[p.country as keyof typeof COUNTRY_COLOR] ?? COUNTRY_FALLBACK}>
                    <title>{`${p.name}: ${p.families.toLocaleString("en-US")} families${p.precision === "country" ? " (placed at country centre)" : ""}`}</title>
                </circle>)}
        </svg>
        <details className="pt-map-list">
            <summary>List</summary>
            <ol>
                {points.map((p) => <li key={p.key}>{p.name} <b>{p.families.toLocaleString("en-US")}</b></li>)}
            </ol>
        </details>
    </div>;
}
