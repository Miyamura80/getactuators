import {
    Color,
    DoubleSide,
    LineBasicMaterial,
    MeshLambertMaterial,
} from "three";

// The kit's look, matching the hero exploded view (lib/exploded-actuator.ts):
// near-black faces, Core Cyan edges at low opacity, one solid cyan accent.

export const INK = {
    background: "#000000",
    face: "#0b0e0e",
    alt: "#1c2323",
    accent: "#7de6e2",
    edge: "#c3fffd",
    accentEdge: "#03302f",
    glow: "#0c3f3d",
    selected: "#0f3634",
} as const;

export type PartState = "rest" | "hover" | "selected" | "dim";

const EDGE_OPACITY: Record<PartState, number> = {
    rest: 0.42,
    hover: 0.8,
    selected: 1,
    dim: 0.1,
};

const LINE_OPACITY: Record<PartState, number> = {
    rest: 0.2,
    hover: 0.35,
    selected: 0.5,
    dim: 0.05,
};

export interface PartMaterials {
    body: MeshLambertMaterial;
    alt: MeshLambertMaterial;
    edge: LineBasicMaterial;
    line: LineBasicMaterial;
}

export interface PartLook {
    state?: PartState;
    accent?: boolean;
    // 0..1 emissive glow (a coil switching on).
    glow?: number;
    // 0..1 fade for actors entering or leaving a loop.
    opacity?: number;
}

const face = (color: string) =>
    new MeshLambertMaterial({
        color,
        side: DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
    });

export function createMaterials(): PartMaterials {
    return {
        body: face(INK.face),
        alt: face(INK.alt),
        edge: new LineBasicMaterial({ color: INK.edge, transparent: true }),
        line: new LineBasicMaterial({ color: INK.edge, transparent: true }),
    };
}

const glowColor = new Color(INK.glow);
const selectedColor = new Color(INK.selected);
const black = new Color(0);

// Mutates the materials in place so per-frame changes (glow, fades) never
// allocate.
export function applyLook(m: PartMaterials, look: PartLook): void {
    const state = look.state ?? "rest";
    const opacity = look.opacity ?? 1;
    const glow = look.glow ?? 0;
    m.body.color.set(look.accent ? INK.accent : INK.face);
    m.alt.color.set(look.accent ? INK.accent : INK.alt);
    const emissive = state === "selected" ? selectedColor : black;
    for (const f of [m.body, m.alt]) {
        f.emissive.copy(emissive).lerp(glowColor, glow);
        f.transparent = opacity < 1;
        f.opacity = opacity;
        f.depthWrite = opacity > 0.5;
    }
    m.edge.color.set(look.accent && state !== "dim" ? INK.accentEdge : INK.edge);
    const edgeBase = look.accent && state !== "dim" ? 0.7 : EDGE_OPACITY[state];
    m.edge.opacity = Math.min(1, edgeBase + glow * 0.5) * opacity;
    m.line.opacity = (LINE_OPACITY[state] + glow * 0.3) * opacity;
}

export function disposeMaterials(m: PartMaterials): void {
    m.body.dispose();
    m.alt.dispose();
    m.edge.dispose();
    m.line.dispose();
}
