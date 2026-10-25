import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { FootnotesProvider } from "../src/components/supply-chain/footnotes";
import { LeaderBars } from "../src/components/supply-chain/LeaderBars";
import { WithoutLeader } from "../src/components/supply-chain/WithoutLeader";
import { UnitTranslation } from "../src/components/supply-chain/UnitTranslation";
import { WaffleGrid, waffleCells } from "../src/components/supply-chain/WaffleGrid";
import {
    EVS_PER_YEAR,
    DOMINANCE_MARKETS,
    HUMANOIDS_PER_YEAR,
    HUMANOIDS_SHIPPED_2025,
    MAGNET_CAPACITY,
    NDFEB_PER_EV,
    NDFEB_PER_HUMANOID,
} from "../../src/supply-chain/perspective";

afterEach(cleanup);
const wrap = (node: React.ReactNode) => render(<FootnotesProvider>{node}</FootnotesProvider>);

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

const market = (id: string) => DOMINANCE_MARKETS.find((m) => m.id === id)!;

test("LeaderBars: sorted by the leader's share, rare earths marked, leader named", () => {
    const c = wrap(<LeaderBars markets={DOMINANCE_MARKETS} />).container;
    const rows = [...c.querySelectorAll(".sc-lead-row")];
    expect(rows.map((r) => r.querySelector(".sc-lead-label")?.textContent)).toEqual([
        "NdFeB magnets", "Rare earth separation", "Web search", "Rare earth mining", "Humanoid robots", "Smartphones",
    ]);
    expect(rows[0]?.classList.contains("is-ree")).toBe(true);
    expect(rows[2]?.classList.contains("is-ree")).toBe(false);
    expect(rows[2]?.querySelector(".sc-lead-who")?.textContent).toContain("Google");
    expect(rows.at(-1)?.querySelector(".sc-lead-who b")?.textContent).toBe("20%");
});

test("WithoutLeader: the leader's part shown as gone, the rest as left", () => {
    const c = wrap(<WithoutLeader markets={["mining", "separation", "magnet"].map(market)} />).container;
    const left = [...c.querySelectorAll(".sc-gone-value b")].map((b) => b.textContent);
    expect(left).toEqual(["31%", "9%", "6%"]);
    expect(c.querySelector(".sc-gone-lost")?.textContent).toContain("69% gone");
});
