import { SITE_NAME, absoluteUrl } from "@/server/site";
import {
    type Block,
    DOCS_DESCRIPTION,
    DOCS_TITLE,
    DOCS_UPDATED,
    docsBlocks,
} from "./content";

// Two renderers over the same blocks: Markdown for agents, HTML for people.

const escapeHtml = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Inline Markdown subset used by the content: `code`, **bold**, [text](url).
function inline(md: string): string {
    return escapeHtml(md)
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
}

const mdRow = (cells: string[]) => `| ${cells.map((c) => c.replace(/\|/g, "\\|")).join(" | ")} |`;

function blockToMarkdown(b: Block): string {
    switch (b.kind) {
        case "h2":
            return `## ${b.text}`;
        case "h3":
            return `### ${b.text}`;
        case "p":
            return b.text;
        case "code":
            return `\`\`\`${b.lang}\n${b.text}\n\`\`\``;
        case "list":
            return b.items.map((i) => `- ${i}`).join("\n");
        case "table":
            return [mdRow(b.head), mdRow(b.head.map(() => "---")), ...b.rows.map(mdRow)].join("\n");
    }
}

export function renderDocsMarkdown(): string {
    const front = [
        "---",
        `title: ${DOCS_TITLE}`,
        `description: ${DOCS_DESCRIPTION}`,
        `canonical: ${absoluteUrl("/docs/api")}`,
        `last-updated: ${DOCS_UPDATED}`,
        "---",
    ].join("\n");
    const body = docsBlocks().map(blockToMarkdown).join("\n\n");
    return `${front}\n\n# ${DOCS_TITLE}\n\n${body}\n`;
}

function tableToHtml(b: Extract<Block, { kind: "table" }>): string {
    const head = `<tr>${b.head.map((h) => `<th>${inline(h)}</th>`).join("")}</tr>`;
    const rows = b.rows.map((r, i) => {
        const id = b.rowIds?.[i];
        const attr = id ? ` id="${escapeHtml(id)}"` : "";
        return `<tr${attr}>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`;
    });
    return `<div class="t"><table><thead>${head}</thead><tbody>${rows.join("")}</tbody></table></div>`;
}

function blockToHtml(b: Block): string {
    switch (b.kind) {
        case "h2":
        case "h3":
            return `<${b.kind} id="${escapeHtml(b.id)}">${inline(b.text)}</${b.kind}>`;
        case "p":
            return `<p>${inline(b.text)}</p>`;
        case "code":
            return `<pre><code class="language-${b.lang}">${escapeHtml(b.text)}</code></pre>`;
        case "list":
            return `<ul>${b.items.map((i) => `<li>${inline(i)}</li>`).join("")}</ul>`;
        case "table":
            return tableToHtml(b);
    }
}

const STYLE = `
:root{--bg:#fff;--fg:#1a1a1a;--muted:#5c5c5c;--line:#e4e4e4;--code:#f5f5f4;--link:#0b57d0}
@media (prefers-color-scheme:dark){:root{--bg:#111;--fg:#ececec;--muted:#a0a0a0;--line:#2c2c2c;--code:#1c1c1c;--link:#8ab4f8}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.6 system-ui,sans-serif}
main{max-width:860px;margin:0 auto;padding:32px 16px 64px}a{color:var(--link)}
h1{font-size:2rem;margin:0 0 4px}h2{margin-top:2.4em;border-bottom:1px solid var(--line);padding-bottom:4px}
h3{margin-top:1.8em;font-family:ui-monospace,monospace;font-size:1rem}
code{font:0.9em ui-monospace,monospace;background:var(--code);padding:1px 4px;border-radius:4px}
pre{background:var(--code);padding:12px 14px;border-radius:6px;overflow-x:auto}pre code{padding:0}
.t{overflow-x:auto}table{border-collapse:collapse;width:100%;font-size:0.92rem}
th,td{text-align:left;border-bottom:1px solid var(--line);padding:6px 8px;vertical-align:top}
tr:target{background:var(--code)}.meta{color:var(--muted);margin:0 0 24px}nav a{margin-right:12px}
`;

export function renderDocsHtml(): string {
    const canonical = absoluteUrl("/docs/api");
    const body = docsBlocks().map(blockToHtml).join("\n");
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${DOCS_TITLE} | ${SITE_NAME}</title>
<meta name="description" content="${escapeHtml(DOCS_DESCRIPTION)}">
<link rel="canonical" href="${canonical}">
<link rel="alternate" type="text/markdown" href="${absoluteUrl("/docs/api.md")}">
<link rel="service-desc" type="application/openapi+json" href="${absoluteUrl("/openapi.json")}">
<style>${STYLE}</style>
</head>
<body>
<main>
<nav><a href="/">${SITE_NAME}</a><a href="/openapi.json">OpenAPI</a><a href="/api">API index</a><a href="/docs/api.md">Markdown</a></nav>
<h1>${DOCS_TITLE}</h1>
<p class="meta">Version 1 &middot; Last updated ${DOCS_UPDATED}</p>
${body}
</main>
</body>
</html>
`;
}
