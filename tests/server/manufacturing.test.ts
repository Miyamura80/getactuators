import { describe, expect, test } from "bun:test";
import { ProcessChainListSchema, ProcessChainSchema } from "@/api/processes";
import { MAGNET_CHAIN, PRECISION_CHAIN, orderedSteps } from "@/supply-chain/processes";
import { get, getMarkdown } from "./agent-helpers";
import { callTool } from "./mcp-helpers";

function jsonLd(html: string): Record<string, unknown>[] {
    return [
        ...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g),
    ].flatMap((m) => {
        const doc = JSON.parse(m[1] ?? "{}") as {
            "@graph"?: Record<string, unknown>[];
        };
        return doc["@graph"] ?? [doc as Record<string, unknown>];
    });
}

describe("/manufacturing page and twin", () => {
    test("serves the SPA with HowTo and Dataset JSON-LD and is linked site-wide", async () => {
        const res = await get("/manufacturing");
        expect(res.status).toBe(200);
        const html = await res.text();
        expect(html).toContain(
            "<title>How actuator magnets and precision parts are made",
        );
        const nodes = jsonLd(html);
        const howTos = nodes.filter((n) => n["@type"] === "HowTo") as {
            step: { name: string; url: string }[];
        }[];
        expect(howTos).toHaveLength(2);
        const [howTo, precision] = howTos;
        expect(howTo?.step).toHaveLength(MAGNET_CHAIN.steps.length);
        expect(howTo?.step[0]?.url).toBe(
            "https://actuatorlist.com/manufacturing#step=open-pit-mining",
        );
        expect(precision?.step).toHaveLength(PRECISION_CHAIN.steps.length);
        expect(precision?.step[0]?.url).toBe(
            "https://actuatorlist.com/manufacturing?chain=precision#step=flexspline-forging",
        );
        expect(nodes.some((n) => n["@type"] === "Dataset")).toBe(true);
        expect(await (await get("/sitemap.xml")).text()).toContain("/manufacturing");
        expect(await (await get("/llms.txt")).text()).toContain("/manufacturing.md");
        expect(html).toContain('<a href="/manufacturing"');
    });

    test("markdown twin lists every step by stage with numbers, who and concentration", async () => {
        for (const res of [
            await get("/manufacturing.md"),
            await getMarkdown("/manufacturing"),
        ]) {
            expect(res.status).toBe(200);
            const md = await res.text();
            for (const h of [
                "## How an NdFeB magnet is made (`magnet`)",
                "### Mining",
                "### Separation",
                "### Metal & alloy",
                "### Magnet",
                "### Product",
                "## Sources",
            ])
                expect(md).toMatch(new RegExp(`^${h.replace(/[()]/g, "\\$&")}$`, "m"));
            const headings = [
                ...md.matchAll(/^#### \d+\. .+ \(`([a-z0-9-]+)`\)$/gm),
            ].map((m) => m[1]);
            expect(headings).toEqual(
                [MAGNET_CHAIN, PRECISION_CHAIN].flatMap((c) =>
                    orderedSteps(c).map((s) => s.id),
                ),
            );
            for (const h of [
                "## How an actuator's precision parts are made (`precision`)",
                "### Strain-wave gear",
                "### Roller screw",
                "### Precision bearing",
                "### Encoder",
            ])
                expect(md).toMatch(new RegExp(`^${h.replace(/[()]/g, "\\$&")}$`, "m"));
            // Precision sub-chains carry a modeled split and its method.
            expect(md).toMatch(
                /Sub-chain concentration: concentrated: .+ Japan ~78%(\[\^\d+\])+ \(2024\)\. Modeled:/,
            );
            expect(md).toContain(
                "https://actuatorlist.com/manufacturing?chain=precision#step=roller-thread-grinding",
            );
            expect(md).toContain("Key numbers: G1 grade 6 µm/300 mm[^");
            expect(md).toContain("Key numbers: Particle size 2-5 µm[^");
            expect(md).toContain("Who does it: JL MAG Rare-Earth, Shin-Etsu Chemical.");
            expect(md).toMatch(
                /Country concentration: monopolized: .+ China ~94%\[\^\d+\] \(2024\)/,
            );
            expect(md).toContain(
                "https://actuatorlist.com/manufacturing#step=jet-milling",
            );
            expect(md).toMatch(/\[\^\d+\]: TU Darmstadt, "Grain boundary engineering/);
            expect(md).not.toContain(String.fromCharCode(0x2014));
        }
    });
});

describe("REST /api/v1/processes", () => {
    test("lists chains and returns the magnet chain in reading order", async () => {
        const list = ProcessChainListSchema.parse(
            await (await get("/api/v1/processes")).json(),
        );
        expect(list.results.map((c) => c.id)).toEqual(["magnet", "precision"]);
        expect(list.results[0]?.step_count).toBe(MAGNET_CHAIN.steps.length);
        const chain = ProcessChainSchema.parse(
            await (await get("/api/v1/processes/magnet")).json(),
        );
        expect(chain.steps.map((s) => s.id)).toEqual(
            orderedSteps(MAGNET_CHAIN).map((s) => s.id),
        );
        expect(chain.clusters.map((c) => c.country_shares?.tier)).toEqual([
            "concentrated",
            "monopolized",
            "monopolized",
            "monopolized",
        ]);
        const jet = chain.steps.find((s) => s.id === "jet-milling");
        expect(jet?.key_numbers[0]?.value.range).toEqual([2, 5]);
        expect(jet?.key_numbers[0]?.value.sources[0]?.publisher).toBe(
            "Advanced Magnets",
        );
        expect(jet?.upstream).toEqual(["hydrogen-decrepitation"]);
        expect(jet?.downstream).toEqual(["field-pressing"]);
        expect(jet?.animation_id).toBe("jet-milling-loop");
    });

    test("step filter returns one step and its edges; unknown ids are 404", async () => {
        const one = ProcessChainSchema.parse(
            await (await get("/api/v1/processes/magnet?step=machining")).json(),
        );
        expect(one.steps.map((s) => s.id)).toEqual(["machining"]);
        expect(one.clusters.map((c) => [c.id, c.step_ids])).toEqual([
            ["magnet", ["machining"]],
        ]);
        expect(
            one.edges.every((e) => e.from === "machining" || e.to === "machining"),
        ).toBe(true);
        expect(
            one.edges.some((e) => e.kind === "loop" && e.to === "scrap-recycling"),
        ).toBe(true);
        expect((await get("/api/v1/processes/motor")).status).toBe(404);
        const missing = await get("/api/v1/processes/magnet?step=welding");
        expect(missing.status).toBe(404);
        expect(await missing.text()).toContain("jet-milling");
        expect((await get("/api/v1/processes/magnet?step=Bad_Id")).status).toBe(400);
    });
});

describe("precision chain over REST", () => {
    test("four sub-chains, modeled shares, terminal steps feed the product", async () => {
        const chain = ProcessChainSchema.parse(
            await (await get("/api/v1/processes/precision")).json(),
        );
        expect(chain.parallel).toBe(true);
        expect(chain.span).toBe("bar stock to tested part");
        expect(chain.clusters.map((c) => [c.id, c.country_shares?.tier])).toEqual([
            ["strain-wave", "concentrated"],
            ["roller-screw", "distributed"],
            ["bearing", "distributed"],
            ["encoder", "distributed"],
        ]);
        expect(chain.clusters[0]?.country_shares?.confidence).toBe("modeled");
        const grind = chain.steps.find((s) => s.id === "roller-thread-grinding");
        expect(grind?.url).toBe(
            "/manufacturing?chain=precision#step=roller-thread-grinding",
        );
        expect(grind?.upstream).toEqual(["screw-hardening"]);
        expect(grind?.animation_id).toBe("roller-thread-grinding-loop");
        expect(grind?.key_numbers[0]?.value.sources[0]?.accessed).toBeNull();
        const pole = chain.steps.find((s) => s.id === "magnetic-pole-writing");
        expect(pole?.branch).toBe("alternative");
    });
});

describe("MCP get_process", () => {
    test("returns the chain, or one step, with sourced numbers", async () => {
        const all = ProcessChainSchema.parse(
            (await callTool("get_process", { chain: "magnet" })).structuredContent,
        );
        expect(all.steps).toHaveLength(MAGNET_CHAIN.steps.length);
        const one = ProcessChainSchema.parse(
            (await callTool("get_process", { step: "sintering" })).structuredContent,
        );
        expect(one.steps[0]?.key_numbers.map((k) => k.label)).toEqual([
            "Sintering",
            "Anneal",
        ]);
        expect(one.steps[0]?.country_shares?.top_country).toBe("CN");
        // A precision step resolves its chain without chain=.
        const screw = ProcessChainSchema.parse(
            (await callTool("get_process", { step: "lead-accuracy-test" }))
                .structuredContent,
        );
        expect(screw.id).toBe("precision");
        expect(screw.steps[0]?.key_numbers.map((k) => k.label)).toEqual([
            "G1 grade",
            "G5 grade",
            "Laser residual",
        ]);
        const precision = ProcessChainSchema.parse(
            (await callTool("get_process", { chain: "precision" })).structuredContent,
        );
        expect(precision.steps).toHaveLength(PRECISION_CHAIN.steps.length);
    });
});
