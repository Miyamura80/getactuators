import { CHECKS, DIMENSIONS, type Preset, SDK_EVIDENCE, SDK_SCORES, unscoredBrands } from "../../../../src/sdk";

// Methodology: the rubric, preset weights, what each collector did in this
// snapshot and where the classifier stands. Collapsed by default.
export function Method({ preset }: { preset: Preset }) {
    const c = SDK_EVIDENCE.classifier;
    return <details className="sdk-method" id="method">
        <summary>Method, sources and classifier</summary>
        <p>A dimension scores 0 to 10: points earned over the points of checks that could be decided. Official evidence earns full points, community-only evidence half. A check whose collector could not run is left out, not zeroed; a zero means no public evidence was found. Overall is the weighted mean of scored dimensions.</p>
        <table className="sdk-rubric">
            <thead><tr><th scope="col">Dimension</th><th scope="col">Weight ({preset.label})</th><th scope="col">Checks (points)</th></tr></thead>
            <tbody>{DIMENSIONS.map((d) => <tr key={d.id}>
                <th scope="row">{d.label}</th>
                <td>{preset.weights[d.id]}</td>
                <td>{CHECKS.filter((x) => x.dimension === d.id).map((x) => `${x.label} (${x.max})`).join("; ")}</td>
            </tr>)}</tbody>
        </table>
        <h3>Collectors, as of {SDK_SCORES.asOf}</h3>
        <ul className="sdk-runs">
            {SDK_EVIDENCE.collectors.map((r) => <li key={r.id} className={`is-${r.status}`}>
                <b>{r.label}</b> <span>{r.status}</span> {r.detail}
            </li>)}
        </ul>
        <h3>Forum classifier</h3>
        <p>Status: <b>{c.status}</b>. {c.detail} Agreement with the gold set: {c.agreement ? Object.entries(c.agreement).map(([d, a]) => `${d} ${Math.round(a * 100)}%`).join(", ") : "not measured"}.</p>
        <p>Not scored (no command interface in the catalog): {unscoredBrands().map((b) => b.name).join(", ")}.</p>
        <p>Re-run with <code>make sdk_signals</code>. Data: <a href="/api/v1/sdk">/api/v1/sdk</a> · <a href="/sdk.md">/sdk.md</a></p>
    </details>;
}
