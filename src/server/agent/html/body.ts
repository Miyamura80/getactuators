import { publicFooter, publicHeader } from "../../../public-navigation";

// Body markup shared by the prerendered SPA root and the server-rendered pages:
// the markdown body rendered to semantic HTML, wrapped in a nav and footer.

// Raw HTML in the markdown is disabled: catalog text is data, never markup.
export function markdownToHtml(md: string): string {
    const html = Bun.markdown.html(md, {
        noHtmlBlocks: true,
        noHtmlSpans: true,
        autolinks: { url: true },
    });
    return html
        .replace(
            /<table>/g,
            '<div class="ga-table-scroll" role="region" aria-label="Scrollable data table" tabindex="0"><table>',
        )
        .replace(/<\/table>/g, "</table></div>");
}

// Stable ids from heading text ("## Knee" -> id="knee") so figures and other
// pages can link into a section.
export function withHeadingIds(html: string): string {
    return html.replace(/<h2>([^<]+)<\/h2>/g, (_, text: string) => {
        const id = text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
        return `<h2 id="${id}">${text}</h2>`;
    });
}

// Each h2 section becomes a closed <details> whose summary is the heading plus
// a one-line payload, so the page can be scanned without reading it.
export function foldSections(html: string, meta: Record<string, string>): string {
    return html.replace(
        /(<h2 id="([^"]+)">[\s\S]*?<\/h2>)([\s\S]*?)(?=<h2 |$)/g,
        (_, heading: string, id: string, rest: string) => {
            const n = (rest.match(/<h3>/g) ?? []).length;
            const line = (meta[id] ?? "").replace("{n}", String(n));
            const payload = line
                ? `<span class="ga-fold-meta">${escapeText(line)}</span>`
                : "";
            return `<details class="ga-fold"><summary>${heading}${payload}</summary>${rest.trim()}</details>`;
        },
    );
}

function escapeText(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Page body: nav, the rendered markdown as <main>, footer.
export function pageBody(
    md: string,
    editorial = false,
    visual?: string,
    path = "",
    footer = true,
): string {
    let content = markdownToHtml(md);
    if (md.startsWith("# Frequently asked questions\n")) {
        content = content.replace(
            /(<h3>[\s\S]*?<\/h3>)([\s\S]*?)(?=<h[23]>|$)/g,
            '<details class="ga-faq-item"><summary>$1</summary>$2</details>',
        );
    }
    if (editorial) {
        // Generated Markdown only; raw HTML remains disabled above.
        content = content.replace(
            /<li>(<a[^>]*><img[^>]*><\/a>)([\s\S]*?)<\/li>/g,
            '<li class="ga-photo-card">$1<div class="ga-photo-copy">$2</div></li>',
        );
        const [intro = "", ...sections] = content.split(/(?=<h2>)/);
        const methodology = sections.filter(
            (section) => !visual || !section.includes('class="ga-photo-card"'),
        );
        const grid = `<div class="ga-editorial-grid">${methodology.map((section) => `<section class="ga-editorial-section">${section}</section>`).join("")}</div>`;
        content = visual
            ? `${intro.match(/<h1>[\s\S]*?<\/h1>/)?.[0] ?? ""}${visual}<details class="ga-methodology"><summary>Full methodology and source conflicts</summary>${intro.replace(/<h1>[\s\S]*?<\/h1>/, "")}${grid}</details>`
            : `${intro}${grid}`;
    }
    return [
        publicHeader(path),
        `<main class="ga-main">${content}</main>`,
        footer ? publicFooter() : "",
    ].join("\n");
}
