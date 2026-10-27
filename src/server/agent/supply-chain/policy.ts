import { countryFlag } from "@/country-flag";
import {
    MEASURE_STATUS_LABEL,
    MEASURE_TYPES,
    MEASURE_TYPE_LABEL,
    POLICY_AS_OF,
    POLICY_FEED_PATH,
    POLICY_LANES,
    POLICY_LANE_LABEL,
    POLICY_MEASURES,
    POLICY_PATH,
    type PolicyMeasure,
    countBy,
    laneOf,
    policyChanges,
    startDate,
} from "@/supply-chain/policy";
import { STAGE_LABEL } from "@/supply-chain/stages";
import { SITE_URL, absoluteUrl } from "../../site";
import * as ld from "../jsonld";
import { mdTable, mdText } from "../md";
import type { Page } from "../page-types";
import { footnotes } from "./footnotes";

// Markdown twin of /policy (measures table sorted by date, with status and
// source), its Dataset JSON-LD, and the Atom feed of status changes.

const TITLE = "Actuator chain policy";
const DESCRIPTION =
    "Export controls, tariffs, subsidies and standards that touch the actuator supply chain from mine to robot, in China, the US, the EU, Japan and Korea, each with its status history and primary source.";

const jurisdiction = (m: PolicyMeasure) =>
    m.jurisdiction === "EU" || m.jurisdiction === "INTL"
        ? m.jurisdiction
        : `${countryFlag(m.jurisdiction)} ${m.jurisdiction}`;

export function policyBody(): string {
    const fn = footnotes();
    const byType = countBy(MEASURE_TYPES, (m) => m.type);
    const byLane = countBy(POLICY_LANES, laneOf);
    const counts = MEASURE_TYPES.map(
        (t) => `${byType[t]} ${MEASURE_TYPE_LABEL[t].toLowerCase()}`,
    ).join(", ");
    const lanes = POLICY_LANES.map((l) => `${POLICY_LANE_LABEL[l]} ${byLane[l]}`).join(
        ", ",
    );
    const table = mdTable(
        ["Date", "Where", "Type", "Measure", "Status", "Stages", "Source"],
        POLICY_MEASURES.map((m) => [
            startDate(m),
            jurisdiction(m),
            MEASURE_TYPE_LABEL[m.type],
            `**${mdText(m.title)}** (\`${m.id}\`): ${mdText(m.summary)}`,
            `${MEASURE_STATUS_LABEL[m.status]} since ${m.statusHistory.at(-1)?.date ?? ""}`,
            m.stages.map((s) => STAGE_LABEL[s]).join(", "),
            fn.ref(m.sources),
        ]),
    );
    const changes = policyChanges()
        .slice(0, 12)
        .map(
            (c) =>
                `- ${c.date}: **${mdText(c.measure.title)}** ${MEASURE_STATUS_LABEL[c.status].toLowerCase()}${c.note ? `. ${mdText(c.note)}` : ""}${fn.ref(c.measure.statusHistory[c.index]?.sources ?? [])}`,
        )
        .join("\n");
    return `# ${TITLE}

Every government or standards-body measure on file that touches the actuator chain, from rare earth mining to the finished robot: ${POLICY_MEASURES.length} measures (${counts}). By lane: ${lanes}. As of ${POLICY_AS_OF}. Interactive timeline: ${absoluteUrl(POLICY_PATH)}. JSON: ${absoluteUrl("/api/v1/policy")}. Feed of status changes: ${absoluteUrl(POLICY_FEED_PATH)}.

Statuses: draft (standard in development), announced (decided, not yet applying), in force, suspended, expired. Every measure cites at least one government gazette, ministry notice or standards catalogue page.

## Latest status changes

${changes}

## Measures

${table}

${fn.section()}`;
}

const xml = (s: string) =>
    s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

// "2025-04" -> "2025-04-01T00:00:00Z".
function atomDate(d: string): string {
    const [y, m = "01", day = "01"] = d.split("-");
    return `${y}-${m}-${day}T00:00:00Z`;
}

// Atom feed: one entry per status change, newest first.
export function policyFeedXml(limit = 50): string {
    const changes = policyChanges().slice(0, limit);
    const entries = changes
        .map((c) => {
            const m = c.measure;
            const link = absoluteUrl(`${POLICY_PATH}#measure=${m.id}`);
            const what = `${m.title}: ${MEASURE_STATUS_LABEL[c.status].toLowerCase()}`;
            const body = c.note ? `${c.note} ${m.summary}` : m.summary;
            return `  <entry>
    <id>${SITE_URL}${POLICY_PATH}/${m.id}/${c.index}</id>
    <title>${xml(what)}</title>
    <link href="${xml(link)}"/>
    <updated>${atomDate(c.date)}</updated>
    <category term="${m.type}"/>
    <summary>${xml(body)}</summary>
  </entry>`;
        })
        .join("\n");
    const updated = changes[0] ? atomDate(changes[0].date) : atomDate(POLICY_AS_OF);
    return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${xml(TITLE)}: status changes</title>
  <id>${SITE_URL}${POLICY_FEED_PATH}</id>
  <link rel="self" href="${absoluteUrl(POLICY_FEED_PATH)}"/>
  <link href="${absoluteUrl(POLICY_PATH)}"/>
  <updated>${updated}</updated>
  <author><name>actuatorlist</name></author>
${entries}
</feed>
`;
}

export const POLICY_PAGE: Page = {
    path: POLICY_PATH,
    kind: "spa",
    title: TITLE,
    description: DESCRIPTION,
    body: policyBody,
    jsonLd: () => [
        ld.webPage("WebPage", POLICY_PATH, TITLE),
        ld.breadcrumbs([
            { name: "Home", path: "/" },
            { name: TITLE, path: POLICY_PATH },
        ]),
        {
            "@type": "Dataset",
            "@id": `${SITE_URL}${POLICY_PATH}#measures`,
            name: "Policy measures on the actuator supply chain",
            description: DESCRIPTION,
            url: absoluteUrl(POLICY_PATH),
            isAccessibleForFree: true,
            license: "https://opensource.org/licenses/MIT",
            temporalCoverage: `2011/${POLICY_AS_OF.slice(0, 4)}`,
            spatialCoverage: [
                "China",
                "United States",
                "European Union",
                "Japan",
                "South Korea",
                "Australia",
            ],
            dateModified: POLICY_AS_OF,
            distribution: [
                {
                    "@type": "DataDownload",
                    encodingFormat: "application/json",
                    contentUrl: absoluteUrl("/api/v1/policy"),
                },
                {
                    "@type": "DataDownload",
                    encodingFormat: "text/markdown",
                    contentUrl: absoluteUrl(`${POLICY_PATH}.md`),
                },
                {
                    "@type": "DataDownload",
                    encodingFormat: "application/atom+xml",
                    contentUrl: absoluteUrl(POLICY_FEED_PATH),
                },
            ],
        },
    ],
};
