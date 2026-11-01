import { STARTUPS, STARTUP_SEGMENTS, countryLabel, formatMetric } from "@/startups";
import { mdLink, mdTable } from "./md";

// Markdown twin of /startups: the same figures the treemaps size by.
export function startupsBody(): string {
    const rows = STARTUPS.map((s) => [
        s.url ? mdLink(s.name, s.url) : s.name,
        s.hq,
        countryLabel(s.country),
        STARTUP_SEGMENTS[s.segment].label,
        formatMetric("raisedUsd", s.raisedUsd, s.raisedIsFloor),
        s.round ?? "Undisclosed",
        s.leadInvestor ?? "Undisclosed",
        formatMetric("unitsPerMonth", s.unitsPerMonth),
        [s.source, ...(s.moreSources ?? [])]
            .map((src) => mdLink(src.label, src.url))
            .join(", "),
    ]);
    const notes = STARTUPS.map((s) => `- **${s.name}:** ${s.volumeNote}`).join("\n");
    return `# Actuator startups

Funded companies building robot actuators and motors, sized by disclosed money raised (equity rounds and grants) and by company-reported production. A + after a figure means some rounds are undisclosed, so the sum is a floor.

${mdTable(["Company", "HQ", "Country", "Segment", "Raised", "Round", "Lead", "Reported output", "Source"], rows)}

## Segments

${Object.values(STARTUP_SEGMENTS)
    .map((g) => `- **${g.label}:** ${g.blurb}.`)
    .join("\n")}

## Production notes

${notes}

Figures are company-reported or from press coverage and are not independently verified.`;
}
