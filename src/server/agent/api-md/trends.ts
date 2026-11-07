import type { ApiContext } from "@/api/http";
import { trendList } from "@/api/trends";
import { getTrendChart } from "@/trends";
import { chartMarkdown } from "../trends/page";
import { filterSummary } from "./shared";

// Markdown twin of /api/v1/trends: the same chart tables as the /trends twin.

export function listTrends(ctx: ApiContext): string {
    const list = trendList(ctx);
    const charts = list.results.flatMap((r) => {
        const c = getTrendChart(r.id);
        return c ? [chartMarkdown(c, 2)] : [];
    });
    return [
        `# Trends${filterSummary(ctx.url)}`,
        `${list.count} charts, as of ${list.as_of}. Each point has a date, a confidence and numbered sources.`,
        ...charts,
    ].join("\n\n");
}
