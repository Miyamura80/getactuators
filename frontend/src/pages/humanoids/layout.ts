import { CENTRAL, SIDED, type CanonicalJoint, type SizeClass } from "../../../../src/humanoids";

// Front view, facing the viewer: the robot's left side is drawn on the right.
export const VIEW = { w: 240, h: 392 };
const CX = 120;

const SIDED_XY: Record<(typeof SIDED)[number], [dx: number, y: number]> = {
    "shoulder-pitch": [36, 80],
    "shoulder-roll": [47, 92],
    "shoulder-yaw": [51, 112],
    elbow: [55, 146],
    wrist: [59, 186],
    hand: [61, 210],
    "hip-yaw": [14, 196],
    "hip-roll": [22, 206],
    "hip-pitch": [30, 218],
    knee: [30, 288],
    "ankle-pitch": [30, 352],
    "ankle-roll": [30, 366],
};

const CENTRAL_XY: Record<(typeof CENTRAL)[number], [number, number]> = {
    neck: [CX, 62],
    waist: [CX, 168],
};

export interface Node {
    id: CanonicalJoint;
    x: number;
    y: number;
}

export const NODES: Node[] = [
    ...CENTRAL.map((id) => ({ id, x: CENTRAL_XY[id][0], y: CENTRAL_XY[id][1] })),
    ...SIDED.flatMap((j) => {
        const [dx, y] = SIDED_XY[j];
        return [
            { id: `r-${j}` as CanonicalJoint, x: CX - dx, y },
            { id: `l-${j}` as CanonicalJoint, x: CX + dx, y },
        ];
    }),
];

// Node radius grows with the motor size class.
export const RADIUS: Record<SizeClass, number> = { xs: 3.6, s: 4.4, m: 5.2, l: 6.2, xl: 7.2 };

// Limb centrelines, drawn as thick outlined strokes under the nodes.
export const LIMBS: [number, number, number, number][] = [
    ...[-1, 1].flatMap((s): [number, number, number, number][] => [
        [CX + s * 36, 80, CX + s * 55, 146],
        [CX + s * 55, 146, CX + s * 60, 204],
        [CX + s * 26, 214, CX + s * 30, 288],
        [CX + s * 30, 288, CX + s * 30, 358],
    ]),
];
