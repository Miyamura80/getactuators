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
    return <details className="compare-measured">
        <summary>Measured T-N overlay ({series.length} of {ids.length} with a curve)</summary>
        <TnChart series={series} title="Measured torque against speed for the compared actuators" />
        <p>Curves come from different rigs and voltages; check each run on <a href={BENCHMARKS_PATH}>/benchmarks</a>.</p>
    </details>;
}
