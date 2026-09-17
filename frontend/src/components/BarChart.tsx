export interface BarItem {
    id: string;
    name: string;
    value: number;
    display: string;
    flag: string | null;
    highlight?: boolean;
}

interface Props {
    items: BarItem[];
    onSelect?: (id: string) => void;
}

const SLOT = 46;
const PAD_L = 8;
const PAD_R = 8;
const TOP = 22;
const BAR_H = 150;
const LABEL_H = 118;

// Vertical bar chart: value above each bar, flag + rotated name below.
// Sized by item count and scrolled horizontally by its container when wide.
export function BarChart({ items, onSelect }: Props) {
    const max = Math.max(...items.map((i) => i.value), 1);
    const width = PAD_L + PAD_R + items.length * SLOT;
    const height = TOP + BAR_H + LABEL_H;
    const baseY = TOP + BAR_H;

    return (
        <svg
            className="barchart"
            viewBox={`0 0 ${width} ${height}`}
            width={width}
            height={height}
            role="img"
        >
            {[0.25, 0.5, 0.75, 1].map((g) => (
                <line
                    key={g}
                    x1={PAD_L}
                    x2={width - PAD_R}
                    y1={baseY - g * BAR_H}
                    y2={baseY - g * BAR_H}
                    className="grid"
                />
            ))}
            {items.map((it, i) => {
                const h = Math.max(2, (it.value / max) * BAR_H);
                const x = PAD_L + i * SLOT;
                const cx = x + SLOT / 2;
                const barW = 30;
                return (
                    <g
                        key={it.id}
                        className="bar-g"
                        onClick={onSelect ? () => onSelect(it.id) : undefined}
                        style={onSelect ? { cursor: "pointer" } : undefined}
                    >
                        <rect
                            x={cx - barW / 2}
                            y={baseY - h}
                            width={barW}
                            height={h}
                            className={it.highlight ? "bar bar-hi" : "bar"}
                        />
                        <text x={cx} y={baseY - h - 6} className="bar-val" textAnchor="middle">
                            {it.display}
                        </text>
                        <text x={cx} y={baseY + 16} className="bar-flag" textAnchor="middle">
                            {it.flag ?? ""}
                        </text>
                        <text
                            x={cx}
                            y={baseY + 26}
                            className="bar-name"
                            textAnchor="end"
                            transform={`rotate(-55 ${cx} ${baseY + 26})`}
                        >
                            {it.name}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}
