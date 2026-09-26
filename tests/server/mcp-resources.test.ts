import { describe, expect, test } from "bun:test";
import { ACTUATORS, ROBOTS } from "@/catalog";
import { appHandler, callTool, rpc } from "./mcp-helpers";

interface ResourceInfo {
    uri: string;
    name: string;
    mimeType?: string;
}

interface ReadResult {
    contents: { uri: string; mimeType?: string; text?: string }[];
}

async function read(uri: string, path = "/mcp") {
    const res = await rpc("resources/read", { uri }, path);
    return res;
}

describe("MCP resources", () => {
    test("every listed resource reads back non-empty with its mimeType", async () => {
        const res = await rpc("resources/list");
        const resources = (res.result?.resources ?? []) as ResourceInfo[];
        const uris = resources.map((r) => r.uri);
        expect(uris).toContain("catalog://actuators");
        expect(uris).toContain("catalog://robots");
        expect(uris).toContain("catalog://categories");
        expect(uris).toContain("ui://getactuators/actuator-compare.html");
        expect(resources.length).toBe(4 + ACTUATORS.length + ROBOTS.length);
        for (const r of resources) {
            expect(r.mimeType).toBeTruthy();
            const out = (await read(r.uri)).result as unknown as ReadResult;
            const c = out.contents[0];
            expect(c?.uri).toBe(r.uri);
            expect(c?.mimeType).toBe(r.mimeType ?? "");
            expect(c?.text?.length ?? 0).toBeGreaterThan(10);
        }
    });

    test("catalog://actuators is the full dataset as JSON", async () => {
        const out = (await read("catalog://actuators")).result as unknown as ReadResult;
        const data = JSON.parse(out.contents[0]?.text ?? "[]") as { id: string }[];
        expect(data.map((a) => a.id)).toEqual(ACTUATORS.map((a) => a.id));
    });

    test("templates are advertised and unknown ids are errors", async () => {
        const res = await rpc("resources/templates/list");
        const templates = (res.result?.resourceTemplates ?? []) as {
            uriTemplate: string;
        }[];
        expect(templates.map((t) => t.uriTemplate).sort()).toEqual([
            "actuator://{id}",
            "robot://{id}",
        ]);
        const bad = await read("actuator://does-not-exist");
        expect(bad.error?.code).toBeDefined();
    });

    test("MCP App view is a self-contained, CSP-scoped HTML page", async () => {
        const out = (await read("ui://getactuators/actuator-compare.html"))
            .result as unknown as ReadResult & {
            contents: { _meta?: { ui?: { csp?: { connectDomains?: string[] } } } }[];
        };
        const c = out.contents[0];
        expect(c?.mimeType).toBe("text/html;profile=mcp-app");
        const html = c?.text ?? "";
        expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
        expect(html).toContain('<meta name="color-scheme" content="light dark">');
        expect(html).toContain("frame-ancestors https://chatgpt.com https://claude.ai");
        expect(html).toMatch(/script-src 'sha256-[A-Za-z0-9+/=]+'/);
        expect(html).not.toContain("default-src *");
        expect(html).not.toMatch(/<script[^>]+src=/);
        expect(html).toContain("ui/notifications/tool-result");
        expect(c?._meta?.ui?.csp?.connectDomains?.length).toBeGreaterThan(0);
    });
});

describe("docs MCP surface (/mcp/docs)", () => {
    test("initialize identifies the docs server", async () => {
        const res = await rpc(
            "initialize",
            {
                protocolVersion: "2025-11-25",
                capabilities: {},
                clientInfo: { name: "t", version: "1" },
            },
            "/mcp/docs",
        );
        const info = res.result?.serverInfo as { name: string };
        expect(info.name).toBe("getactuators-docs");
        expect(res.result?.instructions).toBeTruthy();
    });

    test("search_docs finds units and every page resource reads as markdown", async () => {
        const tools = await rpc("tools/list", undefined, "/mcp/docs");
        const names = ((tools.result?.tools ?? []) as { name: string }[]).map(
            (t) => t.name,
        );
        expect(names).toEqual(["search_docs", "get_doc_page"]);

        const handler = await appHandler();
        const res = await handler(
            new Request("http://localhost/mcp/docs", {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    accept: "application/json, text/event-stream",
                },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    id: 1,
                    method: "tools/call",
                    params: {
                        name: "search_docs",
                        arguments: { query: "torque density" },
                    },
                }),
            }),
        );
        const body = (await res.json()) as {
            result: { structuredContent: { results: { page_id: string }[] } };
        };
        expect(body.result.structuredContent.results[0]?.page_id).toBe("data-fields");

        const list = await rpc("resources/list", undefined, "/mcp/docs");
        const pages = (list.result?.resources ?? []) as ResourceInfo[];
        expect(pages.length).toBeGreaterThanOrEqual(4);
        for (const p of pages) {
            const out = (await read(p.uri, "/mcp/docs"))
                .result as unknown as ReadResult;
            expect(out.contents[0]?.mimeType).toBe("text/markdown");
            expect(out.contents[0]?.text?.startsWith("# ")).toBe(true);
        }
    });

    test("catalog tools do not leak onto the docs surface", async () => {
        const r = await rpc(
            "tools/call",
            { name: "get_actuator", arguments: { id: "x" } },
            "/mcp/docs",
        );
        expect(r.error?.code).toBe(-32602);
        const ok = await callTool("list_brands");
        expect(ok.isError).toBeFalsy();
    });
});
