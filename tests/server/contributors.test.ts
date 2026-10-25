import { expect, test } from "bun:test";
import { ORGS, PEOPLE, peopleIn } from "@/people";
import { get, getMarkdown } from "./agent-helpers";

type Node = Record<string, unknown>;

function graph(html: string): Node[] {
    const m = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html);
    return (JSON.parse(m?.[1] ?? "{}") as { "@graph"?: Node[] })["@graph"] ?? [];
}

test("/contributors serves HTML with an AboutPage and one Person per contributor", async () => {
    const res = await get("/contributors");
    expect(res.status).toBe(200);
    const nodes = graph(await res.text());
    expect(nodes.map((n) => n["@type"])).toContain("AboutPage");
    const people = nodes.filter((n) => n["@type"] === "Person");
    const listed = [...peopleIn("contributor-core"), ...peopleIn("contributor")];
    expect(people.map((n) => n.name)).toEqual(listed.map((p) => p.name));
    for (const p of people) {
        expect((p.affiliation as Node)["@type"]).toBe("Organization");
        expect(String(p["@id"])).toStartWith("https://actuatorlist.com/contributors#");
    }
});

test("the site WebSite node credits every contributor", async () => {
    const site = graph(await (await get("/")).text()).find(
        (n) => n["@type"] === "WebSite",
    );
    const ids = (site?.contributor as { "@id": string }[]).map((c) => c["@id"]);
    expect(ids).toHaveLength(
        peopleIn("contributor-core").length + peopleIn("contributor").length,
    );
    expect(ids).toContain("https://actuatorlist.com/contributors#eito-miyamura");
});

test("/contributors.md lists each contributor with affiliation and contribution", async () => {
    const md = await (await get("/contributors.md")).text();
    expect(await (await getMarkdown("/contributors")).text()).toBe(md);
    expect(md).toContain("# Contributors");
    for (const p of PEOPLE.filter((x) =>
        x.lists.some((l) => l.startsWith("contributor")),
    )) {
        const org = ORGS.find((o) => o.id === p.affiliation.orgId);
        expect(md).toContain(`**${p.name}**`);
        expect(md).toContain(`[${org?.name}](${org?.url})`);
        if (p.contribution) expect(md).toContain(p.contribution);
    }
    expect(md).toContain("https://actuatorlist.com/contact");
});

test("the footer links /contributors right after About", async () => {
    const html = await (await get("/about")).text();
    expect(html).toContain(
        '<a href="/about">About</a><a href="/contributors">Contributors</a>',
    );
});
