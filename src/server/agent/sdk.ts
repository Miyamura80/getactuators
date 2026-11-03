import {
    CAPABILITIES,
    CAPABILITY_LABEL,
    DIMENSION_LABEL,
    DIMENSION_SHORT,
    FORUM_LABEL,
    PRESET_LABEL,
    PRESET_WEIGHTS,
    SDK_AS_OF,
    SDK_DIMENSIONS,
    SDK_METHOD,
    SDK_PATH,
    SDK_PRESETS,
    UNSCORED_BRANDS,
    checksFor,
    sdkLeaderboard,
} from "@/sdk";
import { SDK_EVIDENCE, evidenceFor, painPoints } from "@/sdk/evidence";
import { HALF_LIFE_MONTHS, ISSUE_WEIGHT } from "@/sdk/score";
import { DATA_LICENSE, SITE_URL, absoluteUrl } from "../site";
import * as ld from "./jsonld";
import { mdTable, mdText } from "./md";
import type { Page } from "./page-types";
import { footnotes } from "./supply-chain/footnotes";

// Markdown twin of /sdk (leaderboard, per-brand dimension scores, the checks
// and top evidence links behind them) and its Dataset JSON-LD.

const TITLE = "Best actuator SDKs";
const DESCRIPTION =
    "Which robot actuator brands have the best SDK: protocol openness, bindings, ROS 2 and sim, docs, firmware, support and comms reliability, scored from objective checks and developer posts on Reddit, Hacker News and GitHub.";

const cell = (n: number | undefined) =>
    n === undefined ? "n/a" : String(Math.round(n));

function leaderboardTable(): string {
    return mdTable(
        [
            "#",
            "Brand",
            "Overall",
            ...SDK_DIMENSIONS.map((d) => DIMENSION_SHORT[d]),
            "Evidence",
            "Confidence",
        ],
        sdkLeaderboard().map((s) => [
            String(s.rank),
            `**${mdText(s.brand.name)}** (\`${s.brand.id}\`)`,
            cell(s.score.overall),
            ...SDK_DIMENSIONS.map((d) => cell(s.score.dimensions[d]?.score)),
            String(s.score.evidenceCount),
            s.confidence,
        ]),
    );
}

function presetTable(): string {
    return mdTable(
        ["Preset", ...SDK_DIMENSIONS.map((d) => DIMENSION_SHORT[d]), "Top 3"],
        SDK_PRESETS.map((p) => [
            PRESET_LABEL[p],
            ...SDK_DIMENSIONS.map((d) => `${Math.round(PRESET_WEIGHTS[p][d] * 100)}%`),
            sdkLeaderboard(p)
                .slice(0, 3)
                .map((s) => s.brand.name)
                .join(", "),
        ]),
    );
}

function brandSection(fn: ReturnType<typeof footnotes>): (id: string) => string {
    return (id) => {
        const s = sdkLeaderboard().find((x) => x.brand.id === id);
        if (!s) return "";
        const dims = SDK_DIMENSIONS.map((d) => {
            const v = s.score.dimensions[d];
            const checks = checksFor(id)
                .filter((c) => c.dimension === d)
                .map(
                    (c) =>
                        `${c.value === 1 ? "yes" : c.value === 0.5 ? "partly" : "no"}: ${mdText(c.label)}${fn.ref(c.sources)}`,
                )
                .join("; ");
            return `- **${DIMENSION_LABEL[d]}**: ${v ? `${Math.round(v.score)} (${v.positive} positive, ${v.negative} negative posts)` : "no data"}${checks ? `. ${checks}` : ""}`;
        }).join("\n");
        const caps = CAPABILITIES.filter((c) => s.capabilities[c] !== "none")
            .map((c) => `${CAPABILITY_LABEL[c]} (${s.capabilities[c]})`)
            .join(", ");
        const pains = painPoints(id, 3)
            .map((p) => `${p.theme} (${p.count})`)
            .join(", ");
        const top = evidenceFor(id)
            .slice(0, 5)
            .map(
                (e) =>
                    `- ${e.date}, ${FORUM_LABEL[e.forum]} ${mdText(e.venue)}, ${DIMENSION_SHORT[e.dimension]}, ${e.polarity}: ${mdText(e.claim)} ${e.url}`,
            )
            .join("\n");
        return `### ${s.rank}. ${mdText(s.brand.name)}: ${Math.round(s.score.overall)}

Ships: ${caps || "nothing public found"}.${pains ? ` Recurring complaints: ${pains}.` : ""} Catalog actuators: ${s.actuatorIds.map((a) => `\`${a}\``).join(", ")}.

