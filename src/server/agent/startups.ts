import { STARTUPS, countryLabel, formatMetric } from "@/startups";
import { mdLink, mdTable } from "./md";

// Markdown twin of /startups: the same figures the treemaps size by.
export function startupsBody(): string {
    const rows = STARTUPS.map((s) => [
        mdLink(s.name, s.url),
        s.hq,
        countryLabel(s.country),
        formatMetric("raisedUsd", s.raisedUsd),
        s.round ?? "Undisclosed",
        s.leadInvestor ?? "Undisclosed",
        formatMetric("unitsPerMonth", s.unitsPerMonth),
        [s.source, ...(s.moreSources ?? [])]
            .map((src) => mdLink(src.label, src.url))
            .join(", "),
    ]);
    const notes = STARTUPS.map((s) => `- **${s.name}:** ${s.volumeNote}`).join("\n");
    return `# Actuator startups

Venture-backed companies building robot actuators and motors, sized by disclosed funding and by company-reported production.

${mdTable(["Company", "HQ", "Country", "Raised", "Round", "Lead", "Reported output", "Source"], rows)}

## Production notes

${notes}

Figures are company-reported or from press coverage and are not independently verified.`;
}
