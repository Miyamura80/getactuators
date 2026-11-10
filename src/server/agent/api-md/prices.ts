import type { ApiContext } from "@/api/http";
import { priceHistory } from "@/api/prices";
import { formatValue } from "@/trends";
import { mdLink, mdTable, mdText } from "../md";

// Markdown twin of /api/v1/prices/{id}: one actuator's dated prices.

export function getPriceHistoryMd(ctx: ApiContext): string {
    const h = priceHistory(ctx);
    const sources = [
        ...new Map(h.points.flatMap((p) => p.sources).map((s) => [s.id, s])).values(),
    ];
    const ref = (id: string) => `[${sources.findIndex((s) => s.id === id) + 1}]`;
    const rows = h.points.map((p) => [
        p.date,
        `$${formatValue(p.price_usd)}`,
        p.currency === "USD"
            ? "USD"
            : `${formatValue(p.original_price)} ${p.currency} at ${p.fx_rate}`,
        p.usd_per_nm === null ? "n/a" : formatValue(p.usd_per_nm),
        p.method,
        p.out_of_stock ? "out of stock" : "",
        mdLink("page", p.url),
        p.sources.map((s) => ref(s.id)).join(" "),
        mdText(p.note ?? ""),
    ]);
    const change = h.change_1y
        ? `1-year change: ${(h.change_1y.change * 100).toFixed(1)}% since ${h.change_1y.from_date} ($${formatValue(h.change_1y.from_price_usd)}).`
        : "1-year change: n/a (no price a year before the latest).";
    return [
        `# Price history: ${mdText(h.name)}`,
        `${h.count} ${h.count === 1 ? "point" : "points"} for ${mdText(h.brand)} ${mdText(h.name)} (\`${h.actuator_id}\`), as of ${h.as_of}. Chart: ${mdLink("/prices", h.url)}.`,
        h.note ? `Note: ${mdText(h.note)}` : "",
        h.latest
            ? `Latest: $${formatValue(h.latest.price_usd)} on ${h.latest.date}. ${change}`
            : "No price on file.",
        rows.length
            ? mdTable(
                  [
                      "Date",
                      "US$",
                      "Listed",
                      "$/N·m",
                      "Method",
                      "Stock",
                      "Page",
                      "Sources",
                      "Note",
                  ],
                  rows,
              )
            : "",
        sources.length
            ? `Sources:\n\n${sources.map((s, i) => `${i + 1}. ${mdLink(s.title, s.url)} (${s.reuse})`).join("\n")}`
            : "",
    ]
        .filter(Boolean)
        .join("\n\n");
}
