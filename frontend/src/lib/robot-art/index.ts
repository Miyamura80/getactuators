// Robot category art: three real-scale 3D robots drawn to a 2D canvas as an
// engineering-drawing X-ray that puts their actuators on show. Entry point
// for components; see drafting.ts for the look and models.ts for the robots.
import { type Box, camera, type CamSpec, fit } from "./core";
import { type Annotation, drawDrafting } from "./drafting";
import { arm, humanoid, quadruped } from "./models";
import type { Scene } from "./scene";

export type RobotKind = "humanoid" | "quadruped" | "robot_arm";

// "tile": a 4:3 thumbnail with callouts and a loupe. "card" / "card-lg": the
// wide home category cards, where the title sits bottom left, so the robot is
// framed on the right and left unannotated.
export type RobotArtFraming = "tile" | "card" | "card-lg";

const BUILD: Record<RobotKind, () => Scene> = { robot_arm: arm, humanoid, quadruped };

const CAM: Record<RobotKind, CamSpec> = {
    robot_arm: { yaw: 0.9, pitch: 0.28, dist: 3.2, target: [0.25, 0.4, 0] },
    humanoid: { yaw: 0.75, pitch: 0.12, dist: 5, target: [0, 0.65, 0] },
    quadruped: { yaw: 0.85, pitch: 0.3, dist: 3, target: [0, 0.2, 0] },
};

// Actuator counts of the reference robots (UR5e, Unitree G1 23-DOF, Go2) and
// the joint shown exploded in the loupe.
const ANNOTATION: Record<RobotKind, Annotation> = {
    robot_arm: { count: 6, title: "UR5e-CLASS COBOT", hero: "J2 SHOULDER" },
    humanoid: { count: 23, title: "G1-CLASS HUMANOID", hero: "KNEE" },
    quadruped: { count: 12, title: "GO2-CLASS QUADRUPED", hero: "THIGH" },
};

function frameBox(kind: RobotKind, framing: RobotArtFraming, W: number, H: number): Box {
    // Tile: callouts on the left, loupe on the right.
    if (framing === "tile") return { x: W * 0.2, y: H * 0.1, w: W * 0.42, h: H * 0.84 };
    // Narrow cards (phones) keep the robot smaller and further right so the
    // title and blurb on the left stay readable.
    const narrow = W / H < 2.4;
    // The humanoid is tall: in a wide card, frame it head to hips and let the
    // card crop the legs, like a portrait.
    if (kind === "humanoid") {
        return narrow
            ? { x: W * 0.64, y: H * 0.08, w: W * 0.3, h: H * 1.5, ay: 0 }
            : { x: W * 0.62, y: H * 0.08, w: W * 0.3, h: H * 2.1, ay: 0 };
    }
    if (narrow) return { x: W * 0.56, y: H * 0.12, w: W * 0.4, h: H * 0.76 };
    return framing === "card-lg"
        ? { x: W * 0.48, y: H * 0.1, w: W * 0.47, h: H * 0.8 }
        : { x: W * 0.56, y: H * 0.1, w: W * 0.4, h: H * 0.82 };
}

// Paint one frame into a canvas whose backing store is W x H device pixels.
export function drawRobotArt(ctx: CanvasRenderingContext2D, W: number, H: number, kind: RobotKind, framing: RobotArtFraming): void {
    const scene = BUILD[kind]();
    const cam = camera(CAM[kind]);
    const fr = fit([scene], cam, frameBox(kind, framing, W, H));
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    drawDrafting({ ctx, W, H, u: Math.min(W / 400, H / 300) }, scene, cam, fr, framing === "tile" ? ANNOTATION[kind] : undefined);
    ctx.restore();
}
