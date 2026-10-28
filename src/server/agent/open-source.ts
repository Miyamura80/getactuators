import {
    EXCLUDED_CANDIDATES,
    OPENNESS_DIMENSIONS,
    OPENNESS_LABEL,
    OPEN_ROBOTS,
    OPEN_ROBOTS_AS_OF,
    OPEN_ROBOT_TYPE_LABEL,
    OPEN_SOURCE_PATH,
    type OpenRobot,
    REPO_STATS,
    actuatorUsage,
    getOpenRobot,
    jointMotor,
    licenceLabel,
    lineage,
    opennessScore,
    opennessState,
    repoStat,
    repoUrl,
} from "@/open-source";
import { absoluteUrl } from "../site";
import * as ld from "./jsonld";
import { bullets, mdLink, mdTable, mdText, usd } from "./md";
import type { Page } from "./page-types";

// Markdown twin and JSON-LD of /open-source: robots table, openness matrix,
// actuator usage, family tree and the inclusion rule.

const TITLE = "Open-source robots";
const pct = (x: number) => `${Math.round(x * 100)}%`;

function costText(r: OpenRobot): string {
    const c = r.bomCost;
    if (!c) return "not published";
    const money =
        c.unit === "EUR" ? `${c.value.toLocaleString("en-US")} EUR` : usd(c.value);
    const est = c.confidence === "reported" ? "" : ` (${c.confidence})`;
    return `${money}${est}`;
}

function actuatorsText(r: OpenRobot): string {
    return r.joints
        .map((j) => {
            const m = jointMotor(j);
            const label = `${j.count ?? "?"} x ${m.name}`;
            return j.actuatorId
                ? mdLink(label, absoluteUrl(`/actuators/${j.actuatorId}`))
                : mdText(label);
        })
        .join("; ");
}

function robotsTable(): string {
    return mdTable(
        [
            "Robot",
            "Type",
            "DOF",
            "Cost to build",
            "Licences",
            "Openness",
            "Actuators used",
            "Repo",
            "Stars",
        ],
        OPEN_ROBOTS.map((r) => {
            const stat = repoStat(r);
            const repo = repoUrl(r);
            return [
                mdLink(r.name, absoluteUrl(`${OPEN_SOURCE_PATH}?robot=${r.id}`)),
                OPEN_ROBOT_TYPE_LABEL[r.type],
                r.dof === null ? "n/a" : String(r.dof),
                costText(r),
                r.licence.length
                    ? r.licence.map(licenceLabel).join(", ")
                    : "none stated",
                pct(opennessScore(r).score),
                actuatorsText(r),
                repo ? mdLink(r.repo ?? "", repo) : "none found",
                stat
                    ? `${stat.starsRounded ? "~" : ""}${stat.stars.toLocaleString("en-US")}`
                    : "n/a",
            ];
        }),
    );
}

function matrix(): string {
    return mdTable(
        ["Robot", ...OPENNESS_DIMENSIONS.map((d) => OPENNESS_LABEL[d]), "Score"],
        OPEN_ROBOTS.map((r) => [
            r.name,
            ...OPENNESS_DIMENSIONS.map((d) => {
                const state = opennessState(r, d);
                const link = r.openness[d];
                return link ? mdLink(state, link.url) : "missing";
            }),
            pct(opennessScore(r).score),
        ]),
    );
}

function usageTable(): string {
    return mdTable(
        ["Actuator", "Brand", "Joints", "Robots"],
        actuatorUsage().map((u) => [
            u.actuatorId
                ? mdLink(u.name, absoluteUrl(`/actuators/${u.actuatorId}`))
                : `${mdText(u.name)} (not in catalog)`,
            mdText(u.brand),
            String(u.joints),
            u.robots.map((id) => getOpenRobot(id)?.name ?? id).join(", "),
        ]),
    );
}

function familyTree(): string {
    const name = (id: string) => getOpenRobot(id)?.name ?? id;
    return bullets(lineage().edges.map((e) => `${name(e.from)} -> ${name(e.to)}`));
}

function notes(): string {
    return bullets(
        OPEN_ROBOTS.filter((r) => r.inclusionNote || r.dofNote).map((r) =>
            mdText(
                `${r.name}: ${[r.inclusionNote, r.dofNote].filter(Boolean).join(" ")}`,
            ),
        ),
    );
}

function openSourceBody(): string {
    const passing = OPEN_ROBOTS.filter((r) => r.meetsInclusionRule).length;
    return `# Open-source robots

${OPEN_ROBOTS.length} robots you can build from public files, what actuator sits in each joint and how open each one really is. ${passing} meet the inclusion rule; Manmaru YOR is listed as the YOR derivative and marked where it falls short. As of ${OPEN_ROBOTS_AS_OF}. Interactive version: ${absoluteUrl(OPEN_SOURCE_PATH)}. JSON: ${absoluteUrl("/api/v1/open-robots")}. Robots with an open SDK but closed hardware are covered on ${absoluteUrl("/sdk")}.

Inclusion rule: at least the mechanical design, or the full BOM plus build instructions, is public under a stated licence.

Openness score: the share of eight dimensions (mechanical CAD, electronics, firmware, software and control stack, BOM with suppliers, assembly guide, sim model, licence) that are full, with partial counting half. A partial licence means a non-commercial clause or no licence on the hardware.

## Robots

${robotsTable()}

## Openness matrix

Each cell links to the file or repository it was judged from.

${matrix()}

## Actuators the open-source world builds on

Joints per actuator model across all ${OPEN_ROBOTS.length} robots, most used first. Joints whose motor the project does not name are left out.

${usageTable()}

## Family tree

${familyTree()}

## Notes

${notes()}

## Checked and left out

${bullets(EXCLUDED_CANDIDATES.map((c) => `${mdLink(c.name, c.url)}: ${mdText(c.reason)}`))}

## Method

GitHub stars and last commit: ${REPO_STATS.method} Snapshot ${REPO_STATS.asOf}; "~" marks a rounded star count. Costs are the project's own figures: a parts BOM, or a kit or system price where no BOM total is published (the note says which). Euro figures are not converted.`;
}

// schema.org ItemList of CreativeWork, one per robot, with its licences.
function openRobotsItemList(): Record<string, unknown> {
    return {
        "@type": "ItemList",
        name: "Open-source robots",
        numberOfItems: OPEN_ROBOTS.length,
        itemListElement: OPEN_ROBOTS.map((r, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: absoluteUrl(`${OPEN_SOURCE_PATH}?robot=${r.id}`),
            item: {
                "@type": "CreativeWork",
                name: r.name,
                description: r.summary,
                url: repoUrl(r) ?? r.homepage ?? absoluteUrl(OPEN_SOURCE_PATH),
                creator: r.maintainers.map((name) => ({
                    "@type": "Organization",
                    name,
                })),
                ...(r.licence.length
                    ? {
                          license: r.licence.map(
                              (id) => `https://spdx.org/licenses/${id}.html`,
                          ),
                      }
                    : {}),
            },
        })),
    };
}

export const OPEN_SOURCE_PAGE: Page = {
    path: OPEN_SOURCE_PATH,
    kind: "spa",
    title: TITLE,
    description: `${OPEN_ROBOTS.length} open-source robots, from YOR and SO-101 to Berkeley Humanoid Lite: the actuator in each joint, cost to build and how open each one really is.`,
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
