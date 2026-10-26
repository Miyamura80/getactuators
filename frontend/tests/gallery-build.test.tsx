import "./happydom";
import { expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { act } from "@testing-library/react";
import { spyOn } from "bun:test";
import { mountApp } from "../src/startup";
import type { Root } from "react-dom/client";
import { GalleryRoot } from "../src/GalleryRoot";
import { galleryCards } from "../../src/catalog/gallery";
import { ACTUATORS } from "../src/lib/data";

// Exercise the same command Docker runs, not a test-only renderer.
test("production frontend build emits the exact initial gallery tree without duplicate preload", async () => {
    const file = Bun.file(`${import.meta.dir}/../dist/actuators.html`);
    await Bun.write(file, ""); // A previous build must not mask a missing build step.
    const build = Bun.spawn([process.execPath, "run", "build"], {
        cwd: `${import.meta.dir}/..`,
        stdout: "pipe",
        stderr: "pipe",
        env: { ...process.env, NODE_ENV: "production" },
    });
    const [stdout, stderr, exit] = await Promise.all([
        new Response(build.stdout).text(),
        new Response(build.stderr).text(),
        build.exited,
    ]);
    expect(exit, `${stdout}\n${stderr}`).toBe(0);
    expect(await file.exists()).toBe(true);
    const html = await file.text();
    expect(html).toContain('class="gallery-page"');
    const root = document.createElement("div");
    root.innerHTML = html;
    const cards = [...root.querySelectorAll<HTMLAnchorElement>(".bento-card")];
    const expected = galleryCards(ACTUATORS);
    expect(cards).toHaveLength(79);
    expect(cards.map((card) => card.getAttribute("href"))).toEqual(
        expected.map(({ a }) => `/actuators/${encodeURIComponent(a.id)}`),
    );
    expect(
        [...root.querySelectorAll(".bento-thumb img")].map((img) => img.getAttribute("src")),
    ).toEqual(expected.flatMap(({ a }) => (a.image_url ? [a.image_url] : [])));
    expect(
        root.querySelectorAll('img[fetchpriority="high"][loading="eager"]'),
    ).toHaveLength(1);
    expect(root.querySelectorAll('.bento-thumb img[loading="lazy"][decoding="async"]')).toHaveLength(
        expected.filter(({ a }) => a.image_url).length - 1,
    );
    expect(root.querySelectorAll("link[rel=preload]")).toHaveLength(0);
    const rendered = document.createElement("div");
    rendered.innerHTML = renderToString(<GalleryRoot />);
    rendered.querySelectorAll("link[rel=preload]").forEach((node) => node.remove());
    expect(root.innerHTML).toBe(rendered.innerHTML);
    (
        window as unknown as { happyDOM: { setURL: (url: string) => void } }
    ).happyDOM.setURL("http://localhost:1/actuators");
    window.localStorage.clear();
    root.dataset.galleryPrerender = "true";
    document.body.append(root);
    const photos = [...root.querySelectorAll(".bento-thumb img")];
    photos.forEach((image) =>
        Object.defineProperty(image, "complete", { value: false }),
    );
    const errors = spyOn(console, "error");
    let mounted: Root | undefined;
    try {
        await act(async () => {
            mounted = mountApp(root);
        });
        const after = [...root.querySelectorAll(".bento-card")];
        expect(after.length).toBe(cards.length);
        expect(after.every((node, index) => node === cards[index])).toBe(true);
        const afterPhotos = [...root.querySelectorAll(".bento-thumb img")];
        expect(afterPhotos.length).toBe(photos.length);
        expect(afterPhotos.every((node, index) => node === photos[index])).toBe(true);
        expect(errors).not.toHaveBeenCalled();
    } finally {
        await act(async () => {
            mounted?.unmount();
        });
        errors.mockRestore();
        root.remove();
    }
}, 60000);
