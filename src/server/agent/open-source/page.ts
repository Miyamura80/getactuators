import { countryName } from "@/country-flag";
import {
    EXCLUDED_ROBOTS,
    type FamilyNode,
    OPENNESS_DIMENSIONS,
    OPENNESS_LABEL,
    OPEN_ROBOTS,
    OPEN_SOURCE_AS_OF,
    OPEN_SOURCE_PATH,
    type OpenRobot,
    type OpennessStatus,
    REPO_STATS_AS_OF,
    ROBOT_TYPE_LABEL,
    SDK_PATH,
    actuatorUsage,
    familyTree,
    formatUsd,
    opennessScore,
    opennessStatus,
    repoStat,
    repoUrl,
    sourceOf,
    totalActuators,
} from "@/open-source";
import { absoluteUrl } from "../../site";
import * as ld from "../jsonld";
import { toAbsolute } from "../jsonld";
import { mdLink, mdTable, mdText } from "../md";
import type { Page } from "../page-types";

// Markdown twin and JSON-LD of /open-source: the robots table, the openness
// matrix with links, actuator usage, lineages and the excluded candidates.

const MARK: Record<OpennessStatus, string> = {
    full: "full",
    partial: "partial",
    missing: "-",
};

const pct = (x: number) => `${Math.round(x * 100)}%`;

function costText(r: OpenRobot): string {
    const c = r.bomCostUsd;
    if (!c) return "n/a";
    const value = c.range
        ? `${formatUsd(c.range[0])} to ${formatUsd(c.range[1])}`
        : formatUsd(c.value);
    return `${value} (${c.basis === "kit" ? "kit" : "BOM"})`;
}

function actuatorsText(r: OpenRobot): string {
    if (r.joints.length === 0) return "not itemised";
    return r.joints
        .map((j) => {
            const brand = j.brand === "Off the shelf" ? "" : `${j.brand} `;
            const name = `${j.count} x ${brand}${j.name}`;
            return j.actuatorId
                ? mdLink(name, `/actuators/${j.actuatorId}`)
                : mdText(name);
        })
        .join("; ");
}

function robotRow(r: OpenRobot): string[] {
    const stat = repoStat(r);
    const repo = repoUrl(r);
    return [
        mdLink(r.name, r.homepage),
        ROBOT_TYPE_LABEL[r.type],
        r.dof === null ? "n/a" : String(r.dof),
        costText(r),
        r.licence.length ? r.licence.join(", ") : "none stated",
        pct(opennessScore(r).score),
        actuatorsText(r),
        repo
            ? `${mdLink(r.repo ?? "", repo)}${stat?.stars != null ? ` (${stat.stars.toLocaleString("en-US")} stars)` : ""}`
            : "no repo",
    ];
}

function matrixRow(r: OpenRobot): string[] {
    return [
        mdText(r.name),
        ...OPENNESS_DIMENSIONS.map((d) => {
            const s = opennessStatus(r, d);
            const link = d === "licence" ? undefined : r.openness[d];
            return link ? mdLink(MARK[s], link.url) : MARK[s];
        }),
        pct(opennessScore(r).score),
    ];
}

function lineage(n: FamilyNode, depth = 0): string[] {
    return [
        `${"  ".repeat(depth)}- ${mdText(n.robot.name)}`,
        ...n.children.flatMap((c) => lineage(c, depth + 1)),
    ];
}

function cite(ids: string[]): string {
    return ids
        .map((id) => mdLink(sourceOf(id).title, toAbsolute(sourceOf(id).url)))
        .join("; ");
}

function robotSection(r: OpenRobot): string {
    const stat = repoStat(r);
    const facts = [
        `- **Type:** ${ROBOT_TYPE_LABEL[r.type]}${r.country ? `, ${countryName(r.country)}` : ""}`,
        `- **Maintainers:** ${r.maintainers.map(mdText).join(", ")}`,
        `- **DOF:** ${r.dof ?? "not published"}${r.dofNote ? ` (${mdText(r.dofNote)})` : ""}`,
        `- **Cost:** ${costText(r)}${r.bomCostUsd?.note ? `, ${mdText(r.bomCostUsd.note)}` : ""}`,
        ...(r.payloadKg
            ? [`- **Payload:** ${r.payloadKg.value} ${r.payloadKg.unit ?? "kg"}`]
            : []),
        `- **Licence:** ${r.licence.length ? r.licence.join(", ") : "none stated"}`,
        `- **Openness:** ${pct(opennessScore(r).score)}`,
        ...(stat
            ? [
                  `- **Repository:** ${stat.stars ?? "n/a"} stars, last commit ${stat.lastCommit ?? "n/a"}`,
              ]
            : []),
        ...(r.derivedFrom ? [`- **Derived from:** ${r.derivedFrom}`] : []),
        ...(r.robotId ? [`- **Catalog robot:** ${mdLink(r.robotId, "/robots")}`] : []),
        `- **Actuators:** ${totalActuators(r)}${r.jointsNote ? ` (${mdText(r.jointsNote)})` : ""}`,
        ...(r.inclusionNote ? [`- **Inclusion:** ${mdText(r.inclusionNote)}`] : []),
        `- **Sources:** ${cite(r.sources)}`,
    ];
    return `### ${mdText(r.name)}\n\n${mdText(r.summary)}\n\n${facts.join("\n")}`;
}

