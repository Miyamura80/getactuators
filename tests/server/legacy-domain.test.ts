import { describe, expect, test } from "bun:test";
import { createHandler } from "@/server/app";
import { loadRegistry } from "@/server/registry";
import { createRouter } from "@/server/router";
import { SITE_URL } from "@/server/site";

const handler = createHandler(await loadRegistry());

function send(path: string, init: RequestInit & { host?: string } = {}) {
    const { host, ...rest } = init;
    const headers = new Headers(rest.headers);
    if (host) headers.set("host", host);
    return handler(new Request(`http://localhost${path}`, { ...rest, headers }));
}

describe("legacy domain redirect", () => {
    test("GET on getactuators.com is a 301 to the canonical origin, path and query kept", async () => {
        const res = await send("/actuators/robstride-02?x=1&y=two", {
            host: "getactuators.com",
        });
        expect(res.status).toBe(301);
        expect(res.headers.get("location")).toBe(
            `${SITE_URL}/actuators/robstride-02?x=1&y=two`,
        );
    });

    test("www hosts and HEAD redirect with 301", async () => {
        for (const host of [
            "www.getactuators.com",
            "www.actuatorlist.com",
            "GetActuators.com:443",
        ]) {
            const res = await send("/", { host, method: "HEAD" });
            expect(res.status).toBe(301);
            expect(res.headers.get("location")).toBe(`${SITE_URL}/`);
        }
    });

    test("POST to /mcp is a 308 so the method and body survive", async () => {
        const res = await send("/mcp", {
            host: "getactuators.com",
            method: "POST",
            headers: { "content-type": "application/json" },
            body: "{}",
        });
        expect(res.status).toBe(308);
        expect(res.headers.get("location")).toBe(`${SITE_URL}/mcp`);
    });

    test("the first X-Forwarded-Host value wins over Host", async () => {
        const res = await send("/llms.txt", {
            host: "internal.railway",
            headers: { "x-forwarded-host": "getactuators.com, proxy.example" },
        });
        expect(res.status).toBe(301);
        expect(res.headers.get("location")).toBe(`${SITE_URL}/llms.txt`);
    });

    test("canonical and local hosts are served normally", async () => {
        expect((await send("/healthz", { host: "actuatorlist.com" })).status).toBe(200);
        expect((await send("/healthz")).status).toBe(200);
        const forwarded = await send("/healthz", {
            host: "getactuators.com",
            headers: { "x-forwarded-host": "actuatorlist.com" },
        });
        expect(forwarded.status).toBe(200);
    });
});

describe("router wildcard", () => {
    test('"*" matches every path', () => {
        const match = createRouter([{ path: "*", handler: () => null }]);
        expect(match(new Request("http://x/"))).toHaveLength(1);
        expect(match(new Request("http://x/a/b/c.md"))).toHaveLength(1);
    });
});
