import { countryName } from "@/country-flag";
import {
    ALTS_AS_OF,
    ALTS_PATH,
    ALTS_UPDATED,
    ALT_FAMILIES,
    ALT_TECHS,
    type AltTech,
    DEPLOYMENTS,
    END_MARKET_LABEL,
    FAMILY_LABEL,
    MAGNET_USE_LABEL,
    MARKET_SLICES,
    MILESTONE_LABEL,
    getAltTech,
    techsIn,
} from "@/supply-chain/alts";
import { altTechUrl } from "@/supply-chain/alts/views";
import { NDFEB_PER_HUMANOID } from "@/supply-chain/perspective";
import { getCompany } from "@/supply-chain/registry";
import type { Sourced } from "@/supply-chain/sourced";
import { DATA_LICENSE, SITE_URL, absoluteUrl } from "../../site";
import * as ld from "../jsonld";
import { mdTable, mdText } from "../md";
import type { Page } from "../page-types";
import { type Footnotes, footnotes } from "./footnotes";

// Markdown twin of /alts: the technology table, the market table, the
// methodology, and dated deployments; plus Dataset JSON-LD.

const TITLE = "Alternatives to rare-earth actuators";
const DESCRIPTION =
    "Every serious alternative to the NdFeB-magnet electric actuator: rare-earth-free motors, artificial muscles, hydraulic drives and transmissions, with cited readiness, market size and growth, dated deployments and how each works inside.";

const cell = (fn: Footnotes, s: Sourced<number> | undefined): string =>
    s ? fn.value(s) : "n/a";

function milestonesText(fn: Footnotes, t: AltTech): string {
    if (t.milestones.length === 0) return "none dated";
    return t.milestones
        .map(
            (m) =>
                `${MILESTONE_LABEL[m.kind]} ${fn.value(m.year)}${m.announced ? " (announced)" : ""}`,
        )
        .join("; ");
}

function techTable(fn: Footnotes): string {
    const rows = ALT_TECHS.map((t) => [
        `[${mdText(t.name)}](${absoluteUrl(altTechUrl(t.id))}) (\`${t.id}\`)`,
        FAMILY_LABEL[t.family],
        `${mdText(t.principle)}${fn.ref(t.sources)}`,
        `${fn.value(t.trl)}`,
        cell(fn, t.metrics.specificPower ?? t.metrics.torqueDensity),
        cell(fn, t.metrics.efficiency),
        `${MAGNET_USE_LABEL[t.magnets]}${t.metrics.reeIntensityKgPerKw ? `, ${fn.value(t.metrics.reeIntensityKgPerKw)}` : ""}`,
        milestonesText(fn, t),
    ]);
    return mdTable(
        [
            "Technology",
            "Family",
            "Principle",
            "TRL",
            "Density",
            "Efficiency",
            "Magnets, REE",
            "Milestones",
        ],
        rows,
    );
}

function techDetails(fn: Footnotes): string {
    return ALT_FAMILIES.map((f) => {
        const items = techsIn(f).map((t) => {
            const players = t.players
                .map((p) => getCompany(p.companyId)?.name ?? p.companyId)
                .join(", ");
            const lines = [
                `#### ${mdText(t.name)} (\`${t.id}\`)`,
                "",
                `${mdText(t.principle)}${fn.ref(t.sources)}`,
                "",
            ];
            lines.push(
                `- Readiness: TRL ${fn.value(t.trl)}. ${mdText(t.trl.note ?? "")}`,
            );
            if (players) lines.push(`- Companies: ${mdText(players)}.`);
            for (const k of t.facts)
                lines.push(`- ${mdText(k.label)}: ${fn.value(k.value)}.`);
            lines.push(`- Under the hood: ${mdText(t.scene.spec.title)}.`);
            return lines.join("\n");
        });
        return `### ${FAMILY_LABEL[f]}\n\n${items.join("\n\n")}`;
    }).join("\n\n");
}

