import { describe, expect, test } from "bun:test";
import { MetalListSchema, MetalPricesSchema, MetalSupplySchema } from "@/api/metals";
import { get, getMarkdown } from "./agent-helpers";
import { callTool } from "./mcp-helpers";

describe("/metals page and twin", () => {
    test("serves the SPA with WebPage and three Dataset nodes", async () => {
        const res = await get("/metals");
        expect(res.status).toBe(200);
        const html = await res.text();
        expect(html).toContain("<title>Magnet metals");
        const graphs = [
            ...html.matchAll(
                /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
            ),
        ]
            .map((m) => JSON.stringify(JSON.parse(m[1] ?? "{}")))
            .join("\n");
        expect(graphs).toContain('"@type":"Dataset"');
        expect(graphs).toContain('"temporalCoverage":"2011/2026"');
        expect(graphs).toContain("/api/v1/metal-prices/ndpr-oxide");
        // Live: in the sitemap, llms.txt and the supply-chain menu.
        expect(await (await get("/sitemap.xml")).text()).toContain("/metals");
        expect(await (await get("/llms.txt")).text()).toContain("/metals.md");
        expect(html).toContain('<a href="/metals"');
    });

    test("markdown twin carries every section as cited tables", async () => {
        for (const res of [await get("/metals.md"), await getMarkdown("/metals")]) {
            expect(res.status).toBe(200);
            const md = await res.text();
            for (const h of [
                "## What goes in",
                "## Where it comes from",
                "## How much is left",
                "## Prices",
                "### Events",
                "## How the price is set",
                "## Sources",
            ])
                expect(md).toContain(h);
            expect(md).toContain("| SH | High-performance motors | 4.2%[^");
            expect(md).toContain("| Dy | Separation | 🇨🇳 China ~95%[^");
            expect(md).toContain("| Dy | Mining | n/a | China and Myanmar together");
            expect(md).toContain("| 🇨🇳 China | ~270 kt[^");
            expect(md).toContain("| 163 years[^");
            expect(md).toContain("| Tb metal | Export, FOB China | $1,532/kg[^");
            expect(md).toContain("43%[^");
            expect(md).toContain("| 2025-07-10 | US floor under NdPr |");
            expect(md).toMatch(
                /\[\^\d+\]: USGS, "Mineral Commodity Summaries 2026: Cobalt"/,
            );
            // No em dashes in prose served to people or agents.
            expect(md).not.toContain(String.fromCharCode(0x2014));
        }
    });
});

describe("REST /api/v1/metals and /api/v1/metal-prices", () => {
    test("lists six metals with the top country per stage", async () => {
        const body = MetalListSchema.parse(await (await get("/api/v1/metals")).json());
        expect(body.data.map((m) => m.id)).toEqual([
            "nd",
            "pr",
            "dy",
            "tb",
            "sm",
            "co",
        ]);
        const nd = body.data[0];
        expect(nd?.stages.map((s) => [s.stage, s.top_country])).toEqual([
            ["mining", "CN"],
            ["separation", "CN"],
            ["metal-alloy", "CN"],
            ["magnet", "CN"],
        ]);
    });

    test("one metal: stages, reserves and latest prices, cited", async () => {
        const body = MetalSupplySchema.parse(
            await (await get("/api/v1/metals/DY?stage=separation")).json(),
        );
        expect(body.stages).toHaveLength(1);
        expect(body.stages[0]?.top_share).toBe(0.95);
        expect(body.stages[0]?.sources[0]?.publisher).toBe("NUS East Asian Institute");
        expect(body.reserves.commodity).toBe("ree");
        const cn = body.reserves.rows.find((r) => r.country === "CN");
        expect(cn?.reserves?.value).toBe(44000000);
        expect(cn?.years_of_supply?.confidence).toBe("modeled");
        expect(body.prices.map((p) => p.id)).toEqual(["dy-oxide", "dy-metal-cn"]);
        const co = MetalSupplySchema.parse(
            await (await get("/api/v1/metals/co")).json(),
        );
        expect(co.reserves.rows[0]?.country).toBe("CD");
        expect(co.stages.find((s) => s.stage === "separation")?.status).toBe("gap");
    });

    test("price history filters by month and lists related events", async () => {
        const body = MetalPricesSchema.parse(
            await (
                await get("/api/v1/metal-prices/tb-oxide?from=2021-01&to=2022-12")
            ).json(),
        );
        expect(body.points.map((p) => [p.date, p.price.value])).toEqual([
            ["2021", 1340],
            ["2022", 2050],
        ]);
        expect(body.series.market).toBe("fob-china");
        expect(body.events.map((e) => e.id)).toContain("licensing-2025-04");
    });

    test("bad ids are 404 problems, bad params 400", async () => {
        expect((await get("/api/v1/metals/xx")).status).toBe(404);
        expect((await get("/api/v1/metal-prices/gold")).status).toBe(404);
        expect((await get("/api/v1/metals/nd?stage=smelting")).status).toBe(400);
        expect((await get("/api/v1/metal-prices/dy-oxide?from=2020")).status).toBe(400);
    });

    test("OpenAPI documents the paths under the supply-chain tag", async () => {
        const spec = (await (await get("/openapi.json")).json()) as {
            paths: Record<string, Record<string, { tags: string[] }>>;
        };
        for (const p of [
            "/api/v1/metals",
            "/api/v1/metals/{element}",
            "/api/v1/metal-prices/{series}",
        ])
            expect(spec.paths[p]?.get?.tags).toEqual(["supply-chain"]);
    });
});

describe("MCP metal tools", () => {
    test("get_metal_supply returns one stage when asked", async () => {
        const out = MetalSupplySchema.parse(
            (await callTool("get_metal_supply", { element: "nd", stage: "magnet" }))
                .structuredContent,
        );
        expect(out.stages.map((s) => [s.stage, s.top_country, s.top_share])).toEqual([
            ["magnet", "CN", 0.94],
        ]);
    });

    test("get_metal_prices returns cited points", async () => {
        const out = MetalPricesSchema.parse(
            (await callTool("get_metal_prices", { series: "ndpr-oxide" }))
                .structuredContent,
        );
        expect(out.points).toHaveLength(5);
        expect(out.points[0]?.price.sources[0]?.publisher).toBe("USGS");
        expect((await callTool("get_metal_prices", { series: "gold" })).isError).toBe(
            true,
        );
    });
});
