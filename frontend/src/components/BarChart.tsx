export interface BarItem {
    id: string;
    name: string;
    value: number;
    display: string;
    flag: string | null;
    color: string;
}

interface Props {
    items: BarItem[];
    onSelect?: (id: string) => void;
}

const SLOT = 46;
const MIN_PAD = 8;
const TOP = 22;
const BAR_H = 150;
const NAME_Y = 26; // name anchor, below the baseline
const NAME_ANGLE = 55; // degrees, rotated counter-clockwise
const NAME_MAX_CHARS = 24;
// Generous average glyph width for the 10.5px .bar-name font, so the padding
// errs on the side of a little extra room rather than clipping.
const NAME_CHAR_W = 6.2;

const COS = Math.cos((NAME_ANGLE * Math.PI) / 180);
const SIN = Math.sin((NAME_ANGLE * Math.PI) / 180);

// Long names would push the label band far past the bars; cut them and keep
// the full name in a <title> tooltip.
export function barLabel(name: string): string {
    return name.length > NAME_MAX_CHARS ? `${name.slice(0, NAME_MAX_CHARS - 1).trimEnd()}…` : name;
}

// Rotated names hang down and to the left of their bar, so the first bars'
// labels can reach past x = 0. Size the left pad and the label band from the
// labels themselves so nothing is clipped by the SVG edge.
export function barLayout(names: string[]): { padL: number; labelH: number } {
    let padL = MIN_PAD;
    let drop = 0;
    names.forEach((name, i) => {
        const w = barLabel(name).length * NAME_CHAR_W;
        const reach = w * COS + MIN_PAD - (i * SLOT + SLOT / 2);
        padL = Math.max(padL, reach);
        drop = Math.max(drop, w * SIN);
    });
    return { padL: Math.ceil(padL), labelH: Math.ceil(NAME_Y + drop + MIN_PAD * 2) };
}

// Vertical bar chart: value above each bar, flag + rotated name below.
// Sized by item count and scrolled horizontally by its container when wide.
export function BarChart({ items, onSelect }: Props) {
    const max = Math.max(...items.map((i) => i.value), 1);
    const { padL: PAD_L, labelH } = barLayout(items.map((i) => i.name));
    const PAD_R = MIN_PAD;
    const width = PAD_L + PAD_R + items.length * SLOT;
    const height = TOP + BAR_H + labelH;
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
                            className="bar"
                            style={{ fill: it.color }}
                        />
                        <text x={cx} y={baseY - h - 6} className="bar-val" textAnchor="middle">
                            {it.display}
                        </text>
                        <text x={cx} y={baseY + 16} className="bar-flag" textAnchor="middle">
                            {it.flag ?? ""}
                        </text>
                        <text
                            x={cx}
                            y={baseY + NAME_Y}
                            className="bar-name"
                            textAnchor="end"
                            transform={`rotate(-${NAME_ANGLE} ${cx} ${baseY + NAME_Y})`}
                        >
                            <title>{it.name}</title>
                            {barLabel(it.name)}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}
