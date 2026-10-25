import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { FootnotesProvider } from "../src/components/supply-chain/footnotes";
import { CompetitorEquivalents } from "../src/components/supply-chain/CompetitorEquivalents";
import { ScaleLadder } from "../src/components/supply-chain/ScaleLadder";
import { UnitTranslation } from "../src/components/supply-chain/UnitTranslation";
import { WaffleGrid, waffleCells } from "../src/components/supply-chain/WaffleGrid";
import {
    EVS_PER_YEAR,
    EFFECTIVE_COMPETITORS,
    EQUIVALENT_METHOD_SOURCES,
    HIGHLY_CONCENTRATED_EQUIVALENT,
    HUMANOIDS_PER_YEAR,
    HUMANOIDS_SHIPPED_2025,
    MAGNET_CAPACITY,
    NDFEB_PER_EV,
    NDFEB_PER_HUMANOID,
    REVENUE_LADDER,
} from "../../src/supply-chain/perspective";

afterEach(cleanup);
const wrap = (node: React.ReactNode) => render(<FootnotesProvider>{node}</FootnotesProvider>);

test("ScaleLadder: log ticks per decade and multiples of the first headline", () => {
    const c = wrap(<ScaleLadder points={REVENUE_LADDER} />).container;
    expect([...c.querySelectorAll(".sc-ladder-tick")].map((t) => t.textContent)).toEqual(["$100M", "$1B", "$10B", "$100B"]);
    const x = [...c.querySelectorAll(".sc-ladder-row:not(.sc-ladder-axis) .sc-ladder-x")].map((t) => t.textContent);
    expect(x[0]).toBe("×1");
    expect(x.at(-1)).toBe("×423");
    expect(c.querySelectorAll(".sc-ladder-row.is-headline")).toHaveLength(2);
});

test("UnitTranslation: one icon per million, range drawn outlined", () => {
    const c = wrap(<UnitTranslation label="Plant" quantity={MAGNET_CAPACITY} per={1_000_000}
        rows={[
            { id: "h", label: "Humanoids", icon: "humanoid", perUnit: NDFEB_PER_HUMANOID, result: HUMANOIDS_PER_YEAR },
            { id: "e", label: "EVs", icon: "car", perUnit: NDFEB_PER_EV, result: EVS_PER_YEAR },
        ]}
        benchmark={{ label: "Shipped", icon: "humanoid", value: HUMANOIDS_SHIPPED_2025 }} />).container;
    const rows = [...c.querySelectorAll(".sc-units-row")];
    expect(rows[0]?.querySelectorAll(".sc-iso")).toHaveLength(10);
    expect(rows[0]?.querySelectorAll(".sc-iso.is-range")).toHaveLength(6);
    expect(rows[1]?.querySelectorAll(".sc-iso")).toHaveLength(14);
    expect(rows[0]?.querySelector(".sc-units-result .sc-num")?.textContent).toBe("4.4-10M");
    expect(c.querySelector(".sc-units-key")?.textContent).toBe("1 icon = 1M");
});

test("WaffleGrid: 100 cells per stage, legend with every country largest first and Other last", () => {
    expect(waffleCells({ CN: 0.691, US: 0.131, other: 0.178 }).reduce((t, p) => t + p.cells, 0)).toBe(100);
    const c = wrap(<WaffleGrid rows={[{ id: "m", label: "Mining", shares: { CN: 270, US: 51, AU: 29, other: 40 } }]} />).container;
    expect(c.querySelectorAll(".sc-waffle-grid span")).toHaveLength(100);
    expect(c.querySelector(".sc-waffle-grid")?.getAttribute("aria-label")).toBe("Mining: China 69%, United States 13%, Australia 7%, Other 10%");
    expect(c.querySelector(".sc-waffle-grid span")?.getAttribute("title")).toBe("China 69%");
    const legend = [...c.querySelectorAll(".sc-waffle-legend li")];
    expect(legend.map((l) => l.querySelector("b")?.textContent)).toEqual(["69%", "13%", "7%", "10%"]);
    expect(legend[0]?.querySelector(".flag")?.getAttribute("aria-label")).toBe("China");
    expect(legend.at(-1)?.textContent).toContain("Other");
});

test("CompetitorEquivalents: one square per equal competitor, most concentrated first", () => {
    const c = wrap(<CompetitorEquivalents markets={EFFECTIVE_COMPETITORS} threshold={HIGHLY_CONCENTRATED_EQUIVALENT} methodSources={EQUIVALENT_METHOD_SOURCES} />).container;
    const rows = [...c.querySelectorAll(".sc-eq-row:not(.sc-eq-head)")];
    expect(rows[0]?.querySelector(".sc-eq-label")?.textContent).toBe("NdFeB magnets");
    expect(rows[0]?.querySelector(".sc-num")?.textContent).toBe("1.1");
    expect(rows[0]?.querySelector(".sc-eq-of")?.textContent).toBe("countries");
    expect(rows.at(-1)?.querySelector(".sc-eq-label")?.textContent).toBe("Smartphone makers");
    expect(rows.at(-1)?.querySelectorAll(".sc-eq-sq > span")).toHaveLength(10);
    expect(rows[0]?.querySelectorAll(".sc-eq-sq > span")).toHaveLength(2);
    expect(c.querySelector(".sc-eq-flag")?.textContent).toContain("below 5.6, regulators call it highly concentrated");
    for (const el of c.querySelectorAll(".sc-eq-label, .sc-eq-of")) expect(el.textContent).not.toContain("HHI");
});
