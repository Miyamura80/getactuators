import { Fragment, type ReactNode, useEffect, useMemo, useState } from "react";
import { PublicFooter } from "../../components/PublicFooter";
import { PublicHeader } from "../../components/PublicHeader";
import { MAX_OVERLAY, OriginBadge, type Series, ThermalChart, TnChart } from "../../components/benchmarks/charts";
import {
    BENCHMARKS_AS_OF,
    BENCHMARKS_PATH,
    BENCHMARK_RUNS,
    type BenchmarkRun,
    GROUP_LABEL,
    METRICS,
    PROTOCOL_URL,
    SUBMIT_URL,
    benchmarkedIds,
    continuousTorque,
    curveFor,
    curveRuns,
    datasheetDeltas,
    formatRatio,
    groupsCovered,
    isRanked,
    measuredLeaderboard,
    rankCaveat,
    reportedMetrics,
    runKey,
    thermalRuns,
} from "../../../../src/benchmarks";
import { ACTUATORS } from "../../lib/data";
import { readOpenRun, readPicks, writePicks } from "./url-state";
import "../tools.css";
import "../../components/benchmarks/benchmarks.css";

const TITLE = "Benchmarks";
const nameOf = (id: string) => ACTUATORS.find((a) => a.id === id)?.name ?? id;
const num = (v: number) => String(Number(v.toPrecision(3)));

// Actuators with a T-N curve, in catalog order of first appearance.
const CURVE_IDS = [...new Set(curveRuns().map((r) => r.actuatorId))];
const DEFAULT_PICKS = ["xiaomi-cybergear", "robstride-02", "robstride-00", "dynamixel-xm540-w270-t"].filter((id) => CURVE_IDS.includes(id));

function Section({ n, id, title, lede, children }: { n: string; id: string; title: string; lede: string; children: ReactNode }) {
    return <section className="bm-sec" id={id} aria-labelledby={`${id}-h`}>
        <h2 id={`${id}-h`}><span>{n}</span>{title}</h2>
        <p>{lede}</p>
        {children}
    </section>;
}

// Diverging bars: measured peak over datasheet peak, shortfall to the left.
function DeltaBars() {
    const rows = datasheetDeltas(ACTUATORS);
    const lo = -1;
    const hi = 0.5;
    const pos = (v: number) => ((Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo)) * 100;
    const zero = pos(0);
    return <ol className="bm-delta" style={{ ["--zero" as string]: `${zero}%` }}>
        {rows.map((d) => {
            const r = (d.peak?.ratio ?? 1) - 1;
            const cls = Math.abs(r) < 0.005 ? "is-even" : r < 0 ? "is-short" : "is-over";
            const left = Math.min(pos(r), zero);
            const width = Math.abs(pos(r) - zero);
            return <li key={d.actuator.id} data-actuator={d.actuator.id}>
                <a href={`/actuators/${d.actuator.id}`}>{d.actuator.name}</a>
                <div className="bm-track" title={`${num(d.peak?.measured ?? 0)} N·m measured vs ${num(d.peak?.datasheet ?? 0)} N·m datasheet`}>
                    <span className={`bm-bar ${cls}`} style={{ left: `${left}%`, width: `${width}%` }} />
                </div>
                <span className="bm-mono">{d.peak ? formatRatio(d.peak.ratio) : "n/a"}</span>
            </li>;
        })}
    </ol>;
}

function Leaderboard() {
    const rows = measuredLeaderboard(ACTUATORS);
    const top = rows[0]?.densityNmPerKg ?? 1;
    return <ol className="bm-leader">
        {rows.map((row) => <li key={row.actuator.id}>
            <a href={`/actuators/${row.actuator.id}`}>{row.actuator.name}</a>
            <div className="bm-fill" style={{ width: `${(row.densityNmPerKg / top) * 100}%` }} title={`${num(row.continuousNm)} N·m continuous, ${row.weightG} g`} />
            <span className="bm-mono">{num(row.densityNmPerKg)} N·m/kg</span>
        </li>)}
    </ol>;
}

