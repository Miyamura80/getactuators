import "./happydom";
import { expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { CommandPalette } from "../src/components/CommandPalette";

type HappyWindow = { happyDOM: { setViewport: (v: { width: number; height: number }) => void } };

async function mountWithStyles() {
    const css = (await Bun.file(`${import.meta.dir}/../src/index.css`).text()).replace(/^@import[^\n]*\n/gm, "");
    const style = document.createElement("style");
    style.textContent = css;
    const host = document.createElement("div");
    host.innerHTML = renderToString(<CommandPalette />);
    document.head.append(style);
    document.body.append(host);
    return {
        trigger: host.querySelector<HTMLElement>(".cmdk-trigger")!,
        kbd: host.querySelector<HTMLElement>(".cmdk-trigger-kbd")!,
        cleanup: () => {
            style.remove();
            host.remove();
        },
    };
}

test("floating search trigger shrinks to a 44px icon button on phones", async () => {
    const happy = (window as unknown as HappyWindow).happyDOM;
    const { trigger, kbd, cleanup } = await mountWithStyles();
    try {
        // Desktop keeps the labelled pill with its Cmd+K hint.
        happy.setViewport({ width: 1280, height: 800 });
        expect(getComputedStyle(kbd).display).not.toBe("none");
        expect(getComputedStyle(trigger).bottom).toBe("18px");
    } finally {
        cleanup();
    }
    const phone = await mountWithStyles();
    try {
        happy.setViewport({ width: 390, height: 844 });
        expect(getComputedStyle(phone.trigger).width).toBe("44px");
        expect(getComputedStyle(phone.trigger).height).toBe("44px");
        // Touch screens have no Cmd+K, so the hint is dropped.
        expect(getComputedStyle(phone.kbd).display).toBe("none");
    } finally {
        phone.cleanup();
        happy.setViewport({ width: 1024, height: 768 });
    }
});

test("phones reserve safe-area-aware room below the last content for the trigger", async () => {
    const css = await Bun.file(`${import.meta.dir}/../src/index.css`).text();
    const mobile = css.slice(css.indexOf(".cmdk-trigger-text,\n    .cmdk-trigger-kbd {"));
    expect(mobile).toMatch(/bottom: calc\(12px \+ env\(safe-area-inset-bottom, 0px\)\)/);
    expect(mobile).toMatch(/body:has\(\.cmdk-trigger\)::after \{[^}]*height: calc\(64px \+ env\(safe-area-inset-bottom, 0px\)\)/);
});
