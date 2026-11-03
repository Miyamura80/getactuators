import { countryFlag, countryName } from "@/country-flag";
import { TIER_LABEL, concentrationTier } from "@/supply-chain/concentration-tier";
import { percent } from "@/supply-chain/format";
import { getMetal } from "@/supply-chain/metals/elements";
import {
    MANUFACTURING_AS_OF,
    MANUFACTURING_PATH,
    PROCESS_CHAINS,
    type ProcessChain,
    type ProcessStep,
    type ShareRef,
    neighbours,
    orderedSteps,
    sharesOf,
    stepsIn,
} from "@/supply-chain/processes";
import { processChainUrl, stepUrl } from "@/supply-chain/processes/views";
import { getCompany } from "@/supply-chain/registry";
import { DATA_LICENSE, SITE_URL, absoluteUrl } from "../../site";
import * as ld from "../jsonld";
import { mdText } from "../md";
import type { Page } from "../page-types";
import { type Footnotes, footnotes } from "./footnotes";

// Markdown twin of /manufacturing: every step in order, grouped by stage,
// with its key numbers, who runs it, the stage's country concentration and
// sources; plus HowTo and Dataset JSON-LD.

const TITLE = "How an actuator magnet is made";
const DESCRIPTION =
    "A zoomable process map of the sintered NdFeB magnet in an actuator, from rare earth ore to a magnetised rotor segment: every step with cited temperatures, particle sizes and yields, who runs it and which country holds it.";

function concentrationText(fn: Footnotes, ref: ShareRef | undefined): string {
    const s = sharesOf(ref);
    if (!s) return "no public country split";
    const c = concentrationTier(s.value);
    if (!c) return "no public country split";
    const { country, share } = c.top;
    return `${TIER_LABEL[c.tier].toLowerCase()}: ${countryFlag(country)} ${countryName(country)} ${s.confidence === "estimated" ? "~" : ""}${percent(share)}${fn.ref(s.sources)} (${s.asOf})`;
}

const names = (ids: readonly string[]): string =>
    ids.map((id) => getCompany(id)?.name ?? id).join(", ");

function stepMd(fn: Footnotes, chain: ProcessChain, s: ProcessStep, n: number): string {
    const numbers = s.keyNumbers
        .map((k) => `${k.label} ${fn.value(k.value)}`)
        .join("; ");
    const { next } = neighbours(chain, s.id);
    const lines = [
        `### ${n}. ${mdText(s.label)} (\`${s.id}\`)`,
        "",
        `${mdText(s.caption)}${fn.ref(s.sources)}`,
        "",
        `- In: ${s.inputs.map(mdText).join(", ")}. Out: ${s.outputs.map(mdText).join(", ")}.`,
    ];
    if (numbers) lines.push(`- Key numbers: ${numbers}.`);
    if (s.companyIds.length)
        lines.push(`- Who does it: ${mdText(names(s.companyIds))}.`);
    lines.push(`- Country concentration: ${concentrationText(fn, s.shares)}.`);
    if (next.length)
        lines.push(`- Feeds: ${next.map((id) => `\`${id}\``).join(", ")}.`);
    if (s.elementIds.length)
        lines.push(
            `- Elements: ${s.elementIds.map((e) => `[${getMetal(e)?.symbol ?? e}](${absoluteUrl(`/metals?element=${e}`)})`).join(", ")}.`,
        );
    if (s.branch === "recycling") lines.push("- Loop: scrap returns upstream.");
    lines.push(`- Map: ${absoluteUrl(stepUrl(chain, s.id))}`);
    return lines.join("\n");
}

function chainMd(fn: Footnotes, chain: ProcessChain): string {
    let n = 0;
    const clusters = chain.clusters
        .map((c) => {
            const steps = stepsIn(chain, c.id)
                .map((s) => stepMd(fn, chain, s, ++n))
                .join("\n\n");
            return `## ${mdText(c.label)}\n\nStage concentration: ${concentrationText(fn, c.shares)}.\n\n${steps}`;
        })
        .join("\n\n");
    return `${clusters}\n\n## Product\n\n${mdText(chain.product)}.`;
}

export function manufacturingBody(): string {
    const fn = footnotes();
    const chains = PROCESS_CHAINS.map((c) => chainMd(fn, c)).join("\n\n");
    const chain = PROCESS_CHAINS[0];
    const count = chain ? chain.steps.length : 0;
    return `# ${TITLE}

The permanent magnet at the heart of an actuator, step by step: ${count} steps in four stages (mining, separation, metal and alloy, magnet), with the heavy rare earth branch, grain boundary diffusion and the scrap loop. As of ${MANUFACTURING_AS_OF}. Interactive map: ${absoluteUrl(MANUFACTURING_PATH)} (deep link a step with \`#step=<id>\`). JSON: ${absoluteUrl("/api/v1/processes/magnet")}.

Numbers are each source's published figure for one plant, paper or patent; a range is the spread that source gives, not a world average. Country concentration is the stage's share of world output from [/metals](${absoluteUrl("/metals.md")}).

${chains}

${fn.section()}`;
}

function howTo(chain: ProcessChain): Record<string, unknown> {
    return {
        "@type": "HowTo",
        "@id": `${SITE_URL}${processChainUrl(chain)}#howto-${chain.id}`,
        name: chain.title,
        description: chain.product,
        step: orderedSteps(chain).map((s, i) => ({
            "@type": "HowToStep",
            position: i + 1,
            name: s.label,
            text: s.caption,
            url: absoluteUrl(stepUrl(chain, s.id)),
        })),
    };
}

export const MANUFACTURING_PAGE: Page = {
    path: MANUFACTURING_PATH,
    kind: "spa",
    title: TITLE,
    description: DESCRIPTION,
    body: manufacturingBody,
    jsonLd: () => [
        ld.webPage("WebPage", MANUFACTURING_PATH, TITLE),
        ld.breadcrumbs([
            { name: "Home", path: "/" },
            { name: TITLE, path: MANUFACTURING_PATH },
        ]),
        ...PROCESS_CHAINS.map(howTo),
        {
            "@type": "Dataset",
            "@id": `${SITE_URL}${MANUFACTURING_PATH}#processes`,
            name: "Actuator magnet process steps",
            description: DESCRIPTION,
            url: absoluteUrl(MANUFACTURING_PATH),
            isAccessibleForFree: true,
            license: DATA_LICENSE.url,
            creditText: DATA_LICENSE.credit,
            dateModified: "2026-11",
            distribution: [
                {
                    "@type": "DataDownload",
                    encodingFormat: "application/json",
                    contentUrl: absoluteUrl("/api/v1/processes/magnet"),
                },
                {
                    "@type": "DataDownload",
                    encodingFormat: "text/markdown",
                    contentUrl: absoluteUrl(`${MANUFACTURING_PATH}.md`),
                },
            ],
        },
    ],
};
