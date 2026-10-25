import { ACTUATORS } from "@/catalog";
import { galleryCards } from "@/catalog/gallery";
import { publicFooter } from "../../../public-navigation";
import { DIST_DIR } from "../../static";
import { graph } from "../jsonld";
import { type Page, markdownPath } from "../pages";
import {
    foldLimits,
    foldQuestions,
    foldWorkedExamples,
    markdownToHtml,
    pageBody,
    withHeadingIds,
    withSectionIcons,
} from "./body";
import { type HeadMeta, documentTitle, esc, headTags } from "./head";
import { PAGE_CSS } from "./style";
import { withToolCards } from "./tool-cards";

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

// React owns #root: only the built gallery is hydrated; other fallbacks mount.
// Catalog facts and homepage FAQ live in visible siblings, rendered from the
// same markdown as the agent twins (FAQ answers also supply JSON-LD). React's
// visuals stay intact without discarding that substantive content.
export async function renderSpaPage(
    page: Page,
    visual?: string,
    search = "",
): Promise<string> {
    const meta = headMeta(page);
    const body = page.body();
    const marker =
        page.persistentFrom ??
        (page.ogType === "product" ? "\n\n## Specifications" : null);
    const split = marker === null ? -1 : body.indexOf(marker);
    const fallback = split < 0 ? body : body.slice(0, split);
    const content = split < 0 ? "" : body.slice(split);
    const fallbackHtml = `<div class="ga-page">${pageBody(fallback, false, undefined, page.path, !content)}</div>`;
    // Built with the frontend's own React tree; no React dependency at runtime.
    // Bare/backend-only checkouts keep the existing catalog fallback.
    const galleryFile = Bun.file(`${DIST_DIR}/actuators.html`);
    const galleryHtml =
        page.path === "/actuators" && (await galleryFile.exists())
            ? await galleryFile.text()
            : null;
    const prerender = galleryHtml ?? visual ?? fallbackHtml;
    const rendered = withToolCards(
        foldLimits(
            withSectionIcons(
                foldQuestions(
                    foldWorkedExamples(
                        page.headingIds
                            ? withHeadingIds(markdownToHtml(content))
                            : markdownToHtml(content),
                    ),
                ),
            ),
        ),
    );
    const persistentHtml = page.persistentHtml
        ? page.persistentHtml(rendered)
        : rendered;
    const persistent = content
        ? `<section class="ga-page" id="catalog-content" ${page.ogType === "product" ? 'tabindex="-1" aria-label="Specifications and catalog details"' : `tabindex="-1" aria-label="${esc(page.persistentLabel ?? "Catalog details")}"`}><div class="ga-main">${persistentHtml}</div></section>${publicFooter()}`
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
                // One tiny, already optimized photo: discover the leading gallery
                // image while the application bundle is still downloading. Do not
                // preload later cards (especially on a narrow mobile viewport).
                // The application view reorders cards after hydration, so its
                // first photo is not known here; skip the hint rather than
                // fetch the wrong image early.
                const firstPhoto =
                    page.path === "/actuators" &&
                    new URLSearchParams(search).get("by") !== "application"
                        ? galleryCards(ACTUATORS)[0]?.a.image_url
                        : null;
                if (firstPhoto) {
                    el.append(
                        `<link rel="preload" as="image" href="${esc(firstPhoto)}" fetchpriority="high">\n`,
                        { html: true },
                    );
                }
                el.append(`${headTags(meta)}\n<style>${PAGE_CSS}</style>\n`, {
                    html: true,
                });
            },
        })
        .on("div#root", {
            element: (el) => {
                el.setInnerContent(prerender, { html: true });
                if (galleryHtml) {
                    el.setAttribute("data-gallery-prerender", "true");
                    // The real gallery is the no-JavaScript fallback too. Keep
                    // the loaded page unchanged; canonical Markdown stays intact.
                }
                if (persistent) el.after(persistent, { html: true });
            },
        });
    return rewriter.transform(await loadShell());
}

export interface StandaloneDoc {
    meta: HeadMeta;
    markdown: string;
    editorial?: boolean;
    visual?: string;
}

// A complete server-rendered document in the site's look.
export function renderStandalone({
    meta,
    markdown,
    editorial = false,
    visual,
}: StandaloneDoc): string {
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
  <body class="ga-page${editorial ? " ga-editorial" : ""}">
${pageBody(markdown, editorial, visual, meta.path)}
  </body>
</html>
`;
}

export function renderStaticPage(page: Page): string {
    return renderStandalone({
        meta: headMeta(page),
        markdown: page.body(),
        editorial: page.layout === "editorial",
        visual: page.visual?.(),
    });
}
