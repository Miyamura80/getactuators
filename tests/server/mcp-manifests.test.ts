import { describe, expect, test } from "bun:test";
import { CATALOG_TOOLS, REGISTRY_NAME, SERVER_VERSION } from "@/mcp/server";
import registryJson from "../../server.json";
import { appHandler } from "./mcp-helpers";

async function getJson(path: string) {
    const handler = await appHandler();
    const res = await handler(new Request(`http://localhost${path}`));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    return (await res.json()) as Record<string, unknown>;
}

describe("MCP discovery manifests", () => {
    test("server card has identity, branding, endpoint and every tool", async () => {
        const card = await getJson("/.well-known/mcp/server-card.json");
        expect(card.name).toBe(REGISTRY_NAME);
        expect(card.displayName).toBe("actuatorlist");
        expect(String(card.description).length).toBeGreaterThan(20);
        expect(card.version).toBe(SERVER_VERSION);
        expect(card.serverUrl).toMatch(/^https?:\/\/.+\/mcp$/);
        expect(card.icons).toEqual([
            expect.objectContaining({ mimeType: "image/svg+xml" }),
        ]);
        expect(card.remotes).toEqual([
            { type: "streamable-http", url: card.serverUrl as string },
        ]);
        const tools = card.tools as { name: string; description: string }[];
        expect(tools.map((t) => t.name)).toEqual(CATALOG_TOOLS.map((t) => t.name));
        for (const t of tools) expect(t.description.length).toBeGreaterThanOrEqual(20);
    });

    test("mcp.json lists the catalog and docs endpoints", async () => {
        for (const path of ["/.well-known/mcp.json", "/.well-known/mcp"]) {
            const doc = await getJson(path);
            const servers = doc.servers as { url: string; transport: string }[];
            expect(servers.map((s) => new URL(s.url).pathname)).toEqual([
                "/mcp",
                "/mcp/docs",
            ]);
            for (const s of servers) expect(s.transport).toBe("streamable-http");
        }
    });

    test("registry server.json matches the running server", () => {
        expect(registryJson.name).toBe(REGISTRY_NAME);
        expect(registryJson.version).toBe(SERVER_VERSION);
        expect(registryJson.description.length).toBeLessThanOrEqual(100);
        expect(registryJson.remotes).toEqual([
            { type: "streamable-http", url: "https://actuatorlist.com/mcp" },
        ]);
    });
});
