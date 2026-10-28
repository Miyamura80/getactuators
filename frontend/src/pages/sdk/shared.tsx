import type { ReactNode } from "react";
import type { CheckStatus, Evidence } from "../../../../src/sdk/types";

// Small pieces shared by the /sdk sections.

export const fmtScore = (n: number | null) => (n === null ? "n/a" : n.toFixed(1));

// Radar compare slots: fixed order, so a brand keeps its color while others
// are added or removed after it.
export const SLOT_COLORS = ["#c3fffd", "#ff922b", "#9775fa", "#51cf66"] as const;

// Sequential cyan for 0..10 scores on the black surface.
export function heat(score: number | null): { background: string; color: string } {
    if (score === null) return { background: "transparent", color: "var(--muted)" };
    const a = 0.08 + (score / 10) * 0.82;
    return { background: `rgba(195, 255, 253, ${a.toFixed(2)})`, color: score >= 5.5 ? "#000" : "var(--text)" };
}

export const STATUS_LABEL: Record<CheckStatus, string> = {
    pass: "Pass",
    partial: "Partial",
    fail: "No evidence",
    unknown: "Not checked",
};

export const STATUS_MARK: Record<CheckStatus, string> = { pass: "●", partial: "◐", fail: "○", unknown: "–" };

const host = (url: string) => {
    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return url;
    }
};

export function EvidenceLink({ e }: { e: Evidence }) {
    const tag = e.source === "github" ? (e.official === false ? "community repo" : "official repo") : e.forum ?? e.source;
    return <li className="sdk-ev">
        <a href={e.url} rel="noopener">{e.quote ? `“${e.quote}”` : e.title}</a>
        <span className="sdk-ev-meta">{[tag, e.repo ?? host(e.url), e.date].filter(Boolean).join(" · ")}</span>
    </li>;
}

export function Section({ n, id, title, note, children }: { n: string; id: string; title: string; note?: string; children: ReactNode }) {
    return <section className="sdk-sec" id={id} aria-labelledby={`${id}-h`}>
        <h2 id={`${id}-h`}><span>{n}</span>{title}</h2>
        {note ? <p className="sdk-note">{note}</p> : null}
        {children}
    </section>;
}
