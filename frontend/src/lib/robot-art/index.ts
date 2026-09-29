// Robot category art: three real-scale 3D robots drawn to a 2D canvas in one
// of eight render directions. Entry point for components; see styles.ts for
// the directions and models.ts for the robots.
import { type Box, camera, type CamSpec, fit, lights } from "./core";
import type { Vec3 } from "./math";
import { arm, humanoid, quadruped } from "./models";
import type { Scene } from "./scene";
import { blueprint, type Ctx2D, explodeOffsets, exploded, lidar, motion, rimLight, studio, tonal, xray } from "./styles";

export type RobotKind = "humanoid" | "quadruped" | "robot_arm";

export const ROBOT_ART_STYLES = ["studio", "tonal", "blueprint", "rim", "xray", "lidar", "exploded", "motion"] as const;
export type RobotArtStyle = (typeof ROBOT_ART_STYLES)[number];

// The direction the site ships with. Any other can be previewed on the live
// site with ?art=<style>, e.g. /robots?art=blueprint.
export const DEFAULT_ROBOT_ART_STYLE: RobotArtStyle = "tonal";

export function robotArtStyleFromSearch(search: string): RobotArtStyle {
    const v = new URLSearchParams(search).get("art");
    return (ROBOT_ART_STYLES as readonly string[]).includes(v ?? "") ? (v as RobotArtStyle) : DEFAULT_ROBOT_ART_STYLE;
}

// "tile": a 4:3 thumbnail. "card" / "card-lg": the wide home category cards,
// where the title sits bottom left, so the robot is framed on the right.
export type RobotArtFraming = "tile" | "card" | "card-lg";

const BUILD: Record<RobotKind, () => Scene> = { robot_arm: () => arm(), humanoid: () => humanoid(), quadruped: () => quadruped() };

const CAM: Record<RobotKind, CamSpec> = {
    robot_arm: { yaw: 0.9, pitch: 0.28, dist: 3.2, target: [0.25, 0.4, 0] },
    humanoid: { yaw: 0.75, pitch: 0.12, dist: 5, target: [0, 0.65, 0] },
    quadruped: { yaw: 0.85, pitch: 0.3, dist: 3, target: [0, 0.2, 0] },
};

// Actuator counts of the reference robots (UR5e, Unitree G1 23-DOF, Go2).
const ACTUATORS: Record<RobotKind, number> = { robot_arm: 6, humanoid: 23, quadruped: 12 };

