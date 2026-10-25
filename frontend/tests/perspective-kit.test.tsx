import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { FootnotesProvider } from "../src/components/supply-chain/footnotes";
import { HhiRuler } from "../src/components/supply-chain/HhiRuler";
import { ScaleLadder } from "../src/components/supply-chain/ScaleLadder";
import { UnitTranslation } from "../src/components/supply-chain/UnitTranslation";
import { WaffleGrid, waffleCells } from "../src/components/supply-chain/WaffleGrid";
import {
    EVS_PER_YEAR,
    HHI_COMPARISONS,
    HIGHLY_CONCENTRATED_HHI,
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

test("WaffleGrid: exactly 100 cells per stage, top country flagged", () => {
    expect(waffleCells({ CN: 0.691, US: 0.131, other: 0.178 }).reduce((t, p) => t + p.cells, 0)).toBe(100);
    const c = wrap(<WaffleGrid rows={[{ id: "m", label: "Magnets", shares: { CN: 0.94, other: 0.06 } }]} />).container;
    expect(c.querySelectorAll(".sc-waffle-grid span")).toHaveLength(100);
    expect(c.querySelector(".sc-waffle-grid")?.getAttribute("aria-label")).toBe("Magnets: China 94%, Other 6%");
    expect(c.querySelector(".sc-waffle-top .flag")?.getAttribute("aria-label")).toBe("China");
});

test("HhiRuler: rows sorted, threshold line on every row", () => {
    const c = wrap(<HhiRuler threshold={HIGHLY_CONCENTRATED_HHI} points={HHI_COMPARISONS} />).container;
    const labels = [...c.querySelectorAll(".sc-hhi-row:not(.sc-hhi-axis):not(.sc-hhi-zone) .sc-hhi-label")].map((l) => l.textContent);
    expect(labels[0]).toBe("Humanoid makers");
    expect(labels.at(-1)).toBe("NdFeB magnets");
    expect(c.querySelectorAll(".sc-hhi-line")).toHaveLength(HHI_COMPARISONS.length + 1);
    expect(c.querySelector(".sc-hhi-zone")?.textContent).toContain("1,800+");
});
