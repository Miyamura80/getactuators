import { ACTUATORS, CATEGORIES } from "@/catalog";
import {
    type Fit,
    METHOD_LABEL,
    MIN_CORRELATION_MONTHS,
    PRICES_PATH,
    PRICES_UPDATED,
    PRICE_HISTORY,
    PRICE_METHODS,
    boxStats,
    coverage,
    lagCorrelation,
    learningCurve,
    ndprByMonth,
    nmPoints,
    priceIndex,
    summarize,
} from "@/prices";
import { priceAt } from "@/supply-chain/metals/prices";
import { absoluteUrl } from "../../site";
import * as ld from "../jsonld";
import { mdTable, mdText, usd } from "../md";
import type { Page } from "../page-types";

// Markdown twin of /prices: coverage, the class trend summary, latest price
// and one-year change per actuator, and the index against NdPr oxide.

const TITLE = "Actuator prices";
const DESCRIPTION =
    "Price history of catalog actuators from weekly store snapshots: $/Nm by actuator class, where it is cheapest, and actuator prices against NdPr oxide.";

const pct = (v: number) => `${v >= 0 ? "+" : ""}${(v * 100).toFixed(1)}%`;
const perNmText = (v: number) => `$${v.toFixed(2)}/Nm`;
const labelOf = (slug: string) =>
    CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;

export const priceHistoryUrl = (id: string) =>
    absoluteUrl(`/api/v1/prices/${encodeURIComponent(id)}`);

function fitText(f: Fit): string {
    if (f.status === "insufficient") return `not fitted (${f.reason})`;
    return f.mode === "time"
        ? `${pct(f.rate)} per year, R² ${f.r2.toFixed(2)} (n=${f.n})`
        : `${pct(f.rate)} per doubling of models, R² ${f.r2.toFixed(2)} (n=${f.n})`;
}

function coverageSection(): string {
    const c = coverage();
    const methods = PRICE_METHODS.filter((m) => c.methods[m]).map(
        (m) => `- **${m}** (${c.methods[m]} points): ${METHOD_LABEL[m]}`,
    );
    const wayback = c.methods.wayback
        ? ""
        : "\n\nThe Wayback Machine back-fill has not been run yet, so history starts when the catalog first recorded each price.";
    return `## Coverage

${c.actuators} actuators, ${c.points} price points, ${c.first ?? "n/a"} to ${c.last ?? "n/a"}. Every point records its method, source URL, original currency and FX rate.

${methods.join("\n")}${wayback}`;
}

function classSection(): string {
    const pts = nmPoints(ACTUATORS);
    const rows = CATEGORIES.map((c) => {
        const mine = pts.filter((p) => p.category === c.slug);
        const latest = new Map(mine.map((p) => [p.actuatorId, p.usdPerNm]));
        const mid = boxStats([...latest.values()])?.median;
        return [
            c.label,
            String(latest.size),
            mid === undefined ? "n/a" : perNmText(mid),
            fitText(learningCurve(mine, "time")),
        ];
    });
    return `## Trend by class

Fit: ordinary least squares of ln($/Nm) on time, per class. $/Nm is the listed price over peak torque.

${mdTable(["Class", "Actuators priced", "Median $/Nm", "Trend"], rows)}`;
}

function actuatorSection(): string {
    const rows = ACTUATORS.flatMap((a) => {
        const s = summarize(a.id);
        if (!s.latest) return [];
        const nm = a.peak_torque_nm
            ? perNmText(s.latest.priceUsd / a.peak_torque_nm)
            : "n/a";
        return [
            [
                `[${mdText(a.name)}](${absoluteUrl(`/actuators/${encodeURIComponent(a.id)}`)})`,
                mdText(a.brand),
                labelOf(a.category),
                usd(s.latest.priceUsd),
                nm,
                s.latest.date,
                s.yearChange === null ? "n/a" : pct(s.yearChange),
                s.latest.method,
            ],
        ];
    });
    return `## Latest price per actuator

One-year change is n/a until an actuator has a year of history. Full history per actuator: ${absoluteUrl("/api/v1/prices/{actuatorId}")}.

${mdTable(["Actuator", "Brand", "Class", "Latest", "$/Nm", "As of", "1-year change", "Method"], rows)}`;
}

function metalsSection(): string {
    const index = priceIndex();
    const ndpr = ndprByMonth(index.map((p) => p.month));
    const rows = index.map((p, i) => {
        const at = priceAt("ndpr-oxide", p.month);
        const v = ndpr[i];
        const metal =
            v == null || !at
                ? "n/a"
                : `$${v.toLocaleString("en-US", { maximumFractionDigits: 2 })}/kg${at.carried || at.basis === "annual-average" ? ` (${at.carried ? "carried from" : "average of"} ${at.date})` : ""}`;
        return [p.month, p.index.toFixed(1), String(p.matched), metal];
    });
    const lags = lagCorrelation(index, ndpr);
    const corr = lags.some((c) => c.r !== null)
        ? lags
              .map(
                  (c) =>
                      `lag ${c.lag}: ${c.r === null ? `n/a (${c.n} months)` : `r = ${c.r.toFixed(2)} (${c.n} months)`}`,
              )
              .join("; ")
        : `not computed yet (needs ${MIN_CORRELATION_MONTHS} paired months of changes; has ${lags[0]?.n ?? 0})`;
    return `## Price vs metals

Chain-weighted (Jevons) actuator price index, 100 at the first month, against NdPr oxide (FOB China, US$/kg, from ${absoluteUrl("/metals")}).

${mdTable(["Month", "Index", "Actuators matched", "NdPr oxide"], rows)}

Lagged correlation of monthly log changes (NdPr leading): ${corr}. Correlation is not causation: magnets are one input among motors, gears, electronics and margins.`;
}

export function pricesBody(): string {
    return `# ${TITLE}

How the listed price of catalog actuators moves, as of ${PRICES_UPDATED}. Interactive version: ${absoluteUrl(PRICES_PATH)}. Points come from a weekly snapshot of each actuator's product page and are committed to the repository; nothing is scraped at page load.

${coverageSection()}

${classSection()}

${actuatorSection()}

${metalsSection()}`;
}

export const PRICES_PAGE: Page = {
    path: PRICES_PATH,
    kind: "spa",
    title: TITLE,
    description: DESCRIPTION,
    updatedAt: PRICE_HISTORY.updated,
    body: pricesBody,
    jsonLd: () => [
        ld.webPage("WebPage", PRICES_PATH, TITLE),
        ld.breadcrumbs([
            { name: "Home", path: "/" },
            { name: TITLE, path: PRICES_PATH },
        ]),
        {
            "@type": "Dataset",
            "@id": `${absoluteUrl(PRICES_PATH)}#history`,
            name: "Actuator price history",
            description:
                "Listed prices of catalog robot actuators over time, in USD with the original currency and FX rate, method and source URL per point.",
            url: absoluteUrl(PRICES_PATH),
            isAccessibleForFree: true,
            license: "https://opensource.org/licenses/MIT",
            ...(coverage().first
                ? { temporalCoverage: `${coverage().first}/${coverage().last}` }
                : {}),
            distribution: [
                {
                    "@type": "DataDownload",
                    encodingFormat: "text/markdown",
                    contentUrl: absoluteUrl(`${PRICES_PATH}.md`),
                },
            ],
        },
    ],
};
