import "./happydom";
import { afterEach, expect, spyOn, test } from "bun:test";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { StrictMode } from "react";
import { AllActuators } from "../src/pages/AllActuators";
import { ACTUATORS } from "../src/lib/data";

const ids = ACTUATORS.slice(0, 5).map(a => a.id);
const setURL = (path: string) => (window as unknown as { happyDOM: { setURL: (url: string) => void } }).happyDOM.setURL(`http://localhost${path}`);
const params = () => new URLSearchParams(window.location.search);
const checkedIds = () => ACTUATORS.filter(a => (document.querySelector(`input[aria-label="Compare ${a.name}"]`) as HTMLInputElement | null)?.checked).map(a => a.id).sort();
afterEach(cleanup);

test("restores the shared validated compare selection without measurement or URL writes", () => {
    setURL(`/all?compare=${ids.slice(0, 2).join(",")}&sel=${ids[0]}#table`);
    const original = window.location.href;
    const events: unknown[] = [];
    const listener = (e: Event) => events.push((e as CustomEvent).detail);
    const push = spyOn(window.history, "pushState");
    const replace = spyOn(window.history, "replaceState");
    window.addEventListener("actuatorlist:compare", listener);
    try {
        const view = render(<StrictMode><AllActuators /></StrictMode>);
        expect(checkedIds()).toEqual(ids.slice(0, 2).sort());
        expect(view.getByRole("button", { name: /^Compare$/ }).hasAttribute("disabled")).toBe(false);
        expect(window.location.href).toBe(original);
        expect(events).toEqual([]);
        expect(push).not.toHaveBeenCalled();
        expect(replace).not.toHaveBeenCalled();
    } finally {
        window.removeEventListener("actuatorlist:compare", listener);
        push.mockRestore(); replace.mockRestore();
    }
});

test("picks and unpicks write comparison URLs preserving filters, detail selection and hash", () => {
    setURL(`/all?sort=price_usd&dir=asc&sel=${ids[0]}&extra=keep#table`);
    const view = render(<AllActuators />);
    const pick = (id: string) => fireEvent.click(view.getByRole("checkbox", { name: `Compare ${ACTUATORS.find(a => a.id === id)!.name}` }));
    pick(ids[0]);
    expect(params().get("compare")).toBe(ids[0]);
    pick(ids[1]);
    expect(params().get("compare")).toBe(ids.slice(0, 2).sort().join(","));
    expect(params().get("sel")).toBe(ids[0]);
    expect(params().get("sort")).toBe("price_usd");
    expect(params().get("dir")).toBe("asc");
    expect(params().get("extra")).toBe("keep");
    expect(window.location.hash).toBe("#table");
    pick(ids[0]);
    expect(params().get("compare")).toBe(ids[1]);
    fireEvent.click(view.container.querySelector(".compare-dock button")!);
    expect(params().has("compare")).toBe(false);
    expect(params().get("sel")).toBe(ids[0]);
    expect(window.location.hash).toBe("#table");
});

test("filter and drawer actions retain comparison state in their URL writes", () => {
    setURL(`/all?compare=${ids.slice(0, 2).join(",")}#table`);
    const view = render(<AllActuators />);
    fireEvent.click(view.getByRole("button", { name: "Filters" }));
    fireEvent.click(view.container.querySelector('[aria-label="Category filter"] button')!);
    expect(params().get("cat")).toBeTruthy();
    expect(params().get("compare")).toBe(ids.slice(0, 2).sort().join(","));
    fireEvent.click(view.container.querySelector(".filterbar button.reset")!);
    fireEvent.click(view.getByRole("checkbox", { name: `Compare ${ACTUATORS[0].name}` }).closest("tr")!);
    expect(params().get("sel")).toBe(ids[0]);
    expect(params().get("compare")).toBe(ids.slice(0, 2).sort().join(","));
    expect(window.location.hash).toBe("#table");
});