function metricRows(run: BenchmarkRun): [string, string][] {
    return reportedMetrics(run)
        .filter((k) => k !== "torqueSpeed" && k !== "thermal")
        .map((k) => [METRICS[k].label, `${num(run[k] as number)} ${METRICS[k].unit} ± ${run.uncertainty[k]}`]);
}

function RunCard({ run, open }: { run: BenchmarkRun; open: boolean }) {
    const rig = run.rig;
    const cont = continuousTorque(run);
    return <li>
        <details className="bm-run" id={`run-${run.actuatorId}-${run.runId}`} open={open} data-run={runKey(run)}>
            <summary>
                <OriginBadge run={run} />
                <b>{nameOf(run.actuatorId)}</b>
                <span className="bm-mono">{run.runId} · {run.date} · {run.dataMethod}{rankCaveat(run) ? ` · ${rankCaveat(run)}` : ""}</span>
                <span className="bm-mono">{groupsCovered(run).map((g) => GROUP_LABEL[g]).join(", ")}</span>
            </summary>
            <div className="bm-run-body">
                {run.note ? <p>{run.note}</p> : null}
                {run.notRanked ? <p className="bm-flag">Not ranked: {run.notRanked}</p> : null}
                {run.plausibilityNote ? <p className="bm-flag">Flagged: {run.plausibilityNote}</p> : null}
                <dl>
                    {run.methodNote ? <><dt>Method</dt><dd>{run.methodNote}</dd></> : null}
                    {run.revision ? <><dt>Revision</dt><dd>{run.revision}</dd></> : null}
                    <dt>Rig</dt>
                    <dd>{rig.torqueSensor}{rig.accuracyPct === null ? "" : ` (${rig.accuracyPct}% FS)`}; {rig.encoder}; {rig.controller}{rig.firmware ? ` ${rig.firmware}` : ""}</dd>
                    <dt>Conditions</dt>
                    <dd className="bm-mono">{rig.busV === null ? "bus not stated" : `${rig.busV} V`} · {rig.ambientC === null ? "ambient not stated" : `${rig.ambientC} °C`}</dd>
                    {run.torqueSpeed?.length ? <><dt>T-N</dt><dd className="bm-mono">{run.torqueSpeed.length} points ± {run.uncertainty.torqueSpeed} N·m</dd></> : null}
                    {run.thermal?.length ? <><dt>Thermal</dt><dd className="bm-mono">{run.thermal.map((p) => `${p.torqueNm} N·m ${p.tToLimitS === null ? "continuous" : `${p.tToLimitS} s`}`).join(" · ")} ± {run.uncertainty.thermal} N·m{cont === undefined ? "" : ` (continuous ${num(cont)} N·m)`}</dd></> : null}
                    {metricRows(run).map(([label, value]) => <Fragment key={label}><dt>{label}</dt><dd className="bm-mono">{value}</dd></Fragment>)}
                    <dt>Source</dt>
                    <dd>{run.source ? <a href={run.source.url}>{run.source.title}</a> : `@${run.submitter ?? "unknown"}`}</dd>
                </dl>
            </div>
        </details>
    </li>;
}

