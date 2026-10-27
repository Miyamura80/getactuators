import { Matrix4, Shape, Vector2 } from "three";
import type {
    CircularSplineProps,
    CycloidDiscProps,
    FlexsplineProps,
    PlanetaryStageProps,
    SpurGearProps,
    WaveGeneratorProps,
} from "../../../../src/supply-chain/scenes/spec";
import {
    type Piece,
    TAU,
    aroundZ,
    circlePath,
    extrude,
    gearPoints,
    polygonPath,
    polygonShape,
    revolve,
    ringGeometry,
    rod,
} from "./geometry";

const frac = (x: number) => x - Math.floor(x);

function externalGear(teeth: number, module: number, width: number, bore: number) {
    const holes = bore > 0 ? [circlePath(bore)] : [];
    return extrude(polygonShape(gearPoints(teeth, module), holes), width);
}

function internalGear(teeth: number, module: number, width: number, rim: number) {
    const s = new Shape();
    s.absarc(0, 0, rim, 0, TAU, false);
    s.holes.push(polygonPath(gearPoints(teeth, module, true)));
    return extrude(s, width);
}

export function spurGearPart(p: SpurGearProps): Piece[] {
    const rp = (p.teeth * p.module) / 2;
    const geometry = p.internal
        ? internalGear(p.teeth, p.module, p.width, p.rim ?? rp + 4 * p.module)
        : externalGear(p.teeth, p.module, p.width, p.bore ?? 0);
    return [{ geometry, edges: 30 }];
}

export interface PlanetaryPose {
    sun: number;
    carrier: number;
    // Per planet: carrier angle and the planet's own rotation.
    planets: { theta: number; spin: number }[];
    ring: number;
}

// Angles of a planetary stage with a fixed ring, driven by the sun at
// `phase`. Planet spins are solved from the mesh condition at each contact,
// so the teeth stay meshed at any phase.
export function planetaryPose(p: PlanetaryStageProps, phase = 0): PlanetaryPose {
    const zs = p.sunTeeth;
    const zp = p.planetTeeth;
    const zr = zs + 2 * zp;
    const carrier = (phase * zs) / (zs + zr);
    const tauP = TAU / zp;
    const planets = Array.from({ length: p.planets }, (_, k) => {
        const theta = carrier + (k * TAU) / p.planets;
        const fs = frac((theta - phase) / (TAU / zs));
        const spin = theta + Math.PI - tauP * frac(0.5 - fs);
        return { theta, spin };
    });
    const first = planets[0] ?? { theta: 0, spin: 0 };
    const fp = frac((first.theta - first.spin) / tauP);
    const ring = first.theta - (TAU / zr) * frac(fp - 0.5);
    return { sun: phase, carrier, planets, ring };
}

export function planetaryPart(p: PlanetaryStageProps): Piece[] {
    const m = p.module;
    const zr = p.sunTeeth + 2 * p.planetTeeth;
    const orbit = ((p.sunTeeth + p.planetTeeth) * m) / 2;
    const pose = planetaryPose(p, p.phase ?? 0);
    const rim = p.rim ?? (zr * m) / 2 + 4.25 * m;
    const sun = externalGear(p.sunTeeth, m, p.width, (p.sunTeeth * m) / 5);
    sun.rotateZ(pose.sun);
    const planet = externalGear(p.planetTeeth, m, p.width * 0.94, (p.planetTeeth * m) / 6);
    const planets = pose.planets.map(({ theta, spin }) =>
        new Matrix4()
            .makeTranslation(orbit * Math.cos(theta), orbit * Math.sin(theta), 0)
            .multiply(new Matrix4().makeRotationZ(spin)),
    );
    const ring = internalGear(zr, m, p.width, rim);
    ring.rotateZ(pose.ring);
    const plate = ringGeometry(orbit + (p.planetTeeth * m) / 3, (p.sunTeeth * m) / 3, m * 1.6);
    plate.translate(0, 0, -p.width / 2 - m * 1.2);
    return [
        { geometry: ring, edges: 30 },
        { geometry: sun, edges: 30 },
        { geometry: planet, matrices: planets, tone: "alt", edges: 30 },
        { geometry: plate, edges: 30 },
    ];
}

