// Install matrix for the /agents connect picker (and the WebMCP tools that
// hand the same answers to in-browser agents). One record per MCP client; the
// deep links and snippets are derived from MCP_URL + SERVER_NAME so no two
// surfaces can disagree about the endpoint.
//
// The server is anonymous and read-only, so every path ends at "the tools
// appear". There is no sign-in step to describe.

export const SERVER_NAME = "actuatorlist";
export const DISPLAY_NAME = "actuatorlist";
export const MCP_URL = "https://actuatorlist.com/mcp";

// How much work is left after the visitor acts. "page-only" is ChatGPT: the
// link opens the Plugins page and nothing more (no dialog, no prefill), so the
// URL is copied to the clipboard on the way out and the promise stays
// "shortcut", not "1-click".
export type InstallEffort = "one-click" | "page-only" | "command" | "config" | "prompt";

export const EFFORT_BADGE: Record<InstallEffort, string> = {
    "one-click": "1-click",
    "page-only": "shortcut",
    command: "command",
    config: "config",
    prompt: "prompt",
};

export interface AgentClient {
    id: string;
    name: string;
    logo: string;
    effort: InstallEffort;
    // Deep link (one-click and page-only clients); null otherwise.
    installUrl: string | null;
    // Text to copy: a shell command, a config file snippet, or a prompt.
    snippet: string | null;
    // Fallback click-path, shown behind a disclosure.
    steps: string[] | null;
    note: string | null;
}

// Base64 of an ASCII string. btoa exists in browsers and Bun; the config JSON
// is plain ASCII, so no UTF-8 dance is needed.
function base64(text: string): string {
    return btoa(text);
}

export function claudeLink(url = MCP_URL, name = DISPLAY_NAME): string {
    // Query params must come before the hash route; the /new path is the one
    // that opens the "Add custom connector" dialog prefilled.
    const params = new URLSearchParams({
        modal: "add-custom-connector",
        connectorName: name,
        connectorUrl: url,
    });
    return `https://claude.ai/new?${params.toString()}#settings/customize-connectors`;
}

// ChatGPT has no deep link that opens or prefills the create form. Custom MCP
// servers are added from the Plugins page (Add, then Create custom MCP server), so this
// is a plain page link. The old #settings/Connectors?create-connector=true hash
// route targeted the Settings > Connectors flow, which ChatGPT removed along
// with the separate Developer mode toggle.
export const CHATGPT_LINK = "https://chatgpt.com/plugins";

export function cursorLink(url = MCP_URL, name = SERVER_NAME): string {
    // cursor://anysphere.cursor-deeplink/mcp/install?name=<n>&config=<base64 JSON>
    // base64 may contain + / =, which a query parser would mangle unencoded.
    const config = base64(JSON.stringify({ url }));
    return `cursor://anysphere.cursor-deeplink/mcp/install?name=${encodeURIComponent(name)}&config=${encodeURIComponent(config)}`;
}

export function vscodeLink(url = MCP_URL, name = SERVER_NAME): string {
    // The https redirect form works from any browser, where the vscode: scheme
    // is often blocked. `name` is a query param here, not part of the JSON.
    const config = encodeURIComponent(JSON.stringify({ type: "http", url }));
    return `https://vscode.dev/redirect/mcp/install?name=${encodeURIComponent(name)}&config=${config}`;
}

export function gooseLink(url = MCP_URL, name = SERVER_NAME): string {
    const params = new URLSearchParams({
        url,
        type: "streamable_http",
        id: name,
        name,
        description: "Robot actuator and robot catalog (read-only)",
        timeout: "300",
    });
    return `goose://extension?${params.toString()}`;
}

export function claudeCodeCommand(url = MCP_URL, name = SERVER_NAME): string {
    return `claude mcp add --transport http --scope user ${name} ${url}`;
}

export function codexCommand(url = MCP_URL, name = SERVER_NAME): string {
    return `codex mcp add ${name} --url ${url}`;
}

export function geminiCommand(url = MCP_URL, name = SERVER_NAME): string {
    return `gemini mcp add --transport http ${name} ${url}`;
}

// Windsurf keys a remote server by "serverUrl", not "url"; a snippet copied
// from another client fails silently there.
export function windsurfConfig(url = MCP_URL, name = SERVER_NAME): string {
    return JSON.stringify({ mcpServers: { [name]: { serverUrl: url } } }, null, 2);
}

export function genericPrompt(url = MCP_URL, name = SERVER_NAME): string {
    return `Add a remote MCP server, then check that its tools load.

  Name:      ${name}
  Endpoint:  ${url}
  Transport: streamable HTTP (remote, not stdio)
  Auth:      none

Use this client's own config keys (VS Code "servers",
Cursor/Cline "mcpServers", Zed "context_servers",
Windsurf "serverUrl" instead of "url"). Keep my existing
servers and show me the diff.`;
}

