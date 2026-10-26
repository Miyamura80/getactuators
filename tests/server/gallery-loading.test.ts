import { expect, test } from "bun:test";
import { get } from "./agent-helpers";

function photoPreloads(html: string): string[] {
    const urls: string[] = [];
    new HTMLRewriter()
        .on('head link[rel="preload"][as="image"]', {
            element: (el) => {
                expect(el.getAttribute("fetchpriority")).toBe("high");
                urls.push(el.getAttribute("href") ?? "");
            },
        })
        .transform(html);
    return urls;
}

test("gallery discovers only its first actual photo in the server head before JavaScript", async () => {
    for (const path of [
        "/actuators",
        "/actuators?sort=price_usd&category=smart_servo",
    ]) {
        const html = await (await get(path)).text();
        // Unrelated query parameters do not change the default (by type) gallery.
        expect(photoPreloads(html)).toEqual([
            "/actuator-images/steadywin-gim8108-8.webp",
        ]);
        expect(html.indexOf('as="image"')).toBeLessThan(html.indexOf("</head>"));
    }
});

test("other pages and gallery markdown do not preload gallery photos", async () => {
    for (const path of [
        "/",
        "/actuators?view=list",
        "/robots",
        "/guides",
        "/actuators/cubemars-ak80-9",
        "/actuators.md",
        // Its first card is only known after hydration.
        "/actuators?by=application",
    ]) {
        expect(photoPreloads(await (await get(path)).text()), path).toEqual([]);
    }
});
