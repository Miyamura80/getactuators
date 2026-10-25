import {
    ARC_FILL,
    COST_FIT,
    MASS_FIT,
    REE_METAL_PRICE,
    magnetRangeG,
    NDFEB_DENSITY_G_CM3,
    REE_FRACTION,
    SIZE_CLASSES,
    sourceOf,
} from "../../../../src/humanoids";

const pct = (x: number) => `${Number((x * 100).toFixed(2))}%`;
const bound = (n: number, unit: string) => (Number.isFinite(n) ? `≤ ${n.toLocaleString("en-US")} ${unit}` : "above");
const METHOD_SOURCES = [
    "fai-magnets",
    "jda-ndfeb",
    "crystals-gbd",
    "frameless-ilm85",
    "frameless-ri60",
    "frameless-ri80",
    "catalog-fit",
    "huibo-optimus-bom",
    "ms-optimus-bom",
    "bhl-rdworld",
    "bhl-irz",
    "price-nd",
    "price-pr",
    "price-dy",
    "price-tb",
    "price-feb-2026",
];
const curve = (f: typeof COST_FIT, unit: string, scale = 1) =>
    `${(f.coef * scale).toFixed(scale === 1 ? 0 : 3)} ${unit} x torque^${f.exp.toFixed(2)}, range x or / ${Math.exp(f.sigma).toFixed(2)}, ${f.ids.length} actuators from ${f.minTorque} to ${f.maxTorque} N·m`;

export function Method() {
    return (
        <details className="hm-fold">
            <summary>Method: magnets, cost and mass</summary>
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
                <p>
                    Actuator cost, per unit: the catalog list price when a joint links to a catalog actuator, or a price
                    published for that robot (reported). Optimus uses analyst BOM figures per actuator kind, from Huibo's
                    CNY breakdown at 7.2 CNY/USD up to Morgan Stanley's share of a $55k BOM (estimated). Everything else is
                    modeled from a curve fitted to catalog retail prices against peak torque ({curve(COST_FIT, "$")}), or
                    the Optimus linear-unit estimate for screw actuators. Retail prices of research actuators sit above a
                    volume maker's internal cost. Hydraulic and micro-motor joints have no defensible number and are left out.
                    Actuator mass uses the same approach with catalog masses ({curve(MASS_FIT, "kg", 1 / 1000)}).
                    The rest of the robot (grey) appears only where a cited full-robot BOM exists: Berkeley Humanoid Lite's
                    itemized parts list (reported) and the Optimus analyst remainder, which is not broken into categories
                    (estimated, hatched). List prices are never used for it, since they include margin. In the mass view
                    the rest is the published weight minus the actuator mass counted here (modeled).
                </p>
                <p>
                    Rare-earth cost: each element's grams times its metal price per kg (Nd ${REE_METAL_PRICE.nd.value}, Pr $
                    {REE_METAL_PRICE.pr.value}, Dy ${REE_METAL_PRICE.dy.value}, Tb ${REE_METAL_PRICE.tb.value}, {REE_METAL_PRICE.nd.asOf},
                    low grams at the low price and high grams at the high price). It is the raw value of the rare-earth
                    content only, not the price of a magnet or an actuator.
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
