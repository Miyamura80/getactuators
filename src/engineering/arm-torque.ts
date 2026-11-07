// Shared by the calculator page, the /robots diagram and the MCP tool: pure
// math and URL state, no browser or server dependencies.
//
// Static holding torque for a planar serial arm held horizontal: the worst
// gravity case for every pitch joint at once. Each joint must hold every link,
// actuator and payload outboard of it: τ_i = g · Σ m_k · (x_k − x_i).
// Motion (inertia × acceleration), friction and thermal duty are not modeled.

import { ACTUATORS } from "../catalog";
import { candidateRows, shortlist } from "../catalog/shortlist";

export const ARM_TORQUE_PATH = "/tools/robot-arm-torque-calculator";

export const G = 9.80665;

export interface Link {
    // Joint-to-joint length, m.
    length: number;
    // Structure mass of the link, kg.
    mass: number;
    // Mass of the actuator mounted at the link's far end (driving the next
    // joint), kg. Ignored on the last link: the payload sits there instead.
    actuatorMass: number;
}

export interface Arm {
    links: Link[];
    // Payload plus gripper at the tip, kg.
    payload: number;
    // Where each link's own mass acts, as a fraction of its length (0.5 = middle).
    comFraction: number;
}

export interface JointLoad {
    // Joint position along the arm, m from the first joint.
    x: number;
    // Static holding torque, N·m.
    torqueNm: number;
}

interface PointMass {
    x: number;
    kg: number;
}

export function pointMasses(arm: Arm): PointMass[] {
    const masses: PointMass[] = [];
    let x = 0;
    arm.links.forEach((l, i) => {
        masses.push({ x: x + l.length * arm.comFraction, kg: l.mass });
        x += l.length;
        if (i < arm.links.length - 1) masses.push({ x, kg: l.actuatorMass });
    });
    masses.push({ x, kg: arm.payload });
    return masses;
}

export function jointLoads(arm: Arm): JointLoad[] {
    const masses = pointMasses(arm);
    const loads: JointLoad[] = [];
    let x = 0;
    for (const l of arm.links) {
        const moment = masses
            .filter((m) => m.x > x)
            .reduce((sum, m) => sum + m.kg * (m.x - x), 0);
        loads.push({ x, torqueNm: G * moment });
        x += l.length;
    }
    return loads;
}

// The calculator draws and edits 2 to 4 links; agents get the same range.
export const MIN_LINKS = 2;
export const MAX_LINKS = 4;

export function validArm(arm: Arm): boolean {
    const ok = (v: number) => Number.isFinite(v) && v >= 0;
    return (
        arm.links.length >= MIN_LINKS &&
        arm.links.length <= MAX_LINKS &&
        arm.links.every(
            (l) =>
                ok(l.mass) &&
                ok(l.actuatorMass) &&
                Number.isFinite(l.length) &&
                l.length > 0,
        ) &&
        ok(arm.payload) &&
        arm.comFraction >= 0 &&
        arm.comFraction <= 1
    );
}

export function jointName(i: number, n: number): string {
    const names =
        n <= 3
            ? ["Shoulder", "Elbow", "Wrist"]
            : ["Shoulder", "Elbow", "Wrist 1", "Wrist 2"];
    return names[i] ?? `Joint ${i + 1}`;
}

// Example arms: inputs to try, not specifications of any product.
export const PRESETS: { label: string; arm: Arm }[] = [
    {
        label: "Desktop arm, 0.5 kg",
        arm: {
            payload: 0.5,
            comFraction: 0.5,
            links: [
                { length: 0.25, mass: 0.4, actuatorMass: 0.4 },
                { length: 0.2, mass: 0.3, actuatorMass: 0.2 },
                { length: 0.08, mass: 0.1, actuatorMass: 0 },
            ],
        },
    },
    {
        label: "Mobile manipulator, 2 kg",
        arm: {
            payload: 2,
            comFraction: 0.5,
            links: [
                { length: 0.4, mass: 1.2, actuatorMass: 1.0 },
                { length: 0.35, mass: 0.8, actuatorMass: 0.5 },
                { length: 0.12, mass: 0.3, actuatorMass: 0 },
            ],
        },
    },
    {
        label: "Long reach, 5 kg",
        arm: {
            payload: 5,
            comFraction: 0.5,
            links: [
                { length: 0.6, mass: 3, actuatorMass: 2 },
                { length: 0.5, mass: 2, actuatorMass: 1 },
                { length: 0.15, mass: 0.6, actuatorMass: 0 },
            ],
        },
    },
];

export const DEFAULT_ARM: Arm = PRESETS[1]?.arm as Arm;

function nums(raw: string | null): number[] | null {
    if (!raw || raw.length > 120) return null;
    const parts = raw.split(",");
    // "1," is a truncated vector, not a zero mass.
    if (parts.some((part) => part.trim() === "")) return null;
    const out = parts.map(Number);
    return out.every((v) => Number.isFinite(v) && v >= 0) ? out : null;
}

export function armToQuery(arm: Arm): string {
    const p = new URLSearchParams();
    p.set("L", arm.links.map((l) => l.length).join(","));
    p.set("m", arm.links.map((l) => l.mass).join(","));
    p.set("a", arm.links.map((l) => l.actuatorMass).join(","));
    p.set("p", String(arm.payload));
    if (arm.comFraction !== 0.5)
        p.set("com", String(Number((arm.comFraction * 100).toFixed(2))));
    return `?${p.toString().replaceAll("%2C", ",")}`;
}

export function armFromQuery(search: string): Arm {
    const p = new URLSearchParams(search);
    const L = nums(p.get("L"));
    const m = nums(p.get("m"));
    const a = nums(p.get("a"));
    const payload = Number(p.get("p"));
    const com = p.has("com") ? Number(p.get("com")) / 100 : 0.5;
    if (
        !L ||
        !m ||
        !a ||
        L.length !== m.length ||
        L.length !== a.length ||
        L.length > MAX_LINKS
    )
        return DEFAULT_ARM;
    const arm: Arm = {
        payload: Number.isFinite(payload) && payload >= 0 ? payload : 0,
        comFraction: com,
        links: L.map((length, i) => ({
            length,
            mass: m[i] ?? 0,
            actuatorMass: a[i] ?? 0,
        })),
    };
    return validArm(arm) ? arm : DEFAULT_ARM;
}

// One serializable answer for agent surfaces (MCP and WebMCP): holding torque
// per joint, the catalog screen for each, and the calculator path that opens
// this exact arm. Paths are site-relative.
export const ARM_ASSUMPTIONS =
    "Arm straight and horizontal; gravity only; each link's mass at the stated fraction of its length; actuator masses at the joints they drive; payload at the tip. Holding is continuous duty: compare with rated torque. Inertia × acceleration, friction and margins are left out.";

export function armReport(arm: Arm, limit = 5) {
    return {
        assumptions: ARM_ASSUMPTIONS,
        joints: jointLoads(arm).map((load, i) => {
            const list = shortlist(ACTUATORS, { torqueNm: load.torqueNm }, limit);
            return {
                number: i + 1,
                name: jointName(i, arm.links.length),
                position_m: Math.round(load.x * 1000) / 1000,
                holding_torque_nm: Math.round(load.torqueNm * 100) / 100,
                screen_total: list.total,
                shortlist: candidateRows(list),
            };
        }),
        calculator_path: `${ARM_TORQUE_PATH}${armToQuery(arm)}`,
    };
}
