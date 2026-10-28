import {
    CHECKS,
    DIMENSIONS,
    DIMENSION_IDS,
    type Evidence,
    PRESETS,
    SDK_EVIDENCE,
    SDK_PATH,
    SDK_SCORES,
    checkDef,
    evidenceById,
    evidenceFor,
    leaderboard,
    overall,
    scoredBrands,
    unscoredBrands,
} from "@/sdk";
import { SITE_URL, absoluteUrl } from "../../site";
import * as ld from "../jsonld";
import { mdTable, mdText } from "../md";
import type { Page } from "../page-types";

// Markdown twin of /sdk: methodology, leaderboard per preset, the
// dimension scores, capability matrix and the evidence behind each brand.

const TITLE = "Best actuator SDKs";
const DESCRIPTION =
    "Which robot actuators have the best SDK: brands scored on protocol openness, language bindings, ROS 2 and sim support, docs, firmware tooling, support and reliability, every score traced to a GitHub file, doc or forum post.";

const fmt = (n: number | null) => (n === null ? "n/a" : n.toFixed(1));
const tick = (v: string | null) =>
    v === "official" ? "yes" : v === "community" ? "community" : "";

function methodology(): string {
    const runs = SDK_EVIDENCE.collectors
        .map((c) => `- ${c.label}: **${c.status}**. ${mdText(c.detail)}`)
        .join("\n");
    const dims = mdTable(
        ["Dimension", "Checks (points)"],
        DIMENSIONS.map((d) => [
            d.label,
            CHECKS.filter((c) => c.dimension === d.id)
                .map((c) => `${c.label} (${c.max})`)
                .join("; "),
        ]),
    );
    const c = SDK_EVIDENCE.classifier;
    return `## Method

Scores are evidence-driven. A dimension scores 0 to 10: the points its checks earn over the points of the checks that could be decided. Official evidence earns full points, community-only evidence half. A check is left out (not counted as zero) when its collector could not run; "n/a" means no check in that dimension could be decided. A zero means no public evidence was found, not that the feature cannot exist.

${dims}

Collectors in this snapshot (as of ${SDK_SCORES.asOf}):

${runs}

Forum classifier: **${c.status}**. ${mdText(c.detail)} Gold set: ${c.goldSetSize} posts.`;
}

function leaders(): string {
    const head = [
        "Rank",
        "Brand",
        ...PRESETS.map((p) => p.label),
        "Coverage",
        "Evidence",
    ];
    const rows = leaderboard().map((r) => [
        String(r.rank),
        `[${r.brand.name}](${absoluteUrl(`${SDK_PATH}?brand=${r.brand.brand}`)})`,
        ...PRESETS.map((p) => fmt(overall(r.brand, p).score)),
        `${Math.round(r.overall.coverage * 100)}%`,
        String(r.brand.evidenceCount),
    ]);
    const weights = PRESETS.map(
        (p) =>
            `- ${p.label}: ${DIMENSION_IDS.map((d) => `${DIMENSIONS.find((x) => x.id === d)?.short} ${p.weights[d]}`).join(", ")}`,
    ).join("\n");
    return `## Leaderboard

Overall is the weighted mean of the scored dimensions. Coverage is the share of the weight that could be scored (Balanced preset).

${mdTable(head, rows)}

Preset weights:

${weights}`;
}

function heatmap(): string {
    const rows = leaderboard().map((r) => [
        r.brand.name,
        ...DIMENSION_IDS.map((d) => fmt(r.brand.dimensions[d].score)),
    ]);
    return `## Scores by dimension

${mdTable(["Brand", ...DIMENSIONS.map((d) => d.short)], rows)}`;
}

function capabilities(): string {
    const head = [
        "Brand",
        "Python",
        "C/C++",
        "Rust",
        "ROS 2",
        "ros2_control",
        "URDF",
        "MJCF",
        "Open firmware",
        "Documented protocol",
    ];
    const rows = leaderboard().map(({ brand: b }) => [
        b.name,
        tick(b.capabilities.python),
        tick(b.capabilities.cpp),
        tick(b.capabilities.rust),
        tick(b.capabilities.ros2),
        tick(b.capabilities.ros2_control),
        tick(b.capabilities.urdf),
        tick(b.capabilities.mjcf),
        tick(b.capabilities.open_firmware),
        tick(b.capabilities.documented_protocol),
    ]);
    return `## Capability matrix

"yes" is backed by an official repo, "community" by a third-party one only.

${mdTable(head, rows)}`;
}

