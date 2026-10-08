import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { Compare } from "../src/pages/Compare";
import { mountApp } from "../src/startup";

afterEach(cleanup);
const setURL = (path: string) => (window as unknown as { happyDOM: { setURL: (url: string) => void } }).happyDOM.setURL(`http://localhost${path}`);
test("two-to-one removal keeps the remaining card before any directory and preserves URL state", () => {
    setURL("/compare?compare=cubemars-ak80-9,xiaomi-cybergear&keep=1#keep");
    const view = render(<Compare />);
    fireEvent.click(view.getByRole("button", { name: /^Remove CyberGear Micromotor$/ }));
    expect(document.activeElement === view.getByRole("button", { name: /^Remove / })).toBe(true);
    expect(view.container.querySelector(".comparison-hub") === null).toBe(true);
    expect(view.getByRole("button", { name: /^Remove / }).getAttribute("aria-label")).toContain("AK80-9");
    expect(view.getByRole("status").textContent).toContain("Pick 2–4");
    expect(window.location.search).toBe("?compare=cubemars-ak80-9&keep=1");
    expect(window.location.hash).toBe("#keep");
});
test("direct one-ID startup shows recovery and a remaining card without the directory", async () => {
    setURL("/compare?compare=cubemars-ak80-9");
    const container = document.createElement("div");
    document.body.append(container);
    let root: ReturnType<typeof mountApp> | undefined;
    try {
        await act(async () => { root = mountApp(container); });
        expect(container.querySelector(".comparison-hub") === null).toBe(true);
        expect(container.querySelectorAll("button[aria-label^='Remove']")).toHaveLength(1);
        expect(container.querySelector("[role=status]") !== null).toBe(true);
    } finally {
        await act(async () => root?.unmount());
        container.remove();
    }
});
test("invalid selection retains the bounded recovery helper and zero-selection directory", () => {
    setURL("/compare?compare=nope");
    const view = render(<Compare />);
    expect(view.container.querySelector(".comparison-hub") !== null).toBe(true);
    expect(view.getByRole("status").textContent).toContain("invalid selection");
});
