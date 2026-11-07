import { BoxGeometry, Matrix4, Shape, Vector3 } from "three";
import type { EncoderProps, PcbProps } from "../../../../src/supply-chain/scenes/spec";
import {
    type Piece,
    TAU,
    circleLine,
    extrude,
    polylines,
    ringGeometry,
    rod,
} from "./geometry";

export function encoderPart(p: EncoderProps): Piece[] {
    const t = p.thickness;
    if ((p.kind ?? "optical") === "magnetic") {
        // Diametric magnet on the shaft end, half per pole, with the sensor
        // chip on a small board in front of it.
        const r = p.radius * 0.42;
        const half = (start: number) => {
            const s = new Shape();
            s.absarc(0, 0, r, start, start + Math.PI, false);
            s.lineTo(0, 0);
            return extrude(s, t, 24);
        };
        const chip = new BoxGeometry(r * 0.9, r * 0.9, t * 0.35);
        chip.translate(0, 0, t * 0.9);
        const board = ringGeometry(p.radius, p.radius * 0.6, t * 0.3);
        board.translate(0, 0, t * 0.9);
        return [
            { geometry: half(0), edges: 30 },
            { geometry: half(Math.PI), tone: "alt", edges: 30 },
            { geometry: chip, edges: 30 },
            { geometry: board, edges: 30 },
        ];
    }
    const ticks = p.ticks ?? 64;
    const lines: Vector3[][] = [];
    for (let i = 0; i < ticks; i++) {
        const a = (i / ticks) * TAU;
        const c = Math.cos(a);
        const s = Math.sin(a);
        lines.push([
            new Vector3(p.radius * 0.78 * c, p.radius * 0.78 * s, t / 2 + 0.05),
            new Vector3(p.radius * 0.94 * c, p.radius * 0.94 * s, t / 2 + 0.05),
        ]);
    }
    const head = new BoxGeometry(p.radius * 0.28, p.radius * 0.3, t * 3);
    head.translate(p.radius * 0.86, 0, t * 2.4);
    return [
        { geometry: ringGeometry(p.radius, p.radius * 0.2, t), edges: 30 },
        { geometry: polylines(lines), tone: "lines" },
        { geometry: head, tone: "alt", edges: 30 },
    ];
}

const rand = (i: number) => {
    const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
};

export function pcbPart(p: PcbProps): Piece[] {
    const t = p.thickness ?? 1.6;
    const round = p.shape === "round";
    const w = p.width;
    const h = round ? w : (p.height ?? w);
    const board = round ? ringGeometry(w / 2, p.bore ?? 0, t) : new BoxGeometry(w, h, t);
    const chips = p.chips ?? 0;
    const chip = new BoxGeometry(1, 1, 1);
    const matrices: Matrix4[] = [];
    const traces: Vector3[][] = [];
    const reach = Math.min(w, h) * 0.32;
    for (let i = 0; i < chips; i++) {
        const a = (i / chips) * TAU + 0.4;
        const size = Math.min(w, h) * (0.1 + 0.08 * rand(i));
        const r = reach * (0.75 + 0.35 * rand(i + 9));
        const x = r * Math.cos(a);
        const y = r * Math.sin(a);
        matrices.push(
            new Matrix4()
                .makeTranslation(x, y, t / 2 + size * 0.09)
                .multiply(new Matrix4().makeScale(size, size * (0.7 + 0.5 * rand(i + 3)), size * 0.18)),
        );
        traces.push([new Vector3(x * 0.55, y * 0.55, t / 2 + 0.05), new Vector3(x * 0.8, y * 0.8, t / 2 + 0.05)]);
    }
    if (round) traces.push(circleLine(w * 0.46, t / 2 + 0.05, 0, 0, 96));
    const pieces: Piece[] = [{ geometry: board, edges: 30 }];
    if (chips) pieces.push({ geometry: chip, matrices, tone: "alt", edges: 30 });
    if (traces.length) pieces.push({ geometry: polylines(traces, false), tone: "lines" });
    if (round) {
        const connector = rod(w * 0.04, t * 3, 12);
        connector.translate(-w * 0.3, -w * 0.18, t * 1.5);
        pieces.push({ geometry: connector, edges: 30 });
    }
    return pieces;
}
