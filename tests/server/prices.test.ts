import { describe, expect, test } from "bun:test";
import { PriceHistorySchema } from "@/api/prices";
import { ActuatorSchema } from "@/api/schemas";
import { actuatorsWithHistory, historyFor } from "@/prices";
import { get, getMarkdown } from "./agent-helpers";
import { callTool } from "./mcp-helpers";

function jsonLd(html: string): { "@graph": Record<string, unknown>[] } {
    const m = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html);
    return JSON.parse(m?.[1] ?? "{}");
}

describe("/prices", () => {
    test("serves the SPA shell with a Dataset under CC BY", async () => {
        const res = await get("/prices");
        expect(res.status).toBe(200);
        const html = await res.text();
        expect(html).toContain("<title>Actuator prices | actuatorlist</title>");
        const ds = jsonLd(html)["@graph"].find((n) => n["@type"] === "Dataset") as {
            license: string;
            temporalCoverage: string;
        };
        expect(ds.license).toContain("creativecommons.org/licenses/by/4.0");
        expect(ds.temporalCoverage).toMatch(/^\d{4}\/\d{4}$/);
        expect((await get("/prices?actuator=robstride-04")).status).toBe(200);
    });

    test("the .md twin has the class fits, latest prices, 1-year change and metals note", async () => {
        for (const res of [await get("/prices.md"), await getMarkdown("/prices")]) {
            expect(res.headers.get("content-type")).toBe(
                "text/markdown; charset=utf-8",
            );
            const md = await res.text();
            expect(md).toContain('title: "Actuator prices"');
            expect(md).toContain("## $/N·m over time by class");
            expect(md).toContain(
                "| Class | Points | Fitted points (actuators) | Fitted change | R² |",
            );
            expect(md).toContain("one intercept per actuator");
            expect(md).toContain("## Latest price per actuator");
            expect(md).toContain(
                "| Actuator | Points | First | Latest | $/N·m | 1-year change | Methods | History |",
            );
            expect(md).toContain("(/actuators/dynamixel-xm430-w350-t)");
            expect(md).toContain("## Price index vs NdPr oxide");
            expect(md).toContain("Correlation is not causation");
            expect(md).toContain("web.archive.org");
            expect(md).not.toContain(String.fromCharCode(0x2014));
        }
    });

    test("is in llms.txt, the sitemap and the footer", async () => {
        expect(await (await get("/llms.txt")).text()).toContain("/prices.md");
        expect(await (await get("/sitemap.xml")).text()).toContain("/prices</loc>");
        expect(await (await get("/")).text()).toContain(
            '<a href="/prices">Actuator price history</a>',
        );
    });
});

describe("REST /api/v1/prices/{actuatorId}", () => {
    test("returns dated points with method, page, FX rate and sources", async () => {
        const res = await get("/api/v1/prices/dynamixel-xm430-w350-t");
        expect(res.status).toBe(200);
        const h = PriceHistorySchema.parse(await res.json());
        expect(h.count).toBe(historyFor("dynamixel-xm430-w350-t").length);
        expect(h.points[0]?.method).toBe("wayback");
        expect(h.points[0]?.url).toContain("web.archive.org");
        expect(h.points[0]?.fx_rate).toBe(1);
        expect(h.points.at(-1)?.sources[0]?.url).toMatch(
            /^https:\/\/.+\/actuators\/dynamixel-xm430-w350-t$/,
        );
        expect(h.latest?.price_usd).toBeGreaterThan(0);
        expect(h.change_1y?.from_date).toBe("2024-02");
        expect(h.url).toMatch(/\/prices\?actuator=dynamixel-xm430-w350-t$/);
    });

    test("carries a series caveat, 404s an unknown id and has a markdown twin", async () => {
        const cg = PriceHistorySchema.parse(
            await (await get("/api/v1/prices/xiaomi-cybergear")).json(),
        );
        expect(cg.note).toContain("change of seller");
        expect((await get("/api/v1/prices/nope")).status).toBe(404);
        const md = await (await get("/api/v1/prices/cubemars-ak80-9.md")).text();
        expect(md).toContain("# Price history: AK80-9");
        expect(md).toContain(
            "| Date | US$ | Listed | $/N·m | Method | Stock | Page | Sources | Note |",
        );
    });

    test("actuator responses link their price history", async () => {
        const a = ActuatorSchema.parse(
            await (await get("/api/v1/actuators/robstride-04")).json(),
        );
        expect(a.price_history_url).toMatch(/\/api\/v1\/prices\/robstride-04$/);
        expect((await get(new URL(a.price_history_url).pathname)).status).toBe(200);
    });

    test("is in the OpenAPI document", async () => {
        const doc = (await (await get("/openapi.json")).json()) as {
            paths: Record<string, unknown>;
        };
        expect(Object.keys(doc.paths)).toContain("/api/v1/prices/{id}");
    });
});

describe("MCP get_price_history", () => {
    test("returns one actuator's history", async () => {
        const id = actuatorsWithHistory()[0] as string;
        const out = PriceHistorySchema.parse(
            (await callTool("get_price_history", { actuator_id: id }))
                .structuredContent,
        );
        expect(out.actuator_id).toBe(id);
        expect(out.points.length).toBe(historyFor(id).length);
    });
});