export const AGENT_CLIENTS: readonly AgentClient[] = [
    {
        id: "claude",
        name: "Claude",
        logo: "/logos/claude.svg",
        effort: "one-click",
        installUrl: claudeLink(),
        snippet: null,
        steps: [
            "Open Claude, then Settings, then Connectors",
            "Click Add custom connector",
            "Paste the URL above and click Add",
        ],
        note: "Opens claude.ai or Claude Desktop with the name and URL filled in. Click Add and the tools are live.",
    },
    {
        id: "claude-code",
        name: "Claude Code",
        logo: "/logos/cli.svg",
        effort: "command",
        installUrl: null,
        snippet: claudeCodeCommand(),
        steps: null,
        note: "Run /mcp inside a session to confirm the tools loaded.",
    },
    {
        id: "cursor",
        name: "Cursor",
        logo: "/logos/cursor.svg",
        effort: "one-click",
        installUrl: cursorLink(),
        snippet: null,
        steps: [
            "Open Cursor Settings, then MCP",
            "Add a new server named actuatorlist",
            "Paste the URL above as its url",
        ],
        note: null,
    },
    {
        id: "vscode",
        name: "VS Code",
        logo: "/logos/vscode.svg",
        effort: "one-click",
        installUrl: vscodeLink(),
        snippet: null,
        steps: [
            "Run MCP: Add Server from the Command Palette",
            "Choose HTTP and paste the URL above",
            "Name it actuatorlist",
        ],
        note: "The tools show up in Copilot agent mode.",
    },
    {
        id: "chatgpt",
        name: "ChatGPT",
        logo: "/logos/chatgpt.svg",
        effort: "page-only",
        installUrl: CHATGPT_LINK,
        snippet: null,
        steps: [
            "Add → Create custom MCP server",
            "Paste the URL, Authentication: No Auth → Create as a plugin",
        ],
        note: "Copies the URL and opens ChatGPT Plugins.",
    },
    {
        id: "codex",
        name: "Codex",
        logo: "/logos/codex.svg",
        effort: "command",
        installUrl: null,
        snippet: codexCommand(),
        steps: [
            "Open ~/.codex/config.toml",
            `Add [mcp_servers.${SERVER_NAME}] with url = "${MCP_URL}"`,
        ],
        note: null,
    },
    {
        id: "gemini",
        name: "Gemini CLI",
        logo: "/logos/cli.svg",
        effort: "command",
        installUrl: null,
        snippet: geminiCommand(),
        steps: null,
        note: "Writes to ~/.gemini/settings.json or the project's .gemini/settings.json.",
    },
    {
        id: "goose",
        name: "Goose",
        logo: "/logos/goose.svg",
        effort: "one-click",
        installUrl: gooseLink(),
        snippet: null,
        steps: null,
        note: "Adds the extension over streamable HTTP.",
    },
    {
        id: "windsurf",
        name: "Windsurf",
        logo: "/logos/mcp.svg",
        effort: "config",
        installUrl: null,
        snippet: windsurfConfig(),
        steps: null,
        note: "Merge into ~/.codeium/windsurf/mcp_config.json. Windsurf uses serverUrl, not url.",
    },
    {
        id: "other",
        name: "Any MCP client",
        logo: "/logos/mcp.svg",
        effort: "prompt",
        installUrl: null,
        snippet: genericPrompt(),
        steps: null,
        note: "Anything that speaks MCP over streamable HTTP works. Nothing to install, no key.",
    },
];

export const DEFAULT_CLIENT_ID = "claude";

export function findClient(id: string): AgentClient | undefined {
    return AGENT_CLIENTS.find((c) => c.id === id);
}

// One sentence on what to do with the snippet, per effort.
export function snippetHint(c: AgentClient): string {
    if (c.effort === "command") return "Run this in your terminal.";
    if (c.effort === "config") return `Add this to ${c.name}'s MCP config.`;
    return `Paste this into ${c.name}; it will add the server for you.`;
}

// Tools the MCP server exposes, for the "what agents can do" list.
export const MCP_TOOLS: readonly { name: string; does: string }[] = [
    { name: "search_actuators", does: "Filter and sort by torque, weight, price, category" },
    { name: "get_actuator", does: "Full spec sheet for one actuator, with sources" },
    { name: "compare_actuators", does: "Side-by-side specs for several actuators" },
    { name: "recommend_actuators", does: "Rank candidates for a joint's torque and budget" },
    { name: "list_robots", does: "Robots in the catalog and their joint loadouts" },
    { name: "get_robot", does: "One robot with the actuator behind each joint" },
    { name: "find_robots_using_actuator", does: "Which robots ship a given actuator" },
    { name: "list_actuator_categories", does: "QDD, harmonic, cycloidal and the rest" },
    { name: "list_brands", does: "Every manufacturer in the dataset" },
];
