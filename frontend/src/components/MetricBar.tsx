interface Props {
    value: number | null;
    max: number;
    text: string;
    // higher values are "better" -> greener; lower better inverts the scale
    higherIsBetter: boolean;
}

// A compact cell that shows the number with a proportional bar behind it.
export function MetricBar({ value, max, text, higherIsBetter }: Props) {
    if (value == null) {
        return <span className="cell-null">{"–"}</span>;
    }
    const frac = Math.max(0, Math.min(1, value / max));
    // Goodness drives the hue: strong metric -> accent, weak -> muted.
    const goodness = higherIsBetter ? frac : 1 - frac;
    const width = `${Math.round((higherIsBetter ? frac : Math.max(frac, 0.06)) * 100)}%`;
    return (
        <div className="metricbar" style={{ ["--good" as string]: goodness.toFixed(2) }}>
            <div className="metricbar-fill" style={{ width }} />
            <span className="metricbar-text">{text}</span>
        </div>
    );
}
