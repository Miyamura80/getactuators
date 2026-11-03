import { BENCHMARKS_PATH, curveFor } from "../../../../src/benchmarks";
import { ACTUATORS } from "../../lib/data";
import { TnChart } from "./charts";

// /compare: an optional overlay of the measured T-N curves of the picked
// actuators, closed by default. Hidden when none of them has a curve.
export function MeasuredOverlay({ ids }: { ids: string[] }) {
    const series = ids.flatMap((id) => {
        const run = curveFor(id);
        const name = ACTUATORS.find((a) => a.id === id)?.name ?? id;
        return run ? [{ label: name, run }] : [];
    });
    if (series.length === 0) return null;
    // Say only what differs between the shown curves.
    const differ = (key: (s: (typeof series)[number]) => unknown) => new Set(series.map(key)).size > 1;
    const rigs = differ((s) => JSON.stringify({ ...s.run.rig, busV: null }));
    const volts = differ((s) => s.run.rig.busV);
    const caveat = series.length < 2 ? "Only one of these actuators has a measured curve" : rigs && volts ? "Curves come from different rigs and voltages" : rigs ? "Curves come from different rigs" : volts ? "Curves are at different bus voltages" : "Curves share a rig description and bus voltage, but not necessarily a test";
    return <details className="compare-measured">
        <summary>Measured T-N overlay ({series.length} of {ids.length} with a curve)</summary>
        <TnChart series={series} title="Measured torque against speed for the compared actuators" />
        <p>{caveat}; check each run on <a href={BENCHMARKS_PATH}>/benchmarks</a>.</p>
    </details>;
}
