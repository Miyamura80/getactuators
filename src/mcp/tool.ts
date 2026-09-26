import type { McpServer } from "@modelcontextprotocol/server";
import type { z } from "zod";

// One declarative shape for every catalog tool, so server registration and the
// server card (/.well-known/mcp/server-card.json) read the same list.

export interface ToolDef<
    I extends z.ZodObject = z.ZodObject,
    O extends z.ZodObject = z.ZodObject,
> {
    name: string;
    title: string;
    description: string;
    input: I;
    output: O;
    // ui:// resource that renders this tool's structuredContent (MCP Apps).
    uiResourceUri?: string;
    run: (args: z.output<I>) => z.input<O>;
}

// Thrown by a tool for a well-formed request the catalog cannot answer (e.g.
// an unknown id). Surfaced as an isError tool result the model can act on.
export class ToolInputError extends Error {}

export function defineTool<I extends z.ZodObject, O extends z.ZodObject>(
    def: ToolDef<I, O>,
): ToolDef {
    return def as unknown as ToolDef;
}

// Every tool is a pure read of a static catalog.
export function toolAnnotations(title: string) {
    return {
        title,
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
    };
}

function uiMeta(uri: string | undefined): Record<string, unknown> | undefined {
    if (!uri) return undefined;
    // `ui.resourceUri` is the MCP Apps key; `openai/outputTemplate` is the
    // ChatGPT Apps SDK equivalent for the same template.
    return { ui: { resourceUri: uri }, "openai/outputTemplate": uri };
}

export function registerTools(server: McpServer, tools: readonly ToolDef[]): void {
    for (const t of tools) {
        server.registerTool(
            t.name,
            {
                title: t.title,
                description: t.description,
                inputSchema: t.input,
                outputSchema: t.output,
                annotations: toolAnnotations(t.title),
                _meta: uiMeta(t.uiResourceUri),
            },
            async (args: unknown) => {
                try {
                    const data = t.run(args as never) as Record<string, unknown>;
                    return {
                        content: [
                            { type: "text" as const, text: JSON.stringify(data) },
                        ],
                        structuredContent: data,
                    };
                } catch (err) {
                    if (!(err instanceof ToolInputError)) throw err;
                    return {
                        isError: true,
                        content: [{ type: "text" as const, text: err.message }],
                    };
                }
            },
        );
    }
}
