import type {
    Keyframe,
    LoopStep,
    PartKind,
    PartPropsByKind,
    PartShape,
    PartSpec,
    Transform,
    Vec3,
} from "./spec";

// Pure motion maths for the 3D kit: explode interpolation, keyframe tracks
// and scene bounds. No three.js here, so it runs in the backend test suite
// and in the main bundle without pulling in the 3D chunk.

export const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export function easeInOutCubic(t: number): number {
    const x = clamp01(t);
    return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
}

const add = (a: Vec3, b: Vec3, k = 1): Vec3 => [
    a[0] + b[0] * k,
    a[1] + b[1] * k,
    a[2] + b[2] * k,
];

// Local progress of part `index` of `count` when the whole scene is at `t`.
// With a stagger s, part i starts at i * s and every part takes the same time.
export function partProgress(
    t: number,
    index: number,
    count: number,
    stagger = 0,
): number {
    if (count <= 1 || stagger <= 0) return easeInOutCubic(t);
    const s = Math.min(stagger, 1 / (count - 1));
    const span = 1 - s * (count - 1);
    if (span <= 0) return t >= index * s ? 1 : 0;
    return easeInOutCubic((t - index * s) / span);
}

export function explodedPosition(spec: PartSpec, progress: number): Vec3 {
    return add(spec.assembled?.position ?? [0, 0, 0], spec.explodedOffset, progress);
}

export const pitchRadius = (teeth: number, module: number): number =>
    (teeth * module) / 2;

interface Extent {
    r: number;
    h: number;
}

const ringExtent = (p: { outer: number; length: number }): Extent => ({
    r: p.outer,
    h: p.length / 2,
});

// Rough bounding cylinder of each part kind in its local frame: radius about
// Z and half-length along Z. Used to frame the camera, not for collisions.
const EXTENT: { [K in PartKind]: (p: PartPropsByKind[K]) => Extent } = {
    cylinder: (p) => ({ r: p.radius, h: p.length / 2 }),
    ring: ringExtent,
    "lamination-stack": ringExtent,
    "winding-coils": ringExtent,
    "magnet-ring": ringExtent,
    "spur-gear": (p) => ({
        r: p.internal
            ? (p.rim ?? pitchRadius(p.teeth, p.module) + 4 * p.module)
            : pitchRadius(p.teeth, p.module) + p.module,
        h: p.width / 2,
    }),
    "planetary-stage": (p) => ({
        r:
            p.rim ??
            pitchRadius(p.sunTeeth + 2 * p.planetTeeth, p.module) + 4.25 * p.module,
        h: p.width / 2,
    }),
    flexspline: (p) => ({
        r: pitchRadius(p.teeth, p.module) + 2 * p.module,
        h: p.length / 2,
    }),
    "wave-generator": (p) => ({ r: p.major, h: p.width / 2 }),
    "circular-spline": (p) => ({ r: p.outer, h: p.width / 2 }),
    "cycloid-disc": (p) => ({
        r: p.radius + (p.pins ? 2 * p.pinRadius : 0),
        h: p.thickness / 2,
    }),
    "ball-screw": (p) => {
        const nut = p.nutLength ? (p.nutOuter ?? p.diameter * 0.95) * 1.45 : 0;
        return { r: Math.max(p.diameter / 2, nut), h: p.length / 2 };
    },
    "roller-screw": (p) => ({
        r: p.nutOuter ?? p.screwDiameter / 2 + p.rollerDiameter * 1.6,
        h: p.length / 2,
    }),
    bearing: (p) => ({ r: p.outer, h: p.width / 2 }),
    // The read head (or sensor board) sits in front of the disc.
    encoder: (p) => ({ r: p.radius, h: p.thickness * 4 }),
    pcb: (p) => ({
        r:
            p.shape === "round"
                ? p.width / 2
                : Math.hypot(p.width, p.height ?? p.width) / 2,
        // Components and connectors stand proud of the board.
        h: 3 * (p.thickness ?? 1.6) + p.width * 0.04,
    }),
    housing: (p) => ({
        r: Math.max(
            p.profile === "flange" ? p.outer * 1.22 : p.outer,
            p.ribs ? p.outer + p.wall : 0,
        ),
        h: p.length / 2,
    }),
    bolt: (p) => ({ r: (p.circle ?? 0) + p.diameter, h: p.length / 2 }),
};

export function partExtent(shape: PartShape): Extent {
    const fn = EXTENT[shape.component] as (p: PartShape["props"]) => Extent;
    return fn(shape.props);
}

