import { describe, expect, test } from "bun:test";
import {
    Client,
    StreamableHTTPClientTransport,
    type VersionNegotiationMode,
} from "@modelcontextprotocol/client";
import { appHandler } from "./mcp-helpers";

// End to end with the official SDK client, in process: the client's fetch is
// wired straight to the app handler. Covers both protocol eras the endpoint
// serves (2025-era initialize and 2026-07-28 server/discover).

async function connect(mode: VersionNegotiationMode, path = "/mcp") {
    const handler = await appHandler();
    const client = new Client(
        { name: "e2e", version: "1.0.0" },
        { versionNegotiation: { mode } },
    );
    const transport = new StreamableHTTPClientTransport(
        new URL(`http://localhost${path}`),
        {
            fetch: (url, init) => handler(new Request(url, init)),
        },
    );
    await client.connect(transport);
    return client;
}

for (const mode of ["legacy", "auto"] as const) {
    describe(`SDK client (${mode} negotiation)`, () => {
        test("connects, lists tools and calls one", async () => {
            const client = await connect(mode);
            expect(client.getServerVersion()?.name).toBe("actuatorlist");
            expect(client.getInstructions()).toContain("recommend_actuators");
            const { tools } = await client.listTools();
            expect(tools.length).toBe(10);
            const res = await client.callTool({
                name: "search_actuators",
                arguments: { category: "smart_servo", limit: 2 },
            });
            expect(res.isError).toBeFalsy();
            const out = res.structuredContent as { results: { category: string }[] };
            expect(out.results.length).toBeGreaterThan(0);
            for (const a of out.results) expect(a.category).toBe("smart_servo");
            await client.close();
        });
    });
}

test("auto negotiation lands on the newest protocol revision", async () => {
    const client = await connect("auto");
    expect(client.getNegotiatedProtocolVersion()).toBe("2026-07-28");
    const { resources } = await client.listResources();
    expect(resources.some((r) => r.uri === "catalog://actuators")).toBe(true);
    await client.close();
});

test("docs surface works through the SDK client", async () => {
    const client = await connect("auto", "/mcp/docs");
    const res = await client.callTool({
        name: "get_doc_page",
        arguments: { id: "mcp" },
    });
    const out = res.structuredContent as { markdown: string };
    expect(out.markdown).toContain("claude mcp add");
    await client.close();
});
