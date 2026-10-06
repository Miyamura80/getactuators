import { expect, test } from "bun:test";
import { ACTUATORS } from "@/catalog";
import { actuatorPath } from "@/server/agent/catalog-md";
import { findPage } from "@/server/agent/pages";
import { absoluteUrl } from "@/server/site";

const unverified = ACTUATORS.filter((a) => !a.verified);

test("home rankings list verified entries only", () => {
    expect(unverified.length).toBeGreaterThan(0);
    const page = findPage("/");
    const body = page?.body() ?? "";
    const rankings = body
        .split("## Highest torque density")[1]
        ?.split("## Robots in the catalog")[0];
    expect(rankings).toBeDefined();
    for (const a of unverified)
        expect(rankings).not.toContain(absoluteUrl(actuatorPath(a.id)));
    const list = page?.jsonLd().find((node) => node["@type"] === "ItemList");
    expect(list?.numberOfItems).toBe(10);
    const urls = JSON.stringify(list?.itemListElement);
    for (const a of unverified)
        expect(urls).not.toContain(absoluteUrl(actuatorPath(a.id)));
    // The full tables still list unverified entries.
    expect(findPage("/all")?.body()).toContain(
        absoluteUrl(actuatorPath(unverified[0]?.id ?? "")),
    );
});
