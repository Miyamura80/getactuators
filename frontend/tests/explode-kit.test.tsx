import "./happydom";
import { afterEach, beforeEach, expect, mock, test } from "bun:test";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { MAGNET_PRESS_LOOP, QDD_JOINT } from "../../src/supply-chain/scenes/demos";

// The WebGL halves are replaced with stubs that record their props, so these
// tests cover the wrappers' decisions (poster or live, motion, selection)
// without a GPU.
const explodeProps: Record<string, unknown>[] = [];
const loopProps: Record<string, unknown>[] = [];

mock.module("../src/three/scene/ExplodeCanvas", () => ({
    default: (props: Record<string, unknown> & { onSelect: (id: string | null) => void; onReady?: () => void }) => {
        explodeProps.push(props);
        return (
            <button type="button" data-testid="canvas-stub" onClick={() => props.onSelect("rotor")}>
                canvas
            </button>
        );
    },
}));
mock.module("../src/three/scene/ProcessLoopCanvas", () => ({
    default: (props: Record<string, unknown>) => {
        loopProps.push(props);
        return <div data-testid="loop-stub" />;
    },
}));

const { ExplodeScene, ProcessLoop } = await import("../src/three");
const { setWebGLSupport, scrollProgress, liveKey } = await import("../src/three/support");

const realMatchMedia = window.matchMedia;
const realIO = globalThis.IntersectionObserver;

function reduceMotion(on: boolean) {
    window.matchMedia = ((query: string) => ({
        matches: on && query.includes("reduce"),
        media: query,
        addEventListener() {},
        removeEventListener() {},
    })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
    explodeProps.length = 0;
    loopProps.length = 0;
    // No observer: every scene counts as on screen.
    (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver = undefined;
    reduceMotion(false);
});

afterEach(() => {
    cleanup();
    setWebGLSupport(undefined);
    window.matchMedia = realMatchMedia;
    globalThis.IntersectionObserver = realIO;
});

test("without WebGL the scene shows its poster and parts still select", () => {
    setWebGLSupport(false);
    const picked: (string | null)[] = [];
    const view = render(<ExplodeScene {...QDD_JOINT} onSelectPart={(id) => picked.push(id)} />);
    const fig = view.container.querySelector("figure.x3") as HTMLElement;
    expect(fig.dataset.mode).toBe("poster");
    expect(view.container.querySelector("img.x3-poster")?.getAttribute("src")).toBe("/posters/qdd-joint.png");
    // No slider and no wake button: nothing to drive without a renderer.
    expect(view.container.querySelector('input[type="range"]')).toBeNull();
    expect(view.container.querySelector(".x3-wake")).toBeNull();
    expect(explodeProps).toHaveLength(0);

    const stator = view.getByRole("button", { name: "Stator" });
    fireEvent.click(stator);
    expect(stator.getAttribute("aria-pressed")).toBe("true");
    expect(view.container.querySelector(".x3-readout")?.textContent).toBe("Stator");
    fireEvent.click(stator);
    expect(picked).toEqual(["stator", null]);
});

test("a missing poster falls back to a drawn placeholder", () => {
    setWebGLSupport(false);
    const view = render(<ExplodeScene {...QDD_JOINT} poster="/posters/none.png" />);
    fireEvent.error(view.container.querySelector("img.x3-poster") as HTMLImageElement);
    expect(view.container.querySelector("svg.x3-poster-missing")?.getAttribute("aria-label")).toContain(QDD_JOINT.title);
});

test("with WebGL the scene goes live and canvas clicks reach onSelectPart", async () => {
    setWebGLSupport(true);
    const picked: (string | null)[] = [];
    const view = render(<ExplodeScene {...QDD_JOINT} defaultExplode={0.4} onSelectPart={(id) => picked.push(id)} />);
    const stub = await view.findByTestId("canvas-stub");
    expect(view.container.querySelector("figure.x3")?.getAttribute("data-mode")).toBe("live");
    const last = explodeProps.at(-1);
    expect(last?.explode).toBe(0.4);
    expect(last?.instant).toBe(false);
    fireEvent.click(stub);
    expect(picked).toEqual(["rotor"]);
    expect(explodeProps.at(-1)?.selectedId).toBe("rotor");

    // happy-dom does not fire React's onChange for range inputs; dragging is
    // covered in the browser. Here: the slider mirrors the scene's explode.
    const slider = view.getByRole("slider", { name: "Explode" }) as HTMLInputElement;
    expect(slider.value).toBe("0.4");
    expect(slider.getAttribute("aria-valuetext")).toBe("40% exploded");
});

test("reduced motion renders the exploded end state without animating", async () => {
    setWebGLSupport(true);
    reduceMotion(true);
    const view = render(<ExplodeScene {...QDD_JOINT} defaultExplode={0} drive="scroll" />);
    await view.findByTestId("canvas-stub");
    expect(view.container.querySelector("figure.x3")?.getAttribute("data-motion")).toBe("reduced");
    const last = explodeProps.at(-1);
    expect(last?.explode).toBe(1);
    expect(last?.instant).toBe(true);
});

test("reduced motion holds a loop on its poster frame until play is pressed", async () => {
    setWebGLSupport(true);
    reduceMotion(true);
    const view = render(<ProcessLoop loop={MAGNET_PRESS_LOOP} />);
    await view.findByTestId("loop-stub");
    expect(loopProps.at(-1)?.still).toBe(true);
    expect(loopProps.at(-1)?.playing).toBe(false);
    fireEvent.click(view.getByRole("button", { name: "Play" }));
    expect(loopProps.at(-1)?.still).toBe(false);
    expect(loopProps.at(-1)?.playing).toBe(true);
    expect(view.getAllByRole("listitem").map((li) => li.textContent)).toEqual(["Fill", "Align", "Press", "Eject"]);
});

test("a loop plays by default and pauses on request", async () => {
    setWebGLSupport(true);
    const view = render(<ProcessLoop loop={MAGNET_PRESS_LOOP} />);
    await view.findByTestId("loop-stub");
    expect(loopProps.at(-1)?.playing).toBe(true);
    fireEvent.click(view.getByRole("button", { name: "Pause" }));
    expect(loopProps.at(-1)?.playing).toBe(false);
});

test("only one scene on a page holds a WebGL context", async () => {
    setWebGLSupport(true);
    const view = render(
        <>
            <ExplodeScene {...QDD_JOINT} />
            <ProcessLoop loop={MAGNET_PRESS_LOOP} />
        </>,
    );
    await waitFor(() => expect(view.container.querySelectorAll('figure[data-mode="live"]')).toHaveLength(1));
    const dormant = view.container.querySelector('figure[data-mode="poster"]') as HTMLElement;
    const wake = dormant.querySelector(".x3-wake") as HTMLButtonElement;
    expect(wake).not.toBeNull();
    act(() => wake.click());
    await waitFor(() => expect(dormant.dataset.mode).toBe("live"));
    expect(view.container.querySelectorAll('figure[data-mode="live"]')).toHaveLength(1);
    view.unmount();
    expect(liveKey()).toBeNull();
});

test("scroll progress runs 0 below the fold to 1 in the upper third", () => {
    expect(scrollProgress(900, 800)).toBe(0);
    expect(scrollProgress(800, 800)).toBe(0);
    expect(scrollProgress(400, 800)).toBeCloseTo(400 / 544);
    expect(scrollProgress(100, 800)).toBe(1);
    expect(scrollProgress(0, 0)).toBe(0);
});
