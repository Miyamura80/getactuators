import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { StrictMode } from "react";
import { DetailPanel } from "../src/components/DetailPanel";
import { AllActuators } from "../src/pages/AllActuators";
import { ACTUATORS } from "../src/lib/data";

afterEach(cleanup);
test("drawer primary links are instrumented but citations are not", () => {
    const a = ACTUATORS.find((product) => product.product_url && product.datasheet_url);
    if (!a) throw new Error("Need catalog product with both primary links");
    const view = render(<DetailPanel actuator={a} onClose={() => {}} />);
    expect(view.getByText("Product page").getAttribute("data-measure-event")).toBe("manufacturer_click");
    expect(view.getByText("Datasheet").getAttribute("data-product-id")).toBe(a.id);
    expect(document.querySelector(".drawer-sources [data-measure-event]")).toBeNull();
});
test("comparison opens and removals dispatch only user actions, not StrictMode renders or selection toggles", () => {
    window.history.replaceState(null, "", "/all");
    const events: unknown[] = [];
    const listener = (e: Event) => events.push((e as CustomEvent).detail);
    window.addEventListener("actuatorlist:compare", listener);
    try {
        const view = render(<StrictMode><AllActuators /></StrictMode>);
        const boxes = view.getAllByRole("checkbox");
        // Compare selection controls are labelled per product, not category filters.
        const compareBoxes = boxes.filter((box) => box.getAttribute("aria-label")?.startsWith("Compare "));
        expect(compareBoxes.length).toBeGreaterThan(1);
        fireEvent.click(compareBoxes[0]); fireEvent.click(compareBoxes[1]);
        expect(events).toEqual([]);
        fireEvent.click(view.getByRole("button", { name: /^Compare$/ }));
        expect(events).toHaveLength(1);
        expect(events[0]).toEqual({ action: "open", productIds: expect.arrayContaining([expect.any(String), expect.any(String)]) });
        view.rerender(<StrictMode><AllActuators /></StrictMode>);
        expect(events).toHaveLength(1);
        fireEvent.click(view.getAllByRole("button", { name: /^Remove / })[0]);
        expect(events).toHaveLength(2);
    } finally { window.removeEventListener("actuatorlist:compare", listener); }
});