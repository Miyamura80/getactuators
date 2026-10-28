import { countryFlag, countryName } from "@/country-flag";
import {
    LANDSCAPE,
    type LandscapeSnapshot,
    PATENTS_PATH,
    firstIncompleteYear,
    isCollected,
    leaderboard,
    streamByCountry,
    technologySnapshot,
    years,
} from "@/patents/landscape";
import { TECHNOLOGIES, type Technology } from "@/patents/technologies";
import { METHODOLOGY } from "@/patents/views";
import { percent } from "@/supply-chain/format";
import { SITE_URL, absoluteUrl } from "../../site";
import * as ld from "../jsonld";
import { mdTable, mdText } from "../md";
import type { Page } from "../page-types";

// Markdown twin of /patents: the CPC scope of each technology, then (once a
// snapshot exists) families per priority year by applicant country and the
// top assignees.

const TITLE = "Actuator patent landscape";
const DESCRIPTION =
    "Patent families since 2010 in robot joints, strain-wave, cycloidal and planetary gears, roller screws, NdFeB and rare-earth-free magnets, reluctance motors and artificial muscles, scoped by CPC code.";

const country = (code: string) =>
    code === ""
        ? "Unknown"
        : code === "other"
          ? "Other"
          : `${countryFlag(code)} ${countryName(code)}`;

function scopeTable(t: Technology): string {
    return mdTable(
        ["CPC", "Match", "Covers", "Filter", "Why"],
        t.cpc.map((c) => [
            `\`${c.code}\``,
            c.match,
            mdText(c.title),
            c.keywords ? mdText(c.keywords.join(", ")) : "",
            mdText(c.rationale),
        ]),
    );
}

function yearTable(t: Technology, s: LandscapeSnapshot): string {
    const series = streamByCountry([t.id], s, 5);
    const ys = years(s);
    const incomplete = firstIncompleteYear(s) ?? Number.POSITIVE_INFINITY;
    return mdTable(
        ["Priority year", ...series.map((x) => country(x.key)), "Total"],
        ys.map((y, i) => [
            y >= incomplete ? `${y} (incomplete)` : String(y),
            ...series.map((x) => (x.values[i] ?? 0).toLocaleString("en-US")),
            series
                .reduce((sum, x) => sum + (x.values[i] ?? 0), 0)
                .toLocaleString("en-US"),
        ]),
    );
}

function assigneeTable(t: Technology, s: LandscapeSnapshot): string {
    const board = leaderboard(t.id, s);
    if (!board || board.rows.length === 0) return "No assignees in the snapshot.";
    const window = board.window ? `${board.window[0]} to ${board.window[1]}` : "";
    const rows = board.rows.map((r) => [
        String(r.rank),
        r.companyId
            ? `[${mdText(r.name)}](${absoluteUrl(`/api/v1/companies/${r.companyId}`)})`
            : mdText(r.name),
        country(r.country),
        r.families.toLocaleString("en-US"),
        percent(r.share),
        r.cagr === null ? "n/a" : `${(r.cagr * 100).toFixed(0)}%`,
    ]);
    const top5 =
        board.top5Share === null
            ? ""
            : `\n\nTop five hold ${percent(board.top5Share)} of families.`;
    return `${mdTable(["#", "Assignee", "Country", "Families", "Share", `CAGR ${window}`], rows)}${top5}`;
}

function technologySection(t: Technology, s: LandscapeSnapshot): string {
    const snap = technologySnapshot(t.id, s);
    const data = snap
        ? `${snap.families.toLocaleString("en-US")} families since ${s.sinceYear}.

### Families per priority year

${yearTable(t, s)}

### Top assignees

${assigneeTable(t, s)}`
        : "No counts yet: the first snapshot has not been collected.";
    return `## ${t.label}

${t.description}

${scopeTable(t)}

${data}`;
}

function crossChecks(s: LandscapeSnapshot): string {
    if (s.crossChecks.length === 0) return "";
    return `## Cross-checks

${mdTable(
    ["Technology", "Year", "This dataset", "Other source", "Count there"],
    s.crossChecks.map((c) => [
        c.technology,
        String(c.year),
        c.bigquery.toLocaleString("en-US"),
        `[${c.source}](${c.url})`,
        c.other.toLocaleString("en-US"),
    ]),
)}`;
}

export function patentsBody(s: LandscapeSnapshot = LANDSCAPE): string {
    const status = isCollected(s)
        ? `Snapshot collected ${s.collectedAt}. Priority years from ${firstIncompleteYear(s)} on are incomplete.`
        : "Status: the BigQuery snapshot has not been collected yet, so this page lists the scope only. No counts are shown until real data is committed.";
    return `# ${TITLE}

Who files actuator and magnet inventions, and where. Interactive version: ${absoluteUrl(PATENTS_PATH)}. JSON: ${absoluteUrl("/api/v1/patents")}.

${status}

${METHODOLOGY}

${TECHNOLOGIES.map((t) => technologySection(t, s)).join("\n\n")}

${crossChecks(s)}`.trimEnd();
}

export const PATENTS_PAGE: Page = {
    path: PATENTS_PATH,
    kind: "spa",
    title: TITLE,
    description: DESCRIPTION,
    body: () => patentsBody(),
    // Kept out of search, the sitemap and llms.txt until the first snapshot.
    noindex: !isCollected(),
    jsonLd: () => [
        ld.webPage("WebPage", PATENTS_PATH, TITLE),
        ld.breadcrumbs([
            { name: "Home", path: "/" },
            { name: TITLE, path: PATENTS_PATH },
        ]),
        {
            "@type": "Dataset",
            "@id": `${SITE_URL}${PATENTS_PATH}#families`,
            name: "Actuator and magnet patent families by technology",
            description: `Patent family counts per technology, priority year and applicant country, and top assignees. ${METHODOLOGY}`,
            url: absoluteUrl(PATENTS_PATH),
            isAccessibleForFree: true,
            license: "https://opensource.org/licenses/MIT",
            temporalCoverage: `${LANDSCAPE.sinceYear}/..`,
            isBasedOn:
                "https://console.cloud.google.com/marketplace/product/google_patents_public_datasets/google-patents-public-data",
            measurementTechnique:
                "CPC classification scoping with patent family deduplication",
            distribution: [
                {
                    "@type": "DataDownload",
                    encodingFormat: "application/json",
                    contentUrl: absoluteUrl("/api/v1/patents"),
                },
                {
                    "@type": "DataDownload",
                    encodingFormat: "text/markdown",
                    contentUrl: absoluteUrl(`${PATENTS_PATH}.md`),
                },
            ],
        },
    ],
};
