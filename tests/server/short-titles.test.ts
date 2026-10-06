import { expect, test } from "bun:test";
import { findPage } from "@/server/agent/pages";
import { expectTitles } from "./agent-helpers";

const REPO_ROOT = `${import.meta.dir}/../..`;

// The golden hashes lock page content to the catalog as it stood at capture,
// so short-titles-golden.ts runs in a child process against the frozen copies
// served by short-titles-freeze.ts. Catalog data can change; the title work
// stays guarded.
test("golden content check passes against the frozen catalog", async () => {
    const child = Bun.spawn(
        [
            process.execPath,
            "test",
            "--preload",
            "./tests/server/short-titles-freeze.ts",
            "./tests/server/short-titles-golden.ts",
        ],
        { cwd: REPO_ROOT, env: process.env, stdout: "pipe", stderr: "pipe" },
    );
    // Drain both pipes together: bun test reports on stderr, and a long diff
    // must not block the child.
    const [out, err] = await Promise.all([
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
    ]);
    const output = `${out}${err}`;
    expect(await child.exited, output).toBe(0);
    expect(output).toMatch(/\b1 pass\b/);
    expect(output).toMatch(/\b0 fail\b/);
}, 30_000);

test("editorial metadata is independent of the research headline", async () => {
    for (const [path, title] of [
        ["/guides/robot-actuator-selection", "Robot actuator selection guide"],
        [
            "/comparisons/cubemars-ak80-9-vs-xiaomi-cybergear",
            "CubeMars AK80-9 V3.0 KV100 vs Xiaomi CyberGear",
        ],
    ]) {
        const page = findPage(path ?? "");
        expect(page?.title).toBe(title);
        const headline = page?.body().split("\n")[0]?.slice(2);
        expect(headline).not.toBe(title);
        expect(
            page?.jsonLd().find((node) => node["@type"] === "TechArticle")?.headline,
        ).toBe(headline);
        const html = await expectTitles(path ?? "", `${title} | actuatorlist`);
        expect(html).toContain(Bun.escapeHTML(headline ?? ""));
    }
});

test("product metadata uses a compact brand and keeps voltage qualifiers", async () => {
    const path = "/actuators/steadywin-gim6010-36";
    const page = findPage(path);
    expect(page?.title).toBe("Steadywin GIM6010-36 (48V) specs");
    const html = await expectTitles(
        path,
        "Steadywin GIM6010-36 (48V) specs | actuatorlist",
    );
    expect(html).toContain("GIM6010-36 (48V)");
    expect(page?.body()).toStartWith("# GIM6010-36 (48V)");
});
