import { patentLandscapeView } from "@/api/patents";
import {
    APPLICATION_AREAS,
    type AreaCell,
    CAGR_END,
    CAGR_START,
    COMPLETE_THROUGH,
    FAMILIES,
    FIRST_YEAR,
    LAG_MONTHS,
    LANDSCAPE,
    type LandscapeScope,
    METHODOLOGY,
    MOMENTUM_EARLY,
    MOMENTUM_LATE,
    PATENTS_AS_OF,
    PATENTS_PATH,
    PATENT_SOURCES,
    PATENT_YEARS,
    STREAM_FILTERS,
    TECHNOLOGY_LIST,
    type TechnologyId,
    areaCells,
    areaShift,
    cellPct,
    filterSummary,
    intlShares,
    landscapeOf,
    leaderboard,
    momentum,
    patentsApiPath,
    pctText,
    scopeLabel,
    seriesByCountry,
    signedPct,
    top5Share,
    valueRows,
    yearSpan,
} from "@/patents";
import { DATA_LICENSE, absoluteUrl } from "../../site";
import * as ld from "../jsonld";
import { bullets, mdLink, mdTable, mdText, sourcesList } from "../md";
import type { Page } from "../page-types";

// Markdown twin and JSON-LD of /patents: per technology, families per
// priority year by applicant country and the top assignees.

const TITLE = "Actuator patents";

const pct = (v: number) => pctText(v, 1);
const pct0 = (v: number) => pctText(v, 0);
const signed = (v: number | null) => (v === null ? "n/a" : signedPct(v));
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

const SPAN = yearSpan([FIRST_YEAR, COMPLETE_THROUGH]);

function qualityTable(scope: LandscapeScope): string {
    return mdTable(
        ["Filter", `Families ${SPAN}`, "Share of all", "China share"],
        STREAM_FILTERS.map((f) => {
            const q = filterSummary(scope, f.id);
            return [f.label, String(q.families), pct0(q.share), pct0(q.china)];
        }),
    );
}

function intlLine(scope: LandscapeScope): string {
    const s = intlShares(scope);
    return `${pct0(s.rest)} of non-Chinese and ${pct0(s.cn)} of Chinese families (priority ${SPAN}) were filed in 2+ offices.`;
}

function valueSection(scope: LandscapeScope, top = 12): string {
    return `${intlLine(scope)}\n\n${mdTable(
        ["Assignee", "Country", "Families", "2+ offices", "Granted"],
        valueRows(scope)
            .slice(0, top)
            .map((a) => [
                mdText(a.name),
                a.country,
                String(a.families),
                pct0(a.families ? a.intl / a.families : 0),
                String(a.granted),
            ]),
    )}`;
}

function areaGrid(): string {
    const arrow = (c: AreaCell) => {
        const d = areaShift(c);
        return d ? ` (${d})` : "";
    };
    return mdTable(
        ["Technology", ...APPLICATION_AREAS.map((a) => a.label)],
        TECHNOLOGY_LIST.map((t) => [
            t.short,
            ...areaCells(t.id).map((c) => `${cellPct(c.share)}${arrow(c)}`),
        ]),
    );
}

// "Quality: 1,234 granted families (40%), ..., priority 2010-2024."
function qualityLine(scope: LandscapeScope): string {
    const parts = STREAM_FILTERS.slice(1).map((f) => {
        const q = filterSummary(scope, f.id);
        return `${q.families} ${f.long} (${pct0(q.share)})`;
    });
    return `Quality: ${parts.join(", ")}, priority ${SPAN}.`;
}

// The scope's three largest application areas by families.
function topAreasLine(scope: LandscapeScope): string {
    const top = areaCells(scope)
        .sort((a, b) => b.families - a.families)
        .slice(0, 3)
        .map((c) => `${c.label} ${cellPct(c.share)}`);
    return `Top application areas: ${top.join(", ")}.`;
}

const codeList = (codes: readonly string[]) => codes.map((s) => `\`${s}\``).join(", ");

