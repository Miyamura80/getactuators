import type { Actuator } from "@/catalog";
import {
    ARM_TORQUE_PATH,
    type Arm,
    DEFAULT_ARM,
    armToQuery,
    jointLoads,
} from "@/engineering/arm-torque";
import { HUMANOID_GUIDE_PATH, HUMANOID_USE_CASES, JOINTS } from "./humanoid-joints";

// "Size a joint" on each actuator page: the three engineering tools, opened
// at this part's own numbers. Each line states the number the link leads to,
// so the section reads on its own and gives crawlers a reason to follow it.

const MOTOR_TORQUE_PATH = "/tools/motor-torque-calculator";

function round(v: number): string {
    return String(Number(v.toPrecision(3)));
}

function motorLine(a: Actuator): string | null {
    const torque = a.rated_torque_nm ?? a.peak_torque_nm;
    if (torque == null) return null;
    const which = a.rated_torque_nm != null ? "rated" : "peak";
    const rpm = a.max_speed_rpm;
    if (rpm == null) {
        return `- [Motor torque calculator](${MOTOR_TORQUE_PATH}?solve=power&t=${torque}): **${round(torque)} N·m** ${which}; add a speed for its shaft power.`;
    }
    const watts = (torque * rpm) / (60 / (2 * Math.PI));
    return `- [Motor torque calculator](${MOTOR_TORQUE_PATH}?solve=power&t=${torque}&n=${rpm}): **${round(watts)} W** of shaft power at its ${which} ${round(torque)} N·m and ${round(rpm)} rpm.`;
}

// The calculator's default 2 kg arm with this part at the elbow: its mass is
// what the shoulder carries.
function armLine(a: Actuator): string | null {
    if (a.weight_g == null || a.weight_g <= 0) return null;
    const kg = a.weight_g / 1000;
    const arm: Arm = {
        ...DEFAULT_ARM,
        links: DEFAULT_ARM.links.map((l, i) =>
            i === 0 ? { ...l, actuatorMass: kg } : l,
        ),
    };
    const shoulder = jointLoads(arm)[0]?.torqueNm;
    if (shoulder == null) return null;
    return `- [Robot arm torque calculator](${ARM_TORQUE_PATH}${armToQuery(arm)}): **${round(shoulder)} N·m** at the shoulder with its ${round(a.weight_g)} g at the elbow of a 2 kg-payload arm.`;
}

function humanoidLine(a: Actuator): string | null {
    if (!a.use_cases.some((u) => (HUMANOID_USE_CASES as readonly string[]).includes(u)))
        return null;
    const rated = a.rated_torque_nm;
    const covered =
        rated == null
            ? []
            : JOINTS.filter((j) => j.torqueNm <= rated).sort(
                  (x, y) => y.torqueNm - x.torqueNm,
              );
    if (covered.length === 0)
        return `- [Humanoid robot actuators](${HUMANOID_GUIDE_PATH}): **${JOINTS.length} joints** with a static torque estimate and the catalog parts that reach it.`;
    return `- [Humanoid robot actuators](${HUMANOID_GUIDE_PATH}#${covered[0]?.id}): **${covered.length} of ${JOINTS.length} joints** within its rated torque, up to the ${covered[0]?.name.toLowerCase()} at ${covered[0]?.torqueNm} N·m.`;
}

export function sizeAJointSection(a: Actuator): string | null {
    const lines = [motorLine(a), armLine(a), humanoidLine(a)].filter(
        (l): l is string => l !== null,
    );
    return lines.length > 0 ? `## Size a joint\n\n${lines.join("\n")}` : null;
}
