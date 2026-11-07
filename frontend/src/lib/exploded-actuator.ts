// Exploded view of a rotary actuator for the home hero: housing, stator,
// rotor, planetary stage and output flange pulled apart along one axis.
// Drawn in brand terms: thin cyan strokes on black, black fills only to hide
// the parts behind, and the keyed output shaft as the single solid cyan fill.

export const EXPLODED_W = 960;
export const EXPLODED_H = 600;

const CY = 296;
// Foreshortening of the disk faces (they are seen three-quarter on).
const K = 0.4;
const SCALE = 1.42;

const C = {
    fill: "#000000",
    face: "#0a0a0a",
    edge: "rgba(195, 255, 253, 0.38)",
    hi: "#c3fffd",
    detail: "#383838",
    faint: "#242424",
    magnetA: "rgba(125, 230, 226, 0.55)",
    magnetB: "#242424",
    axis: "rgba(195, 255, 253, 0.3)",
    label: "#9ba4a6",
    leader: "#383838",
};

type Pt = [number, number];

// Point on a disk face at axial x, radius r, angle th (th = 0 at the top).
function pt(x: number, r: number, th: number): Pt {
    return [x + K * r * Math.sin(th), CY - r * Math.cos(th)];
}

export function drawExplodedActuator(
    ctx: CanvasRenderingContext2D,
    t: number,
    reduced: boolean,
): void {
    const ell = (x: number, r: number) => {
        ctx.beginPath();
        ctx.ellipse(x, CY, K * r, r, 0, 0, Math.PI * 2);
    };

    // Solid ring from x0 (back face) to x1 (front face), inner bore ri.
    const cyl = (x0: number, x1: number, ro: number, ri: number) => {
        ctx.lineWidth = 1.2;
        ctx.fillStyle = C.fill;
        ctx.strokeStyle = C.edge;
        ell(x0, ro);
        ctx.fill();
        ctx.stroke();
        ctx.fillRect(x0, CY - ro, x1 - x0, ro * 2);
        ctx.beginPath();
        ctx.moveTo(x0, CY - ro);
        ctx.lineTo(x1, CY - ro);
        ctx.moveTo(x0, CY + ro);
        ctx.lineTo(x1, CY + ro);
        ctx.stroke();
        ell(x1, ro);
        ctx.fillStyle = C.face;
        ctx.fill();
        ctx.strokeStyle = C.hi;
        ctx.stroke();
        if (ri > 0) {
            ell(x1, ri);
            ctx.fillStyle = C.fill;
            ctx.fill();
            ctx.strokeStyle = C.edge;
            ctx.stroke();
        }
    };

    const radial = (x: number, r0: number, r1: number, th: number) => {
        const a = pt(x, r0, th);
        const b = pt(x, r1, th);
        ctx.beginPath();
        ctx.moveTo(...a);
        ctx.lineTo(...b);
        ctx.stroke();
    };

    const hole = (x: number, r: number, th: number, rad: number) => {
        const [px, py] = pt(x, r, th);
        ctx.beginPath();
        ctx.ellipse(px, py, K * rad, rad, 0, 0, Math.PI * 2);
        ctx.fillStyle = C.fill;
        ctx.fill();
        ctx.stroke();
    };

    // Gear outline on a face, centred at an in-plane offset [up, across].
    const gear = (x: number, off: Pt, r: number, teeth: number, rot: number, depth: number) => {
        ctx.beginPath();
        const n = teeth * 4;
        for (let i = 0; i <= n; i++) {
            const th = rot + (i / n) * Math.PI * 2;
            const q = i % 4;
            const rr = q === 1 || q === 2 ? r + depth : r;
            const px = x + K * (off[1] + rr * Math.sin(th));
            const py = CY - (off[0] + rr * Math.cos(th));
            if (i) ctx.lineTo(px, py);
            else ctx.moveTo(px, py);
        }
        ctx.closePath();
    };

    const label = (txt: string, x: number, r: number, dir: -1 | 1) => {
        const ty = dir < 0 ? CY - r - 34 : CY + r + 44;
        const ay = dir < 0 ? CY - r : CY + r;
        ctx.strokeStyle = C.leader;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, ay + (dir < 0 ? -6 : 6));
        ctx.lineTo(x, ty + (dir < 0 ? 6 : -16));
        ctx.stroke();
        ctx.fillStyle = C.label;
        ctx.font = "500 12px 'JetBrains Mono', ui-monospace, monospace";
        ctx.textAlign = "center";
        ctx.fillText(txt, x, ty + (dir < 0 ? 0 : -2));
    };

    // Explode factor breathes 0..1; a fixed, fully legible frame when reduced.
    const e = reduced ? 0.62 : 0.5 + 0.5 * Math.sin(t * 0.00045 - 0.6);
    const rot = reduced ? 0.35 : t * 0.00035;
    const gap = 18 + 46 * e;

    ctx.clearRect(0, 0, EXPLODED_W, EXPLODED_H);
    ctx.save();
    ctx.translate(EXPLODED_W / 2, CY);
    ctx.scale(SCALE, SCALE);
    ctx.translate(-EXPLODED_W / 2, -CY);

    const widths = [44, 36, 26, 24, 20];
    const total = widths.reduce((a, b) => a + b, 0) + gap * 4;
    let cursor = EXPLODED_W / 2 - total / 2 - 20;
    const xs = widths.map((w): Pt => {
        const s = cursor;
        cursor += w + gap;
        return [s, s + w];
    });

    // Shaft axis (centre line).
    ctx.save();
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1;
    ctx.setLineDash([10, 5, 2, 5]);
    ctx.beginPath();
    ctx.moveTo(EXPLODED_W / 2 - 330, CY);
    ctx.lineTo(EXPLODED_W / 2 + 330, CY);
    ctx.stroke();
    ctx.restore();

    // 1. Housing: rear cup with cooling ribs and six cover bolts.
    let [a0, a1] = xs[0];
    cyl(a0, a1, 132, 118);
    ctx.strokeStyle = C.detail;
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
        const xx = a0 + ((a1 - a0) * i) / 4;
        ctx.beginPath();
        ctx.moveTo(xx, CY - 132);
        ctx.lineTo(xx, CY - 126);
        ctx.moveTo(xx, CY + 132);
        ctx.lineTo(xx, CY + 126);
        ctx.stroke();
    }
    ctx.strokeStyle = C.edge;
    for (let i = 0; i < 6; i++) hole(a1, 125, (i * Math.PI) / 3 + Math.PI / 6, 3.2);
    label("HOUSING", a0 + 10, 132, -1);

    // 2. Stator: slotted ring with windings.
    [a0, a1] = xs[1];
    cyl(a0, a1, 112, 84);
    const slots = 24;
    for (let i = 0; i < slots; i++) {
        const th = (i / slots) * Math.PI * 2;
        ctx.strokeStyle = C.detail;
        ctx.lineWidth = 5.5;
        radial(a1, 86, 104, th + Math.PI / slots);
        ctx.strokeStyle = C.edge;
        ctx.lineWidth = 1;
        radial(a1, 84, 108, th);
    }
    ell(a1, 108);
    ctx.strokeStyle = C.faint;
    ctx.stroke();
    label("STATOR", a1 - 6, 112, 1);

    // 3. Rotor: alternating magnet poles, spinning.
    [a0, a1] = xs[2];
    cyl(a0, a1, 80, 40);
    const poles = 28;
    const pitch = ((Math.PI * 2) / poles) * 0.82;
    for (let i = 0; i < poles; i++) {
        const th = rot * 2.2 + (i / poles) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(...pt(a1, 78, th));
        ctx.lineTo(...pt(a1, 78, th + pitch));
        ctx.lineTo(...pt(a1, 66, th + pitch));
        ctx.lineTo(...pt(a1, 66, th));
        ctx.closePath();
        ctx.fillStyle = i % 2 ? C.magnetB : C.magnetA;
        ctx.fill();
    }
    ctx.strokeStyle = C.edge;
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) radial(a1, 42, 62, rot * 2.2 + (i * Math.PI) / 3);
    ell(a1, 64);
    ctx.stroke();
    label("ROTOR", a0 + 6, 80, -1);

    // 4. Planetary stage: ring gear, three planets on a carrier, sun.
    [a0, a1] = xs[3];
    cyl(a0, a1, 104, 0);
    ctx.lineWidth = 1.1;
    ctx.fillStyle = C.fill;
    ctx.strokeStyle = C.hi;
    gear(a1, [0, 0], 86, 48, -rot * 0.4, -5);
    ctx.fill();
    ctx.stroke();
    const carrier = rot * 0.5;
    for (let i = 0; i < 3; i++) {
        const c = carrier + (i * Math.PI * 2) / 3;
        const off: Pt = [55 * Math.cos(c), 55 * Math.sin(c)];
        ctx.fillStyle = C.face;
        ctx.strokeStyle = C.edge;
        gear(a1, off, 26, 18, -rot * 1.6, 4);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(a1 + K * off[1], CY - off[0], K * 6, 6, 0, 0, Math.PI * 2);
        ctx.fillStyle = C.fill;
        ctx.fill();
        ctx.stroke();
    }
    ctx.fillStyle = C.face;
    ctx.strokeStyle = C.hi;
    gear(a1, [0, 0], 19, 12, rot * 2.2, 4);
    ctx.fill();
    ctx.stroke();
    label("PLANETARY", a1 - 4, 104, 1);

    // 5. Output flange: bolt circle and the keyed shaft (the one solid fill).
    [a0, a1] = xs[4];
    cyl(a0, a1, 92, 0);
    ctx.strokeStyle = C.edge;
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 8; i++) hole(a1, 70, carrier + (i * Math.PI) / 4, 6.5);
    ell(a1, 40);
    ctx.strokeStyle = C.detail;
    ctx.stroke();
    ctx.fillStyle = C.fill;
    ctx.fillRect(a1, CY - 22, 26, 44);
    ctx.strokeStyle = C.edge;
    ctx.beginPath();
    ctx.moveTo(a1, CY - 22);
    ctx.lineTo(a1 + 26, CY - 22);
    ctx.moveTo(a1, CY + 22);
    ctx.lineTo(a1 + 26, CY + 22);
    ctx.stroke();
    ell(a1 + 26, 22);
    ctx.fillStyle = C.face;
    ctx.fill();
    ctx.strokeStyle = C.hi;
    ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
        const p = pt(a1 + 26, 11, carrier + Math.PI / 4 + (i * Math.PI) / 2);
        if (i) ctx.lineTo(...p);
        else ctx.moveTo(...p);
    }
    ctx.closePath();
    ctx.fillStyle = C.hi;
    ctx.fill();
    // Rotation arc.
    ctx.strokeStyle = C.hi;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 20; i++) {
        const p = pt(a1 + 34, 118, -0.3 + i * 0.045);
        if (i) ctx.lineTo(...p);
        else ctx.moveTo(...p);
    }
    ctx.stroke();
    label("OUTPUT FLANGE", a0 + 4, 92, -1);

    ctx.restore();
}
