import type { Gate } from "./readiness";

// Trend views that the history cannot support yet, folded into one panel
// with how far each is from its threshold. Each leaves the panel and becomes
// its own section the week it crosses.

export function TrendGate({ gates }: { gates: readonly Gate[] }) {
    return <div className="pr-gate">
        <ul>
            {gates.map((g) => <li key={g.id} data-gate={g.id}>
                <span className="pr-gate-label">{g.label}</span>
                <progress value={Math.min(g.have, g.need)} max={g.need} aria-label={`${g.label}: ${g.have} of ${g.need} ${g.unit}`} />
                <span className="pr-gate-n">{g.note
                    ? <span className="pr-muted">{g.note}</span>
                    : <>{g.have} <span className="pr-muted">of {g.need} {g.unit}</span></>}</span>
            </li>)}
        </ul>
        <p className="pr-note">A bot reads every product page each week. A chart appears here once the data behind it clears the bar its statistics need.</p>
    </div>;
}
