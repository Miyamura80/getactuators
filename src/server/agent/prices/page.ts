import { getActuator } from "@/catalog";
import {
    CAUSATION_NOTE,
    FIT_METHOD,
    INDEX_METHOD,
    METHOD_LABEL,
    PRICES_AS_OF,
    PRICES_PATH,
    PRICE_POINTS,
    actuatorsWithHistory,
    classTrends,
    groupStats,
    historyFor,
    latestPoint,
    metalsOverlay,
    priceHistoryApiPath,
    priceYears,
    seriesNote,
    yearChange,
} from "@/prices";
import { formatValue, isOwnSource, sourceOf } from "@/trends";
import { DATA_LICENSE, absoluteUrl } from "../../site";
import * as ld from "../jsonld";
import { toAbsolute } from "../jsonld";
import { bullets, mdLink, mdTable, mdText, usd } from "../md";
import type { Page } from "../page-types";

// Markdown twin and JSON-LD of /prices: class trends with their fit, latest
// price and 1-year change per actuator, and the index against NdPr oxide.

const TITLE = "Actuator prices";

const pct = (v: number) => `${v >= 0 ? "+" : ""}${(v * 100).toFixed(1)}%`;

function classSection(): string {
    const rows = classTrends().map((t) => [
        t.label,
        String(t.points.length),
        t.fit ? `${t.fit.n} (${t.fit.actuators})` : "0",
        t.fit ? `${pct(t.fit.annualChange)}/yr` : "not enough data",
        t.fit ? t.fit.r2.toFixed(2) : "n/a",
    ]);
    return [
        "## $/N·m over time by class",
        mdTable(
            ["Class", "Points", "Fitted points (actuators)", "Fitted change", "R²"],
            rows,
        ),
        `Fit: ${FIT_METHOD}`,
    ].join("\n\n");
}

// $/N·m spread by country and by brand in the latest year with prices.
function groupSection(): string {
    const year = priceYears().at(-1);
    if (year === undefined) return "";
    const table = (by: "country" | "brand", head: string) =>
        mdTable(
            [head, "Actuators", "Min", "Median", "Max"],
            groupStats(by, year).map((g) => [
                mdText(g.group),
                String(g.n),
                formatValue(g.min),
                formatValue(g.median),
                formatValue(g.max),
            ]),
        );
    return [
        `## $/N·m by country and brand (${year})`,
        "Each actuator counts once: its last priced point that year. Cheapest median first.",
        table("country", "Country"),
        table("brand", "Brand"),
    ].join("\n\n");
}

function actuatorSection(): string {
    const rows = actuatorsWithHistory().map((id) => {
        const a = getActuator(id);
        const pts = historyFor(id);
        const last = latestPoint(id);
        const yc = yearChange(id);
        const methods = [...new Set(pts.map((p) => p.method))].join(", ");
        return [
            mdLink(a?.name ?? id, `/actuators/${id}`),
            String(pts.length),
            pts[0]?.date ?? "",
            last ? `${usd(last.priceUsd)} (${last.date})` : "n/a",
            last?.usdPerNm != null ? formatValue(last.usdPerNm) : "n/a",
            yc ? `${pct(yc.change)} since ${yc.from.date}` : "n/a",
            methods,
            mdLink("JSON", absoluteUrl(priceHistoryApiPath(id))),
        ];
    });
    return [
        "## Latest price per actuator",
        "1-year change compares the latest price with the last price on or before the same day a year earlier.",
        mdTable(
            [
                "Actuator",
                "Points",
                "First",
                "Latest",
                "$/N·m",
                "1-year change",
                "Methods",
                "History",
            ],
            rows,
        ),
        bullets(
            actuatorsWithHistory().flatMap((id) => {
                const note = seriesNote(id);
                return note ? [`${getActuator(id)?.name ?? id}: ${note}`] : [];
            }),
        ),
    ].join("\n\n");
}

