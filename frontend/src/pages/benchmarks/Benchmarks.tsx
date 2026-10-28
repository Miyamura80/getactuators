import { type ReactNode, useEffect, useState } from "react";
import { PublicFooter } from "../../components/PublicFooter";
import { PublicHeader } from "../../components/PublicHeader";
import {
    DeltaBar,
    IndependenceBadge,
    OriginBadge,
    RunItem,
    SourceLink,
    ThermalChart,
    TorqueSpeedChart,
} from "../../components/benchmarks/BenchmarkViews";
import {
    BENCHMARKS_PATH,
    BENCHMARK_RUNS,
    PROTOCOL_URL,
    SUBMIT_URL,
    benchmarkActuator,
    datasheetDeltas,
    measuredActuators,
    measuredLeaderboard,
    runsFor,
    torqueSpeedSeries,
} from "../../../../src/benchmarks";
import "../tools.css";

const TITLE = "Actuator benchmarks";
const MAX_OVERLAY = 4;

function Section({ n, id, title, children }: { n: string; id: string; title: string; children: ReactNode }) {
    return <section className="bm-sec" id={id} aria-labelledby={`${id}-h`}>
        <h2 id={`${id}-h`}><span>{n}</span>{title}</h2>
        {children}
    </section>;
}

function DatasheetVsMeasured() {
    const rows = datasheetDeltas();
    const ids = [...new Set(rows.map((r) => r.actuatorId))];
    return <><div className="bm-dvm">
        {ids.map((id) => <article key={id} className="bm-card">
            <h3><a href={`/actuators/${id}`}>{benchmarkActuator(id)?.name ?? id}</a></h3>
            {rows.filter((r) => r.actuatorId === id).map((r) => <div key={`${r.run.runId}-${r.metric}`} className="bm-dvm-row">
                <DeltaBar row={r} />
                <small><OriginBadge origin={r.run.origin} /> <IndependenceBadge run={r.run} /> <SourceLink run={r.run} /></small>
            </div>)}
        </article>)}
    </div>
    <p className="bm-note">Verdicts come from independent runs only. Maker and affiliated tests are shown without one; a datasheet maximum is either met or exceeded.</p>
    </>;
}

function Overlay() {
    const available = [...new Set(torqueSpeedSeries().map((s) => s.actuatorId))];
    const [picked, setPicked] = useState<string[]>(() => available.slice(0, MAX_OVERLAY));
    const toggle = (id: string) =>
        setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : cur.length < MAX_OVERLAY ? [...cur, id] : cur));
    return <>
        <div className="bm-picks" role="group" aria-label="Actuators on the chart">
            {available.map((id) => <button key={id} type="button" aria-pressed={picked.includes(id)} onClick={() => toggle(id)}>
                {benchmarkActuator(id)?.name ?? id}
            </button>)}
        </div>
        <TorqueSpeedChart ids={picked} />
        <p className="bm-note">Up to four. A lone point at 0 rpm is a stall test, not a curve.</p>
    </>;
}

function Leaderboard() {
    const board = measuredLeaderboard();
    const ranked = new Set(board.map((r) => r.actuator.id));
    const waiting = measuredActuators().filter((a) => !ranked.has(a.id));
    return <>
        <ol className="bm-board">
            {board.map((r) => <li key={r.actuator.id}>
                <a href={`/actuators/${r.actuator.id}`}>{r.actuator.name}</a>
                <b>{r.densityNmPerKg.toFixed(2)} Nm/kg</b>
                <small>{r.continuousTorqueNm} Nm continuous, {r.massKg} kg <OriginBadge origin={r.run.origin} /> <IndependenceBadge run={r.run} /></small>
            </li>)}
        </ol>
        {waiting.length > 0 && <p className="bm-note">Not ranked until a continuous hold is measured: {waiting.map((a) => a.name).join(", ")}.</p>}
    </>;
}

function AllRuns() {
    return <div className="bm-all">
        {measuredActuators().map((a) => <details key={a.id} className="bm-card">
            <summary><span>{a.name}</span><small>{runsFor(a.id).length === 1 ? "1 run" : `${runsFor(a.id).length} runs`}</small></summary>
            <ul className="bm-runs">{runsFor(a.id).map((r) => <RunItem key={r.runId} run={r} />)}</ul>
        </details>)}
    </div>;
}

// /benchmarks: datasheet vs measured, T-N overlay, thermal derating, measured
// leaderboard, then every run with its origin badge and source.
export function Benchmarks({ menuOpen = false }: { menuOpen?: boolean }) {
    useEffect(() => {
        const prev = document.title;
        document.title = TITLE;
        return () => { document.title = prev; };
    }, []);
    return <div className="tool-page bm-page">
        <PublicHeader path={BENCHMARKS_PATH} initialOpen={menuOpen} />
        <main className="tool-main">
            <header className="tool-head bm-head">
                <p className="tool-kicker">{BENCHMARK_RUNS.length} runs · {measuredActuators().length} actuators</p>
                <h1>{TITLE}</h1>
                <p className="tool-lede">What actuators do on a test rig, next to what the datasheet says.</p>
                <a className="bm-cta" href={SUBMIT_URL}>Submit a run</a>
            </header>

            <Section n="01" id="datasheet-vs-measured" title="Datasheet vs measured"><DatasheetVsMeasured /></Section>
            <Section n="02" id="torque-speed" title="Torque-speed"><Overlay /></Section>
            <Section n="03" id="thermal" title="Thermal derating"><ThermalChart /></Section>
            <Section n="04" id="leaderboard" title="Measured leaderboard"><Leaderboard /></Section>
            <Section n="05" id="runs" title="All runs"><AllRuns /></Section>
            <p className="bm-note bm-foot"><a href={PROTOCOL_URL}>Test protocol</a> · <a href="/api/v1/benchmarks">JSON</a> · <a href="/benchmarks.md">Markdown</a></p>
        </main>
        <PublicFooter />
    </div>;
}
