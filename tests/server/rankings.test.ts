import { expect, test } from "bun:test";
import { ACTUATORS } from "@/catalog";
import { isRankable } from "@/catalog/evidence";
import { actuatorPath } from "@/server/agent/catalog-md";
import { findPage } from "@/server/agent/pages";
import { absoluteUrl } from "@/server/site";

const unverified = ACTUATORS.filter((a) => !a.verified);
const excluded = ACTUATORS.filter((a) => !isRankable(a));

test("home rankings list verified actuators only", () => {
    expect(unverified.length).toBeGreaterThan(0);
    // A verified bare gearbox (no motor) is excluded too.
    expect(excluded.some((a) => a.verified && a.id === "nabtesco-rv-42n")).toBe(true);
    const page = findPage("/");
    const body = page?.body() ?? "";
    const rankings = body
        .split("## Highest torque density")[1]
        ?.split("## Robots in the catalog")[0];
    expect(rankings).toBeDefined();
    for (const a of excluded)
        expect(rankings).not.toContain(absoluteUrl(actuatorPath(a.id)));
    const list = page?.jsonLd().find((node) => node["@type"] === "ItemList");
    expect(list?.numberOfItems).toBe(10);
    const urls = JSON.stringify(list?.itemListElement);
    for (const a of excluded)
        expect(urls).not.toContain(absoluteUrl(actuatorPath(a.id)));
    // The full tables still list unverified entries and gearboxes.
    const all = findPage("/all")?.body();
    expect(all).toContain(absoluteUrl(actuatorPath(unverified[0]?.id ?? "")));
    expect(all).toContain(absoluteUrl(actuatorPath("nabtesco-rv-42n")));
});
