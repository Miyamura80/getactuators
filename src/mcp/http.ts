import {
    type McpServer,
    WebStandardStreamableHTTPServerTransport,
    createMcpHandler,
    isLegacyRequest,
} from "@modelcontextprotocol/server";

// Streamable HTTP endpoint for a stateless MCP server, serving both protocol
// eras from one factory:
// - 2026-07-28 clients (per-request _meta envelope, server/discover) go to
//   the SDK's createMcpHandler.
// - 2025-era clients (initialize handshake) get a fresh server + transport per
//   request with no session id and plain JSON responses, which is the
//   widest-compatibility shape for a read-only server.
// There is no server-initiated stream, so GET and DELETE answer 405.

const CORS: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
        "Content-Type, Accept, Authorization, Mcp-Session-Id, MCP-Protocol-Version, Mcp-Method, Mcp-Name, Last-Event-ID",
    "Access-Control-Expose-Headers": "Mcp-Session-Id, MCP-Protocol-Version",
    "Access-Control-Max-Age": "86400",
};

function withCors(res: Response): Response {
    const headers = new Headers(res.headers);
    for (const [k, v] of Object.entries(CORS)) headers.set(k, v);
    return new Response(res.body, { status: res.status, headers });
}

function methodNotAllowed(): Response {
    return Response.json(
        {
            jsonrpc: "2.0",
            id: null,
            error: {
                code: -32000,
                message:
                    "Method not allowed. This stateless MCP endpoint takes JSON-RPC over POST only (Streamable HTTP).",
            },
        },
        { status: 405, headers: { Allow: "POST, OPTIONS" } },
    );
}

// The spec asks clients to accept both JSON and SSE; tolerate clients and
// probes that send only one (or none) instead of failing them with 406.
function normalizeAccept(req: Request): Request {
    const accept = req.headers.get("accept") ?? "";
    if (accept.includes("application/json") && accept.includes("text/event-stream")) {
        return req;
    }
    const headers = new Headers(req.headers);
    headers.set("accept", "application/json, text/event-stream");
    return new Request(req, { headers });
}

export type McpEndpoint = (req: Request) => Promise<Response>;

export function createMcpEndpoint(factory: () => McpServer): McpEndpoint {
    const modern = createMcpHandler(factory, { legacy: "reject" });

    const legacy = async (req: Request): Promise<Response> => {
        const server = factory();
        const transport = new WebStandardStreamableHTTPServerTransport({
            sessionIdGenerator: undefined,
            enableJsonResponse: true,
        });
        await server.connect(transport);
        try {
            return await transport.handleRequest(req);
        } finally {
            await server.close();
        }
    };

    return async (req) => {
        if (req.method === "OPTIONS") {
            return withCors(new Response(null, { status: 204 }));
        }
        if (req.method !== "POST") return withCors(methodNotAllowed());
        const normalized = normalizeAccept(req);
        const res = (await isLegacyRequest(normalized))
            ? await legacy(normalized)
            : await modern.fetch(normalized);
        return withCors(res);
    };
}
