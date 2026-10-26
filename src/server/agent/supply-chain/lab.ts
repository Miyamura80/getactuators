import { countryFlag } from "@/country-flag";
import { COMPANIES, SEGMENTS, SEGMENT_LABEL } from "@/supply-chain/companies";
import { concentration } from "@/supply-chain/concentration";
import { percent } from "@/supply-chain/format";
import { LAB_MINING_HHI, LAB_STAGE_SHARES } from "@/supply-chain/lab-fixtures";
import { marketOf } from "@/supply-chain/market-share";
import { getCompany } from "@/supply-chain/registry";
import { mdTable, mdText } from "../md";
import { type Footnotes, footnotes } from "./footnotes";

const flagged = (code: string) => `${countryFlag(code)} ${code}`;

function segmentSection(fn: Footnotes, seg: (typeof SEGMENTS)[number]): string {
    const market = marketOf(seg);
    const companies = COMPANIES.filter((c) => c.segment === seg);
    const rows = companies.map((c) => {
        const s = market?.shares[c.id];
        return [mdText(c.name), flagged(c.hqCountry), s ? fn.value(s) : "-"];
    });
    if (market) {
        const named = Object.values(market.shares).reduce((t, s) => t + s.value, 0);
        rows.push(["Other", "", percent(Math.max(0, 1 - named))]);
    }
    const caption = market
        ? `Share of ${market.market.toLowerCase()}, ${market.asOf}.`
        : "";
    return `### ${SEGMENT_LABEL[seg]}\n\n${caption}\n\n${mdTable(["Company", "Country", "Share"], rows)}`;
}

// Markdown twin of /lab/supply-chain: the cited kit fixtures as text, with
// footnotes. Noindex and left out of the sitemap and llms.txt.
export function supplyChainLabBody(): string {
    const fn = footnotes();
    const stages = LAB_STAGE_SHARES.map((r) => {
        const c = concentration(r.shares.value);
        return [
            r.label,
            c
                ? `${flagged(c.top.country)} ${r.shares.confidence === "estimated" ? "~" : ""}${percent(c.top.share)}${fn.ref(r.shares.sources)}`
                : "n/a",
            c ? c.hhi.toLocaleString("en-US") : "n/a",
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
    return `# Supply-chain kit

Visual QA page for the shared supply-chain components. Not indexed.

## Country share by stage

${mdTable(["Stage", "Top country", "HHI", "As of"], stages)}

## Confidence styles

${values.map(([label, v]) => `- ${label}: ${v ? fn.value(v) : "n/a"}`).join("\n")}

Reported figures are plain; estimates carry "~" and models say so.

## Registry: market share by segment

A dash means no public share was found.

${SEGMENTS.map((seg) => segmentSection(fn, seg)).join("\n\n")}

${fn.section()}`;
}
