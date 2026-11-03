import { BoxGeometry, Shape, Vector3 } from "three";
import type { ArcSegmentProps, BlockProps } from "../../../../src/supply-chain/scenes/spec";
import { type Piece, alternatingPoles, extrude, polylines } from "./geometry";

// Prismatic parts shared by /manufacturing vignettes and /bom explodes:
// sintered blocks, tanks and trucks (block) and arc magnet segments.

export function blockPart(p: BlockProps): Piece[] {
    const pieces: Piece[] = [{ geometry: new BoxGeometry(p.width, p.height, p.depth), edges: 30 }];
    const n = Math.max(0, Math.round(p.slices ?? 0));
    if (n > 0) {
        const w = p.width / 2;
        const h = p.height / 2 + 0.02;
        const d = p.depth / 2 + 0.02;
        const lines: Vector3[][] = [];
        for (let i = 1; i <= n; i++) {
            const x = -w + (i * p.width) / (n + 1);
            lines.push([
                new Vector3(x, -h, d),
                new Vector3(x, h, d),
                new Vector3(x, h, -d),
                new Vector3(x, -h, -d),
            ]);
        }
        pieces.push({ geometry: polylines(lines, true), tone: "lines" });
    }
    return pieces;
}

// One annular sector centred on +X, extruded along Z.
function sectorShape(outer: number, inner: number, angle: number): Shape {
    const a = angle / 2;
    const s = new Shape();
    s.absarc(0, 0, outer, -a, a, false);
    s.absarc(0, 0, Math.max(inner, 0.001), a, -a, true);
    s.closePath();
    return s;
}

export function arcSegmentPart(p: ArcSegmentProps): Piece[] {
    const geometry = extrude(sectorShape(p.outer, p.inner, p.angle), p.length, 24);
    const count = Math.max(1, Math.round(p.count ?? 1));
    if (count === 1) return [{ geometry, edges: 30 }];
    return alternatingPoles(geometry, count);
}
