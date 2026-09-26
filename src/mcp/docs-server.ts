import {
    McpServer,
    ResourceNotFoundError,
    ResourceTemplate,
} from "@modelcontextprotocol/server";
import { z } from "zod";
import { DOC_PAGES, type DocPage } from "./docs-pages";
import { ICON_URL, SERVER_VERSION } from "./server";
import { ToolInputError, defineTool, registerTools } from "./tool";

// Second MCP surface (/mcp/docs): the "learn" side. Serves the reference
// pages as markdown resources and a keyword search over their sections.

export const DOCS_SERVER_NAME = "getactuators-docs";
const MARKDOWN = "text/markdown";
const pageUri = (id: string) => `docs://getactuators/${id}`;

interface Section {
    page: DocPage;
    heading: string;
    text: string;
}

const SECTIONS: Section[] = DOC_PAGES.flatMap((page) =>
    page.markdown.split(/\n(?=#{1,2} )/).map((chunk) => ({
        page,
        heading: chunk.split("\n", 1)[0]?.replace(/^#+\s*/, "") ?? page.title,
        text: chunk.trim(),
    })),
);

function search(query: string, limit: number) {
    const terms = query
        .toLowerCase()
        .split(/\W+/)
        .filter((t) => t.length > 1);
    return SECTIONS.map((s) => {
        const hay = s.text.toLowerCase();
        const score = terms.reduce((n, t) => n + hay.split(t).length - 1, 0);
        return { s, score };
    })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(({ s, score }) => ({
            page_id: s.page.id,
            uri: pageUri(s.page.id),
            heading: s.heading,
            score,
            excerpt: s.text.slice(0, 600),
        }));
}

const searchDocs = defineTool({
    name: "search_docs",
    title: "Search getactuators docs",
    description:
        "Keyword search over the getactuators reference docs (data fields and units, categories, MCP and REST access). Returns matching sections with excerpts and the page id to open with get_doc_page.",
    input: z.object({
        query: z
            .string()
            .min(2)
            .max(200)
            .describe("Words to look for, e.g. 'torque density unit'."),
        limit: z
            .number()
            .int()
            .min(1)
            .max(20)
            .default(5)
            .describe("Max sections (1-20)."),
    }),
    output: z.object({
        results: z.array(
            z.object({
                page_id: z.string(),
                uri: z.string(),
                heading: z.string(),
                score: z.number(),
                excerpt: z.string(),
            }),
        ),
    }),
    run: ({ query, limit }) => ({ results: search(query, limit) }),
});

const getDocPage = defineTool({
    name: "get_doc_page",
    title: "Read a getactuators doc page",
    description: `Return one reference page as markdown by id. Pages: ${DOC_PAGES.map((p) => p.id).join(", ")}.`,
    input: z.object({
        id: z.string().min(1).max(60).describe("Page id, e.g. data-fields."),
    }),
    output: z.object({ id: z.string(), title: z.string(), markdown: z.string() }),
    run: ({ id }) => {
        const p = DOC_PAGES.find((x) => x.id === id);
        if (!p) {
            throw new ToolInputError(
                `No doc page '${id}'. Valid ids: ${DOC_PAGES.map((x) => x.id).join(", ")}.`,
            );
        }
        return { id: p.id, title: p.title, markdown: p.markdown };
    },
});

export const DOCS_TOOLS = [searchDocs, getDocPage];

export function createDocsServer(): McpServer {
    const server = new McpServer(
        {
            name: DOCS_SERVER_NAME,
            title: "getactuators docs",
            version: SERVER_VERSION,
            icons: [{ src: ICON_URL, mimeType: "image/svg+xml", sizes: ["any"] }],
        },
        {
            instructions:
                "Reference documentation for the getactuators catalog: field meanings and units, categories, and how to reach the data over MCP and REST. Use search_docs to find a section, get_doc_page or the docs:// resources to read a page. For catalog data itself, use the main server at /mcp.",
        },
    );
    registerTools(server, DOCS_TOOLS);
    server.registerResource(
        "doc-page",
        new ResourceTemplate("docs://getactuators/{id}", {
            list: async () => ({
                resources: DOC_PAGES.map((p) => ({
                    uri: pageUri(p.id),
                    name: p.id,
                    title: p.title,
                    description: p.description,
                    mimeType: MARKDOWN,
                })),
            }),
        }),
        { title: "getactuators doc page", mimeType: MARKDOWN },
        async (uri, { id }) => {
            const p = DOC_PAGES.find((x) => x.id === String(id));
            if (!p) throw new ResourceNotFoundError(uri.href);
            return {
                contents: [{ uri: uri.href, mimeType: MARKDOWN, text: p.markdown }],
            };
        },
    );
    return server;
}