// Thin cup with an external toothed rim at its open (-Z) end, squeezed into
// an ellipse by the wave generator.
export function flexsplinePart(p: FlexsplineProps): Piece[] {
    const rp = (p.teeth * p.module) / 2;
    const wall = p.wall ?? Math.max(p.module * 2, rp * 0.03);
    const root = rp - 1.25 * p.module;
    const band = p.length * 0.3;
    const h = p.length / 2;
    const hub = rp * 0.36;
    const cup = revolve([
        [root - wall, -h + band],
        [root, -h + band],
        [root, h - wall],
        [hub * 1.25, h],
        [hub, h + wall * 2],
        [hub * 0.55, h + wall * 2],
        [hub * 0.55, h - wall],
        [root - wall, h - wall * 2],
        [root - wall, -h + band],
    ]);
    const teeth = externalGear(p.teeth, p.module, band, root - wall);
    teeth.translate(0, 0, -h + band / 2);
    const d = (p.deflection ?? 0) / rp;
    teeth.scale(1 + d, 1 - d, 1);
    cup.scale(1 + d * 0.5, 1 - d * 0.5, 1);
    return [
        { geometry: cup, edges: 30 },
        { geometry: teeth, edges: 30 },
    ];
}

export function waveGeneratorPart(p: WaveGeneratorProps): Piece[] {
    const cam = new Shape();
    cam.absellipse(0, 0, p.major * 0.86, p.minor * 0.86, 0, TAU, false, 0);
    if (p.bore) cam.holes.push(circlePath(p.bore));
    const race = new Shape();
    race.absellipse(0, 0, p.major, p.minor, 0, TAU, false, 0);
    const hole = new Shape();
    hole.absellipse(0, 0, p.major * 0.92, p.minor * 0.92, 0, TAU, false, 0);
    race.holes.push(hole);
    const balls = rod(p.width * 0.18, p.width * 0.5, 10);
    const ballMatrices = Array.from({ length: 28 }, (_, i) => {
        const a = (i / 28) * TAU;
        const r = 0.89;
        return new Matrix4().makeTranslation(p.major * r * Math.cos(a), p.minor * r * Math.sin(a), 0);
    });
    return [
        { geometry: extrude(cam, p.width, 96), edges: 30 },
        { geometry: extrude(race, p.width * 0.8, 96), edges: 30 },
        { geometry: balls, matrices: ballMatrices, tone: "alt", edges: false },
    ];
}

export function circularSplinePart(p: CircularSplineProps): Piece[] {
    return [{ geometry: internalGear(p.teeth, p.module, p.width, p.outer), edges: 30 }];
}

// Cycloidal disc profile for `lobes` lobes engaging lobes + 1 housing pins.
export function cycloidPoints(p: CycloidDiscProps, samples = 0): Vector2[] {
    const n = p.lobes + 1;
    const count = samples || p.lobes * 28;
    const pts: Vector2[] = [];
    for (let i = 0; i < count; i++) {
        const t = (i / count) * TAU;
        const psi = Math.atan2(Math.sin((1 - n) * t), p.radius / (p.eccentricity * n) - Math.cos((1 - n) * t));
        pts.push(
            new Vector2(
                p.radius * Math.cos(t) - p.pinRadius * Math.cos(t + psi) - p.eccentricity * Math.cos(n * t),
                -p.radius * Math.sin(t) + p.pinRadius * Math.sin(t + psi) + p.eccentricity * Math.sin(n * t),
            ),
        );
    }
    return pts;
}

export function cycloidPart(p: CycloidDiscProps): Piece[] {
    const holes = [circlePath(p.radius * 0.16)];
    const nHoles = p.holes ?? 0;
    for (let i = 0; i < nHoles; i++) {
        const a = (i / nHoles) * TAU;
        const h = new Shape();
        const r = p.radius * 0.52;
        h.absarc(r * Math.cos(a), r * Math.sin(a), p.radius * 0.11 + p.eccentricity, 0, TAU, false);
        holes.push(h);
    }
    const disc = extrude(polygonShape(cycloidPoints(p), holes), p.thickness, 24);
    const pieces: Piece[] = [{ geometry: disc, edges: 35 }];
    if (p.pins) {
        const n = p.lobes + 1;
        const pin = rod(p.pinRadius, p.thickness * 1.5, 16);
        pieces.push({ geometry: pin, matrices: aroundZ(n, p.radius), tone: "alt", edges: 40 });
        const ring = ringGeometry(p.radius + p.pinRadius * 2.4, p.radius + p.pinRadius * 0.4, p.thickness * 1.5);
        pieces.push({ geometry: ring, edges: 30 });
    }
    return pieces;
}
