import "./happydom";
import { afterEach, beforeEach, expect, test } from "bun:test";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { BOM_CASES, getBomCase } from "../../src/supply-chain/bom";
import { Bom } from "../src/pages/supply-chain/bom/Bom";
import { marginSegments } from "../src/pages/supply-chain/bom/MarginBar";
import { SMALL_PARTS_ID, caseModel, graphModel, makerOf, sankeyModel, topSankey } from "../src/pages/supply-chain/bom/model";
import { setWebGLSupport } from "../src/three/support";

const setURL = (path: string) =>
    (window as unknown as { happyDOM: { setURL: (u: string) => void } }).happyDOM.setURL(`http://localhost${path}`);

beforeEach(() => setWebGLSupport(false));

afterEach(() => {
    cleanup();
    setWebGLSupport(undefined);
});

const optimus = () => {
    const c = getBomCase("optimus-linear");
    if (!c) throw new Error("missing case");
    return caseModel(c);
};

test("sankey model drops unlinked nodes and badges only wide nodes", () => {
    const m = optimus();
    const s = sankeyModel(m, "cost");
    const ids = new Set(s.links.flatMap((l) => [l.source, l.target]));
    expect(s.nodes.every((n) => ids.has(n.id))).toBe(true);
    expect(s.nodes.find((n) => n.id === "roller-screw")?.badges?.some((b) => b.kind === "idiot-index")).toBe(true);
    expect(s.nodes.find((n) => n.id === "rollers")?.badges).toEqual([]);
});

test("compare sankey keeps the top tier and merges slivers", () => {
    const unitree = getBomCase("unitree-qdd");
    if (!unitree) throw new Error("missing case");
    const t = topSankey(caseModel(unitree));
    expect(t.nodes.map((n) => n.id)).toContain(SMALL_PARTS_ID);
    expect(t.nodes.some((n) => n.id === "stator")).toBe(false);
});

test("graph links each maker to its buyer, and selection falls back to an ancestor's maker", () => {
    const m = optimus();
    const g = graphModel(m);
    expect(g.edges.some((e) => e.from === "beite" && e.to === "sanhua")).toBe(true);
    expect(makerOf(m, "rollers")).toBe("beite");
    expect(makerOf(m, "force-sensor")).toBe("sanhua");
});

test("margin segments add up to the whole price", () => {
    for (const c of BOM_CASES) {
        const total = marginSegments(c).reduce((s, x) => s + x.share, 0);
        expect(total).toBeCloseTo(1, 6);
    }
});

test("the index lists every case with its margin bar", () => {
    setURL("/bom");
    const { getAllByRole, getByText } = render(<Bom />);
    for (const c of BOM_CASES) expect(getByText(c.name)).toBeTruthy();
    expect(getAllByRole("img", { name: /Share of the price/ })).toHaveLength(BOM_CASES.length);
});

test("a case page syncs the part panel, Sankey and graph through #node=", async () => {
    setURL("/bom/optimus-linear#node=roller-screw");
    const { container, getByRole } = render(<Bom />);
    const panel = getByRole("complementary", { name: "Selected part" });
    expect(panel.textContent).toContain("Planetary roller screw");
    expect(panel.textContent).toContain("Beite Technology");
    // The graph lights the maker.
    expect(container.querySelector('.fk-card.is-selected[data-node="beite"]')).toBeTruthy();
    // Pick a raw material from the Sankey.
    const copper = container.querySelector<HTMLButtonElement>('.fk-node-hit[aria-label^="Copper"]');
    expect(copper).toBeTruthy();
    await act(async () => { if (copper) fireEvent.click(copper); });
    expect(window.location.hash).toBe("#node=m-copper");
    expect(panel.textContent).toContain("Used in");
    // Raw-material mode keeps the selection.
    await act(async () => { fireEvent.click(getByRole("radio", { name: "Raw material only" })); });
    expect(window.location.hash).toBe("#node=m-copper");
});
