import {
    ARC_FILL,
    magnetRangeG,
    NDFEB_DENSITY_G_CM3,
    REE_FRACTION,
    SIZE_CLASSES,
    sourceOf,
} from "../../../../src/humanoids";

const pct = (x: number) => `${Number((x * 100).toFixed(2))}%`;
const bound = (n: number, unit: string) => (Number.isFinite(n) ? `≤ ${n.toLocaleString("en-US")} ${unit}` : "above");
const METHOD_SOURCES = ["fai-magnets", "jda-ndfeb", "crystals-gbd", "frameless-ilm85", "frameless-ri60", "frameless-ri80"];

export function Method() {
    return (
        <details className="hm-fold">
            <summary>Magnet mass method</summary>
            <div className="hm-method">
                <p>
                    Each actuator gets a motor size class from its peak torque (rotary) or force (linear), or from its
                    joint and the robot's mass when neither is published. Magnet mass = π × airgap diameter × active
                    length × magnet thickness × arc fill ({pct(ARC_FILL[0])} to {pct(ARC_FILL[1])}) × {NDFEB_DENSITY_G_CM3}{" "}
                    g/cm³. Hydraulic joints carry no magnet at the joint. Every figure is an estimate with a range.
                </p>
                <div className="hm-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Class</th>
                                <th className="num">Torque</th>
                                <th className="num">Force</th>
                                <th className="num">Airgap x length</th>
                                <th className="num">Magnet</th>
                                <th className="num">g per motor</th>
                                <th>Comparable</th>
                            </tr>
                        </thead>
                        <tbody>
                            {SIZE_CLASSES.map((c, i) => {
                                const [lo, hi] = magnetRangeG(c.id);
                                const prev = SIZE_CLASSES[i - 1];
                                return (
                                    <tr key={c.id}>
                                        <td>{c.label}</td>
                                        <td className="num">
                                            {Number.isFinite(c.maxTorqueNm) ? bound(c.maxTorqueNm, "N·m") : `> ${prev?.maxTorqueNm} N·m`}
                                        </td>
                                        <td className="num">
                                            {Number.isFinite(c.maxForceN) ? bound(c.maxForceN, "N") : `> ${prev?.maxForceN.toLocaleString("en-US")} N`}
                                        </td>
                                        <td className="num">
                                            {c.airgapDiameterMm} x {c.activeLengthMm} mm
                                        </td>
                                        <td className="num">
                                            {c.magnetThicknessMm[0]} to {c.magnetThicknessMm[1]} mm
                                        </td>
                                        <td className="num">
                                            {lo} to {hi}
                                        </td>
                                        <td>{c.comparable}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <p>
                    Rare earths, by magnet mass: Nd {pct(REE_FRACTION.nd[0])} to {pct(REE_FRACTION.nd[1])}, Pr{" "}
                    {pct(REE_FRACTION.pr[0])} to {pct(REE_FRACTION.pr[1])} (PrNd 29 to 32% of a sintered magnet, Pr 20 to
                    25% of that), Dy {pct(REE_FRACTION.dy[0])} to {pct(REE_FRACTION.dy[1])} (grain-boundary diffused to
                    grade H), Tb {pct(REE_FRACTION.tb[0])} to {pct(REE_FRACTION.tb[1])}. Published per-robot estimates
                    run 2 to 4.5 kg of NdFeB; robots here land lower where hands and extra axes are not counted.
                </p>
                <ol className="hm-src">
                    {METHOD_SOURCES.map((id) => {
                        const s = sourceOf(id);
                        return (
                            <li key={id}>
                                <a href={s.url} target={s.url.startsWith("/") ? undefined : "_blank"} rel="noopener">
                                    {s.title}
                                </a>
                            </li>
                        );
                    })}
                </ol>
            </div>
        </details>
    );
}
