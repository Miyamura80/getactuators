import { beforeAll, describe, expect, test } from "bun:test";
import { createRateLimiter } from "@/api/rate-limit";
import { API_OPERATIONS } from "@/api/surface";
import { type FetchHandler, createHandler } from "@/server/app";
import { loadRegistry } from "@/server/registry";

type Json = Record<string, unknown>;

let handler: FetchHandler;
let spec: {
    openapi: string;
    servers: { url: string }[];
    security: unknown[];
    paths: Record<string, Record<string, Json>>;
    components: Record<string, Record<string, Json>>;
};

const get = (path: string, headers: Record<string, string> = {}) =>
    handler(
        new Request(`http://localhost${path}`, {
            headers: { "X-Forwarded-For": "198.51.100.20", ...headers },
        }),
    );

beforeAll(async () => {
    handler = createHandler(await loadRegistry());
    spec = await (await get("/openapi.json")).json();
});

// Resolve a local "#/components/..." $ref.
function deref(node: Json): Json {
    const ref = node.$ref;
    if (typeof ref !== "string") return node;
    const [, , group, name] = ref.split("/");
    const target = spec.components[group ?? ""]?.[name ?? ""];
    if (!target) throw new Error(`dangling $ref ${ref}`);
    return target;
}

function operations() {
    return Object.entries(spec.paths).flatMap(([path, item]) =>
        Object.entries(item).map(([method, op]) => ({ path, method, op })),
    );
}

describe("OpenAPI document", () => {
    test("is OpenAPI 3.1 with the site as server and no auth", () => {
        expect(spec.openapi).toBe("3.1.0");
        expect(spec.servers[0]?.url).toMatch(/^https?:\/\//);
        expect(spec.security).toEqual([]);
    });

    test("covers every operation exactly once with unique snake_case ids", () => {
        const ids = operations().map(({ op }) => op.operationId as string);
        expect(new Set(ids).size).toBe(ids.length);
        expect(ids.sort()).toEqual(API_OPERATIONS.map((o) => o.operationId).sort());
        for (const id of ids) expect(id).toMatch(/^[a-z][a-z0-9_]*$/);
    });

    test("every operation is documented and every response has a schema", () => {
        for (const { path, method, op } of operations()) {
            const where = `${method.toUpperCase()} ${path}`;
            expect(op.summary, where).toBeTruthy();
            expect(op.description, where).toBeTruthy();
            const responses = op.responses as Record<string, Json>;
            expect(Object.keys(responses)).toContain("200");
            for (const [status, raw] of Object.entries(responses)) {
                const res = deref(raw);
                const content = res.content as Record<string, { schema?: Json }>;
                const media =
                    Number(status) >= 400
                        ? "application/problem+json"
                        : "application/json";
                const schema = content[media]?.schema;
                expect(schema, `${where} ${status}`).toBeDefined();
                deref(schema as Json);
            }
            for (const p of (op.parameters as Json[] | undefined) ?? []) {
                const param = deref(p);
                expect(param.schema, `${where} ${String(param.name)}`).toBeDefined();
                expect(
                    param.description,
                    `${where} ${String(param.name)}`,
                ).toBeTruthy();
            }
        }
    });

    test("POST declares Idempotency-Key and path params match templates", () => {
        const post = spec.paths["/api/v1/actuators/compare"]?.post as Json;
        const params = (post.parameters as Json[]).map(deref);
        expect(
            params.some((p) => p.name === "Idempotency-Key" && p.in === "header"),
        ).toBe(true);
        for (const { path, op } of operations()) {
            const names = [...path.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
            const inPath = ((op.parameters as Json[] | undefined) ?? [])
                .map(deref)
                .filter((p) => p.in === "path")
                .map((p) => p.name);
            expect(inPath).toEqual(names);
        }
    });

    test("is served at the /api alias with the same content", async () => {
        const alias = await (await get("/api/openapi.json")).json();
        expect(alias).toEqual(spec);
    });
});

describe("developer docs", () => {
    test("/docs/api is server-rendered HTML with every endpoint", async () => {
        const res = await get("/docs/api");
        expect(res.headers.get("content-type")).toContain("text/html");
        const html = await res.text();
        expect(html).toContain("<h1>getactuators API</h1>");
        for (const op of API_OPERATIONS)
            expect(html).toContain(`id="${op.operationId}"`);
        expect(html).toContain('id="error-not-found"');
        expect(html).not.toContain(String.fromCharCode(0x2014));
    });

    test("/docs/api.md has frontmatter and an H1", async () => {
        const res = await get("/docs/api.md");
        expect(res.headers.get("content-type")).toContain("text/markdown");
        const md = await res.text();
        expect(md.startsWith("---\ntitle: ")).toBe(true);
        expect(md).toContain("\ncanonical: ");
        expect(md).toContain("\nlast-updated: ");
        expect(md).toContain("\n# getactuators API\n");
        expect(md).toContain("curl -s");
    });

    test("Accept: text/markdown on /docs/api returns the twin", async () => {
        const res = await get("/docs/api", { Accept: "text/markdown" });
        expect(res.headers.get("content-type")).toContain("text/markdown");
    });

    test("/developers and /docs redirect to /docs/api", async () => {
        for (const p of ["/developers", "/docs"]) {
            const res = await get(p);
            expect(res.status).toBe(301);
            expect(res.headers.get("location")).toBe("/docs/api");
        }
    });
});

describe("rate limiter", () => {
    test("counts per key and resets each window", () => {
        let now = 0;
        const limit = createRateLimiter(2, 60, () => now);
        expect(limit("a").allowed).toBe(true);
        expect(limit("a").allowed).toBe(true);
        expect(limit("b").allowed).toBe(true);
        const third = limit("a");
        expect(third.allowed).toBe(false);
        expect(third.reset).toBe(60);
        now = 60_000;
        expect(limit("a").remaining).toBe(1);
    });
});
