import { createHandler } from "@/server/app";
import { loadRegistry } from "@/server/registry";

// Raw JSON-RPC over the real request pipeline (routes + hooks), speaking the
// 2025-era stateless shape most MCP clients use today.

export const PROTOCOL = "2025-11-25";

let handlerPromise: ReturnType<typeof build> | undefined;
async function build() {
    return createHandler(await loadRegistry());
}

export function appHandler() {
    handlerPromise ??= build();
    return handlerPromise;
}

export interface RpcResponse {
    jsonrpc: "2.0";
    id: number | string | null;
    result?: Record<string, unknown> & {
        structuredContent?: Record<string, unknown>;
        isError?: boolean;
        content?: { type: string; text: string }[];
    };
    error?: { code: number; message: string };
}

let nextId = 1;

export async function rawPost(
    body: unknown,
    headers: Record<string, string> = {},
    path = "/mcp",
): Promise<Response> {
    const handler = await appHandler();
    return handler(
        new Request(`http://localhost${path}`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                accept: "application/json, text/event-stream",
                "mcp-protocol-version": PROTOCOL,
                ...headers,
            },
            body: JSON.stringify(body),
        }),
    );
}

export async function rpc(
    method: string,
    params?: Record<string, unknown>,
    path = "/mcp",
): Promise<RpcResponse> {
    const res = await rawPost(
        { jsonrpc: "2.0", id: nextId++, method, params },
        {},
        path,
    );
    return (await res.json()) as RpcResponse;
}

export async function callTool(name: string, args: Record<string, unknown> = {}) {
    const res = await rpc("tools/call", { name, arguments: args });
    if (!res.result)
        throw new Error(`tools/call ${name} failed: ${JSON.stringify(res)}`);
    return res.result;
}