export interface Box {
    min: Vec3;
    max: Vec3;
}

// Axis-aligned box (scene frame) around every part at explode t, staggered
// as the scene is. A rotated part counts as its bounding sphere.
export function sceneBox(parts: PartSpec[], t = 1, stagger = 0): Box {
    if (parts.length === 0) return { min: [-1, -1, -1], max: [1, 1, 1] };
    const min: Vec3 = [
        Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY,
    ];
    const max: Vec3 = [
        Number.NEGATIVE_INFINITY,
        Number.NEGATIVE_INFINITY,
        Number.NEGATIVE_INFINITY,
    ];
    parts.forEach((p, i) => {
        const { r, h } = partExtent(p);
        const rot = p.assembled?.rotation?.some((a) => a !== 0);
        const s = rot ? Math.hypot(r, h) : 0;
        const half: Vec3 = rot ? [s, s, s] : [r, r, h];
        const c = explodedPosition(p, partProgress(t, i, parts.length, stagger));
        for (let k = 0; k < 3; k++) {
            min[k] = Math.min(min[k] as number, (c[k] as number) - (half[k] as number));
            max[k] = Math.max(max[k] as number, (c[k] as number) + (half[k] as number));
        }
    });
    return { min, max };
}

// ---- Keyframe tracks ----------------------------------------------------

export interface TrackSample {
    position: Vec3;
    rotation: Vec3;
    scale: number;
    opacity: number;
    value: number;
}

type Channel = "position" | "rotation" | "scale" | "opacity" | "value";

const DEFAULTS: TrackSample = {
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: 1,
    opacity: 1,
    value: 0,
};

// Wrap any time onto the loop: phase in [0, 1).
export function loopPhase(seconds: number, duration: number): number {
    if (duration <= 0) return 0;
    const p = (seconds / duration) % 1;
    return p < 0 ? p + 1 : p;
}

function sampleChannel<C extends Channel>(
    track: Keyframe[],
    channel: C,
    phase: number,
    base: TrackSample[C],
): TrackSample[C] {
    const keys = track
        .filter((k) => k[channel] !== undefined)
        .sort((a, b) => a.at - b.at);
    const first = keys[0];
    const last = keys[keys.length - 1];
    if (!first || !last) return base;
    if (phase <= first.at) return first[channel] as TrackSample[C];
    if (phase >= last.at) return last[channel] as TrackSample[C];
    const i = keys.findIndex((k) => k.at > phase);
    const a = keys[i - 1] as Keyframe;
    const b = keys[i] as Keyframe;
    const t = easeInOutCubic((phase - a.at) / (b.at - a.at || 1));
    const va = a[channel] as TrackSample[C];
    const vb = b[channel] as TrackSample[C];
    if (Array.isArray(va) && Array.isArray(vb)) {
        return [
            lerp(va[0], vb[0], t),
            lerp(va[1], vb[1], t),
            lerp(va[2], vb[2], t),
        ] as TrackSample[C];
    }
    return lerp(va as number, vb as number, t) as TrackSample[C];
}

// Value of every channel at `phase`. Channels hold their first value before
// the first key and their last value after the last key; between keys they
// ease in and out. A track that never sets a channel uses `base` for it.
export function sampleTrack(
    track: Keyframe[],
    phase: number,
    base: Transform = {},
): TrackSample {
    const b: TrackSample = {
        ...DEFAULTS,
        position: base.position ?? DEFAULTS.position,
        rotation: base.rotation ?? DEFAULTS.rotation,
    };
    return {
        position: add(b.position, sampleChannel(track, "position", phase, [0, 0, 0])),
        rotation: add(b.rotation, sampleChannel(track, "rotation", phase, [0, 0, 0])),
        scale: sampleChannel(track, "scale", phase, b.scale),
        opacity: sampleChannel(track, "opacity", phase, b.opacity),
        value: sampleChannel(track, "value", phase, b.value),
    };
}

// Index of the caption that is active at `phase` (the last step at or before
// it), or -1 with no steps.
export function activeStep(steps: LoopStep[] | undefined, phase: number): number {
    if (!steps?.length) return -1;
    let idx = -1;
    steps.forEach((s, i) => {
        if (s.at <= phase) idx = i;
    });
    return idx === -1 ? steps.length - 1 : idx;
}

// Clicking the selected part again clears the selection.
export function nextSelection(
    current: string | null,
    clicked: string | null,
): string | null {
    return clicked === current ? null : clicked;
}
