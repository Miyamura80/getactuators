import type { OpennessStatus } from "../../../../src/open-source";

// Openness score as a ring: the filled arc is the share of the eight
// dimensions that are open (partial counts half).
export function ScoreRing({ score, size = 40 }: { score: number; size?: number }) {
    const r = size / 2 - 3;
    const c = 2 * Math.PI * r;
    const pct = Math.round(score * 100);
    return (
        <svg className="os-ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img">
            <title>{`Openness ${pct}%`}</title>
            <circle cx={size / 2} cy={size / 2} r={r} className="os-ring-track" />
            <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                className="os-ring-fill"
                strokeDasharray={`${c * score} ${c}`}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
            <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle">
                {pct}
            </text>
        </svg>
    );
}

const STATUS_LABEL: Record<OpennessStatus, string> = {
    full: "Published",
    partial: "Partly published",
    missing: "Not published",
};

// One matrix cell: filled, half or empty dot.
export function StatusDot({ status }: { status: OpennessStatus }) {
    return <i className={`os-dot is-${status}`} role="img" aria-label={STATUS_LABEL[status]} title={STATUS_LABEL[status]} />;
}
