import { DIST_DIR } from "../../static";
import { graph } from "../jsonld";
import { type Page, markdownPath } from "../pages";
import { markdownToHtml, pageBody } from "./body";
import { type HeadMeta, documentTitle, esc, headTags } from "./head";
import { PAGE_CSS } from "./style";

// HTML for every page: the React shell enriched at serve time (SPA pages) or a
// complete server-rendered document (trust pages, 404).

const FONTS =
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap";

// Used when frontend/dist has not been built (tests, bare checkouts).
const FALLBACK_SHELL = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="" />
    <title>actuatorlist</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

let shellCache: string | null = null;

async function loadShell(): Promise<string> {
    if (shellCache !== null) return shellCache;
    const file = Bun.file(`${DIST_DIR}/index.html`);
    shellCache = (await file.exists()) ? await file.text() : FALLBACK_SHELL;
    return shellCache;
}

function headMeta(page: Page, noindex = false): HeadMeta {
    return {
        path: page.path,
        title: page.title,
        description: page.description,
        markdownPath: markdownPath(page),
        ogType: page.ogType,
        image: page.image,
        jsonLd: graph(page.jsonLd()),
        noindex,
    };
}

// React owns #root, whose fallback is replaced on mount (not hydrated).
// Catalog facts and homepage FAQ live in visible siblings, rendered from the
// same markdown as the agent twins (FAQ answers also supply JSON-LD). React's
// visuals stay intact without discarding that substantive content.
export async function renderSpaPage(page: Page): Promise<string> {
    const meta = headMeta(page);
    const body = page.body();
    const marker =
        page.ogType === "product"
            ? "\n\n## Specifications"
            : page.path === "/"
              ? "\n\n## Frequently asked questions"
              : null;
    const split = marker === null ? -1 : body.indexOf(marker);
    const fallback = split < 0 ? body : body.slice(0, split);
    const content = split < 0 ? "" : body.slice(split);
    const prerender = `<div class="ga-page">${pageBody(fallback)}</div>`;
    const persistent = content
        ? `<section class="ga-page" id="catalog-content" ${page.ogType === "product" ? 'tabindex="-1" aria-label="Specifications and catalog details"' : 'aria-label="Catalog details"'}><div class="ga-main">${markdownToHtml(content)}</div></section>`
        : "";
    const rewriter = new HTMLRewriter()
        .on("html", {
            element: (el) => {
                el.setAttribute("lang", "en");
            },
        })
        .on("title", {
            element: (el) => {
                el.setInnerContent(documentTitle(page.title));
            },
        })
        .on('meta[name="description"]', {
            element: (el) => {
                el.setAttribute("content", page.description);
            },
        })
        .on("head", {
            element: (el) => {
                el.append(`${headTags(meta)}\n<style>${PAGE_CSS}</style>\n`, {
                    html: true,
                });
            },
        })
        .on("div#root", {
            element: (el) => {
                el.setInnerContent(prerender, { html: true });
                if (persistent) el.after(persistent, { html: true });
            },
        });
    return rewriter.transform(await loadShell());
}

export interface StandaloneDoc {
    meta: HeadMeta;
    markdown: string;
}

// A complete server-rendered document in the site's look.
export function renderStandalone({ meta, markdown }: StandaloneDoc): string {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${esc(documentTitle(meta.title))}</title>
    <meta name="description" content="${esc(meta.description)}">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="${FONTS}" rel="stylesheet">
    ${headTags(meta)}
    <style>${PAGE_CSS}</style>
  </head>
  <body class="ga-page">
${pageBody(markdown)}
  </body>
</html>
`;
}

export function renderStaticPage(page: Page): string {
    return renderStandalone({ meta: headMeta(page), markdown: page.body() });
}