function marketTable(fn: Footnotes): string {
    const rows = [...MARKET_SLICES]
        .sort((a, b) => b.revenueUsd.value - a.revenueUsd.value)
        .map((s) => [
            mdText(s.label),
            s.techIds.map((id) => `\`${id}\``).join(", "),
            fn.value(s.revenueUsd),
            fn.value(s.cagr),
            END_MARKET_LABEL[s.endMarket],
        ]);
    return mdTable(
        [
            "Market",
            "Technologies",
            "Size",
            "Growth a year",
            "Largest end market (our class)",
        ],
        rows,
    );
}

function deploymentList(fn: Footnotes): string {
    return DEPLOYMENTS.map((d) => {
        const t = getAltTech(d.techId);
        const where = d.location
            ? ` ${mdText(d.location.place)}, ${countryName(d.location.country)}.`
            : "";
        return `- ${d.date}, ${mdText(t?.name ?? d.techId)}: ${mdText(d.org)}, ${mdText(d.product)} (${d.status}).${where}${fn.ref(d.sources)}`;
    }).join("\n");
}

export function altsBody(): string {
    const fn = footnotes();
    const techs = techTable(fn);
    const details = techDetails(fn);
    const market = marketTable(fn);
    const deployments = deploymentList(fn);
    return `# ${TITLE}

${ALT_TECHS.length} alternatives to the NdFeB permanent magnet electric actuator in four families: rare-earth-free motors, artificial muscles, hydraulic drives and transmissions. Today's baseline holds about ${fn.value(NDFEB_PER_HUMANOID)} of NdFeB magnet per humanoid robot; see [/metals](${absoluteUrl("/metals.md")}) for where it comes from. As of ${ALTS_AS_OF}. Interactive page: ${absoluteUrl(ALTS_PATH)} (deep link \`?tech=<id>\` and \`?group=family|company-type|end-market|country\`). JSON: ${absoluteUrl("/api/v1/alts")}.

## Technologies

Density is specific power (W/kg) for muscles and motors, or torque density (Nm/kg) where only that is published. TRL is our reading of the cited evidence (model). Milestone years are the earliest dated evidence we cite; the event may be earlier. "n/a" means no public source.

${techs}

${details}

## Markets

Each row is one publisher's estimate from the public summary of a paid report. Publishers disagree by several times because each defines its market differently; each note gives the spread we saw. Technologies with no published market have no row.

${market}

## Methodology

- Market size: top-down, one market report per row, quoted as that publisher's estimate. We found no company revenue split by technology, so there is no bottom-up check yet.
- Growth: the same report's forecast compound annual growth rate.
- Grouping on the page: by family or end market a market moves whole; by company type or country it is split evenly across the types or home countries of the companies we list for its technologies. That split is our model, not a measured share.
- Readiness: TRL 1 (principle observed) to 9 (proven in volume use), judged from the cited basis.

## Deployments

${deployments}

${fn.section()}`;
}

export const ALTS_PAGE: Page = {
    path: ALTS_PATH,
    kind: "spa",
    title: TITLE,
    description: DESCRIPTION,
    body: altsBody,
    jsonLd: () => [
        ld.webPage("WebPage", ALTS_PATH, TITLE),
        ld.breadcrumbs([
            { name: "Home", path: "/" },
            { name: TITLE, path: ALTS_PATH },
        ]),
        {
            "@type": "Dataset",
            "@id": `${SITE_URL}${ALTS_PATH}#technologies`,
            name: "Alternative actuator technologies",
            description: DESCRIPTION,
            url: absoluteUrl(ALTS_PATH),
            isAccessibleForFree: true,
            license: DATA_LICENSE.url,
            creditText: DATA_LICENSE.credit,
            dateModified: ALTS_UPDATED,
            variableMeasured: [
                "Technology readiness level",
                "Market size (USD)",
                "Market growth (CAGR)",
                "Efficiency",
                "Specific power (W/kg)",
                "Rare earth intensity (kg/kW)",
            ],
            distribution: [
                {
                    "@type": "DataDownload",
                    encodingFormat: "application/json",
                    contentUrl: absoluteUrl("/api/v1/alts"),
                },
                {
                    "@type": "DataDownload",
                    encodingFormat: "text/markdown",
                    contentUrl: absoluteUrl(`${ALTS_PATH}.md`),
                },
            ],
        },
    ],
};
