import "./happydom";
import { expect, spyOn, test } from "bun:test";
import { act } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { ActuatorsGallery } from "../src/pages/ActuatorsGallery";
import { CommandPalette } from "../src/components/CommandPalette";
import { GalleryRoot } from "../src/GalleryRoot";
import { mountApp } from "../src/startup";
import type { Root } from "react-dom/client";

test("gallery startup reuses every initial card and photo instead of replacing them", async () => {
    (
        window as unknown as { happyDOM: { setURL: (url: string) => void } }
    ).happyDOM.setURL("http://localhost:1/actuators");
    const html = renderToString(
        <>
            <ActuatorsGallery />
            <CommandPalette />
        </>,
    );
    document.body.innerHTML = `<div id="root" data-gallery-prerender="true">${html}</div>`;
    const root = document.getElementById("root")!;
    const cards = [...root.querySelectorAll(".bento-card")];
    const photos = [...root.querySelectorAll(".bento-thumb img")];
    // Happy DOM reports complete=true/zero dimensions without loading images.
    // Model pending requests; the separate regression models a completed failure.
    photos.forEach((image) =>
        Object.defineProperty(image, "complete", { value: false }),
    );
    expect(cards).toHaveLength(68);
    const errors = spyOn(console, "error");
    let mounted: Root | undefined;
    try {
        await act(async () => {
            mounted = mountApp(root);
        });
        const afterCards = [...root.querySelectorAll(".bento-card")];
        const afterPhotos = [...root.querySelectorAll(".bento-thumb img")];
        expect(afterCards.length).toBe(cards.length);
        expect(afterCards.every((node, i) => node === cards[i])).toBe(true);
        expect(afterPhotos.length).toBe(photos.length);
        expect(afterPhotos.every((node, i) => node === photos[i])).toBe(true);
        expect(root.querySelectorAll(".gallery-page")).toHaveLength(1);
        expect(errors).not.toHaveBeenCalled();
        const click = new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            button: 0,
        });
        cards[0].dispatchEvent(click);
        expect(click.defaultPrevented).toBe(false);
        await act(async () => {
            window.dispatchEvent(
                new KeyboardEvent("keydown", {
                    key: "k",
                    ctrlKey: true,
                    bubbles: true,
                }),
            );
        });
        expect(root.querySelector('[role="dialog"]')).not.toBeNull();
        await act(async () => {
            root.querySelector('[role="dialog"]')!.dispatchEvent(
                new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
            );
        });
        expect(root.querySelector('[role="dialog"]')).toBeNull();
    } finally {
        await act(async () => {
            mounted?.unmount();
        });
        errors.mockRestore();
        document.body.innerHTML = "";
    }
});

test("a photo that failed before hydration falls back to its schematic", async () => {
    (
        window as unknown as { happyDOM: { setURL: (url: string) => void } }
    ).happyDOM.setURL("http://localhost:1/actuators");
    document.body.innerHTML = `<div id="root" data-gallery-prerender="true">${renderToString(<GalleryRoot />)}</div>`;
    const container = document.getElementById("root")!;
    const card = container.querySelector(".bento-card")!;
    const image = card.querySelector("img")!;
    Object.defineProperty(image, "complete", { value: true });
    Object.defineProperty(image, "currentSrc", { value: image.src });
    Object.defineProperty(image, "naturalWidth", { value: 0 });
    image.dispatchEvent(new Event("error")); // No client handlers yet.
    let mounted: Root | undefined;
    try {
        await act(async () => {
            mounted = mountApp(container);
        });
        expect(card.querySelector("img") === null).toBe(true);
        expect(card.querySelector('svg[role="img"]')).not.toBeNull();
        expect(container.querySelector(".bento-card") === card).toBe(true);
    } finally {
        await act(async () => {
            mounted?.unmount();
        });
        document.body.innerHTML = "";
    }
});