function techSection(scope: TechnologyId): string {
    const v = patentLandscapeView(scope);
    const codes = v.cpc_codes.map(
        (c) => `\`${c.code}\`${c.filtered ? " (filtered)" : ""}: ${c.rationale}`,
    );
    const top = v.top_families
        .slice(0, 5)
        .map(
            (f) =>
                `${mdLink(mdText(f.title || f.publication_number), f.url)}, ${mdText(f.assignee || "unknown assignee")}, priority ${f.priority_date}, ${f.jurisdictions} offices`,
        );
    return [
        `## ${v.label}`,
        `${v.scope} ${v.families} families, ${v.assignees} distinct first assignees; the top five hold ${pct(top5Share(scope))}. JSON: \`${patentsApiPath(scope)}\`.`,
        `CPC codes:\n\n${bullets(codes)}`,
        v.title_filter.length
            ? `Filter for codes marked filtered: title matches one of ${codeList(v.title_filter)}${v.co_codes.length ? `, or the family also has ${codeList(v.co_codes)}` : ""}.`
            : "",
        v.title_exclude.length
            ? `Titles matching ${codeList(v.title_exclude)} are left out.`
            : "",
        "### Families per priority year by applicant country",
        yearTable(scope),
        "### Top assignees",
        assigneeTable(scope),
        `${qualityLine(scope)} ${intlLine(scope)} ${topAreasLine(scope)}`,
        `### Largest families\n\n${bullets(top)}`,
    ]
        .filter(Boolean)
        .join("\n\n");
}

// Families per technology in the early and late momentum windows, with every
// applicant and outside China.
function momentumTable(): string {
    const ex = new Map(momentum("ex-cn").map((r) => [r.id, r]));
    const change = (c: number | null) => (c === null ? "new" : signed(c));
    return mdTable(
        [
            "Technology",
            yearSpan(MOMENTUM_EARLY),
            yearSpan(MOMENTUM_LATE),
            "Change",
            "Change outside China",
        ],
        momentum().map((r) => [
            r.label,
            String(r.early),
            String(r.late),
            change(r.change),
            change(ex.get(r.id)?.change ?? null),
        ]),
    );
}

function patentsBody(): string {
    const e = LANDSCAPE.extract;
    const totals = mdTable(
        ["Technology", "Families", "Assignees", "Top-5 share", "Id"],
        TECHNOLOGY_LIST.map((t) => [
            t.label,
            String(landscapeOf(t.id).families),
            String(landscapeOf(t.id).assignees),
            pct(top5Share(t.id)),
            `\`${t.id}\``,
        ]),
    );
    return `Patent families with a priority date from ${FIRST_YEAR} in ${TECHNOLOGY_LIST.length} actuator technologies, as of ${PATENTS_AS_OF}: ${e.matched} families from an extract of ${e.publications} publications in ${e.families} families. Priority years from ${incompleteYear} are incomplete: applications publish about ${LAG_MONTHS} months after priority.

Per technology as JSON: ${mdLink("/api/v1/patents/{technology}", absoluteUrl(patentsApiPath("strain-wave")))} (or \`all\`), or MCP get_patent_landscape.

${totals}

## Method

${bullets(Object.values(METHODOLOGY))}

## All technologies

${scopeLabel("all")}: ${LANDSCAPE.all.families} families counted once; the top five assignees hold ${pct(top5Share("all"))}.

${yearTable("all")}

${assigneeTable("all")}

### Momentum

${momentumTable()}

### Quality filters

Families that cleared a costlier bar: granted, filed in 2+ offices (not counting WO), or filed at the US, EP and JP offices.

${qualityTable("all")}

### Value vs volume

${valueSection("all")}

### Where it ends up

Share of each technology's families (priority ${SPAN}) by application area, from CPC co-classification: a proxy for use until citation data is added. (up) or (down): the share moved 1 point or more from ${yearSpan(LANDSCAPE.areaWindows.early)} to ${yearSpan(LANDSCAPE.areaWindows.late)}.

${areaGrid()}

${TECHNOLOGY_LIST.map((t) => techSection(t.id)).join("\n\n")}

## Sources

${sourcesList(Object.values(PATENT_SOURCES))}

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
        distribution: TECHNOLOGY_LIST.map((t) => ({
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