${dims}

${top ? `Newest evidence:\n\n${top}` : "No community posts matched yet."}`;
    };
}

export function sdkBody(): string {
    const fn = footnotes();
    const board = sdkLeaderboard();
    const gold = SDK_METHOD.gold;
    const agreement = gold.agreement
        .map((a) => `${DIMENSION_SHORT[a.dimension]} ${Math.round(a.agreement * 100)}%`)
        .join(", ");
    const brands = board.map((s) => brandSection(fn)(s.brand.id)).join("\n\n");
    const unscored = UNSCORED_BRANDS.map(
        (b) => `- ${mdText(b.name)}: ${mdText(b.noneReason ?? "")}`,
    ).join("\n");
    return `# ${TITLE}

How painful each actuator brand is to talk to from software, scored 0 to 100 on seven dimensions for ${board.length} brands. ${SDK_EVIDENCE.length} community claims back the scores, from ${SDK_METHOD.postsMatched} matching posts out of ${SDK_METHOD.postsScanned} scanned. As of ${SDK_AS_OF}. Interactive page with presets, heatmap, radar compare and evidence drill-down: ${absoluteUrl(SDK_PATH)}. JSON: ${absoluteUrl("/api/v1/sdk")}.

## Leaderboard (balanced preset)

${leaderboardTable()}

## Reader presets

Weights per dimension; the overall score is the weighted mean of all seven, where a dimension with no checks and no posts counts as 50.

${presetTable()}

## Method

- **Objective checks** (60% of a dimension when present): is the protocol published, which official or community libraries exist, ROS 2 drivers and URDF / MJCF models, docs, open firmware and config tools, plus the maker's repository activity and median time to close issues. Each check cites its source.
- **Community signal** (up to 40%, growing with the number of posts): developer posts on Reddit, Hacker News and GitHub issues that name a brand are matched by alias, then each post was read once by ${mdText(SDK_METHOD.labelledBy)}, who labelled the claim's dimension and polarity and wrote a one-line summary in our words; the labels are committed and no model API runs. A post's weight halves every ${HALF_LIFE_MONTHS} months, and a GitHub issue counts ${ISSUE_WEIGHT} of a discussion post because trackers collect bug reports. A small pull toward 50 keeps a dimension resting on one check off 0 and 100. No quotes or usernames are stored.
- **Label check**: ${gold.items} posts were labelled separately (${mdText(gold.labelledBy)}); agreement with the committed labels per dimension: ${agreement}. Scores are only written when every dimension reaches 80%.
- **Confidence**: high at 40 or more evidence items, medium at 15, else low.

## Brands

${brands}

## Not scored

${unscored}

${fn.section()}`;
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
            name: "Robot actuator SDK scores",
            description: DESCRIPTION,
            url: absoluteUrl(SDK_PATH),
            isAccessibleForFree: true,
            license: DATA_LICENSE.url,
            dateModified: SDK_AS_OF,
            measurementTechnique:
                "Objective checks of vendor docs and repositories blended with LLM-labelled developer posts (Reddit, Hacker News, GitHub issues), validated against a hand-labelled gold set.",
            variableMeasured: SDK_DIMENSIONS.map((d) => DIMENSION_LABEL[d]),
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
