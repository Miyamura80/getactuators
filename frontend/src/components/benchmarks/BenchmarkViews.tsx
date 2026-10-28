import {
    BENCHMARKS_PATH,
    type BenchmarkOrigin,
    type BenchmarkRun,
    type DeltaRow,
    ORIGIN_LABEL,
    datasheetDeltas,
    describeRig,
    holdLabel,
    measuredSummary,
    runsFor,
    thermalSeries,
    torqueSpeedSeries,
} from "../../../../src/benchmarks";
import { XYChart, type XYSeries } from "./XYChart";
import "./benchmarks.css";

export function OriginBadge({ origin }: { origin: BenchmarkOrigin }) {
    return <span className="bm-origin" data-origin={origin}>{ORIGIN_LABEL[origin]}</span>;
}

export function SourceLink({ run }: { run: BenchmarkRun }) {
    if (run.source) return <a href={run.source.url} rel="noopener">{run.source.title}</a>;
    return <span>{run.submitter ? `@${run.submitter}` : run.runId}</span>;
}

const pct = (r: number) => `${r >= 1 ? "+" : ""}${Math.round((r - 1) * 100)}%`;
const num = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });

const VERDICT = { "over-promised": "Over-promised", matches: "Matches", beats: "Beats" } as const;

export function DeltaBar({ row }: { row: DeltaRow }) {
    // Both values on one scale: the claim as a tick, the measurement as a bar.
    const max = Math.max(row.claimed, row.measured) * 1.15 || 1;
    return <div className="bm-delta" data-verdict={row.verdict}>
        <span className="bm-delta-label">{row.label}</span>
        <span className="bm-verdict">{VERDICT[row.verdict]}</span>
        <span className="bm-delta-track" aria-hidden="true">
            <span className="bm-delta-bar" style={{ width: `${(row.measured / max) * 100}%` }} />
            <span className="bm-delta-claim" style={{ left: `${(row.claimed / max) * 100}%` }} />
        </span>
        <span className="bm-delta-values">
            {num(row.measured)} measured vs {num(row.claimed)} {row.unit} claimed <b>{pct(row.ratio)}</b>
        </span>
    </div>;
}

function torqueSpeedChartSeries(ids?: readonly string[]): XYSeries[] {
    return torqueSpeedSeries(ids).slice(0, 4).map((s) => ({
        id: `${s.actuatorId}/${s.run.runId}`,
        name: s.name,
        points: s.points.map((p) => ({
            x: p.rpm,
            y: p.torqueNm,
            label: `${num(p.torqueNm)} Nm at ${num(p.rpm)} rpm${p.efficiency === undefined ? "" : `, ${Math.round(p.efficiency * 100)}% efficient`}`,
        })),
    }));
}

export function TorqueSpeedChart({ ids }: { ids?: readonly string[] }) {
    const series = torqueSpeedChartSeries(ids);
    if (series.length === 0) return <p className="bm-empty">No measured torque-speed data for this selection yet.</p>;
    // Stall tests alone make no curve: draw them as bars.
    if (series.every((s) => s.points.length === 1 && s.points[0]?.x === 0)) {
        const max = Math.max(...series.map((s) => s.points[0]?.y ?? 0)) || 1;
        return <ul className="bm-stall" aria-label="Measured stall torque">
            {series.map((s, i) => <li key={s.id} className={`bm-c${i % 4}`}>
                <span>{s.name}</span>
                <span className="bm-stall-bar" style={{ width: `${((s.points[0]?.y ?? 0) / max) * 100}%` }} />
                <b>{num(s.points[0]?.y ?? 0)} Nm at 0 rpm</b>
            </li>)}
        </ul>;
    }
    return <XYChart series={series} xLabel="rpm" yLabel="Nm" ariaLabel="Measured torque versus speed" />;
}

// Continuous holds sit one decade past the longest timed hold.
export function ThermalChart() {
    const all = thermalSeries();
    const finite = all.flatMap((s) => s.points.map((p) => p.tToLimitS ?? 0));
    const cont = 10 ** Math.ceil(Math.log10(Math.max(10, ...finite)) + 1);
    const series: XYSeries[] = all.slice(0, 4).map((s) => ({
        id: `${s.actuatorId}/${s.run.runId}`,
        name: s.name,
        points: s.points.map((p) => ({
            x: p.tToLimitS ?? cont,
            y: p.torqueNm,
            label: `${num(p.torqueNm)} Nm for ${holdLabel(p.tToLimitS)}`,
        })),
    }));
    if (series.length === 0) return <p className="bm-empty">No thermal runs yet.</p>;
    return <XYChart series={series} logX xLabel="time to thermal limit, s" yLabel="Nm" ariaLabel="Torque held versus time to thermal limit"
        xTickLabel={(v) => (v >= cont ? "cont." : v >= 1000 ? `${v / 1000}k` : `${v}`)} />;
}

export function RunItem({ run }: { run: BenchmarkRun }) {
    return <li className="bm-run">
        <OriginBadge origin={run.origin} />
        <span className="bm-run-what">{measuredSummary(run)}</span>
        <details>
            <summary>Source & rig</summary>
            <p><SourceLink run={run} />{run.source?.locator && <small> ({run.source.locator})</small>}</p>
            <p>{run.unit}. {describeRig(run)}. {run.date}.</p>
            {run.notes && <p>{run.notes}</p>}
        </details>
    </li>;
}

// "Measured" panel for an actuator page, beside the engineering evidence.
export function MeasuredPanel({ id }: { id: string }) {
    const runs = runsFor(id);
    if (runs.length === 0) return null;
    const deltas = datasheetDeltas(id);
    return <section className="bm-panel" aria-labelledby={`bm-panel-${id}`} data-actuator-id={id}>
        <header>
            <h2 id={`bm-panel-${id}`}>Measured</h2>
            <a href={BENCHMARKS_PATH}>All benchmarks</a>
        </header>
        {deltas.length > 0 && <div className="bm-deltas">{deltas.map((d) => <DeltaBar key={`${d.run.runId}-${d.metric}`} row={d} />)}</div>}
        <ul className="bm-runs">{runs.map((r) => <RunItem key={r.runId} run={r} />)}</ul>
    </section>;
}
