import type { PriceRecord } from "../../src/prices/types";

// The bot PR body: what was added, what failed and why, and what needs a
// person before it goes in. Nothing is skipped silently.

export interface RunReport {
    title: string;
    date: string;
    added: PriceRecord[];
    review: { record: PriceRecord; reason: string }[];
    failures: { actuatorId: string; url: string; reason: string }[];
    skipped: { actuatorId: string; reason: string }[];
}

const money = (r: PriceRecord) =>
    r.currency === "USD"
        ? `$${r.priceUsd.toFixed(2)}`
        : `$${r.priceUsd.toFixed(2)} (${r.originalPrice} ${r.currency} at ${r.fxRate})`;

function table(head: string[], rows: string[][]): string {
    const esc = (c: string) => c.replace(/\|/g, "\\|").replace(/\n/g, " ");
    return [
        `| ${head.join(" | ")} |`,
        `| ${head.map(() => "---").join(" | ")} |`,
        ...rows.map((r) => `| ${r.map(esc).join(" | ")} |`),
    ].join("\n");
}

const count = (n: number, one: string, many = `${one}s`) =>
    `${n} ${n === 1 ? one : many}`;

export function renderReport(r: RunReport): string {
    const oos = r.added.filter((p) => p.outOfStock).length;
    const parts = [
        `## ${r.title} (${r.date})`,
        `${count(r.added.length, "point")} added (${oos} flagged out of stock), ${r.review.length} held for review, ${count(r.failures.length, "failure")}, ${r.skipped.length} skipped.`,
    ];
    if (r.added.length)
        parts.push(
            `### Added\n\n${table(
                ["Actuator", "Date", "Price", "Method", "Stock", "Page"],
                r.added.map((p) => [
                    p.actuatorId,
                    p.date,
                    money(p),
                    p.method,
                    p.outOfStock ? "out of stock" : "",
                    p.url,
                ]),
            )}`,
        );
    if (r.review.length)
        parts.push(
            `### Needs review (not added)\n\nCheck each against the page; add the good ones to \`data/prices/history.json\` by hand with \`method\` kept.\n\n${table(
                ["Actuator", "Date", "Price", "Reason", "Page"],
                r.review.map(({ record, reason }) => [
                    record.actuatorId,
                    record.date,
                    money(record),
                    reason,
                    record.url,
                ]),
            )}\n\n<details><summary>Records as JSON</summary>\n\n\`\`\`json\n${JSON.stringify(
                r.review.map((x) => x.record),
                null,
                4,
            )}\n\`\`\`\n\n</details>`,
        );
    if (r.failures.length)
        parts.push(
            `### Failures\n\n${table(
                ["Actuator", "Reason", "Page"],
                r.failures.map((f) => [f.actuatorId, f.reason, f.url]),
            )}`,
        );
    if (r.skipped.length)
        parts.push(
            `### Skipped\n\n${table(
                ["Actuator", "Reason"],
                r.skipped.map((s) => [s.actuatorId, s.reason]),
            )}`,
        );
    return `${parts.join("\n\n")}\n`;
}