const link = (e: Evidence) => `[${mdText(e.title)}](${e.url})`;

function brandSection(brand: string): string {
    const b = scoredBrands().find((x) => x.brand === brand);
    if (!b) return "";
    const lines = DIMENSION_IDS.flatMap((d) => {
        const dim = b.dimensions[d];
        const label = DIMENSIONS.find((x) => x.id === d)?.label ?? d;
        return [
            `- **${label}: ${fmt(dim.score)}**`,
            ...dim.checks.map((c) => {
                const ev = c.evidence
                    .map(evidenceById)
                    .filter((e): e is Evidence => !!e)
                    .slice(0, 3)
                    .map(link)
                    .join("; ");
                return `  - ${checkDef(c.id)?.label}: ${c.status} (${c.points}/${c.max})${ev ? `. ${ev}` : ""}`;
            }),
        ];
    });
    const posts = evidenceFor(brand)
        .filter((e) => e.signal === "forum-mention")
        .sort((x, y) => (y.date ?? "").localeCompare(x.date ?? ""))
        .slice(0, 5)
        .map((e) => `- ${e.date}, ${e.forum}: "${mdText(e.quote ?? "")}" ${e.url}`);
    return `### ${b.name}

${lines.join("\n")}${posts.length ? `\n\nRecent forum posts (tagged by keyword, not sentiment):\n\n${posts.join("\n")}` : ""}`;
}

function notApplicable(): string {
    const names = unscoredBrands()
        .map((b) => b.name)
        .join(", ");
    return `## Not scored

These brands appear in the catalog only as gearboxes or frameless motors with no command interface, so there is no SDK to score: ${names}.`;
}

export function sdkBody(): string {
    return `# ${TITLE}

Which actuators are easiest to talk to from code. Brands are scored on seven dimensions from public evidence: GitHub repositories (read with git), maker documentation the catalog cites, and developer forum posts. Interactive version with presets, heatmap drill-down, radar compare and price scatter: ${absoluteUrl(SDK_PATH)}. JSON: ${absoluteUrl("/api/v1/sdk")}.

${leaders()}

${heatmap()}

${capabilities()}

## Evidence by brand

${leaderboard()
    .map((r) => brandSection(r.brand.brand))
    .join("\n\n")}

${notApplicable()}

${methodology()}`;
}

export const SDK_PAGE: Page = {
    path: SDK_PATH,
    kind: "spa",
    title: TITLE,
    description: DESCRIPTION,
    body: sdkBody,
    jsonLd: () => [
        ld.webPage("WebPage", SDK_PATH, TITLE),
        ld.breadcrumbs([
            { name: "Home", path: "/" },
            { name: TITLE, path: SDK_PATH },
        ]),
        {
            "@type": "Dataset",
            "@id": `${SITE_URL}${SDK_PATH}#scores`,
            name: "Actuator SDK scores and evidence",
            description:
                "Per-brand SDK scores on seven dimensions with the GitHub, documentation and forum evidence behind each check.",
            url: absoluteUrl(SDK_PATH),
            isAccessibleForFree: true,
            license: "https://opensource.org/licenses/MIT",
            dateModified: SDK_SCORES.asOf,
            measurementTechnique:
                "Rubric of objective checks over partial git clones of maker and community repositories, maker documentation cited by the catalog, and keyword-tagged forum posts; see the Method section.",
            distribution: [
                {
                    "@type": "DataDownload",
                    encodingFormat: "application/json",
                    contentUrl: absoluteUrl("/api/v1/sdk"),
                },
                {
                    "@type": "DataDownload",
                    encodingFormat: "text/markdown",
                    contentUrl: absoluteUrl(`${SDK_PATH}.md`),
                },
            ],
        },
    ],
};
