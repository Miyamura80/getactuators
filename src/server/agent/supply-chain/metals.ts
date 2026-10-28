import { countryFlag, countryName } from "@/country-flag";
import { concentration } from "@/supply-chain/concentration";
import { percent, percentDigits } from "@/supply-chain/format";
import {
    BASIS_LABEL,
    MAGNET_GRADES,
    MARKET_LABEL,
    METALS,
    METALS_AS_OF,
    METALS_PATH,
    METAL_CLASS_LABEL,
    METAL_EVENTS,
    METAL_STAGES,
    NDPR_PRICE_FLOOR,
    PRICE_CHAIN,
    PRICE_DRIVERS,
    PRICE_SERIES,
    RESERVES,
    type ReserveTable,
    STAGE_LABEL_FOR,
    gradeComposition,
    humanoidElementMass,
    priceSpreads,
    sortedPoints,
    stageEntry,
    yearsOfSupply,
} from "@/supply-chain/metals";
import type { Sourced } from "@/supply-chain/sourced";
import { STAGE_LABEL } from "@/supply-chain/stages";
import { DATA_LICENSE, SITE_URL, absoluteUrl } from "../../site";
import * as ld from "../jsonld";
import { mdTable, mdText } from "../md";
import type { Page } from "../page-types";
import { type Footnotes, footnotes } from "./footnotes";

// Markdown twin of /metals: each section as tables with footnotes, numbered
// the way the React page numbers them.

const TITLE = "Magnet metals";
const DESCRIPTION =
    "Where the neodymium, dysprosium, terbium, samarium and cobalt in actuator magnets come from, how much is left and how their prices are set, every number cited.";

const country = (code: string) =>
    code === "other" ? "Other" : `${countryFlag(code)} ${countryName(code)}`;

function price(fn: Footnotes, s: Sourced<number>): string {
    const n = s.value.toLocaleString("en-US", { maximumFractionDigits: 2 });
    return `${s.confidence === "estimated" ? "~" : ""}$${n}/kg${fn.ref(s.sources)}`;
}

// Shares with one decimal: "4.2%", or "8.5-11%" for a range.
function share(fn: Footnotes, s: Sourced<number>): string {
    const body = s.range
        ? `${percentDigits(s.range[0])}-${percentDigits(s.range[1])}`
        : percentDigits(s.value);
    const tag = s.confidence === "modeled" ? " (model)" : "";
    return `${s.confidence === "estimated" ? "~" : ""}${body}${fn.ref(s.sources)}${tag}`;
}

function whatGoesIn(fn: Footnotes): string {
    const elements = mdTable(
        ["Element", "Class", "Magnet", "Role"],
        METALS.map((m) => [
            `${m.symbol} ${m.name}`,
            METAL_CLASS_LABEL[m.class],
            m.magnet,
            `${mdText(m.role)}${fn.ref(m.sources)}`,
        ]),
    );
    const grades = mdTable(
        ["Grade suffix", "Typical use", "Dy by weight", "Nd+Pr by weight"],
        MAGNET_GRADES.map((g) => [
            g.suffix,
            g.use,
            share(fn, g.dy),
            share(fn, gradeComposition(g.id).ndpr),
        ]),
    );
    const m = humanoidElementMass("sh");
    return `## What goes in

${elements}

Sintered NdFeB by temperature grade. Dysprosium replaces part of the neodymium, so total rare earth stays near 32% while Dy rises with the grade; boron is about ${fn.value(gradeComposition("n").boron)} and iron the rest.

${grades}

One humanoid with SH-grade magnets holds about ${fn.value(m.nd)} of Nd, ${fn.value(m.pr)} of Pr and ${fn.value(m.dy)} of Dy. Per-joint estimates for 21 humanoids: ${absoluteUrl("/humanoids")}.`;
}

function whereFrom(fn: Footnotes): string {
    const rows = METALS.flatMap((m) =>
        METAL_STAGES.map((stage) => {
            const label = STAGE_LABEL_FOR[m.id][stage] ?? STAGE_LABEL[stage];
            const e = stageEntry(m.id, stage);
            if (e.kind === "gap")
                return [
                    m.symbol,
                    label,
                    "n/a",
                    `${mdText(e.text)}${fn.ref(e.sources)}`,
                ];
            const c = concentration(e.shares.value);
            const est = e.shares.confidence === "estimated" ? "~" : "";
            return [
                m.symbol,
                label,
                c
                    ? `${country(c.top.country)} ${est}${percent(c.top.share)}${fn.ref(e.shares.sources)}`
                    : "n/a",
                c ? `HHI ${c.hhi.toLocaleString("en-US")}, ${e.shares.asOf}` : "",
            ];
        }),
    );
    return `## Where it comes from

Control concentrates down the chain: China mines about two thirds of rare earths but makes over 90% of the metal and magnets.

${mdTable(["Element", "Stage", "Top country", "Concentration"], rows)}`;
}

function reserveSection(fn: Footnotes, t: ReserveTable): string {
    const rows = t.rows.map((r) => {
        const y = yearsOfSupply(r);
        return [
            country(r.country),
            fn.value(r.production2025),
            r.reserves ? fn.value(r.reserves) : "NA",
            y ? fn.value(y) : "",
        ];
    });
    rows.push([
        "World",
        fn.value(t.world.production2025),
        fn.value(t.world.reserves),
        "",
    ]);
    return `### ${t.label} (${t.basis})

${mdTable(["Country", "Mine production 2025", "Reserves", "Years at current rate"], rows)}`;
}

