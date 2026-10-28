// One-dimensional beeswarm: dots keep their x and move off the centre line
// (alternating below and above) just far enough not to overlap a dot already
// placed. Dots are placed in x order, so the layout is deterministic.

export interface SwarmDot<T> {
    item: T;
    x: number;
    dy: number;
}

export function beeswarm<T>(items: readonly T[], xOf: (t: T) => number, r: number): SwarmDot<T>[] {
    const d = 2 * r + 1;
    const step = r / 2;
    const placed: SwarmDot<T>[] = [];
    for (const item of [...items].sort((a, b) => xOf(a) - xOf(b))) {
        const x = xOf(item);
        const near = placed.filter((p) => Math.abs(p.x - x) < d);
        let dy = 0;
        for (let k = 1; near.some((p) => (p.x - x) ** 2 + (p.dy - dy) ** 2 < d * d); k++)
            dy = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * step;
        placed.push({ item, x, dy });
    }
    return placed;
}
