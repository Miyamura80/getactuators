// The /agents picker hands out install links and commands verbatim, so a wrong
// encoding ships a broken "Add to" button. These pin each format.
import { describe, expect, test } from "bun:test";
import {
    AGENT_CLIENTS,
    DEFAULT_CLIENT_ID,
    MCP_URL,
    SERVER_NAME,
    claudeCodeCommand,
    claudeLink,
    codexCommand,
    cursorLink,
    findClient,
    geminiCommand,
    gooseLink,
    vscodeLink,
    windsurfConfig,
} from "../src/lib/agent-clients";

describe("agent client install formats", () => {
    test("server contract", () => {
        expect(SERVER_NAME).toBe("actuatorlist");
        expect(MCP_URL).toBe("https://actuatorlist.com/mcp");
    });

    test("Cursor link carries base64 JSON, URL-encoded", () => {
        const link = cursorLink("https://x.test/mcp?a=1", "srv");
        expect(link.startsWith("cursor://anysphere.cursor-deeplink/mcp/install?")).toBe(true);
        const params = new URL(link.replace("cursor://", "https://")).searchParams;
        expect(params.get("name")).toBe("srv");
        const config = JSON.parse(atob(params.get("config") ?? ""));
        expect(config).toEqual({ url: "https://x.test/mcp?a=1" });
        // Raw base64 padding / plus signs must not leak into the query string.
        expect(link.split("config=")[1]).not.toMatch(/[+=/]/);
    });

    test("VS Code link uses the https redirect with a type/url JSON config", () => {
        const url = new URL(vscodeLink());
        expect(url.origin + url.pathname).toBe("https://vscode.dev/redirect/mcp/install");
        expect(url.searchParams.get("name")).toBe("actuatorlist");
        expect(JSON.parse(url.searchParams.get("config") ?? "")).toEqual({
            type: "http",
            url: MCP_URL,
        });
    });

    test("Claude link puts the query before the hash route", () => {
        const url = new URL(claudeLink());
        expect(url.pathname).toBe("/new");
        expect(url.hash).toBe("#settings/customize-connectors");
        expect(url.searchParams.get("modal")).toBe("add-custom-connector");
        expect(url.searchParams.get("connectorUrl")).toBe(MCP_URL);
    });

    test("Goose link declares streamable HTTP", () => {
        const q = new URLSearchParams(gooseLink().split("?")[1]);
        expect(q.get("type")).toBe("streamable_http");
        expect(q.get("url")).toBe(MCP_URL);
    });

    test("CLI commands", () => {
        expect(claudeCodeCommand()).toBe(
            "claude mcp add --transport http --scope user actuatorlist https://actuatorlist.com/mcp",
        );
        expect(codexCommand()).toBe("codex mcp add actuatorlist --url https://actuatorlist.com/mcp");
        expect(geminiCommand()).toBe(
            "gemini mcp add --transport http actuatorlist https://actuatorlist.com/mcp",
        );
    });

    test("Windsurf config uses serverUrl", () => {
        expect(JSON.parse(windsurfConfig())).toEqual({
            mcpServers: { actuatorlist: { serverUrl: MCP_URL } },
        });
    });
});

describe("client matrix", () => {
    test("ids are unique and the default exists", () => {
        const ids = AGENT_CLIENTS.map((c) => c.id);
        expect(new Set(ids).size).toBe(ids.length);
        expect(findClient(DEFAULT_CLIENT_ID)).toBeDefined();
    });

    test("every client gives the visitor something to act on", () => {
        for (const c of AGENT_CLIENTS) {
            expect(c.installUrl != null || c.snippet != null).toBe(true);
            if (c.effort === "one-click" || c.effort === "dialog-only")
                expect(c.installUrl).not.toBeNull();
        }
    });

    test("no copy mentions sign-in or OAuth (the server is anonymous)", () => {
        const text = JSON.stringify(AGENT_CLIENTS).toLowerCase();
        expect(text).not.toContain("oauth");
        expect(text).not.toContain("sign in");
        expect(text).not.toContain("sign-in");
    });
});
