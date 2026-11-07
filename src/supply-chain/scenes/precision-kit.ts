import type { Keyframe, Vec3 } from "./spec";

// Shared frames and tracks for the precision chain's vignettes
// (./precision-drive-loops, ./precision-loops).

export const TAU = Math.PI * 2;
// Quarter turn about X: a rotary part's local Z axis becomes world Y.
export const UPRIGHT: Vec3 = [-Math.PI / 2, 0, 0];
// Quarter turn about Y: a rotary part's local Z axis becomes world X.
export const SIDE: Vec3 = [0, Math.PI / 2, 0];
export const y = (v: number): Vec3 => [0, v, 0];
export const x = (v: number): Vec3 => [v, 0, 0];

// `turns` full turns about the part's own axis over the loop.
export const spin = (turns: number): Keyframe[] => [
    { at: 0, rotation: [0, 0, 0] },
    { at: 1, rotation: [0, 0, TAU * turns] },
];

// A glow channel that comes on between `on` and `off`.
export const glow = (on: number, off: number, peak = 1): Keyframe[] => [
    { at: Math.max(0, on - 0.05), value: 0 },
    { at: on, value: peak },
    { at: off, value: peak },
    { at: Math.min(1, off + 0.05), value: 0 },
];
