import type { AltFamily, MilestoneKind } from "../../../../../src/supply-chain/alts";
import { FAMILY_KEY } from "./landscape-model";

// Family marks drawn in a -5..5 box: a rotor for motors, a contracting
// zigzag for muscles, a drop for hydraulics, spokes for transmissions.
const FAMILY_PATH: Record<AltFamily, string> = {
    "ree-free-motor": "M-3.6 0a3.6 3.6 0 1 0 7.2 0a3.6 3.6 0 1 0 -7.2 0M0 -3.6v7.2M-3.6 0h7.2",
    "artificial-muscle": "M-4.5 2l1.5 -4l1.5 4l1.5 -4l1.5 4l1.5 -4l1.5 4",
    hydraulic: "M0 -4.2C2 -1.4 3.2 0.4 3.2 1.4a3.2 3.2 0 0 1 -6.4 0C-3.2 0.4 -2 -1.4 0 -4.2z",
    transmission: "M-4 0h8M0 -4v8M-2.8 -2.8l5.6 5.6M2.8 -2.8l-5.6 5.6",
};

export function FamilyGlyph({ family, scale = 1 }: { family: AltFamily; scale?: number }) {
    return <path className="al-glyph" d={FAMILY_PATH[family]} transform={`scale(${scale})`} />;
}

// A technology dot: filled when we cite a deployment, hollow and dashed
// when we cite none.
export function TechDot({ family, r, deployments }: { family: AltFamily; r: number; deployments: number }) {
    return <g className={`al-dot al-f-${FAMILY_KEY[family]}${deployments === 0 ? " is-zero" : ""}`}>
        <circle r={r} />
        <FamilyGlyph family={family} scale={Math.max(0.75, r / 8)} />
    </g>;
}

// The NdFeB baseline: a crosshair ring.
export function TodayMark({ r = 9 }: { r?: number }) {
    return <g className="al-today">
        <circle r={r} />
        <path d={`M${-r - 4} 0h${r - 1}M${r + 4} 0h${-r + 1}M0 ${-r - 4}v${r - 1}M0 ${r + 4}v${-r + 1}`} />
    </g>;
}

export function MilestoneShape({ kind, size = 5 }: { kind: MilestoneKind; size?: number }) {
    const s = size;
    if (kind === "lab") return <circle r={s} />;
    if (kind === "first-commercial") return <rect x={-s} y={-s} width={2 * s} height={2 * s} />;
    return <path d={`M0 ${-s * 1.35}L${s * 1.35} 0L0 ${s * 1.35}L${-s * 1.35} 0Z`} />;
}
