import "./happydom";
import { expect, test } from "bun:test";
import { act, fireEvent } from "@testing-library/react";
import { mountApp } from "../src/startup";
import captures from "./fixtures/comparisons.json";

for (const mode of ["initial-hash", "focused-fragment", "focused-control", "unrelated-hash", "no-hash"] as const) {
    test(`startup replacement restores only comparison fragment intent: ${mode}`, async () => {
        const hash = mode === "unrelated-hash" ? "#unrelated" : mode === "no-hash" ? "" : "#compare-smart_servo";
        (window as unknown as { happyDOM: { setURL: (url: string) => void } }).happyDOM.setURL(`http://localhost/compare${hash}`);
        const container = document.createElement("div");
        container.innerHTML = captures.find(capture => capture.path === "/compare")!.root;
        document.body.append(container);
        const oldTarget = container.querySelector<HTMLElement>("#compare-smart_servo")!;
        if (mode === "focused-fragment") oldTarget.focus();
        if (mode === "focused-control") container.querySelector<HTMLElement>(".site-brand")!.focus();
        let root: ReturnType<typeof mountApp> | undefined;
        try {
            await act(async () => { root = mountApp(container); });
            const target = container.querySelector<HTMLElement>("#compare-smart_servo")!;
            expect(target === oldTarget).toBe(false);
            expect(document.activeElement === target).toBe(mode === "initial-hash" || mode === "focused-fragment");
            // Startup restoration is one-shot, not a hash/selection render effect.
            container.querySelector<HTMLElement>(".site-brand")!.focus();
            await act(async () => { fireEvent(window, new PopStateEvent("popstate")); });
            expect(document.activeElement === target).toBe(false);
        } finally {
            await act(async () => root?.unmount());
            container.remove();
        }
    });
}
