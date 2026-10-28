import "./happydom";
import { expect, spyOn, test } from "bun:test";
import { act } from "@testing-library/react";
import type { Root } from "react-dom/client";
import { mountApp } from "../src/startup";

for (const [path, selector] of [
    ["/", ".hero"],
    ["/actuators?view=list", "#table"],
    ["/compare?compare=cubemars-ak80-9,xiaomi-cybergear", ".compare-page .compare-specs"],
    ["/actuators/cubemars-ak80-9", ".xp-stage"],
    ["/actuators", ".gallery-page"],
    ["/humanoids", ".hm-page .hm-fig"],
    ["/open-source", ".os-page .os-gallery"],
]) {
    test(`unprerendered ${path} keeps the existing client mount and persistent sibling`, async () => {
        (
            window as unknown as { happyDOM: { setURL: (url: string) => void } }
        ).happyDOM.setURL(`http://localhost:1${path}`);
        document.body.innerHTML =
            '<div id="root"><p id="old-fallback">Catalog fallback</p></div><section id="catalog-content">Persistent facts</section>';
        const container = document.getElementById("root")!;
        const persistent = document.getElementById("catalog-content")!;
        const errors = spyOn(console, "error");
        let mounted: Root | undefined;
        try {
            await act(async () => {
                mounted = mountApp(container);
            });
            expect(container.querySelector(selector) !== null).toBe(true);
            expect(container.querySelector("#old-fallback") === null).toBe(true);
            expect(document.getElementById("catalog-content") === persistent).toBe(
                true,
            );
            expect(errors).not.toHaveBeenCalled();
        } finally {
            await act(async () => {
                mounted?.unmount();
            });
            errors.mockRestore();
            document.body.innerHTML = "";
        }
    });
}
