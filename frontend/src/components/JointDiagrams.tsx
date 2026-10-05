import { useMemo, useState } from "react";
import { ARM_TORQUE_PATH, DEFAULT_ARM, armToQuery, jointLoads, jointName } from "../../../src/engineering/arm-torque";
import { HUMANOID_GUIDE_PATH } from "../../../src/server/agent/humanoid-joints";
import { humanoidJointMap } from "../../../src/server/agent/humanoid-map";
import { fmt } from "../lib/motor-torque";
import { ArmDiagram } from "./ArmDiagram";
import { BrandGlyph } from "./BrandGlyph";
import "../pages/tools.css";

// The same two drawings as the humanoid guide and the arm calculator, so a
// robot type on this page leads straight into its sizing model. The humanoid
// map is the server-rendered SVG (static data, no user input).
export function JointDiagrams() {
    const [active, setActive] = useState(0);
    const loads = useMemo(() => jointLoads(DEFAULT_ARM), []);
    const mapHtml = useMemo(() => humanoidJointMap(HUMANOID_GUIDE_PATH), []);
    const n = DEFAULT_ARM.links.length;
    const calc = `${ARM_TORQUE_PATH}${armToQuery(DEFAULT_ARM)}`;
    return (
        <section className="home-diagrams" aria-labelledby="joint-diagrams-title">
            <h2 className="block-title" id="joint-diagrams-title">
                <BrandGlyph className="block-tag" />
                Size it joint by joint
            </h2>
            <p className="block-sub">
                Static torque at every joint of a worked humanoid and a worked arm. Select a joint to open its
                catalog shortlist.
            </p>

            <div className="diagram-panel">
                <header className="diagram-head">
                    <h3>Humanoid joint map</h3>
                    <a href={HUMANOID_GUIDE_PATH}>Open the humanoid actuator guide →</a>
                </header>
                {/* biome-ignore lint/security/noDangerouslySetInnerHtml: generated from catalog data by humanoid-map.ts, which escapes nothing user-supplied. */}
                <div className="diagram-humanoid" dangerouslySetInnerHTML={{ __html: mapHtml }} />
            </div>

            <div className="diagram-panel">
                <header className="diagram-head">
                    <h3>Robot arm free-body diagram</h3>
                    <a href={calc}>Open this arm in the calculator →</a>
                </header>
                <div className="arm-sheet">
                    <ArmDiagram arm={DEFAULT_ARM} loads={loads} active={active} onSelect={setActive} />
                </div>
                <p className="diagram-readout" aria-live="polite">
                    <b>
                        τ{active + 1} {jointName(active, n)}
                    </b>{" "}
                    holds {fmt(loads[active]?.torqueNm ?? 0)} N·m with a 2 kg payload.{" "}
                    <a href={calc}>See actuators that reach it →</a>
                </p>
            </div>
        </section>
    );
}