function howMuchLeft(fn: Footnotes): string {
    return `## How much is left

Reserves are what known deposits can supply profitably today, not all that exists (resources). Years of supply is reserves divided by 2025 mine output.

${RESERVES.map((t) => reserveSection(fn, t)).join("\n\n")}`;
}

function prices(fn: Footnotes): string {
    const latest = mdTable(
        ["Series", "Market", "Latest", "Date", "Basis"],
        PRICE_SERIES.flatMap((s) => {
            const p = sortedPoints(s).at(-1);
            return p
                ? [
                      [
                          s.label,
                          MARKET_LABEL[s.market],
                          price(fn, p.value),
                          p.date,
                          BASIS_LABEL[p.basis],
                      ],
                  ]
                : [];
        }),
    );
    const spreads = priceSpreads()
        .map(
            (s) =>
                `- ${s.label}, ${s.date}: China ${price(fn, s.domestic)}, export ${price(fn, s.export)}, ${fn.value(s.premium)} more outside China.`,
        )
        .join("\n");
    const events = mdTable(
        ["Date", "Event", "What happened"],
        METAL_EVENTS.map((e) => [
            e.date,
            e.title,
            `${mdText(e.detail)}${fn.ref(e.sources)}`,
        ]),
    );
    return `## Prices

US$ per kg. Long-run points are USGS annual averages and year-end ranges; 2026 points are monthly Shanghai Metals Market readings. Full series: ${absoluteUrl("/api/v1/metal-prices/dy-oxide")} (swap the series id).

${latest}

China domestic against export (FOB China) on the same day:

${spreads}

The US Department of Defense floor under MP Materials' NdPr: ${price(fn, NDPR_PRICE_FLOOR)}.

### Events

${events}`;
}

function market(fn: Footnotes): string {
    const chain = PRICE_CHAIN.map(
        (s, i) => `${i + 1}. **${s.label}**: ${mdText(s.detail)}${fn.ref(s.sources)}`,
    ).join("\n");
    const arrow = {
        up: "pushes prices up",
        down: "pushes prices down",
        floor: "sets a floor",
    };
    const drivers = PRICE_DRIVERS.map(
        (d) =>
            `- **${d.title}** (${arrow[d.direction]}): ${mdText(d.example)}${fn.ref(d.sources)}`,
    ).join("\n");
    return `## How the price is set

${chain}

### What moves it

${drivers}`;
}

export function metalsBody(): string {
    const fn = footnotes();
    return `# ${TITLE}

The metals in an actuator's permanent magnet (neodymium, praseodymium, dysprosium and terbium for NdFeB; samarium and cobalt for SmCo): who controls each step, how much is left and how prices are set. As of ${METALS_AS_OF}. Interactive version: ${absoluteUrl(METALS_PATH)}. JSON: ${absoluteUrl("/api/v1/metals")}.

Estimates carry "~"; modeled values say so.

${whatGoesIn(fn)}

${whereFrom(fn)}

${howMuchLeft(fn)}

${prices(fn)}

${market(fn)}

${fn.section()}`;
}

function dataset(
    id: string,
    name: string,
    description: string,
    temporalCoverage: string,
    api: string,
): Record<string, unknown> {
    return {
        "@type": "Dataset",
        "@id": `${SITE_URL}${METALS_PATH}#${id}`,
        name,
        description,
        url: absoluteUrl(METALS_PATH),
        isAccessibleForFree: true,
        license: DATA_LICENSE.url,
        creditText: DATA_LICENSE.credit,
        temporalCoverage,
        distribution: [
            {
                "@type": "DataDownload",
                encodingFormat: "application/json",
                contentUrl: absoluteUrl(api),
            },
            {
                "@type": "DataDownload",
                encodingFormat: "text/markdown",
                contentUrl: absoluteUrl(`${METALS_PATH}.md`),
            },
        ],
    };
}

export const METALS_PAGE: Page = {
    path: METALS_PATH,
    kind: "spa",
    title: TITLE,
    description: DESCRIPTION,
    body: metalsBody,
    jsonLd: () => [
        ld.webPage("WebPage", METALS_PATH, TITLE),
        ld.breadcrumbs([
            { name: "Home", path: "/" },
            { name: TITLE, path: METALS_PATH },
        ]),
        dataset(
            "stage-shares",
            "Magnet metal supply by country and stage",
            "Country shares of mining, separation, metal and alloy, and magnet making for Nd, Pr, Dy, Tb, Sm and Co, with sources.",
            "2023/2025",
            "/api/v1/metals",
        ),
        dataset(
            "reserves",
            "Rare earth and cobalt reserves and mine production by country",
            "USGS mine production 2024 and 2025, reserves and years of supply at the current rate.",
            "2024/2025",
            "/api/v1/metals/nd",
        ),
        dataset(
            "prices",
            "Magnet metal prices",
            "Cited US$/kg prices of NdPr, Nd, Pr, Dy, Tb and Sm oxide and metal and cobalt, China domestic and FOB China, with events.",
            "2011/2026",
            "/api/v1/metal-prices/ndpr-oxide",
        ),
    ],
};
