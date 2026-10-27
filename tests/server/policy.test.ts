import { describe, expect, test } from "bun:test";
import { PolicyListSchema, PolicyMeasureSchema } from "@/api/policy";
import { POLICY_MEASURES } from "@/supply-chain/policy";
import { get, getMarkdown } from "./agent-helpers";
import { callTool } from "./mcp-helpers";

describe("/policy page, twin and feed", () => {
    test("serves the SPA with a Dataset node and is linked site-wide", async () => {
        const res = await get("/policy");
        expect(res.status).toBe(200);
        const html = await res.text();
        expect(html).toContain("<title>Actuator chain policy");
        const graphs = [
            ...html.matchAll(
                /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
            ),
        ]
            .map((m) => JSON.stringify(JSON.parse(m[1] ?? "{}")))
            .join("\n");
        expect(graphs).toContain('"@type":"Dataset"');
        expect(graphs).toContain("/api/v1/policy");
        expect(graphs).toContain("/policy/feed.xml");
        expect(await (await get("/sitemap.xml")).text()).toContain("/policy");
        expect(await (await get("/llms.txt")).text()).toContain("/policy.md");
        expect(html).toContain('<a href="/policy"');
    });

    test("markdown twin lists every measure by date with status and source", async () => {
        for (const res of [await get("/policy.md"), await getMarkdown("/policy")]) {
            expect(res.status).toBe(200);
            const md = await res.text();
            for (const h of ["## Latest status changes", "## Measures", "## Sources"])
                expect(md).toContain(h);
            const rows = md.split("\n").filter((l) => /^\| \d{4}/.test(l));
            expect(rows).toHaveLength(POLICY_MEASURES.length);
            const dates = rows.map((r) => r.split(" | ")[0]?.slice(2) ?? "");
            expect(dates).toEqual([...dates].sort());
            expect(md).toContain("`cn-mofcom-2025-18`");
            expect(md).toContain("| In force since 2025-04-04 |");
            expect(md).toMatch(/\[\^\d+\]: MOFCOM, GAC, "Announcement 2025 No\. 18/);
            expect(md).not.toContain(String.fromCharCode(0x2014));
        }
    });

    test("Atom feed has one entry per recent status change, newest first", async () => {
        const res = await get("/policy/feed.xml");
        expect(res.status).toBe(200);
        expect(res.headers.get("content-type")).toContain("application/atom+xml");
        const xml = await res.text();
        expect(xml).toStartWith('<?xml version="1.0" encoding="utf-8"?>');
        expect(xml).toContain('<feed xmlns="http://www.w3.org/2005/Atom">');
        const updated = [
            ...xml.matchAll(/<entry>[\s\S]*?<updated>([^<]+)<\/updated>/g),
        ].map((m) => m[1] ?? "");
        expect(updated.length).toBe(50);
        expect(updated).toEqual([...updated].sort().reverse());
        expect(xml).toContain("https://actuatorlist.com/policy#measure=");
    });
});

describe("REST /api/v1/policy", () => {
    test("lists all measures and filters by jurisdiction, type, stage and status", async () => {
        const all = PolicyListSchema.parse(await (await get("/api/v1/policy")).json());
        expect(all.total).toBe(POLICY_MEASURES.length);
        expect(all.total).toBeGreaterThanOrEqual(60);
        const cn = PolicyListSchema.parse(
            await (
                await get("/api/v1/policy?jurisdiction=cn&type=export-control")
            ).json(),
        );
        expect(cn.results.length).toBeGreaterThan(5);
        expect(
            cn.results.every(
                (m) => m.jurisdiction === "CN" && m.type === "export-control",
            ),
        ).toBe(true);
        const magnets = PolicyListSchema.parse(
            await (await get("/api/v1/policy?stage=magnet&status=suspended")).json(),
        );
        expect(magnets.results.map((m) => m.id)).toContain("cn-mofcom-2025-57");
        const other = PolicyListSchema.parse(
            await (await get("/api/v1/policy?jurisdiction=OTHER")).json(),
        );
        expect(other.results.every((m) => m.lane === "OTHER")).toBe(true);
    });

    test("one measure: status history, sources and registry company ids", async () => {
        const m = PolicyMeasureSchema.parse(
            await (await get("/api/v1/policy/us-dod-mp-partnership-2025")).json(),
        );
        expect(m.url).toBe("/policy#measure=us-dod-mp-partnership-2025");
        expect(m.status_history.map((c) => c.date)).toEqual([
            "2025-07-10",
            "2025-10-01",
            "2026-04",
        ]);
        expect(m.amount_usd?.value).toBe(400_000_000);
        expect(m.companies_affected[0]).toEqual({
            name: "MP Materials",
            company_id: "mp-materials",
        });
        expect(m.metals_event_id).toBe("dod-floor-2025");
        expect(
            m.sources.some((s) => s.publisher === "Council of Economic Advisers"),
        ).toBe(true);
    });

    test("unknown ids are 404, bad filters 400, documented in OpenAPI", async () => {
        expect((await get("/api/v1/policy/nope")).status).toBe(404);
        expect((await get("/api/v1/policy?type=quota")).status).toBe(400);
        const spec = (await (await get("/openapi.json")).json()) as {
            paths: Record<string, Record<string, { tags: string[] }>>;
        };
        for (const p of ["/api/v1/policy", "/api/v1/policy/{id}"])
            expect(spec.paths[p]?.get?.tags).toEqual(["supply-chain"]);
    });
});

describe("MCP list_policy_measures", () => {
    test("filters like REST", async () => {
        const out = PolicyListSchema.parse(
            (
                await callTool("list_policy_measures", {
                    jurisdiction: "JP",
                    stage: "gearing",
                })
            ).structuredContent,
        );
        expect(out.results.map((m) => m.id).sort()).toEqual([
            "jp-espa-critical-products-2022",
            "jp-espa-hds-reducers-2023",
            "jp-espa-nidec-reducers-2023",
        ]);
        const hds = out.results.find((m) => m.id === "jp-espa-hds-reducers-2023");
        expect(hds?.status).toBe("expired");
        expect(hds?.status_history.at(-1)?.note).toBe("Approval revoked.");
    });
});