interface Motion {
    scenes: Scene[];
    trace: Vec3[];
    cam: CamSpec;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Chronophotograph poses: a pick reach, a walk cycle and a trot.
function motionOf(kind: RobotKind): Motion {
    if (kind === "robot_arm") {
        const pose = (t: number) => ({ q1: lerp(-0.6, 0.55, t), q2: lerp(1.7, 0.9, t), q3: lerp(-2.3, -0.95, t), q4: lerp(0.6, 0.05, t) });
        return {
            scenes: [0, 0.5, 1].map((t) => arm(pose(t))),
            trace: Array.from({ length: 30 }, (_, i) => arm(pose(i / 29)).tip),
            cam: { ...CAM.robot_arm, yaw: 0.8 },
        };
    }
    if (kind === "humanoid") {
        const scenes = [0, 1, 2, 3, 4].map((i) => {
            const ph = i * 1.3;
            const sw = Math.sin(ph);
            return humanoid({
                x: i * 0.3,
                hipL: 0.38 * sw,
                hipR: -0.38 * sw,
                kneeL: -0.1 - 0.55 * Math.max(0, Math.cos(ph)),
                kneeR: -0.1 - 0.55 * Math.max(0, -Math.cos(ph)),
                shL: -0.35 * sw,
                shR: 0.35 * sw,
                elL: 0.5,
                elR: 0.5,
            });
        });
        const trace = Array.from({ length: 40 }, (_, i): Vec3 => [i * 0.03 - 0.02, 1.33 + 0.012 * Math.cos(i * 0.52), 0]);
        return { scenes, trace, cam: { yaw: 0.42, pitch: 0.1, dist: 6, target: [0.5, 0.65, 0] } };
    }
    const scenes = [0, 1, 2, 3, 4].map((i) => {
        const ph = i * 1.4;
        const a = Math.sin(ph) * 0.08;
        const l = Math.max(0, Math.cos(ph)) * 0.06;
        const b = Math.max(0, -Math.cos(ph)) * 0.06;
        return quadruped({ x: i * 0.26, feet: [[a, l], [-a, b], [-a, b], [a, l]] });
    });
    const trace = Array.from({ length: 40 }, (_, i): Vec3 => [i * 0.026 + 0.19, 0.02 + Math.max(0, Math.sin(i * 0.5)) * 0.07, 0.155]);
    return { scenes, trace, cam: { yaw: 0.5, pitch: 0.24, dist: 3.6, target: [0.35, 0.2, 0] } };
}

function frameBox(kind: RobotKind, style: RobotArtStyle, framing: RobotArtFraming, W: number, H: number): Box {
    if (framing === "tile") {
        return style === "xray"
            ? { x: W * 0.22, y: H * 0.1, w: W * 0.56, h: H * 0.82 }
            : { x: W * 0.08, y: H * 0.08, w: W * 0.84, h: H * 0.84 };
    }
    // Narrow cards (phones) keep the robot smaller and further right so the
    // title and blurb on the left stay readable.
    const narrow = W / H < 2.4;
    // The humanoid is tall: in a wide card, frame it head to hips and let the
    // card crop the legs, like a portrait.
    if (kind === "humanoid") {
        if (style === "motion") return { x: W * 0.45, y: H * 0.06, w: W * 0.52, h: H * 1.7, ay: 0 };
        return narrow
            ? { x: W * 0.64, y: H * 0.08, w: W * 0.3, h: H * 1.5, ay: 0 }
            : { x: W * 0.62, y: H * 0.08, w: W * 0.3, h: H * 2.1, ay: 0 };
    }
    if (narrow) return { x: W * 0.56, y: H * 0.12, w: W * 0.4, h: H * 0.76 };
    return framing === "card-lg"
        ? { x: W * 0.48, y: H * 0.1, w: W * 0.47, h: H * 0.8 }
        : { x: W * 0.56, y: H * 0.1, w: W * 0.4, h: H * 0.82 };
}

export interface RobotArtOptions {
    kind: RobotKind;
    style: RobotArtStyle;
    framing: RobotArtFraming;
    // Category hue for the studio backdrop.
    hue: number;
}

// Paint one frame into a canvas whose backing store is W x H device pixels.
export function drawRobotArt(ctx: CanvasRenderingContext2D, W: number, H: number, o: RobotArtOptions): void {
    const { kind, style, framing } = o;
    const c: Ctx2D = { ctx, W, H, u: Math.min(W / 400, H / 300) };
    const box = frameBox(kind, style, framing, W, H);
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    if (style === "motion") {
        const mo = motionOf(kind);
        const cam = camera(mo.cam);
        motion(c, mo.scenes, mo.trace, cam, fit(mo.scenes, cam, box), lights(cam));
    } else {
        const scene = BUILD[kind]();
        const cam = camera(CAM[kind]);
        const L = lights(cam);
        if (style === "exploded") {
            const k = kind === "humanoid" ? 0.35 : 0.45;
            const off = explodeOffsets(scene, k);
            exploded(c, scene, cam, fit([scene], cam, box, off), L, off, k);
        } else {
            const fr = fit([scene], cam, box);
            if (style === "studio") studio(c, scene, cam, fr, L, o.hue);
            else if (style === "tonal") tonal(c, scene, cam, fr, L);
            else if (style === "blueprint") blueprint(c, scene, cam, fr, framing === "tile");
            else if (style === "rim") rimLight(c, scene, cam, fr, L);
            else if (style === "xray") xray(c, scene, cam, fr, L, framing === "tile", ACTUATORS[kind]);
            else lidar(c, scene, cam, fr);
        }
    }
    ctx.restore();
}