function metalsSection(): string {
    const { index, metal, lags } = metalsOverlay();
    const m = new Map(metal.map((x) => [x.year, x]));
    const rows = index.map((i) => {
        const x = m.get(i.year);
        return [
            String(i.year),
            i.value === null ? "n/a" : i.value.toFixed(1),
            String(i.actuators),
            x
                ? `${formatValue(x.usdPerKg)}${x.carried ? ` (carried from ${x.date})` : ""}`
                : "n/a",
        ];
    });
    return [
        "## Price index vs NdPr oxide",
        mdTable(["Year", "Actuator index", "Actuators", "NdPr oxide (US$/kg)"], rows),
        `Index: ${INDEX_METHOD} NdPr oxide is the FOB China series on ${mdLink("/metals", absoluteUrl("/metals"))}: for each year, the reading for June, or the latest earlier reading when June has none.`,
        bullets(
            lags.map(
                (l) =>
                    `NdPr leading by ${l.lag} ${l.lag === 1 ? "year" : "years"}: r = ${l.r === null ? "n/a" : l.r.toFixed(2)} over ${l.n} yearly changes`,
            ),
        ),
        CAUSATION_NOTE,
    ].join("\n\n");
}

function sourcesSection(): string {
    const ids = [
        ...new Set(
            PRICE_POINTS.flatMap((p) => p.sources).filter(
                (id) => !isOwnSource(id) && !id.startsWith("url:"),
            ),
        ),
    ];
    return `## Sources\n\nCurated points (from /trends):\n\n${ids
        .map(
            (id, i) =>
                `${i + 1}. ${mdLink(sourceOf(id).title, toAbsolute(sourceOf(id).url))} (${sourceOf(id).reuse})`,
        )
        .join(
            "\n",
        )}\n\nSnapshot points cite the product page they were read from; current prices are the catalog's (CC BY 4.0).`;
}

function pricesBody(): string {
    const n = actuatorsWithHistory().length;
    const multi = actuatorsWithHistory().filter(
        (id) => historyFor(id).length > 1,
    ).length;
    return `Dated list prices for ${n} catalog actuators, ${PRICE_POINTS.length} points, as of ${PRICES_AS_OF}. ${multi} actuators have more than one dated price so far; the rest have only the current catalog price. A weekly workflow reads each product page (JSON-LD, Shopify or WooCommerce product data, then the page's price element), converts to US dollars with that day's ECB rate and opens a pull request; a Wayback Machine back-fill adds at most one past snapshot per month. Every point records its method, page URL and FX rate.

Methods: ${Object.entries(METHOD_LABEL)
        .map(([k, v]) => `${k} (${v.toLowerCase()})`)
        .join(
            ", ",
        )}. Out-of-stock listings are kept with a flag and left out of fits and the index.

Per actuator as JSON: ${mdLink("/api/v1/prices/{actuatorId}", absoluteUrl("/api/v1/prices/dynamixel-xm430-w350-t"))}, or MCP get_price_history. The curated sample also appears on ${mdLink("/trends", absoluteUrl("/trends"))}.

${classSection()}

${groupSection()}

${actuatorSection()}

${metalsSection()}

${sourcesSection()}`;
}

function pricesDataset(): Record<string, unknown> {
    const years = PRICE_POINTS.map((p) => Number(p.date.slice(0, 4)));
    return {
        "@type": "Dataset",
        name: "actuatorlist price history: dated actuator list prices and $/N·m",
        description:
            "Dated list prices per catalog actuator with method, page URL and FX rate, $/N·m by class with a fitted trend, and a price index against NdPr oxide.",
        url: absoluteUrl(PRICES_PATH),
        license: DATA_LICENSE.url,
        creditText: DATA_LICENSE.credit,
        isAccessibleForFree: true,
        temporalCoverage: `${Math.min(...years)}/${Math.max(...years)}`,
        variableMeasured: ["List price (USD)", "Price per peak torque (USD/N·m)"],
        distribution: [
            {
                "@type": "DataDownload",
                encodingFormat: "application/json",
                contentUrl: absoluteUrl("/api/v1/prices/dynamixel-xm430-w350-t"),
            },
        ],
    };
}

export const PRICES_PAGE: Page = {
    path: PRICES_PATH,
    kind: "spa",
    title: TITLE,
    description:
        "Actuator price history: $/N·m over time by class with a fitted trend, $/N·m by country and brand, per-actuator price charts and a price index against NdPr oxide.",
    body: pricesBody,
    jsonLd: () => [
        ld.webPage("CollectionPage", PRICES_PATH, TITLE),
        ld.breadcrumbs([
            { name: "Home", path: "/" },
            { name: TITLE, path: PRICES_PATH },
        ]),
        pricesDataset(),
    ],
};
