import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { FootnotesProvider } from "../src/components/supply-chain/footnotes";
import { LeaderBars } from "../src/components/supply-chain/LeaderBars";
import { OutOfTen } from "../src/components/supply-chain/OutOfTen";
import { PlayersToNinety } from "../src/components/supply-chain/PlayersToNinety";
import { WithoutLeader } from "../src/components/supply-chain/WithoutLeader";
import { ScaleLadder } from "../src/components/supply-chain/ScaleLadder";
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

const market = (id: string) => DOMINANCE_MARKETS.find((m) => m.id === id)!;

test("OutOfTen: ten items per stage, coloured by maker, exact share on hover", () => {
    const c = wrap(<OutOfTen rows={[
        { market: market("mining"), icon: "ore", item: "tonnes of ore" },
        { market: market("magnet"), icon: "magnet", item: "magnets" },
    ]} />).container;
    const rows = [...c.querySelectorAll(".sc-ten-row")];
    expect(rows[0]?.querySelectorAll(".sc-ten-items svg")).toHaveLength(10);
    expect(rows[1]?.querySelector(".sc-ten-lead")?.textContent).toContain("9 of 10");
    expect(rows[0]?.querySelector(".sc-ten-lead")?.textContent).toContain("7 of 10");
    expect(rows[1]?.querySelector(".sc-ten-items svg title")?.textContent).toBe("China 94%");
    expect(rows[1]?.querySelector(".sc-ten-items")?.getAttribute("aria-label")).toBe("9 of 10 magnets from China, 1 of 10 magnets from others");
});

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

test("PlayersToNinety: the real players that reach 90%, fewest first", () => {
    const c = wrap(<PlayersToNinety markets={DOMINANCE_MARKETS.filter((m) => m.id !== "humanoids")} />).container;
    const rows = [...c.querySelectorAll(".sc-ninety-row")];
    const counts = rows.map((r) => r.querySelector(".sc-ninety-count")?.textContent);
    expect(counts).toEqual(["1", "1", "1", "4", "8+"]);
    const phones = rows.at(-1)!;
    expect(phones.querySelectorAll(".sc-chip:not(.is-more)")).toHaveLength(5);
    expect(phones.querySelector(".sc-chip.is-more")?.textContent).toBe("+3 more");
});

test("WithoutLeader: the leader's part shown as gone, the rest as left", () => {
    const c = wrap(<WithoutLeader markets={["mining", "separation", "magnet"].map(market)} />).container;
    const left = [...c.querySelectorAll(".sc-gone-value b")].map((b) => b.textContent);
    expect(left).toEqual(["31%", "9%", "6%"]);
    expect(c.querySelector(".sc-gone-lost")?.textContent).toContain("69% gone");
});
