// Upper-left Pareto frontier shared by the price scatters: a point is on it
// when nothing else costs no more, scores no worse, and is strictly better on
// one of the two.
export function paretoFront<T>(pts: T[], cost: (p: T) => number, score: (p: T) => number): boolean[] {
    return pts.map((p) =>
        pts.every((q) => {
            if (q === p) return true;
            const [qc, qs, pc, ps] = [cost(q), score(q), cost(p), score(p)];
            return !(qc <= pc && qs >= ps && (qc < pc || qs > ps));
        }),
    );
}

// SVG path through the frontier points, left to right.
export function frontierPath(pts: { x: number; y: number }[]): string {
    return [...pts]
        .sort((a, b) => a.x - b.x)
        .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
        .join(" ");
}
