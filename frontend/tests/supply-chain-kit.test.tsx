import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { ConcentrationBadge } from "../src/components/supply-chain/ConcentrationBadge";
import { ConfidenceLegend } from "../src/components/supply-chain/ConfidenceLegend";
import { FootnotesProvider } from "../src/components/supply-chain/footnotes";
import { SourcedValue } from "../src/components/supply-chain/SourcedValue";
import { SourcesSection } from "../src/components/supply-chain/SourcesSection";
import { StageShareBar } from "../src/components/supply-chain/StageShareBar";
import { PublicHeader } from "../src/components/PublicHeader";
import { SupplyChainLab } from "../src/pages/supply-chain/SupplyChainLab";
import { supplyChainMenu, SUPPLY_CHAIN_PAGES_LIVE } from "../../src/public-navigation";
import type { Sourced } from "../../src/supply-chain/sourced";

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
});

test("footnote card opens on tap and closes on Escape", () => {
    const view = render(<FootnotesProvider><SourcedValue value={estimated} /></FootnotesProvider>);
    const button = view.container.querySelector(".sc-ref button")!;
    fireEvent.click(button);
    expect(button.getAttribute("aria-expanded")).toBe("true");
    const tip = view.container.querySelector('[role="tooltip"]')!;
    expect(tip.textContent).toContain("As of 2025");
    expect(tip.textContent).toContain("Estimate");
    expect(tip.textContent).toContain("Method.");
    fireEvent.keyDown(button, { key: "Escape" });
    expect(button.getAttribute("aria-expanded")).toBe("false");
});

test("ConcentrationBadge and StageShareBar read the level at a glance", () => {
    const badge = render(<ConcentrationBadge level="monopolized" top={{ country: "CN", share: 0.94 }} />);
    expect(badge.container.textContent).toBe("MonopolizedCN 94%");
    expect(badge.container.querySelector(".sc-badge-monopolized")).not.toBeNull();
    cleanup();
    const bars = render(<FootnotesProvider><StageShareBar rows={[
        { id: "a", label: "Mining", shares: { CN: 270, US: 51, other: 69 } },
        { id: "b", label: "Spread", shares: { US: 0.2, JP: 0.2, KR: 0.2, CN: 0.2, AU: 0.2 } },
    ]} /></FootnotesProvider>);
    const rows = [...bars.container.querySelectorAll(".sc-stage")];
    const segs = [...(rows[0]?.querySelectorAll(".sc-seg") ?? [])].map((s) => s.getAttribute("title"));
    expect(segs).toEqual(["China 69%", "United States 13%", "Other 18%"]);
    expect(rows[0]?.querySelector(".sc-badge-concentrated")).not.toBeNull();
    expect(rows[1]?.querySelector(".sc-badge-moderate")).not.toBeNull();
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
    expect(c.querySelectorAll(".sc-stage")).toHaveLength(5);
    expect(c.querySelectorAll(".sc-lab-levels .sc-badge")).toHaveLength(4);
    expect(c.querySelector(".sc-legend")).not.toBeNull();
    expect(c.querySelectorAll(".sc-lab-readouts .sc-value")).toHaveLength(4);
    expect(c.querySelectorAll(".sc-sources li").length).toBeGreaterThanOrEqual(4);
    expect(c.querySelectorAll("footer.site-footer")).toHaveLength(1);
});
