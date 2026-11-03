import {
    BENCHMARKS_PATH,
    continuousTorque,
    curveFor,
    datasheetDelta,
    formatRatio,
    METRICS,
    type MetricKey,
    rankableRuns,
    reportedMetrics,
    runsFor,
} from "../../../../src/benchmarks";
import { ACTUATORS } from "../../lib/data";
import { OriginBadge, TnChart, runHref } from "./charts";

type ExtraKey = Exclude<MetricKey, "torqueSpeed" | "thermal" | "peakTorqueNm">;
const EXTRA_KEYS: readonly ExtraKey[] = ["noLoadRpm", "backlashArcmin", "stiffnessNmPerRad", "frictionNm", "ripplePct", "bandwidthHz", "latencyMs", "repeatabilityArcmin"];

const num = (v: number) => String(Number(v.toPrecision(3)));

// "Measured" next to the engineering evidence panel on an actuator page:
// the best measured peak and continuous torque against the datasheet, the
// T-N curve, and every run with its origin. Renders nothing without runs.
export function MeasuredPanel({ id }: { id: string }) {
    const actuator = ACTUATORS.find((a) => a.id === id);
    const runs = runsFor(id);
    if (!actuator || runs.length === 0) return null;
    const ranked = rankableRuns(id).map((r) => datasheetDelta(r, actuator));
    const peak = ranked.filter((d) => d.peak).sort((a, b) => (b.peak?.ratio ?? 0) - (a.peak?.ratio ?? 0))[0]?.peak;
    const cont = ranked.map((d) => continuousTorque(d.run)).filter((v): v is number => v !== undefined).sort((a, b) => b - a)[0];
    const curve = curveFor(id);
    // Transmission and control figures, one per metric, first run first.
    const extras: [ExtraKey, number, string][] = [];
    for (const r of runs)
        for (const k of reportedMetrics(r))
            if (EXTRA_KEYS.includes(k as ExtraKey) && !extras.some(([key]) => key === k))
                extras.push([k as ExtraKey, r[k as ExtraKey] as number, r.runId]);
    return <section className="measured-panel" aria-label={`Measured performance of ${actuator.name}`} data-actuator-id={id}>
        <header>
            <h2>Measured</h2>
            <p>{runs.length} run{runs.length === 1 ? "" : "s"} on file. Measurements next to the datasheet; read each run's method before comparing.</p>
        </header>
        <div className="measured-grid">
            <div>
                <ul className="measured-kpis">
                    {peak ? <li data-kpi="peak"><b>{num(peak.measured)} N·m</b><span>measured peak vs {num(peak.datasheet)} N·m datasheet ({formatRatio(peak.ratio)})</span></li> : null}
                    {cont !== undefined ? <li data-kpi="continuous"><b>{num(cont)} N·m</b><span>held 10 min or without reaching the thermal limit{actuator.rated_torque_nm ? ` (rated ${num(actuator.rated_torque_nm)} N·m)` : ""}</span></li> : null}
                    {extras.map(([key, value, run]) => <li key={`${run}-${key}`} data-kpi={key}><b>{num(value)} {METRICS[key].unit}</b><span>{METRICS[key].label.toLowerCase()} ({run})</span></li>)}
                </ul>
                <ul className="measured-runs">
                    {runs.map((r) => <li key={r.runId}>
                        <OriginBadge run={r} />
                        <a href={runHref(r)}>{r.runId}</a>
                        <span className="bm-mono">{r.date} · {r.dataMethod}{r.otherRevision ? " · other revision" : ""}</span>
                    </li>)}
                </ul>
            </div>
            {curve ? <TnChart series={[{ label: actuator.name, run: curve }]} title={`Measured torque against speed for ${actuator.name}`} /> : null}
        </div>
        <p><a href={BENCHMARKS_PATH}>All measured benchmarks</a></p>
    </section>;
}
