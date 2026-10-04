import "./happydom";
import { afterEach, expect, spyOn, test } from "bun:test";
import { act, cleanup, render } from "@testing-library/react";
import { StrictMode } from "react";
import { spawnSync } from "node:child_process";
import { Compare } from "../src/pages/Compare";
import { useCompareSelection } from "../src/lib/compare-selection";

const setURL = (search: string) => (window as unknown as { happyDOM: { setURL: (url: string) => void } }).happyDOM.setURL(`http://localhost/compare${search}#keep`);
const initial = "?compare=unitree-m107,nabtesco-rv-42n,cubemars-ak80-9";
const restored = "?compare=robstride-03,steadywin-gim6010-36,cubemars-ak70-10";
function serverSnapshot(search: string) {
    // Execute the real server adapter in its own package/dependency context.
    const result = spawnSync(process.execPath, ["-e", `import { comparisonRows, compareVisual } from './src/server/agent/compare'; console.log(JSON.stringify({ ids: comparisonRows(${JSON.stringify(search)}).map(a => a.id), html: compareVisual(${JSON.stringify(search)}) }));`], {
        cwd: new URL("../../", import.meta.url), encoding: "utf8",
    });
    expect(result.status).toBe(0);
    return JSON.parse(result.stdout) as { ids: string[]; html: string };
}
function Selection() {
    const selection = useCompareSelection();
    return <output data-testid="selection">{JSON.stringify({ ids: selection.ids, rows: selection.rows.map(a => a.id) })}</output>;
}
function assertOrder(container: HTMLElement, search: string) {
    const server = serverSnapshot(search);
    const selection = JSON.parse(container.querySelector("output")!.textContent!);
    expect(selection.ids).toEqual(server.ids);
    expect(selection.rows).toEqual(server.ids);
    const serverDOM = document.createElement("div");
    serverDOM.innerHTML = server.html;
    for (const selector of [".compare-products h2", ".compare-specs thead th", ".compare-specs tbody tr"]) {
        const texts = (element: HTMLElement) => Array.from(element.querySelectorAll(selector), node => node.textContent);
        expect(texts(container)).toEqual(texts(serverDOM));
    }
}
afterEach(cleanup);

test("shared comparison restores server product and specification column order silently, including popstate", () => {
    setURL(initial);
    const push = spyOn(window.history, "pushState");
    const replace = spyOn(window.history, "replaceState");
    const events: unknown[] = [];
    const listener = (event: Event) => events.push((event as CustomEvent).detail);
    window.addEventListener("actuatorlist:compare", listener);
    try {
        const original = window.location.href;
        const view = render(<StrictMode><Selection /><Compare /></StrictMode>);
        assertOrder(view.container, initial);
        expect(window.location.href).toBe(original);
        // Happy DOM tests the URL/popstate boundary, not native history traversal.
        act(() => { setURL(restored); window.dispatchEvent(new PopStateEvent("popstate")); });
        assertOrder(view.container, restored);
        const target = window.location.href;
        act(() => window.dispatchEvent(new PopStateEvent("popstate")));
        assertOrder(view.container, restored);
        expect(window.location.href).toBe(target);
        expect(push).not.toHaveBeenCalled();
        expect(replace).not.toHaveBeenCalled();
        expect(events).toEqual([]);
    } finally {
        window.removeEventListener("actuatorlist:compare", listener);
        push.mockRestore(); replace.mockRestore();
    }
});
