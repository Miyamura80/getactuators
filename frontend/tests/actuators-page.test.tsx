import "./happydom";
import { afterEach, expect, spyOn, test } from "bun:test";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { StrictMode } from "react";
import { ActuatorsPage } from "../src/pages/actuators/ActuatorsPage";
import { ACTUATORS } from "../src/lib/data";
import { CATEGORIES } from "../src/types";

const ids = ACTUATORS.slice(0, 5).map(a => a.id);
const setURL = (path: string) => (window as unknown as { happyDOM: { setURL: (url: string) => void } }).happyDOM.setURL(`http://localhost${path}`);
const params = () => new URLSearchParams(window.location.search);
const checkedIds = () => ACTUATORS.filter(a => (document.querySelector(`input[aria-label="Compare ${a.name}"]`) as HTMLInputElement | null)?.checked).map(a => a.id).sort();
const tray = (view: ReturnType<typeof render>) => view.queryByRole("region", { name: "Selected actuators" });
afterEach(() => {
    cleanup();
    window.localStorage.clear();
});

test("gallery is the default view and the switch moves to the list, remembering the choice", () => {
    setURL("/actuators");
    const view = render(<ActuatorsPage />);
    expect(view.getByRole("button", { name: "Gallery view" }).getAttribute("aria-pressed")).toBe("true");
    expect(view.container.querySelectorAll("a.bento-card")).toHaveLength(ACTUATORS.length);
    expect(view.container.querySelector("#table")).toBeNull();
    fireEvent.click(view.getByRole("button", { name: "List view" }));
    expect(params().get("view")).toBe("list");
    expect(view.container.querySelector("#table table")).not.toBeNull();
    expect(view.container.querySelector("a.bento-card")).toBeNull();
    expect(view.queryByRole("group", { name: "Group actuators by" })).toBeNull();
    cleanup();
    // A later visit without ?view opens the remembered list.
    setURL("/actuators");
    const again = render(<ActuatorsPage />);
    expect(again.getByRole("button", { name: "List view" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(again.getByRole("button", { name: "Gallery view" }));
    expect(params().has("view")).toBe(false);
    expect(window.localStorage.getItem("actuatorlist:view")).toBe("gallery");
});

test("filters apply to the gallery and survive switching views", () => {
    const cat = CATEGORIES.find(c => ACTUATORS.some(a => a.category === c.slug))!;
    const inCat = ACTUATORS.filter(a => a.category === cat.slug).length;
    setURL(`/actuators?cat=${cat.slug}`);
    const view = render(<ActuatorsPage />);
    expect(view.container.querySelectorAll("a.bento-card")).toHaveLength(inCat);
    fireEvent.click(view.getByRole("button", { name: "List view" }));
    expect(params().get("cat")).toBe(cat.slug);
    expect(view.container.querySelectorAll("#table tbody tr")).toHaveLength(inCat);
});

test("a gallery with no matches says so instead of rendering empty sections", () => {
    setURL("/actuators?q=zzzz-no-such-part");
    const view = render(<ActuatorsPage />);
    expect(view.getByText("No actuators match these filters.")).toBeTruthy();
    expect(view.container.querySelector(".gallery-section")).toBeNull();
});

test("a prerendered mount starts as the default gallery and applies the URL after hydration", () => {
    setURL(`/actuators?view=list&by=application`);
    const view = render(<ActuatorsPage prerendered />);
    expect(view.container.querySelector("#table table")).not.toBeNull();
    expect(params().get("by")).toBe("application");
});

test("restores the shared validated compare selection without measurement or URL writes", () => {
    setURL(`/actuators?view=list&compare=${ids.slice(0, 2).join(",")}&sel=${ids[0]}#table`);
    const original = window.location.href;
    const events: unknown[] = [];
    const listener = (e: Event) => events.push((e as CustomEvent).detail);
    const push = spyOn(window.history, "pushState");
    const replace = spyOn(window.history, "replaceState");
    window.addEventListener("actuatorlist:compare", listener);
    try {
        const view = render(<StrictMode><ActuatorsPage /></StrictMode>);
        expect(checkedIds()).toEqual(ids.slice(0, 2).sort());
        expect(view.getByRole("link", { name: "Compare selected actuators" })).toBeTruthy();
        expect(view.container.querySelector(".drawer")).not.toBeNull();
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
    setURL(`/actuators?view=list&sort=price_usd&dir=asc&sel=${ids[0]}&extra=keep#table`);
    const view = render(<ActuatorsPage />);
    const pick = (id: string) => fireEvent.click(view.getByRole("checkbox", { name: `Compare ${ACTUATORS.find(a => a.id === id)!.name}` }));
    pick(ids[0]);
    expect(params().get("compare")).toBe(ids[0]);
    pick(ids[1]);
    expect(params().get("compare")).toBe(ids.slice(0, 2).sort().join(","));
    expect(params().get("sel")).toBe(ids[0]);
    expect(params().get("sort")).toBe("price_usd");
    expect(params().get("dir")).toBe("asc");
    expect(params().get("view")).toBe("list");
    expect(params().get("extra")).toBe("keep");
    expect(window.location.hash).toBe("#table");
    pick(ids[0]);
    expect(params().get("compare")).toBe(ids[1]);
    fireEvent.click(view.getByRole("button", { name: "Clear" }));
    expect(params().has("compare")).toBe(false);
    expect(params().get("sel")).toBe(ids[0]);
    expect(window.location.hash).toBe("#table");
});

test("filter, view and drawer actions retain comparison state in their URL writes", () => {
    setURL(`/actuators?view=list&compare=${ids.slice(0, 2).join(",")}#table`);
    const view = render(<ActuatorsPage />);
    fireEvent.click(view.getByRole("button", { name: "Filters" }));
    fireEvent.click(view.container.querySelector('[aria-label="Category filter"] button')!);
    expect(params().get("cat")).toBeTruthy();
    expect(params().get("compare")).toBe(ids.slice(0, 2).sort().join(","));
    fireEvent.click(view.container.querySelector(".filterbar button.reset")!);
    fireEvent.click(view.getByRole("checkbox", { name: `Compare ${ACTUATORS[0].name}` }).closest("tr")!);
    expect(params().get("sel")).toBe(ids[0]);
    expect(params().get("compare")).toBe(ids.slice(0, 2).sort().join(","));
    fireEvent.click(view.getByRole("button", { name: "Gallery view" }));
    expect(params().get("compare")).toBe(ids.slice(0, 2).sort().join(","));
    expect(checkedIds()).toEqual(ids.slice(0, 2).sort());
    expect(window.location.hash).toBe("#table");
});

test("popstate restores view, filters, detail and comparison without history writes or measurement", () => {
    setURL(`/actuators?view=list&compare=${ids.slice(0, 2).join(",")}`);
    const view = render(<StrictMode><ActuatorsPage /></StrictMode>);
    const push = spyOn(window.history, "pushState");
    const replace = spyOn(window.history, "replaceState");
    const events: unknown[] = [];
    const listener = (e: Event) => events.push((e as CustomEvent).detail);
    window.addEventListener("actuatorlist:compare", listener);
    try {
        // Happy DOM does not emulate native history traversal: deliver the same
        // URL/popstate boundary that browser back and forward provide.
        act(() => {
            setURL(`/actuators?view=list&compare=${ids[2]}&q=${encodeURIComponent(ACTUATORS[2].name)}&sel=${ids[2]}#table`);
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
            setURL(`/actuators?compare=${ids.slice(0, 2).join(",")}`);
            window.dispatchEvent(new PopStateEvent("popstate"));
        });
        expect(checkedIds()).toEqual(ids.slice(0, 2).sort());
        expect(view.container.querySelector("a.bento-card")).not.toBeNull();
        expect(push).not.toHaveBeenCalled();
        expect(replace).not.toHaveBeenCalled();
        expect(events).toEqual([]);
    } finally {
        window.removeEventListener("actuatorlist:compare", listener);
        push.mockRestore(); replace.mockRestore();
    }
});

// Regression coverage for the shared validator.
for (const query of [
    `compare=unknown-product`,
    `compare=${ids[0]},${ids[0]}`,
    `compare=${ids.join(",")}`,
    `compare=${ids[0]}&compare=${ids[1]}`,
    "compare=",
]) {
    test(`rejects malformed shared selection: ${query}`, () => {
        setURL(`/actuators?view=list&${query}`);
        const view = render(<ActuatorsPage />);
        expect(checkedIds()).toEqual([]);
        expect(tray(view)).toBeNull();
    });
}

test("four-selection limit and tray removals keep the same URL-backed selection", () => {
    setURL(`/actuators?view=list&compare=${ids.slice(0, 4).join(",")}&sel=${ids[0]}#table`);
    const view = render(<ActuatorsPage />);
    const original = window.location.href;
    fireEvent.click(view.getByRole("checkbox", { name: `Compare ${ACTUATORS[4].name}` }));
    expect(window.location.href).toBe(original);
    expect(checkedIds()).toEqual(ids.slice(0, 4).sort());
    fireEvent.click(view.getByRole("button", { name: `Remove ${ACTUATORS[0].name}` }));
    expect(params().get("compare")).toBe(ids.slice(1, 4).sort().join(","));
    expect(params().get("sel")).toBe(ids[0]);
    expect(window.location.hash).toBe("#table");
    while (view.queryAllByRole("button", { name: /^Remove / }).length) {
        fireEvent.click(view.getAllByRole("button", { name: /^Remove / })[0]);
    }
    expect(params().has("compare")).toBe(false);
    expect(tray(view)).toBeNull();
});

test("the filters popover writes country choices to the URL and shows them as removable pills", () => {
    setURL("/actuators");
    const view = render(<ActuatorsPage />);
    expect(view.container.querySelector('[aria-label="Country filter"]')).toBeNull();
    fireEvent.click(view.getByRole("button", { name: "Filters" }));
    const country = ACTUATORS.find(a => a.country)!.country!;
    fireEvent.click(view.container.querySelector(`[aria-label="Country filter"] button[title="${country}"]`)!);
    expect(params().get("country")).toBe(country);
    expect(view.getByRole("button", { name: "Filters, 1 active" })).toBeTruthy();
    expect(view.container.querySelectorAll("a.bento-card")).toHaveLength(ACTUATORS.filter(a => a.country === country).length);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(view.container.querySelector('[aria-label="Country filter"]')).toBeNull();
    fireEvent.click(view.getByRole("button", { name: `Clear filter: ${country}` }));
    expect(params().has("country")).toBe(false);
});
