import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { ActuatorsGallery } from "../src/pages/ActuatorsGallery";
import { ACTUATORS } from "../src/lib/data";
import { selectedIds } from "../src/lib/compare-selection";
import { readFileSync } from "node:fs";
afterEach(cleanup);
test("gallery picks are separate accessible controls with a compact shareable tray", async () => {
    (window as unknown as { happyDOM: { setURL: (url: string) => void } }).happyDOM.setURL("http://localhost/actuators");
    const view = render(<ActuatorsGallery />);
    expect(view.container.querySelectorAll("input[type=checkbox]")).toHaveLength(ACTUATORS.length);
    const boxes = view.getAllByRole("checkbox", { name: /^Compare / });
    expect(boxes).toHaveLength(ACTUATORS.length);
    expect(boxes.every(box => !box.closest("a"))).toBe(true);
    expect(view.container.querySelectorAll("a.bento-card")).toHaveLength(ACTUATORS.length);
    fireEvent.click(boxes[0]);
    expect(view.getByRole("button", { name: "Compare" }).hasAttribute("disabled")).toBe(true);
    fireEvent.click(boxes[1]);
    const link = view.getByRole("link", { name: "Compare selected actuators" });
    expect(link.getAttribute("href")).toStartWith("/compare?compare=");
    expect(view.getAllByRole("button", { name: /^Remove / })).toHaveLength(2);
    expect(new URLSearchParams(window.location.search).get("compare")?.split(",")).toHaveLength(2);
    fireEvent.click(view.getByRole("button", { name: "Clear" }));
    await waitFor(() => expect(view.queryByRole("region", { name: "Selected actuators" })).toBeNull());
    expect(new URLSearchParams(window.location.search).has("compare")).toBe(false);
});

test("validated selection rejects duplicates, unknowns, repeated keys and oversized lists", () => {
    const ids = ACTUATORS.slice(0, 5).map(a => a.id);
    expect(selectedIds(`?compare=${ids.slice(0, 4).join(",")}`)).toEqual(ids.slice(0, 4).sort());
    for (const query of ["?compare=nope", `?compare=${ids[0]},${ids[0]}`, `?compare=${ids[0]}&compare=${ids[1]}`, `?compare=${ids.join(",")}`, "?compare="]) expect(selectedIds(query)).toEqual([]);
});
test("gallery restores silently, caps at four, preserves other query state and follows popstate", async () => {
    const ids = ACTUATORS.slice(0, 4).map(a => a.id);
    window.history.replaceState(null, "", `/actuators?sel=${ids[0]}&q=robot&compare=${ids.join(",")}#keep`);
    const events: unknown[] = [];
    const listener = (e: Event) => events.push((e as CustomEvent).detail);
    window.addEventListener("actuatorlist:compare", listener);
    try {
        const view = render(<ActuatorsGallery />);
        expect(view.getAllByRole("checkbox").filter(b => b.hasAttribute("disabled"))).toHaveLength(ACTUATORS.length - ids.length);
        expect(events).toEqual([]);
        fireEvent.click(view.getAllByRole("button", { name: /^Remove / })[0]);
        expect(events).toHaveLength(1);
        expect(window.location.search).toContain("q=robot");
        expect(window.location.search).toContain("sel=");
        expect(window.location.hash).toBe("#keep");
        window.history.replaceState(null, "", `/actuators?compare=${ids.join(",")}`);
        fireEvent(window, new PopStateEvent("popstate"));
        await waitFor(() => expect(view.getAllByRole("button", { name: /^Remove / })).toHaveLength(4));
        expect(events).toHaveLength(1);
        fireEvent.click(view.getByRole("button", { name: "Clear" }));
        expect(events).toHaveLength(2);
        expect(events[1]).toEqual({ action: "update", productIds: [] });
    } finally { window.removeEventListener("actuatorlist:compare", listener); }
});
test("pick wrapper owns the grid spans and tray is sticky", () => {
    const css = readFileSync(new URL("../src/index.css", import.meta.url), "utf8");
    expect(css).toContain('.bento-pick[data-size="lg"]');
    expect(css).toContain('.bento-pick[data-size="wide"]');
    expect(css).toContain('.pick-tray');
    expect(css).toContain('position: sticky');
    expect(css.includes('.compare-products { display: grid;')).toBe(true);
    expect(css.includes('.compare-spec-scroll { overflow-x: auto;')).toBe(true);
});
