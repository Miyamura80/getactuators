import { getOpenRobot, lineage } from "../../../../src/open-source";

// Forks and derivatives as a left-to-right lineage graph: one column per
// generation, one band per family.

const COL = 190;
const ROW = 46;
const NODE_W = 150;
const NODE_H = 30;

interface Placed {
    id: string;
    col: number;
    row: number;
}

function layout(): { placed: Placed[]; edges: { from: string; to: string }[]; rows: number; cols: number } {
    const { nodes, edges } = lineage();
    // Families: connected groups of nodes, in data order.
    const family = new Map<string, number>();
    let next = 0;
    for (const n of nodes) {
        if (family.has(n.id)) continue;
        const stack = [n.id];
        while (stack.length) {
            const id = stack.pop()!;
            if (family.has(id)) continue;
            family.set(id, next);
            for (const e of edges) {
                if (e.from === id) stack.push(e.to);
                if (e.to === id) stack.push(e.from);
            }
        }
        next += 1;
    }
    const placed: Placed[] = [];
    let base = 0;
    for (let f = 0; f < next; f += 1) {
        const members = nodes.filter((n) => family.get(n.id) === f);
        const perCol = new Map<number, number>();
        for (const n of members) {
            const row = perCol.get(n.depth) ?? 0;
            perCol.set(n.depth, row + 1);
            placed.push({ id: n.id, col: n.depth, row: base + row });
        }
        base += Math.max(...perCol.values());
    }
    const cols = Math.max(1, ...placed.map((p) => p.col + 1));
    return { placed, edges, rows: base, cols };
}

export function FamilyTree({ selected, onPick }: { selected: string | null; onPick: (id: string) => void }) {
    const { placed, edges, rows, cols } = layout();
    const at = new Map(placed.map((p) => [p.id, p]));
    const w = (cols - 1) * COL + NODE_W + 2;
    const h = rows * ROW;
    const px = (p: Placed) => p.col * COL + 1;
    const py = (p: Placed) => p.row * ROW + (ROW - NODE_H) / 2;
    return (
        <figure className="os-tree">
            <svg viewBox={`0 0 ${w} ${h}`} style={{ maxWidth: w }} role="img" aria-label="Family tree of open-source robots">
                {edges.map((e) => {
                    const a = at.get(e.from);
                    const b = at.get(e.to);
                    if (!a || !b) return null;
                    const x1 = px(a) + NODE_W;
                    const y1 = py(a) + NODE_H / 2;
                    const x2 = px(b);
                    const y2 = py(b) + NODE_H / 2;
                    const mid = (x1 + x2) / 2;
                    return <path key={`${e.from}-${e.to}`} className="os-edge" d={`M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`} />;
                })}
                {placed.map((p) => {
                    const r = getOpenRobot(p.id);
                    return (
                        <g
                            key={p.id}
                            className={`os-node${selected === p.id ? " is-on" : ""}`}
                            data-robot={p.id}
                            role="button"
                            tabIndex={0}
                            aria-label={r?.name ?? p.id}
                            onClick={() => onPick(p.id)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    onPick(p.id);
                                }
                            }}
                        >
                            <rect x={px(p)} y={py(p)} width={NODE_W} height={NODE_H} rx={2} />
                            <text x={px(p) + NODE_W / 2} y={py(p) + NODE_H / 2 + 4} textAnchor="middle">
                                {r?.name ?? p.id}
                            </text>
                        </g>
                    );
                })}
            </svg>
            <figcaption>Each line runs from a design (left) to the robots built on it (right). Robots with no recorded parent or child are not drawn.</figcaption>
        </figure>
    );
}
