import { describe, expect, test } from "bun:test";
import { PriceHistorySchema } from "@/api/prices";
import { ActuatorDetailSchema } from "@/api/schemas";
import { PRICE_HISTORY } from "@/prices";
import { get, getMarkdown } from "./agent-helpers";
import { callTool } from "./mcp-helpers";

const ID = "robstride-02";

describe("/prices page and twin", () => {
    test("serves the SPA with a Dataset node and is listed everywhere", async () => {
        const res = await get("/prices");
        expect(res.status).toBe(200);
        const html = await res.text();
        expect(html).toContain("<title>Actuator prices");
        expect(html).toContain('"@type":"Dataset"');
        expect(html).toContain('<a href="/prices">Actuator prices</a>');
        expect(await (await get("/sitemap.xml")).text()).toContain("/prices");
        expect(await (await get("/llms.txt")).text()).toContain("/prices.md");
    });

    test("markdown twin: coverage, class trend, latest price per actuator, index vs NdPr", async () => {
        for (const res of [await get("/prices.md"), await getMarkdown("/prices")]) {
            expect(res.status).toBe(200);
            const md = await res.text();
            for (const h of [
                "## Coverage",
                "## Trend by class",
                "## Latest price per actuator",
                "## Price vs metals",
            ])
                expect(md).toContain(h);
            expect(md).toContain(
                "| [RobStride 02](https://actuatorlist.com/actuators/robstride-02) | RobStride | Integrated Joint | $160.99 | $9.47/Nm | 2026-09-23 | n/a | manual |",
            );
            expect(md).toContain("Correlation is not causation");
            expect(md).toContain("not fitted (needs 4+ points over 365+ days");
            expect(md).not.toContain(String.fromCharCode(0x2014));
        }
    });
});

describe("REST /api/v1/prices/{actuatorId}", () => {
    test("returns every point with method, source and FX rate", async () => {
        const body = PriceHistorySchema.parse(
            await (await get(`/api/v1/prices/${ID}`)).json(),
        );
        expect(body.actuator_id).toBe(ID);
        expect(body.latest_price_usd).toBe(160.99);
        expect(body.usd_per_nm).toBe(9.47);
        expect(body.year_change).toBeNull();
        expect(body.page_url).toBe(
            "https://actuatorlist.com/prices?actuator=robstride-02",
        );
        expect(body.points.length).toBe(
            PRICE_HISTORY.points.filter((p) => p.actuatorId === ID).length,
        );
        for (const p of body.points) {
            expect(p.url).toStartWith("https://");
            expect(p.fx_rate).toBeGreaterThan(0);
            expect(p.method).toBeTruthy();
        }
        expect((await get("/api/v1/prices/not-an-actuator")).status).toBe(404);
    });

    test("actuator responses link to their price history; OpenAPI documents the path", async () => {
        const a = ActuatorDetailSchema.parse(
            await (await get(`/api/v1/actuators/${ID}`)).json(),
        );
        expect(a.price_history_url).toBe(
            `https://actuatorlist.com/api/v1/prices/${ID}`,
        );
        const spec = (await (await get("/openapi.json")).json()) as {
            paths: Record<string, Record<string, { tags: string[] }>>;
        };
        expect(spec.paths["/api/v1/prices/{actuatorId}"]?.get?.tags).toEqual([
            "actuators",
        ]);
    });
});

describe("MCP get_price_history", () => {
    test("same shape as REST; unknown ids are errors", async () => {
        const out = PriceHistorySchema.parse(
            (await callTool("get_price_history", { actuatorId: ID })).structuredContent,
        );
        expect(out.latest_price_usd).toBe(160.99);
        expect(
            (await callTool("get_price_history", { actuatorId: "nope" })).isError,
        ).toBe(true);
    });
});

describe("history file", () => {
    test("every point records method, source URL and FX rate, for catalog ids", async () => {
        const { ACTUATORS } = await import("@/catalog");
        const ids = new Set(ACTUATORS.map((a) => a.id));
        expect(PRICE_HISTORY.points.length).toBeGreaterThan(0);
        for (const p of PRICE_HISTORY.points) {
            expect(ids.has(p.actuatorId)).toBe(true);
            expect(p.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(p.url).toStartWith("https://");
            expect(p.fxRate).toBeGreaterThan(0);
            expect(p.currency).toMatch(/^[A-Z]{3}$/);
            if (p.priceUsd === null) expect(p.inStock).toBe(false);
        }
    });
});
