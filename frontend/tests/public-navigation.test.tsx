import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { mountApp } from "../src/startup";
import { act } from "@testing-library/react";
import homeCapture from "./fixtures/home.json";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { PublicHeader } from "../src/components/PublicHeader";
import App from "../src/App";
import { Home } from "../src/pages/Home";
import { AllActuators } from "../src/pages/AllActuators";
import { ActuatorsGallery } from "../src/pages/ActuatorsGallery";
import { Agents } from "../src/pages/Agents";
import { ExplodedView } from "../src/pages/ExplodedView";
import { FOOTER_GROUPS } from "../../src/public-navigation";

afterEach(cleanup);

test("homepage startup preserves a menu opened before JavaScript mounts", async () => {
    (window as unknown as { happyDOM: { setURL: (url: string) => void } }).happyDOM.setURL("http://localhost:1/");
    document.body.innerHTML = homeCapture.body;
    const root = document.getElementById("root")!;
    root.querySelector<HTMLDetailsElement>(".site-menu")!.open = true;
    let mounted: ReturnType<typeof mountApp> | undefined;
    try {
        await act(async () => { mounted = mountApp(root); });
        expect(root.querySelector<HTMLDetailsElement>(".site-menu")?.open).toBe(true);
        expect(document.querySelectorAll("footer.site-footer")).toHaveLength(1);
    } finally {
        await act(async () => { mounted?.unmount(); });
        document.body.innerHTML = "";
    }
});

test("homepage footer is a page-level landmark outside its main content", () => {
    const view = render(<App />);
    // Assert a bounded boolean: formatting a failing DOM node can traverse
    // cyclic Happy DOM documents and exhaust memory.
    expect(Boolean(view.container.querySelector("footer.site-footer")?.closest("main"))).toBe(false);
});

test("mobile menu Escape closes the disclosure and returns focus to its icon", () => {
    const view = render(<PublicHeader path="/" />);
    const menu = view.container.querySelector("details")!;
    const summary = menu.querySelector("summary")!;
    menu.open = true;
    menu.querySelector<HTMLAnchorElement>("nav a")!.focus();
    fireEvent.keyDown(menu, { key: "Escape" });
    expect(menu.open).toBe(false);
    expect(document.activeElement === summary).toBe(true);
});

test("resizing to desktop resets the native mobile menu", () => {
    const view = render(<PublicHeader path="/" />);
    const menu = view.container.querySelector("details")!;
    menu.open = true;
    Object.defineProperty(window, "innerWidth", { value: 1200, configurable: true });
    fireEvent(window, new Event("resize"));
    expect(menu.open).toBe(false);
});

test("public SPA headers share native mobile disclosure and active route links", () => {
    for (const [page, path] of [[<App />, "/"], [<Home />, "/robots"], [<AllActuators />, "/all"], [<ActuatorsGallery />, "/actuators"], [<Agents />, "/agents"], [<ExplodedView id="cubemars-ak80-9" />, "/actuators"]] as const) {
        const view = render(page);
        const header = view.container.querySelector("header.site-header")!;
        expect(header).not.toBeNull();
        const menu = header.querySelector("details")!;
        expect(menu.open).toBe(false);
        expect(menu.querySelector("summary")?.textContent).toBe("");
        expect(menu.querySelector("summary")?.getAttribute("aria-label")).toBe("Menu");
        expect(Boolean(menu.querySelector('summary svg[aria-hidden="true"] path'))).toBe(true);
        expect(header.querySelector(`a[href="${path}"][aria-current="page"]`)).not.toBeNull();
        expect(header.querySelector(".alpha-tag")?.textContent).toBe("alpha");
        for (const link of header.querySelectorAll("nav a")) {
            const event = new MouseEvent("click", { bubbles: true, cancelable: true });
            link.dispatchEvent(event);
            expect(event.defaultPrevented).toBe(false);
        }
        cleanup();
    }
});

test("each public SPA surface has exactly one shared grouped footer and retains its warning", () => {
    for (const page of [<App />, <Home />, <AllActuators />, <ActuatorsGallery />, <Agents />]) {
        const view = render(page);
        expect(view.container.querySelectorAll("footer.site-footer")).toHaveLength(1);
        for (const group of FOOTER_GROUPS) for (const [href, label] of group.links) {
            expect(view.container.querySelector(`footer a[href="${href}"]`)?.textContent).toBe(label);
        }
        if (view.container.querySelector(".hero")) expect(view.container.textContent).toContain("verify against datasheets before engineering use.");
        cleanup();
    }
});