export function openSourceBody(): string {
    const usage = mdTable(
        ["Actuator", "Brand", "Joints", "Robots", "Catalog"],
        actuatorUsage().map((u) => [
            mdText(u.name),
            mdText(u.brand),
            String(u.joints),
            u.robots.join(", "),
            u.actuatorId
                ? mdLink(u.actuatorId, `/actuators/${u.actuatorId}`)
                : "unlisted",
        ]),
    );
    const excluded = mdTable(
        ["Candidate", "Why not listed", "Source"],
        EXCLUDED_ROBOTS.map((e) => [
            mdLink(e.name, e.url),
            mdText(e.reason),
            cite(e.sources),
        ]),
    );
    return `# Open-source robots

${OPEN_ROBOTS.length} robots you can build from published designs, the actuators in their joints and how open each one is. As of ${OPEN_SOURCE_AS_OF}; repository stars and last commits as of ${REPO_STATS_AS_OF}. Interactive version: ${absoluteUrl(OPEN_SOURCE_PATH)}. JSON: ${absoluteUrl("/api/v1/open-robots")}.

Inclusion rule: the mechanical design, or the full BOM plus build instructions, is public under a stated licence. Robots with only an open SDK are rated on ${mdLink("SDK ratings", SDK_PATH)} instead.

## Robots

${mdTable(["Robot", "Type", "DOF", "Cost", "Licence", "Openness", "Actuators", "Repository"], OPEN_ROBOTS.map(robotRow))}

## Openness matrix

Openness score = share of the eight columns that are full, with partial counting half. Each cell links to the published file or folder. Licence is full when every licence allows commercial use, partial when one is non-commercial.

${mdTable(["Robot", ...OPENNESS_DIMENSIONS.map((d) => OPENNESS_LABEL[d]), "Score"], OPEN_ROBOTS.map(matrixRow))}

## Actuator usage

Joint count by actuator model across the open robots. Catalog actuators link to their spec page; unlisted ones are named as their sources name them.

${usage}

## Family tree

${familyTree()
    .map((n) => lineage(n).join("\n"))
    .join("\n\n")}

## Robot notes

${OPEN_ROBOTS.map(robotSection).join("\n\n")}

## Checked but not listed

${excluded}`;
}

function licenseUrls(r: OpenRobot): string[] {
    return r.licence
        .filter((l) => !l.startsWith("LicenseRef-"))
        .map((l) => `https://spdx.org/licenses/${l}.html`);
}

// schema.org ItemList: each robot as a Product whose design (a CreativeWork)
// carries the licences.
export function openRobotsItemList(): Record<string, unknown> {
    return {
        "@type": "ItemList",
        name: "Open-source robots and their actuators",
        numberOfItems: OPEN_ROBOTS.length,
        itemListElement: OPEN_ROBOTS.map((r, i) => {
            const url = absoluteUrl(`${OPEN_SOURCE_PATH}?robot=${r.id}`);
            return {
                "@type": "ListItem",
                position: i + 1,
                url,
                item: {
                    "@type": ["Product", "CreativeWork"],
                    name: r.name,
                    description: r.summary,
                    url,
                    category: ROBOT_TYPE_LABEL[r.type],
                    brand: { "@type": "Brand", name: r.maintainers[0] ?? r.name },
                    ...(licenseUrls(r).length ? { license: licenseUrls(r) } : {}),
                    ...(repoUrl(r) ? { sameAs: repoUrl(r) } : {}),
                    additionalProperty: [
                        {
                            "@type": "PropertyValue",
                            name: "Openness score",
                            value: Math.round(opennessScore(r).score * 100),
                            unitText: "percent",
                        },
                        ...(r.dof === null
                            ? []
                            : [
                                  {
                                      "@type": "PropertyValue",
                                      name: "Degrees of freedom",
                                      value: r.dof,
                                  },
                              ]),
                    ],
                },
            };
        }),
    };
}

const TITLE = "Open-source robots";

export const OPEN_SOURCE_PAGE: Page = {
    path: OPEN_SOURCE_PATH,
    kind: "spa",
    title: TITLE,
    description: `${OPEN_ROBOTS.length} open robots you can build, from YOR and SO-101 to Berkeley Humanoid Lite: the actuators in each joint, BOM cost and how open each design is.`,
    body: openSourceBody,
    jsonLd: () => [
        ld.webPage("CollectionPage", OPEN_SOURCE_PATH, TITLE),
        ld.breadcrumbs([
            { name: "Home", path: "/" },
            { name: TITLE, path: OPEN_SOURCE_PATH },
        ]),
        openRobotsItemList(),
    ],
};
