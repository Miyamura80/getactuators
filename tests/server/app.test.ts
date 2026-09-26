import { describe, expect, test } from "bun:test";
import { createHandler } from "@/server/app";
import { loadRegistry } from "@/server/registry";
import { createRouter } from "@/server/router";

describe("router", () => {
    test("matches :params and respects method", () => {
        const match = createRouter([
            { method: "GET", path: "/api/v1/actuators/:id", handler: () => null },
        ]);
        const hit = match(new Request("http://x/api/v1/actuators/robstride-01"));
        expect(hit[0]?.params.id).toBe("robstride-01");
        expect(
            match(new Request("http://x/api/v1/actuators/a", { method: "POST" })),
        ).toEqual([]);
        expect(
            match(new Request("http://x/api/v1/actuators/a", { method: "HEAD" })),
        ).toHaveLength(1);
    });
});

describe("server pipeline", () => {
    test("auto-discovers route modules", async () => {
        const handler = createHandler(await loadRegistry());
        const res = await handler(new Request("http://x/healthz"));
        expect(res.status).toBe(200);
        const body = (await res.json()) as { status: string; actuators: number };
        expect(body.status).toBe("ok");
        expect(body.actuators).toBeGreaterThan(0);
    });

    test("null handlers fall through and hooks run on every response", async () => {
        const handler = createHandler({
            routes: [
                { path: "/x", handler: () => null },
                { path: "/x", handler: () => new Response("second") },
            ],
            hooks: [
                (_req, res) => {
                    const h = new Headers(res.headers);
                    h.set("x-hook", "1");
                    return new Response(res.body, { status: res.status, headers: h });
                },
            ],
        });
        const res = await handler(new Request("http://x/x"));
        expect(await res.text()).toBe("second");
        expect(res.headers.get("x-hook")).toBe("1");
    });
});
