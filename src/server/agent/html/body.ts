import { REPO_URL } from "../../site";
import { PATHS } from "../links";

// Body markup shared by the prerendered SPA root and the server-rendered pages:
// the markdown body rendered to semantic HTML, wrapped in a nav and footer.

const NAV: [string, string][] = [
    ["/", "Leaderboard"],
    ["/all", "All actuators"],
    ["/actuators", "Gallery"],
    ["/robots", "Robots"],
    ["/guides", "Guides"],
    [PATHS.agentsPage, "For agents"],
];

const FOOTER: [string, string][] = [
    ["/about", "About"],
    ["/contact", "Contact"],
    ["/privacy", "Privacy"],
    ["/guides", "Guides"],
    [PATHS.apiDocs, "API"],
    [PATHS.llms, "llms.txt"],
    [REPO_URL, "GitHub"],
];

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

function links(items: [string, string][]): string {
    return items.map(([href, label]) => `<a href="${href}">${label}</a>`).join(" ");
}

// Page body: nav, the rendered markdown as <main>, footer.
export function pageBody(md: string, editorial = false, visual?: string): string {
    let content = markdownToHtml(md);
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
        `<nav class="ga-nav" aria-label="Site">${links(NAV)}</nav>`,
        `<main class="ga-main">${content}</main>`,
        `<footer class="ga-footer"><nav aria-label="Footer">${links(FOOTER)}</nav></footer>`,
    ].join("\n");
}
