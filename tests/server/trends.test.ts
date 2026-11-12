import { describe, expect, test } from "bun:test";
import { TrendListSchema } from "@/api/trends";
import { TREND_CHARTS, chartsIn } from "@/trends";
import { get, getMarkdown } from "./agent-helpers";
import { callTool } from "./mcp-helpers";

function jsonLd(html: string): { "@graph": Record<string, unknown>[] } {
    const m = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html);
    return JSON.parse(m?.[1] ?? "{}");
}

describe("/trends", () => {
    test("serves the SPA shell with a Dataset node under CC BY", async () => {
        const res = await get("/trends");
        expect(res.status).toBe(200);
        const html = await res.text();
        expect(html).toContain("<title>Trends | actuatorlist</title>");
        const ds = jsonLd(html)["@graph"].find((n) => n["@type"] === "Dataset") as {
            license: string;
            variableMeasured: string[];
            temporalCoverage: string;
        };
        expect(ds.license).toContain("creativecommons.org/licenses/by/4.0");
        expect(ds.variableMeasured).toHaveLength(TREND_CHARTS.length);
        expect(ds.temporalCoverage).toMatch(/^\d{4}\/\d{4}$/);
    });

    test("the .md twin has every chart's table, notes, licence and sources", async () => {
        for (const res of [await get("/trends.md"), await getMarkdown("/trends")]) {
            expect(res.headers.get("content-type")).toBe(
                "text/markdown; charset=utf-8",
            );
            const md = await res.text();
            expect(md).toContain('title: "Trends"');
            for (const c of TREND_CHARTS) expect(md).toContain(`### ${c.title}`);
            expect(md).toContain(
                "| Series | Date | Value (USD) | $/N·m | Confidence | Sources | Note |",
            );
            expect(md).toContain("(/actuators/dynamixel-xm430-w350-t)");
            expect(md).toContain(
                "https://epoch.ai/publications/the-plunging-price-of-thought",
            );
            expect(md).toContain("Too thin to read as a trend");
            expect(md).toContain("issue #95");
            expect(md).toContain("CubeMars AK80-9: Earlier points");
            expect(md).not.toContain(String.fromCharCode(0x2014));
        }
    });

    test("is in llms.txt, the sitemap and the footer", async () => {
        expect(await (await get("/llms.txt")).text()).toContain("/trends.md");
        expect(await (await get("/sitemap.xml")).text()).toContain("/trends</loc>");
        expect(await (await get("/")).text()).toContain('<a href="/trends">Trends</a>');
    });
});

describe("REST /api/v1/trends", () => {
    test("lists every chart with cited points and filters by section", async () => {
        const all = TrendListSchema.parse(await (await get("/api/v1/trends")).json());
        expect(all.count).toBe(TREND_CHARTS.length);
        const prices = all.results.find((c) => c.id === "actuator-prices");
        const point = prices?.series[0]?.points[0];
        expect(point?.usd_per_nm).toBeGreaterThan(0);
        expect(point?.sources[0]?.url).toContain("web.archive.org");
        expect(prices?.url).toMatch(/^https:\/\/.+\/trends#actuator-prices$/);
        const own = prices?.series[0]?.points.at(-1)?.sources[0]?.url;
        expect(own).toMatch(/^https:\/\/.+\/actuators\/dynamixel-xm430-w350-t$/);
        const csf = all.results
            .find((c) => c.id === "rated-life")
            ?.series.find((s) => s.id === "hd-csf");
        expect(csf?.estimated).toBe(true);
        const ai = TrendListSchema.parse(
            await (await get("/api/v1/trends?section=ai")).json(),
        );
        expect(ai.results.map((c) => c.id)).toEqual(chartsIn("ai").map((c) => c.id));
    });

    test("rejects an unknown section and has a markdown twin", async () => {
        expect((await get("/api/v1/trends?section=nope")).status).toBe(400);
        const md = await (await get("/api/v1/trends.md?chart=battery-runtime")).text();
        expect(md).toContain("## Humanoid battery runtime");
        expect(md).not.toContain("## Actuator list prices");
        expect(md).toContain("1 chart, as of");
    });
});

describe("MCP get_trends", () => {
    test("returns one chart by id", async () => {
        const out = TrendListSchema.parse(
            (await callTool("get_trends", { chart: "price-of-ai" })).structuredContent,
        );
        expect(out.results).toHaveLength(1);
        expect(out.results[0]?.series.map((s) => s.id)).toContain("llm");
    });
});