test("popstate restores filters, detail and comparison without history writes or measurement", () => {
    setURL(`/all?compare=${ids.slice(0, 2).join(",")}`);
    const view = render(<StrictMode><AllActuators /></StrictMode>);
    const push = spyOn(window.history, "pushState");
    const replace = spyOn(window.history, "replaceState");
    const events: unknown[] = [];
    const listener = (e: Event) => events.push((e as CustomEvent).detail);
    window.addEventListener("actuatorlist:compare", listener);
    try {
        // Happy DOM does not emulate native history traversal: deliver the same
        // URL/popstate boundary that browser back and forward provide.
        act(() => {
            setURL(`/all?compare=${ids[2]}&q=${encodeURIComponent(ACTUATORS[2].name)}&sel=${ids[2]}#table`);
            window.dispatchEvent(new PopStateEvent("popstate"));
        });
        expect(checkedIds()).toEqual([ids[2]]);
        expect((view.getByPlaceholderText("Search actuators, brands...") as HTMLInputElement).value).toBe(ACTUATORS[2].name);
        expect(view.container.querySelector(".drawer")).not.toBeNull();
        expect(view.getByRole("button", { name: /^Compare$/ }).hasAttribute("disabled")).toBe(true);
        const target = window.location.href;
        act(() => window.dispatchEvent(new PopStateEvent("popstate")));
        expect(window.location.href).toBe(target);
        act(() => {
            setURL(`/all?compare=${ids.slice(0, 2).join(",")}`);
            window.dispatchEvent(new PopStateEvent("popstate"));
        });
        expect(checkedIds()).toEqual(ids.slice(0, 2).sort());
        expect(push).not.toHaveBeenCalled();
        expect(replace).not.toHaveBeenCalled();
        expect(events).toEqual([]);
    } finally {
        window.removeEventListener("actuatorlist:compare", listener);
        push.mockRestore(); replace.mockRestore();
    }
});

// Regression coverage for the shared validator and existing panel workflow.
for (const query of [
    `compare=unknown-product`,
    `compare=${ids[0]},${ids[0]}`,
    `compare=${ids.join(",")}`,
    `compare=${ids[0]}&compare=${ids[1]}`,
    "compare=",
]) {
    test(`rejects malformed shared selection: ${query}`, () => {
        setURL(`/all?${query}`);
        const view = render(<AllActuators />);
        expect(checkedIds()).toEqual([]);
        expect(view.container.querySelector(".compare-dock")).toBeNull();
    });
}

test("four-selection limit and panel removals keep the same URL-backed selection", () => {
    setURL(`/all?compare=${ids.slice(0, 4).join(",")}&sel=${ids[0]}#table`);
    const view = render(<AllActuators />);
    const original = window.location.href;
    fireEvent.click(view.getByRole("checkbox", { name: `Compare ${ACTUATORS[4].name}` }));
    expect(window.location.href).toBe(original);
    expect(checkedIds()).toEqual(ids.slice(0, 4).sort());
    fireEvent.click(view.getByRole("button", { name: /^Compare$/ }));
    fireEvent.click(view.getByRole("button", { name: `Remove ${ACTUATORS[0].name}` }));
    expect(params().get("compare")).toBe(ids.slice(1, 4).sort().join(","));
    expect(params().get("sel")).toBe(ids[0]);
    expect(window.location.hash).toBe("#table");
    while (view.queryAllByRole("button", { name: /^Remove / }).length) {
        fireEvent.click(view.getAllByRole("button", { name: /^Remove / })[0]);
    }
    expect(params().has("compare")).toBe(false);
    expect(view.container.querySelector(".compare-dock")).toBeNull();
});

test("the filters popover writes country choices to the URL and shows them as removable pills", () => {
    setURL("/all");
    const view = render(<AllActuators />);
    expect(view.container.querySelector('[aria-label="Country filter"]')).toBeNull();
    fireEvent.click(view.getByRole("button", { name: "Filters" }));
    const country = ACTUATORS.find(a => a.country)!.country!;
    fireEvent.click(view.container.querySelector(`[aria-label="Country filter"] button[title="${country}"]`)!);
    expect(params().get("country")).toBe(country);
    expect(view.getByRole("button", { name: "Filters, 1 active" })).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(view.container.querySelector('[aria-label="Country filter"]')).toBeNull();
    fireEvent.click(view.getByRole("button", { name: `Clear filter: ${country}` }));
    expect(params().has("country")).toBe(false);
});
