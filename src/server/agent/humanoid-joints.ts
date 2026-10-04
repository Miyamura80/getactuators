import { ACTUATORS } from "@/catalog";
import { type Shortlist, shortlist } from "@/catalog/shortlist";

// Static joint-torque estimates for a hypothetical 1.5 m, 50 kg humanoid
// carrying 1 kg in one hand. Each one is mass × g × horizontal lever arm for
// one stated pose: a floor for screening, not a dynamic requirement.

const G = 9.807;

export interface Joint {
    id: string;
    n: number;
    name: string;
    dof: string;
    // Static estimate, N·m, rounded to 0.1.
    torqueNm: number;
    pose: string;
    working: string;
}

function joint(
    id: string,
    n: number,
    name: string,
    dof: string,
    pose: string,
    terms: [mass: number, lever: number][],
): Joint {
    const raw = terms.reduce((sum, [m, l]) => sum + m * G * l, 0);
    const working = terms.map(([m, l]) => `${m} × ${G} × ${l}`).join(" + ");
    return { id, n, name, dof, pose, working, torqueNm: Math.round(raw * 10) / 10 };
}

// Numbered top to bottom, as balloons on a drawing are.
export const JOINTS: readonly Joint[] = [
    joint(
        "shoulder",
        1,
        "Shoulder",
        "2–3 (pitch, roll, yaw)",
        "arm straight out in front: a 3 kg arm with its center of mass 0.25 m out, plus the 1 kg payload at 0.55 m",
        [
            [3, 0.25],
            [1, 0.55],
        ],
    ),
    joint(
        "elbow",
        2,
        "Elbow",
        "1 (pitch)",
        "forearm horizontal: 1.2 kg forearm and hand at 0.12 m, plus the payload at 0.30 m",
        [
            [1.2, 0.12],
            [1, 0.3],
        ],
    ),
    joint(
        "wrist",
        3,
        "Wrist",
        "1–3 (pitch, yaw, roll)",
        "hand horizontal: the payload at 0.08 m and a 0.4 kg hand at 0.05 m",
        [
            [1, 0.08],
            [0.4, 0.05],
        ],
    ),
    joint(
        "waist",
        4,
        "Waist",
        "1–3 (yaw, pitch, roll)",
        "a 20 kg upper body with its center of mass 0.25 m above the waist, leaning 20°, so 0.086 m forward",
        [[20, 0.086]],
    ),
    joint(
        "hip",
        5,
        "Hip",
        "3 (pitch, roll, yaw)",
        "single-leg stance: the 42 kg above the stance hip, with its center of mass 0.10 m to the side",
        [[42, 0.1]],
    ),
    joint(
        "knee",
        6,
        "Knee",
        "1 (pitch)",
        "single-leg stance on a bent knee: 47 kg above the knee, center of mass 0.15 m behind it",
        [[47, 0.15]],
    ),
    joint(
        "ankle",
        7,
        "Ankle",
        "2 (pitch, roll)",
        "single-leg stance with the center of pressure 0.08 m from the ankle axis: 49 kg above the ankle",
        [[49, 0.08]],
    ),
];

export const HUMANOID_USE_CASES = ["humanoid_joint", "humanoid"] as const;

export function jointShortlist(
    j: Joint,
    limit = 4,
): Shortlist<(typeof ACTUATORS)[number]> {
    return shortlist(
        ACTUATORS,
        { torqueNm: j.torqueNm, useCases: HUMANOID_USE_CASES },
        limit,
    );
}

// Humanoid-tagged entries whose rated and peak torque are both undocumented:
// they can never pass a screen, so name them instead of hiding them.
export function undocumentedHumanoidEntries() {
    return ACTUATORS.filter(
        (a) =>
            a.use_cases.some((u) =>
                (HUMANOID_USE_CASES as readonly string[]).includes(u),
            ) &&
            a.rated_torque_nm == null &&
            a.peak_torque_nm == null,
    );
}
