import { expect, test } from "bun:test";
import { get } from "./agent-helpers";

test("/all moved into the /actuators list view, keeping its query", async () => {
    const cases: [string, string][] = [
        ["/all", "/actuators?view=list"],
        [
            "/all?use=quadruped_leg&sel=cubemars-ak80-9",
            "/actuators?use=quadruped_leg&sel=cubemars-ak80-9&view=list",
        ],
        ["/all.md", "/actuators.md"],
    ];
    for (const [from, to] of cases) {
        const res = await get(from);
        expect({
            from,
            status: res.status,
            location: res.headers.get("location"),
        }).toEqual({
            from,
            status: 301,
            location: to,
        });
    }
});

test("the merged page owns the full table and the site search action", async () => {
    const md = await (await get("/actuators.md")).text();
    expect(md).toContain("# Robot actuators");
    expect(md).toContain("## All actuators");
    const html = await (await get("/")).text();
    expect(html).toContain("/actuators?view=list&q={search_term_string}");
    expect(html).not.toContain('href="/all"');
});
