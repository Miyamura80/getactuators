import "./happydom";
import { expect, test } from "bun:test";

test("shared footer rules override later legacy bottom reserves", async () => {
    const legacy = (await Bun.file(`${import.meta.dir}/../src/index.css`).text())
        .replace(/^@import[^\n]*\n/gm, "");
    const navigation = await Bun.file(`${import.meta.dir}/../../src/public-navigation.css`).text();
    const style = document.createElement("style");
    const fixture = document.createElement("div");
    style.textContent = `${navigation}\n${legacy}`;
    fixture.innerHTML = '<div class="gallery-page"><footer class="site-footer"></footer></div><div class="home-page"><footer class="site-footer"></footer></div><div class="agents-page"><div class="agents-grid"></div></div><div class="shell"><main class="content"></main></div>';
    document.head.append(style);
    document.body.append(fixture);
    try {
        for (const [selector, expected] of [
            [".gallery-page", "0px"], [".home-page", "0px"],
            [".agents-grid", "24px"], [".shell > .content", "24px"],
        ]) {
            expect(getComputedStyle(fixture.querySelector(selector)!).paddingBottom).toBe(expected);
        }
    } finally {
        style.remove();
        fixture.remove();
    }
});
