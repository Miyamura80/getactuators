import { expect, test } from "bun:test";
import { headerMenus } from "@/public-navigation";
import { get as getShared } from "./agent-helpers";

// Every link in the header dropdowns resolves, and each page's header
// carries the menus. A client key of its own keeps this off the shared
// rate-limit window.
const get = (path: string) =>
    getShared(path, { "x-forwarded-for": "header-menu-test" });

test("every header menu link returns 200 and renders the menus", async () => {
    const hrefs = headerMenus().flatMap((m) =>
        m.groups.flatMap((g) => g.links.map((l) => l.href)),
    );
    const failures: string[] = [];
    for (const href of hrefs) {
        const res = await get(href);
        const html = await res.text();
        if (res.status !== 200) failures.push(`${href}: ${res.status}`);
        else if (!html.includes('data-menu="market-intel"'))
            failures.push(`${href}: no menu`);
    }
    expect(failures).toEqual([]);
});
