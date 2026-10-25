import { COMPANIES, SEGMENTS, SEGMENT_LABEL } from "@/supply-chain/companies";
import { LEVEL_LABEL, concentration } from "@/supply-chain/concentration";
import { countryName } from "@/supply-chain/countries";
import { percent } from "@/supply-chain/format";
import { LAB_MINING_HHI, LAB_STAGE_SHARES } from "@/supply-chain/lab-fixtures";
import { getCompany, sitesOf } from "@/supply-chain/registry";
import { mdTable, mdText } from "../md";
import { footnotes } from "./footnotes";

// Markdown twin of /lab/supply-chain: the cited kit fixtures as text, with
// footnotes. Noindex and left out of the sitemap and llms.txt.
export function supplyChainLabBody(): string {
    const fn = footnotes();
    const stages = LAB_STAGE_SHARES.map((r) => {
        const c = concentration(r.shares.value);
        return [
            r.label,
            c
                ? `${c.top.country} ${percent(c.top.share)}${fn.ref(r.shares.sources)}`
                : "n/a",
            c ? c.hhi.toLocaleString("en-US") : "n/a",
            c ? LEVEL_LABEL[c.level] : "n/a",
            r.shares.asOf,
        ];
    });
    const values = [
        ["MP Materials revenue", getCompany("mp-materials")?.revenue],
        [
            "China Northern Rare Earth revenue",
            getCompany("china-northern-rare-earth")?.revenue,
        ],
        ["Rare earth mining HHI", LAB_MINING_HHI],
    ] as const;
    const companies = SEGMENTS.map((seg) => {
        const list = COMPANIES.filter((c) => c.segment === seg).map((c) => {
            const n = sitesOf(c.id).length;
            return `${mdText(c.name)} (${c.hqCountry}, ${n} site${n === 1 ? "" : "s"})`;
        });
        return `- **${SEGMENT_LABEL[seg]}:** ${list.join(", ")}`;
    });
    return `# Supply-chain kit

Visual QA page for the shared supply-chain components. Not indexed.

## Concentration by stage

${mdTable(["Stage", "Top country", "HHI", "Level", "As of"], stages)}

Monopolized: top country at 70% or more. Concentrated: HHI 2,500 or more. Moderate: 1,500 to 2,499. Distributed: under 1,500.

## Confidence styles

${values.map(([label, v]) => `- ${label}: ${v ? fn.value(v) : "n/a"}`).join("\n")}

Reported figures are plain; estimates carry "~" and models say so.

## Registry seed

${companies.join("\n")}

Countries: ${["JP", "CN", "KR", "US"].map(countryName).join(", ")}.

${fn.section()}`;
}
