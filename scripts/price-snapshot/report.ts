import type { PriceObservation, PriceReviewItem } from "../../src/prices/types";
import type { Outcome } from "./read";

// The bot PR body: what changed, what failed and why, what is out of stock
// and which points need a person. Nothing is skipped silently.

const usd = (n: number) =>
    `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type Priced = Extract<Outcome, { kind: "price" }>;
type Failed = Extract<Outcome, { kind: "failure" }>;

function changesTable(
    changed: Priced[],
    previous: ReadonlyMap<string, PriceObservation>,
): string[] {
    if (!changed.length) return [];
    const rows = changed.map(({ point }) => {
        const before = previous.get(point.actuatorId)?.priceUsd ?? 0;
        const now = point.priceUsd ?? 0;
        const pct = ((now - before) / before) * 100;
        return `| ${point.actuatorId} | ${usd(before)} | ${usd(now)} | ${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% | ${point.method} |`;
    });
    return [
        "### Price changes",
        "",
        "| Actuator | Before | Now | Change | Method |",
        "|---|---|---|---|---|",
        ...rows,
        "",
    ];
}

function failuresTable(failures: Failed[]): string[] {
    if (!failures.length) return [];
    const rows = failures.map((f) => `| ${f.actuatorId} | ${f.reason} | ${f.url} |`);
    return [
        "### Failures",
        "",
        "| Actuator | Reason | URL |",
        "|---|---|---|",
        ...rows,
        "",
    ];
}

function outOfStock(out: Priced[]): string[] {
    if (!out.length) return [];
    return [
        "### Out of stock (flag only, no price recorded)",
        "",
        ...out.map((o) => `- ${o.point.actuatorId}: ${o.point.url}`),
        "",
    ];
}

function needsALook(doubtful: Priced[], review: PriceReviewItem[]): string[] {
    if (!doubtful.length && !review.length) return [];
    return [
        "### Needs a look",
        "",
        ...doubtful.map(
            (o) =>
                `- ${o.point.actuatorId} (${o.point.method}): ${o.doubts.join("; ")}`,
        ),
        ...review.map((r) => `- ${r.actuatorId} ${r.date}: ${r.reason} (${r.url})`),
        "",
    ];
}

export function reportMarkdown(
    title: string,
    outcomes: Outcome[],
    previous: ReadonlyMap<string, PriceObservation>,
    review: PriceReviewItem[],
): string {
    const prices = outcomes.filter((o): o is Priced => o.kind === "price");
    const failures = outcomes.filter((o): o is Failed => o.kind === "failure");
    const out = prices.filter((o) => o.point.inStock === false);
    const changed = prices.filter((o) => {
        const before = previous.get(o.point.actuatorId)?.priceUsd;
        const now = o.point.priceUsd;
        return now !== null && before != null && Math.abs(now - before) >= 0.01;
    });
    return [
        `## ${title}`,
        "",
        `${outcomes.length} reads: ${prices.length - out.length} priced, ${out.length} out of stock, ${failures.length} failed.`,
        "",
        ...changesTable(changed, previous),
        ...failuresTable(failures),
        ...outOfStock(out),
        ...needsALook(
            prices.filter((o) => o.doubts.length > 0),
            review,
        ),
    ].join("\n");
}

// Latest priced point per actuator, for the before/after table.
export function latestPriced(
    points: PriceObservation[],
): Map<string, PriceObservation> {
    const out = new Map<string, PriceObservation>();
    for (const p of points) {
        if (p.priceUsd === null) continue;
        const cur = out.get(p.actuatorId);
        if (!cur || cur.date <= p.date) out.set(p.actuatorId, p);
    }
    return out;
}
