import { expect, test } from "bun:test";
import { DIRECTORY } from "@/people";
import { get, getMarkdown } from "./agent-helpers";
import { callTool } from "./mcp-helpers";

type Node = Record<string, unknown>;

function graph(html: string): Node[] {
    const m = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html);
    return (JSON.parse(m?.[1] ?? "{}") as { "@graph"?: Node[] })["@graph"] ?? [];
}

test("/people serves HTML with an ItemList of Person nodes", async () => {
    const res = await get("/people");
    expect(res.status).toBe(200);
    const nodes = graph(await res.text());
    const list = nodes.find((n) => n["@type"] === "ItemList");
    const items = (list?.itemListElement as { item: Node }[]).map((i) => i.item);
    expect(items).toHaveLength(DIRECTORY.length);
    for (const p of items) {
        expect(p["@type"]).toBe("Person");
        expect((p.affiliation as Node[])[0]?.["@type"]).toBe("Organization");
        expect((p.sameAs as string[]).length).toBeGreaterThan(0);
    }
});

test("/people.md has one table per domain, criteria and numbered sources", async () => {
    const md = await (await get("/people.md")).text();
    expect(await (await getMarkdown("/people")).text()).toBe(md);
    for (const h of [
        "## Actuator research",
        "## Actuators and robots",
        "## REE and magnets",
        "## Analysts and policy",
        "## Inclusion criteria",
        "## Sources",
    ])
        expect(md).toContain(h);
    for (const p of DIRECTORY) expect(md).toContain(`**${p.name}**[^`);
    expect(md).toContain("https://actuatorlist.com/contact");
});

test("REST /api/v1/people filters by domain and 404s unknown ids", async () => {
    const all = (await (await get("/api/v1/people")).json()) as { total: number };
    expect(all.total).toBe(DIRECTORY.length);
    const res = await get("/api/v1/people?domain=magnets");
    const body = (await res.json()) as { data: { domain: string }[] };
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.every((p) => p.domain === "magnets")).toBe(true);
    expect((await get("/api/v1/people?domain=nope")).status).toBe(400);
    const one = (await (await get("/api/v1/people/masato-sagawa")).json()) as {
        affiliation: { company_id: string };
        sources: { url: string }[];
    };
    expect(one.affiliation.company_id).toBe("daido-steel");
    expect(one.sources.length).toBeGreaterThan(0);
    expect((await get("/api/v1/people/nobody")).status).toBe(404);
});

test("MCP list_people returns the same records, optionally by domain", async () => {
    const r = await callTool("list_people", { domain: "policy" });
    const out = r.structuredContent as { data: { domain: string }[]; total: number };
    expect(out.total).toBe(DIRECTORY.filter((p) => p.domain === "policy").length);
    expect(out.data.every((p) => p.domain === "policy")).toBe(true);
});

test("llms.txt and the footer link /people", async () => {
    expect(await (await get("/llms.txt")).text()).toContain("/people.md");
    expect(await (await get("/about")).text()).toContain(
        '<a href="/people">Leading people</a>',
    );
});
