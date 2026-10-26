import { describe, expect, test } from "bun:test";
import {
    CompanyDetailSchema,
    CompanyListSchema,
    SiteListSchema,
} from "@/api/supply-chain";
import { COMPANIES } from "@/supply-chain/companies";
import { get } from "./agent-helpers";
import { callTool } from "./mcp-helpers";

describe("REST /api/v1/companies and /api/v1/sites", () => {
    test("lists companies with filters and matches the schema", async () => {
        const res = await get("/api/v1/companies?country=jp&stage=gearing");
        expect(res.status).toBe(200);
        const body = CompanyListSchema.parse(await res.json());
        expect(body.data.map((c) => c.id)).toEqual([
            "harmonic-drive-systems",
            "nabtesco",
            "nidec",
        ]);
        const all = CompanyListSchema.parse(
            await (await get("/api/v1/companies?limit=100")).json(),
        );
        expect(all.pagination.total).toBe(COMPANIES.length);
    });

    test("paginates with a cursor", async () => {
        const first = CompanyListSchema.parse(
            await (await get("/api/v1/companies?limit=5")).json(),
        );
        expect(first.pagination.has_more).toBe(true);
        const next = CompanyListSchema.parse(
            await (
                await get(
                    `/api/v1/companies?limit=5&cursor=${first.pagination.next_cursor}`,
                )
            ).json(),
        );
        expect(next.data[0]?.id).not.toBe(first.data[0]?.id);
    });

    test("one company carries sites, links and cited numbers", async () => {
        const body = CompanyDetailSchema.parse(
            await (await get("/api/v1/companies/china-northern-rare-earth")).json(),
        );
        expect(body.company.revenue_usd?.confidence).toBe("estimated");
        expect(body.company.revenue_usd?.range).toEqual([5.8e9, 6.0e9]);
        expect(body.company.revenue_usd?.sources[0]?.url).toStartWith("https://");
        expect(body.supplies.map((l) => l.to)).toEqual(["jl-mag"]);
        expect(body.sites).toHaveLength(1);
    });

    test("unknown company is a 404 problem", async () => {
        const res = await get("/api/v1/companies/no-such-co");
        expect(res.status).toBe(404);
        expect(res.headers.get("content-type")).toContain("application/problem+json");
    });

    test("sites filter by company and reject bad params", async () => {
        const body = SiteListSchema.parse(
            await (await get("/api/v1/sites?company=jl-mag")).json(),
        );
        expect(body.data.map((s) => s.id)).toContain("jlmag-baotou-expansion");
        expect((await get("/api/v1/sites?kind=castle")).status).toBe(400);
    });

    test("OpenAPI documents the new paths under a supply-chain tag", async () => {
        const spec = (await (await get("/openapi.json")).json()) as {
            paths: Record<string, Record<string, { tags: string[] }>>;
        };
        for (const p of [
            "/api/v1/companies",
            "/api/v1/companies/{id}",
            "/api/v1/sites",
        ])
            expect(spec.paths[p]?.get?.tags).toEqual(["supply-chain"]);
    });
});

describe("MCP supply-chain tools", () => {
    test("list_companies filters by country and stage", async () => {
        const out = (
            await callTool("list_companies", { country: "JP", stage: "gearing" })
        ).structuredContent as { total: number; results: { id: string }[] };
        expect(out.total).toBe(3);
        expect(out.results.map((c) => c.id)).toEqual([
            "harmonic-drive-systems",
            "nabtesco",
            "nidec",
        ]);
    });

    test("get_company returns sites, links and cited revenue", async () => {
        const out = CompanyDetailSchema.parse(
            (await callTool("get_company", { id: "mp-materials" })).structuredContent,
        );
        expect(out.company.revenue_usd?.confidence).toBe("reported");
        expect(out.company.revenue_usd?.sources[0]?.publisher).toBe("MP Materials");
        expect(out.sites.map((s) => s.id)).toContain("mp-mountain-pass");
        expect(out.supplies.map((l) => l.to)).toEqual(["shenghe-resources"]);
        // The Shenghe offtake stopped in April 2025: kept, but marked historical.
        expect(out.supplies[0]?.ended).toBe("2025-04");
        expect((await callTool("get_company", { id: "no-such-co" })).isError).toBe(
            true,
        );
    });

    test("list_sites filters by kind", async () => {
        const out = (await callTool("list_sites", { kind: "mine" }))
            .structuredContent as {
            results: { id: string; precision: string }[];
        };
        expect(out.results.map((s) => [s.id, s.precision])).toEqual([
            ["mp-mountain-pass", "site"],
        ]);
    });
});
