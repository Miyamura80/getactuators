import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { MarketShareList } from "../src/components/supply-chain/MarketShareList";
import { ConfidenceLegend } from "../src/components/supply-chain/ConfidenceLegend";
import { FootnotesProvider } from "../src/components/supply-chain/footnotes";
import { SourcedValue } from "../src/components/supply-chain/SourcedValue";
import { SourcesSection } from "../src/components/supply-chain/SourcesSection";
import { PublicHeader } from "../src/components/PublicHeader";
import { SupplyChainLab } from "../src/pages/supply-chain/SupplyChainLab";
import { supplyChainMenu, SUPPLY_CHAIN_PAGES_LIVE } from "../../src/public-navigation";
import type { Sourced } from "../../src/supply-chain/sourced";
import { COMPANIES } from "../../src/supply-chain/companies";
import { marketOf } from "../../src/supply-chain/market-share";

afterEach(cleanup);

const base = { unit: "t", asOf: "2025" } as const;
const reported: Sourced<number> = { ...base, value: 12000, sources: ["usgs-mcs-2026-ree"], confidence: "reported" };
const estimated: Sourced<number> = { ...base, value: 15000, range: [12000, 18000], sources: ["iea-rare-earths-2025"], confidence: "estimated", note: "Method." };
const modeled: Sourced<number> = { ...base, value: 9000, sources: ["usgs-mcs-2026-ree"], confidence: "modeled" };

test("SourcedValue styles each confidence and numbers sources in first-cited order", () => {
    const view = render(<FootnotesProvider>
        <SourcedValue value={reported} />
        <SourcedValue value={estimated} />
        <SourcedValue value={modeled} />
        <SourcesSection />
    </FootnotesProvider>);
    const values = [...view.container.querySelectorAll(".sc-value")];
    expect(values.map((v) => v.querySelector(".sc-num")?.textContent)).toEqual(["12 kt", "~12-18 kt", "9 kt"]);
    expect(values[1]?.classList.contains("sc-value-estimated")).toBe(true);
    expect(values[2]?.querySelector(".sc-tag")?.textContent).toBe("model");
    expect(values.map((v) => v.querySelector("sup")?.textContent)).toEqual(["1", "2", "1"]);
    const sources = [...view.container.querySelectorAll(".sc-sources li")];
    expect(sources).toHaveLength(2);
    expect(sources[0]?.id).toBe("sc-source-1");
    expect(sources[0]?.textContent).toContain("USGS");
    expect(sources[1]?.textContent).toContain("IEA");
    const details = view.container.querySelector("details.sc-sources") as HTMLDetailsElement;
    expect(details.open).toBe(false);
    expect(details.querySelector("summary")?.textContent).toBe("Sources (2)");
    const link = values[1]?.querySelector('sup a[href="#sc-source-2"]') as HTMLAnchorElement;
    fireEvent.click(link);
    expect(details.open).toBe(true);
});

test("footnote card carries publisher, as-of, confidence and method", () => {
    const view = render(<FootnotesProvider><SourcedValue value={estimated} /></FootnotesProvider>);
    const link = view.container.querySelector(".sc-ref sup a")!;
    const tip = view.container.querySelector('[role="tooltip"]')!;
    expect(link.getAttribute("aria-describedby")).toBe(tip.id);
    expect(tip.textContent).toContain("IEA");
    expect(tip.textContent).toContain("As of 2025");
    expect(tip.textContent).toContain("Estimate");
    expect(tip.textContent).toContain("Method.");
});

test("MarketShareList shows cited shares, dashes and Other", () => {
    const view = render(<FootnotesProvider><MarketShareList
        companies={COMPANIES.filter((c) => c.segment === "robot-actuator-oem")}
        market={marketOf("robot-actuator-oem")} /></FootnotesProvider>);
    const rows = [...view.container.querySelectorAll(".sc-share li")];
    expect(rows[0]?.querySelector(".sc-share-name")?.textContent).toBe("AgiBot");
    expect(rows[0]?.querySelector(".sc-num")?.textContent).toBe("39%");
    expect(rows[0]?.querySelector('[role="img"]')?.getAttribute("aria-label")).toBe("China");
    const tesla = rows.find((r) => r.textContent?.includes("Tesla"));
    expect(tesla?.querySelector(".sc-num")?.textContent).toBe("~1-4%");
    const fanuc = rows.find((r) => r.textContent?.includes("FANUC"));
    expect(fanuc?.classList.contains("sc-share-none")).toBe(true);
    expect(fanuc?.querySelector(".sc-share-fill")).toBeNull();
    expect(rows.at(-1)?.textContent).toContain("Other");
    expect(view.container.querySelector(".sc-share-cap")?.textContent).toContain("Humanoid robot shipments");
});

test("legend shows all three confidence styles", () => {
    const view = render(<ConfidenceLegend />);
    expect(view.container.querySelectorAll("li")).toHaveLength(3);
    expect(view.container.textContent).toContain("~12 kt");
});

test("supply-chain menu stays hidden until a page is live", () => {
    expect(SUPPLY_CHAIN_PAGES_LIVE.size).toBe(0);
    const view = render(<PublicHeader path="/" />);
    expect(view.container.querySelector(".site-sub")).toBeNull();
    cleanup();
    expect(supplyChainMenu(false, new Set(["/metals"]))).toEqual([
        { label: "Chain", links: [{ href: "/metals", label: "Metals", live: true }] },
    ]);
    const preview = render(<PublicHeader path="/lab/supply-chain" supplyChainPreview />);
    expect(preview.container.querySelectorAll(".site-sub-soon")).toHaveLength(8);
    expect(preview.container.querySelectorAll(".site-sub-panel a")).toHaveLength(0);
});

test("lab page renders every kit component", () => {
    const view = render(<SupplyChainLab />);
    const c = view.container;
    expect(c.querySelectorAll(".sc-waffle")).toHaveLength(3);
    expect(c.querySelectorAll(".sc-hhi, .sc-stage")).toHaveLength(0);
    expect(c.querySelectorAll(".sc-eq-row")).toHaveLength(0);
    for (const v of ["d1", "d2", "d3", "d4"]) expect(c.querySelector(`#perspective-${v} .sc-lab-headline`)).not.toBeNull();
    expect(c.querySelectorAll(".sc-badge")).toHaveLength(0);
    expect(c.querySelectorAll(".sc-share")).toHaveLength(4);
    expect(c.querySelector(".sc-legend")).not.toBeNull();
    expect(c.querySelectorAll(".sc-lab-readouts .sc-value")).toHaveLength(4);
    expect(c.querySelectorAll(".sc-sources li").length).toBeGreaterThanOrEqual(4);
    expect(c.querySelectorAll("footer.site-footer")).toHaveLength(1);
});
