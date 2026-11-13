import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { PublicHeader } from "../src/components/PublicHeader";
import { MARKET_INTEL_GROUPS, publicHeader } from "../../src/public-navigation";

afterEach(cleanup);

const HREFS = MARKET_INTEL_GROUPS.flatMap((g) => g.links.map(([href]) => href));

test("market intel menu lists the market pages before supply chain", () => {
    const view = render(<PublicHeader path="/patents" />);
    const menus = [...view.container.querySelectorAll(".site-sub")];
    expect(menus.map((m) => m.getAttribute("data-menu"))).toEqual(["market-intel", "supply-chain"]);
    const links = [...menus[0]!.querySelectorAll("a")];
    expect(links.map((a) => a.getAttribute("href"))).toEqual(HREFS);
    expect(menus[0]!.querySelector("summary")?.className).toBe("is-current");
    expect(links.find((a) => a.getAttribute("aria-current") === "page")?.getAttribute("href")).toBe("/patents");
});

test("server-rendered header carries the same menu", () => {
    const html = publicHeader("/");
    expect(html).toContain('data-menu="market-intel"');
    for (const href of HREFS) expect(html).toContain(`href="${href}"`);
});
