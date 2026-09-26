import { REPO_URL } from "../../site";
import { PATHS } from "../links";

// Body markup shared by the prerendered SPA root and the server-rendered pages:
// the markdown body rendered to semantic HTML, wrapped in a nav and footer.

const NAV: [string, string][] = [
    ["/", "Leaderboard"],
    ["/all", "All actuators"],
    ["/actuators", "Gallery"],
    ["/robots", "Robots"],
    [PATHS.agentsPage, "For agents"],
];

const FOOTER: [string, string][] = [
    ["/about", "About"],
    ["/contact", "Contact"],
    ["/privacy", "Privacy"],
    [PATHS.apiDocs, "API"],
    [PATHS.llms, "llms.txt"],
    [REPO_URL, "GitHub"],
];

// Raw HTML in the markdown is disabled: catalog text is data, never markup.
export function markdownToHtml(md: string): string {
    return Bun.markdown.html(md, {
        noHtmlBlocks: true,
        noHtmlSpans: true,
        autolinks: { url: true },
    });
}

function links(items: [string, string][]): string {
    return items.map(([href, label]) => `<a href="${href}">${label}</a>`).join(" ");
}

// Page body: nav, the rendered markdown as <main>, footer.
export function pageBody(md: string): string {
    return [
        `<nav class="ga-nav" aria-label="Site">${links(NAV)}</nav>`,
        `<main class="ga-main">${markdownToHtml(md)}</main>`,
        `<footer class="ga-footer"><nav aria-label="Footer">${links(FOOTER)}</nav></footer>`,
    ].join("\n");
}
