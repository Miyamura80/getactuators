import { readFileSync } from "node:fs";
import { absoluteUrl } from "../site";
import { comparisonDashboard, guideDashboard } from "./editorial-visuals";
import { breadcrumbs, webPage } from "./jsonld";
import type { Page } from "./page-types";

const guide = readFileSync(
    new URL("./content/guide.md", import.meta.url),
    "utf8",
).trim();
const comparison = readFileSync(
    new URL("./content/comparison.md", import.meta.url),
    "utf8",
).trim();

function article(
    path: string,
    description: string,
    title: string,
    body: string,
    visual: () => string,
): Page {
    const headline = body.split("\n")[0]?.replace(/^# /, "") ?? "";
    return {
        path,
        kind: "static",
        layout: "editorial",
        title,
        description,
        ogType: "article",
        updatedAt: "2026-10-01",
        body: () => body,
        visual,
        jsonLd: () => [
            {
                "@type": "TechArticle",
                "@id": `${absoluteUrl(path)}#article`,
                url: absoluteUrl(path),
                headline,
                description,
                inLanguage: "en",
                author: { "@type": "Organization", name: "actuatorlist" },
                dateModified: "2026-10-01",
                mainEntityOfPage: absoluteUrl(path),
            },
            breadcrumbs([
                { name: "Home", path: "/" },
                { name: "Engineering guides", path: "/guides" },
                { name: headline, path },
            ]),
        ],
    };
}

export const EDITORIAL_PAGES: Page[] = [
    {
        path: "/guides",
        kind: "static",
        layout: "editorial",
        title: "Robot actuator engineering guides",
        updatedAt: "2026-10-01",
        description:
            "Source-backed selection guides and actuator comparisons: efficiency, thermal duty, output precision and sim2real modeling, with explicit unknowns.",
        body: () => `# Robot actuator engineering guides

Choose a robot joint on more than peak torque. These guides separate manufacturer specifications, published research measurements, conditional engineering inference and unknown values. They describe proposed validation workflows, not tests we have performed on your hardware.

## Selection workflow

[How to select a robot actuator](/guides/robot-actuator-selection): define the mission, measure complete bus-to-output efficiency, validate installed thermal duty, test loaded output repeatability and identify a model on held-out trajectories.

## Version-scoped comparison

[CubeMars AK80-9 V3.0 KV100 versus original Xiaomi CyberGear](/comparisons/cubemars-ak80-9-vs-xiaomi-cybergear): what the documents establish, their revision conflicts, and why they do not prove an efficiency, thermal, precision or sim2real winner.

## Reducers are not integrated motors

Read family-level engineering notes for [Leaderdrive LCS](/actuators/leaderdrive-lcs), [LHD](/actuators/leaderdrive-lhd), [LHS](/actuators/leaderdrive-lhs), [Nidec WPG](/actuators/nidec-flexwave-wpg) and [Smart SRH](/actuators/nidec-smart-flexwave-srh). These distinguish input variants, sensor electronics and rating conditions without inventing missing motor specifications.

[Browse the complete catalog](/actuators). Confirm the actual configuration, hardware and firmware before design sign-off.`,
        jsonLd: () => [
            {
                ...webPage(
                    "CollectionPage",
                    "/guides",
                    "Robot actuator engineering guides",
                ),
                dateModified: "2026-10-01",
            },
        ],
    },
    article(
        "/guides/robot-actuator-selection",
        "Choose robot actuators using efficiency, thermal duty, precision and sim2real evidence. Separate published specifications from unmeasured performance.",
        "Robot actuator selection guide",
        guide,
        guideDashboard,
    ),
    article(
        "/comparisons/cubemars-ak80-9-vs-xiaomi-cybergear",
        "CubeMars AK80-9 V3.0 KV100 vs original 24 V Xiaomi CyberGear: efficiency, thermal duty, encoder conflicts and sim2real limits. Not a bench test.",
        "CubeMars AK80-9 V3.0 KV100 vs Xiaomi CyberGear",
        comparison,
        comparisonDashboard,
    ),
];