// /benchmarks: measured actuator performance against the datasheet. The T-N
// overlay picks live in ?tn=, an open run in #run=<actuator>/<run>.
export function Benchmarks({ menuOpen = false }: { menuOpen?: boolean }) {
    const [picks, setPicks] = useState<string[]>(() => {
        const fromUrl = readPicks(window.location.search);
        return fromUrl === null ? DEFAULT_PICKS : fromUrl.filter((id) => CURVE_IDS.includes(id)).slice(0, MAX_OVERLAY);
    });
    // The open run follows #run=…, including legend links clicked on this page.
    const [openRun, setOpenRun] = useState(() => readOpenRun(window.location.hash));
    useEffect(() => {
        const onHash = () => setOpenRun(readOpenRun(window.location.hash));
        window.addEventListener("hashchange", onHash);
        return () => window.removeEventListener("hashchange", onHash);
    }, []);
    useEffect(() => {
        const prev = document.title;
        document.title = TITLE;
        return () => { document.title = prev; };
    }, []);
    useEffect(() => {
        if (openRun) document.getElementById(`run-${openRun.replace("/", "-")}`)?.scrollIntoView?.({ block: "start" });
    }, [openRun]);
    const toggle = (id: string) => {
        const next = picks.includes(id) ? picks.filter((p) => p !== id) : [...picks, id].slice(0, MAX_OVERLAY);
        setPicks(next);
        window.history.replaceState(window.history.state, "", `${BENCHMARKS_PATH}${writePicks(window.location.search, next)}${window.location.hash}`);
    };
    const tnSeries: Series[] = useMemo(() => picks.flatMap((id) => {
        const run = curveFor(id);
        return run ? [{ label: nameOf(id), run }] : [];
    }), [picks]);
    const thermal = thermalRuns().filter(isRanked);
    const thermalGroups = [thermal.slice(0, MAX_OVERLAY), thermal.slice(MAX_OVERLAY, MAX_OVERLAY * 2)].filter((g) => g.length);
    const community = BENCHMARK_RUNS.filter((r) => r.origin === "community").length;
    return <div className="tool-page bm-page">
        <PublicHeader path={BENCHMARKS_PATH} initialOpen={menuOpen} />
        <main className="tool-main">
            <header className="tool-head bm-head">
                <p className="tool-kicker">Measured · as of {BENCHMARKS_AS_OF}</p>
                <h1>{TITLE}</h1>
                <p className="tool-lede">What actuators do on a dyno, next to what the datasheet claims.</p>
                <a className="bm-cta" href={SUBMIT_URL}>Submit a run</a>
                <div className="bm-stats">
                    <div><b>{BENCHMARK_RUNS.length}</b><span>runs</span></div>
                    <div><b>{benchmarkedIds().length}</b><span>actuators</span></div>
                    <div><b>{curveRuns().length}</b><span>T-N curves</span></div>
                    <div><b>{community}</b><span>community runs</span></div>
                </div>
            </header>

            <Section n="01" id="delta" title="Datasheet vs measured" lede="Highest measured peak torque over the datasheet peak. A curve that stops short of the stall rating counts as a shortfall.">
                <DeltaBars />
            </Section>

            <Section n="02" id="curves" title="Torque-speed" lede={`Overlay up to ${MAX_OVERLAY} T-N curves. Bus voltage and method are in the legend; digitised curves carry their reading error.`}>
                <div className="bm-picks" role="group" aria-label="Actuators on the overlay">
                    {CURVE_IDS.map((id) => <button key={id} type="button" aria-pressed={picks.includes(id)} disabled={!picks.includes(id) && picks.length >= MAX_OVERLAY} onClick={() => toggle(id)}>{nameOf(id)}</button>)}
                </div>
                <TnChart series={tnSeries} title="Measured torque against speed" />
            </Section>

            <Section n="03" id="thermal" title="Thermal derating" lede="How long each torque holds before the winding limit, as a share of the run's peak. Hollow points on the right held without reaching it. Heat sinks differ: see each run.">
                {thermalGroups.map((g, i) => <ThermalChart key={g.map(runKey).join()} series={g.map((run) => ({ label: nameOf(run.actuatorId), run }))} title={`Thermal derating, group ${i + 1}`} />)}
            </Section>

            <Section n="04" id="leaderboard" title="Measured leaderboard" lede="Continuous torque density: the highest torque held 10 minutes or without reaching the limit, per kg.">
                <Leaderboard />
            </Section>

            <Section n="05" id="runs" title="All runs" lede="Every run with its rig, method, uncertainty and source.">
                <ul className="bm-runs">
                    {BENCHMARK_RUNS.map((r) => <RunCard key={runKey(r)} run={r} open={openRun === runKey(r)} />)}
                </ul>
                <p><a href={PROTOCOL_URL}>Test protocol</a> · <a href="/api/v1/benchmarks">JSON</a> · <a href={`${BENCHMARKS_PATH}.md`}>Markdown</a></p>
            </Section>
        </main>
        <PublicFooter />
    </div>;
}
