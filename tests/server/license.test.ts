import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { CODE_LICENSE, DATA_LICENSE, LICENSE_EXCLUDES } from "@/server/site";
import { get } from "./agent-helpers";

const ROOT = `${import.meta.dir}/../..`;

type Node = Record<string, unknown>;

async function datasets(path: string): Promise<Node[]> {
    const html = await (await get(path)).text();
    const found: Node[] = [];
    const walk = (value: unknown): void => {
        if (Array.isArray(value)) {
            for (const v of value) walk(v);
            return;
        }
        if (!value || typeof value !== "object") return;
        const node = value as Node;
        if (node["@type"] === "Dataset") found.push(node);
        for (const v of Object.values(node)) walk(v);
    };
    for (const m of html.matchAll(
        /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    ))
        walk(JSON.parse(m[1] ?? "{}"));
    return found;
}

describe("license contract", () => {
    test("pricing.md names the data license and credit", async () => {
        const body = await (await get("/pricing.md")).text();
        expect(body).toContain(DATA_LICENSE.url);
        expect(body).toContain(DATA_LICENSE.credit);
        expect(body).toContain(CODE_LICENSE.name);
        expect(body).toContain(LICENSE_EXCLUDES);
    });

    test("catalog and metals Dataset nodes carry the data license", async () => {
        const catalog = (await datasets("/")).filter(
            (d) => d.name === "actuatorlist robot actuator catalog",
        );
        expect(catalog).toHaveLength(1);
        const metals = await datasets("/metals");
        expect(metals.length).toBeGreaterThan(0);
        for (const d of [...catalog, ...metals]) {
            expect(d.license).toBe(DATA_LICENSE.url);
            expect(d.creditText).toBe(DATA_LICENSE.credit);
        }
    });

    test("OpenAPI describes both licenses", async () => {
        const spec = await (await get("/openapi.json")).json();
        expect(spec.info.description).toContain(DATA_LICENSE.name);
        expect(spec.info.description).toContain(DATA_LICENSE.url);
        expect(spec.info.description).toContain(LICENSE_EXCLUDES);
        expect(spec.info.license).toEqual({
            name: CODE_LICENSE.name,
            identifier: CODE_LICENSE.spdx,
        });
    });

    test("every path LICENSE-DATA lists exists", async () => {
        const text = await Bun.file(`${ROOT}/LICENSE-DATA`).text();
        const paths = [...text.matchAll(/\b((?:frontend|src)\/[\w./-]*[\w/])/g)].map(
            (m) => m[1] ?? "",
        );
        expect(paths.length).toBeGreaterThan(5);
        for (const p of paths)
            expect([p, existsSync(`${ROOT}/${p}`)]).toEqual([p, true]);
    });
});
