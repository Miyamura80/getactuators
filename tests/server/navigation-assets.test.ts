import { expect, test } from "bun:test";

test("deployment includes shared navigation dependencies and mobile-only disclosure CSS", async () => {
    const dockerfile = await Bun.file("Dockerfile").text();
    expect(dockerfile).toContain(
        "COPY src/public-navigation.ts src/public-navigation.css ./src/",
    );
    const css = await Bun.file("src/public-navigation.css").text();
    expect(css).toContain("@media (max-width: 860px)");
    expect(css).toContain(".site-menu > summary");
    expect(css).toContain(".site-menu::details-content");
    expect(css).toContain(":focus-visible");
});
