import {
    CAGR_END,
    CAGR_START,
    FAMILIES,
    LANDSCAPE,
    type LandscapeScope,
    METHODOLOGY,
    PATENTS_AS_OF,
    PATENTS_PATH,
    PATENT_SOURCES,
    PATENT_YEARS,
    TECHNOLOGIES,
    familiesFor,
    googlePatentsUrl,
    landscapeOf,
    leaderboard,
    patentsApiPath,
    scopeLabel,
    seriesByCountry,
    top5Share,
} from "@/patents";
import { DATA_LICENSE, absoluteUrl } from "../../site";
import * as ld from "../jsonld";
import { bullets, mdLink, mdTable, mdText } from "../md";
import type { Page } from "../page-types";

// Markdown twin and JSON-LD of /patents: per technology, families per
// priority year by applicant country and the top assignees.

const TITLE = "Actuator patents";

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
const signed = (v: number | null) =>
    v === null ? "n/a" : `${v >= 0 ? "+" : ""}${(v * 100).toFixed(0)}%`;
const incompleteYear = Number(LANDSCAPE.incompleteFrom.slice(0, 4));
const yearLabel = (y: number) =>
    y >= incompleteYear ? `${y} (incomplete)` : String(y);

function yearTable(scope: LandscapeScope): string {
    const series = seriesByCountry(scope, 6);
    const rows = PATENT_YEARS.map((y, i) => {
        const cells = series.map((s) => String(s.values[i] ?? 0));
        const total = series.reduce((sum, s) => sum + (s.values[i] ?? 0), 0);
        return [yearLabel(y), ...cells, String(total)];
    });
    return mdTable(["Priority year", ...series.map((s) => s.label), "Total"], rows);
}

function assigneeTable(scope: LandscapeScope): string {
    return mdTable(
        [
            "#",
            "Assignee",
            "Country",
            "Families",
            "Share",
            `CAGR ${CAGR_START}-${CAGR_END}`,
        ],
        leaderboard(scope).map((a) => [
            String(a.rank),
            a.company ? `${mdText(a.name)} (company \`${a.company}\`)` : mdText(a.name),
            a.country,
            String(a.families),
            pct(a.share),
            signed(a.cagr),
        ]),
    );
}

function techSection(scope: Exclude<LandscapeScope, "all">): string {
    const t = TECHNOLOGIES.find((x) => x.id === scope);
    if (!t) return "";
    const l = landscapeOf(scope);
    const codes = t.codes.map(
        (c) =>
            `\`${c.code}\`${"filtered" in c && c.filtered ? " (filtered)" : ""}: ${c.why}`,
    );
    const top = familiesFor(scope)
        .slice(0, 5)
        .map(
            (f) =>
                `${mdLink(mdText(f.title || f.pub), googlePatentsUrl(f.pub))}, ${mdText(f.assignee || "unknown assignee")}, priority ${f.priority}, ${f.jurisdictions} offices`,
        );
    return [
        `## ${t.label}`,
        `${t.scope} ${l.families} families, ${l.assignees} distinct first assignees; the top five hold ${pct(top5Share(scope))}. JSON: \`${patentsApiPath(scope)}\`.`,
        `CPC codes:\n\n${bullets(codes)}`,
        "filter" in t && t.filter
            ? `Filter for codes marked filtered: title matches one of ${t.filter.title.map((s) => `\`${s}\``).join(", ")}${"coCodes" in t.filter && t.filter.coCodes ? `, or the family also has ${t.filter.coCodes.map((s) => `\`${s}\``).join(", ")}` : ""}.`
            : "",
        "exclude" in t && t.exclude
            ? `Titles matching ${t.exclude.map((s) => `\`${s}\``).join(", ")} are left out.`
            : "",
        "### Families per priority year by applicant country",
        yearTable(scope),
        "### Top assignees",
        assigneeTable(scope),
        `### Largest families\n\n${bullets(top)}`,
    ]
        .filter(Boolean)
        .join("\n\n");
}

function patentsBody(): string {
    const e = LANDSCAPE.extract;
    const totals = mdTable(
        ["Technology", "Families", "Assignees", "Top-5 share", "Id"],
        TECHNOLOGIES.map((t) => [
            t.label,
            String(landscapeOf(t.id).families),
            String(landscapeOf(t.id).assignees),
            pct(top5Share(t.id)),
            `\`${t.id}\``,
        ]),
    );
    return `Patent families with a priority date from 2010 in ${TECHNOLOGIES.length} actuator technologies, as of ${PATENTS_AS_OF}: ${e.matched} families from an extract of ${e.publications} publications in ${e.families} families. Priority years from ${incompleteYear} are incomplete: applications publish about 18 months after priority.

Per technology as JSON: ${mdLink("/api/v1/patents/{technology}", absoluteUrl(patentsApiPath("strain-wave")))} (or \`all\`), or MCP get_patent_landscape.

${totals}

## Method

${bullets(Object.values(METHODOLOGY).map((v) => v))}

## All technologies

${scopeLabel("all")}: ${LANDSCAPE.all.families} families counted once; the top five assignees hold ${pct(top5Share("all"))}.

${yearTable("all")}

${assigneeTable("all")}

${TECHNOLOGIES.map((t) => techSection(t.id)).join("\n\n")}

## Sources

${Object.values(PATENT_SOURCES)
    .map((s, i) => `${i + 1}. ${mdLink(s.title, s.url)} (${s.reuse})`)
    .join("\n")}

Family titles, assignees and dates are from Google Patents Public Datasets (CC BY 4.0); ${FAMILIES.length} families are listed on the page.`;
}

function patentsDataset(): Record<string, unknown> {
    return {
        "@type": "Dataset",
        name: "actuatorlist patent landscape: actuator, gear, screw, magnet and motor patent families since 2010",
        description:
            "Patent families per technology, priority year and applicant country, top assignees with 3-year growth, and the largest families, for robot joints, strain-wave, cycloidal and planetary gears, roller and ball screws, NdFeB and rare-earth-free magnets, reluctance and axial-flux motors, artificial muscles and electrohydrostatic actuators.",
        url: absoluteUrl(PATENTS_PATH),
        license: DATA_LICENSE.url,
        creditText: DATA_LICENSE.credit,
        isAccessibleForFree: true,
        dateModified: PATENTS_AS_OF,
        temporalCoverage: `${PATENT_YEARS[0]}/${PATENT_YEARS.at(-1)}`,
        measurementTechnique: Object.values(METHODOLOGY).join(" "),
        variableMeasured: [
            "Patent families per priority year",
            "Patent families per applicant country",
            "Top assignee families and 3-year CAGR",
        ],
        isBasedOn: Object.values(PATENT_SOURCES).map((s) => s.url),
        distribution: TECHNOLOGIES.map((t) => ({
            "@type": "DataDownload",
            name: t.label,
            encodingFormat: "application/json",
            contentUrl: absoluteUrl(patentsApiPath(t.id)),
        })),
    };
}

export const PATENTS_PAGE: Page = {
    path: PATENTS_PATH,
    kind: "spa",
    title: TITLE,
    description:
        "Actuator patent landscape since 2010: families per year by country or technology, top assignees by technology with 3-year growth, and the largest families, for gears, screws, magnets, motors and artificial muscles.",
    body: patentsBody,
    jsonLd: () => [
        ld.webPage("CollectionPage", PATENTS_PATH, TITLE),
        ld.breadcrumbs([
            { name: "Home", path: "/" },
            { name: TITLE, path: PATENTS_PATH },
        ]),
        patentsDataset(),
    ],
};
