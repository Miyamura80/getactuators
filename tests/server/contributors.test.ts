import { expect, test } from "bun:test";
import { CONTRIBUTORS, LINK_LABEL, orgOf, schoolOf } from "@/people";
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
    expect(people.map((n) => n.name)).toEqual(CONTRIBUTORS.map((p) => p.name));
    for (const p of people) {
        expect((p.affiliation as Node)["@type"]).toBe("Organization");
        const person = CONTRIBUTORS.find((c) => c.name === p.name);
        const school = person ? schoolOf(person) : null;
        if (school) expect((p.alumniOf as Node).name).toBe(school.name);
        expect(String(p["@id"])).toStartWith("https://actuatorlist.com/contributors#");
    }
});

test("the site WebSite node credits every contributor", async () => {
    const site = graph(await (await get("/")).text()).find(
        (n) => n["@type"] === "WebSite",
    );
    const ids = (site?.contributor as { "@id": string }[]).map((c) => c["@id"]);
    expect(ids).toHaveLength(CONTRIBUTORS.length);
    expect(ids).toContain("https://actuatorlist.com/contributors#eito-miyamura");
});

test("/contributors.md matches the page: name, role, affiliation, school and links, no commit counts", async () => {
    const md = await (await get("/contributors.md")).text();
    expect(await (await getMarkdown("/contributors")).text()).toBe(md);
    expect(md).toContain("# Contributors");
    for (const p of CONTRIBUTORS) {
        const org = orgOf(p);
        const school = schoolOf(p);
        const links = p.links
            .map((l) => `[${LINK_LABEL[l.kind]}](${l.url})`)
            .join(", ");
        expect(md).toContain(
            `**${p.name}**, ${p.role}, [${org.name}](${org.url})${school ? `, [${school.name}](${school.url})` : ""}. ${links}`,
        );
    }
    expect(md).not.toContain("commit");
    expect(md).toContain("https://actuatorlist.com/contact");
});

test("the footer links /contributors right after About", async () => {
    const html = await (await get("/about")).text();
    expect(html).toContain(
        '<a href="/about">About</a><a href="/contributors">Contributors</a>',
    );
});
