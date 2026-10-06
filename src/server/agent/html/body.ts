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

// One line icon per kind of section, drawn in the site's stroke style, so the
// method below a tool can be scanned by shape before it is read.
const ICON_PATHS: Record<string, string> = {
    method: "M5 3v18M12 3v18M19 3v18M3 17 21 7",
    formula: "M17 4H7l6 8-6 8h10",
    units: "M4 8h15l-3-3M20 16H5l3 3",
    example: "M3 17 17 3l4 4L7 21ZM7 13l2 2M10 10l2 2M13 7l2 2",
    limits: "M12 3 22 20H2ZM12 10v4M12 17v.5",
    assumptions: "M4 7h16M4 17h16M14 4.5v5M8 14.5v5",
    funnel: "M3 4h18l-7 8v6l-4 2v-8Z",
    questions:
        "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.6v.6M12 17v.5",
    next: "M4 12h15M14 7l5 5-5 5",
};

const SECTION_ICON: [RegExp, string][] = [
    [/^How (the calculat|to read)/, "method"],
    [/^Formulas/, "formula"],
    [/^Unit conversions/, "units"],
    [/^Worked/, "example"],
    [/^What (the result|this guide) does not/, "limits"],
    [/^Assumptions/, "assumptions"],
    [/^From requirement/, "funnel"],
    [/^Questions/, "questions"],
    [/^Next steps/, "next"],
];

export function withSectionIcons(html: string): string {
    return html.replace(
        /<h2([^>]*)>([^<]+)<\/h2>/g,
        (whole, attrs: string, text: string) => {
            const kind = SECTION_ICON.find(([re]) => re.test(text))?.[1];
            if (!kind) return whole;
            const icon = `<svg class="ga-h2-icon ga-ic-${kind}" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="${ICON_PATHS[kind]}"/></svg>`;
            return `<h2${attrs}>${icon}${text}</h2>`;
        },
    );
}

// In a "Worked ..." section each example's h3 already states its result, so
// the working folds under it: the result stays readable, the arithmetic is
// one tap away.
export function foldWorkedExamples(html: string): string {
    return html.replace(
        /(<h2[^>]*>Worked[^<]*<\/h2>)([\s\S]*?)(?=<h2[ >]|$)/g,
        (_, heading: string, section: string) =>
            heading +
            section.replace(
                /(<h3>[\s\S]*?<\/h3>)([\s\S]*?)(?=<h3>|$)/g,
                (_m: string, title: string, body: string) =>
                    `<details class="ga-example"><summary>${title}</summary>${body.trim()}</details>\n`,
            ),
    );
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
