import { absoluteUrl } from "../site";
import { renderStandalone } from "./html/render";
import { PATHS } from "./links";
import { bullets, mdDocument, mdLink } from "./md";
import {
    htmlResponse,
    jsonResponse,
    markdownResponse,
    wantsMarkdown,
} from "./negotiate";

// A real 404 for every unknown path (no soft-404 SPA shell): JSON problem
// details for API and well-known paths, markdown for agents, HTML otherwise.
// The body tells the caller where to go next instead of just failing.

const TITLE = "Page not found";
const DESCRIPTION = "There is no page at this address on actuatorlist.";

function body(pathname: string): string {
    return [
        `# ${TITLE}`,
        `Nothing lives at \`${pathname.replace(/`/g, "")}\` on actuatorlist. The catalog pages, API and agent documents are listed below.`,
        bullets([
            mdLink("Leaderboard (home)", absoluteUrl("/")),
            mdLink("All actuators", absoluteUrl("/actuators")),
            mdLink("Robots", absoluteUrl("/robots")),
            mdLink("llms.txt index for agents", absoluteUrl(PATHS.llms)),
            mdLink("Sitemap", absoluteUrl(PATHS.sitemap)),
            mdLink("REST API reference", absoluteUrl(PATHS.apiDocs)),
        ]),
    ].join("\n\n");
}

function problem(pathname: string): Response {
    return jsonResponse(
        {
            type: "about:blank",
            title: "Not Found",
            status: 404,
            detail: `No resource at ${pathname}. See ${absoluteUrl(PATHS.apiIndex)} for the API index and ${absoluteUrl(PATHS.llms)} for every agent surface.`,
            instance: pathname,
        },
        "application/problem+json",
        404,
    );
}

export function notFound(req: Request): Response {
    const pathname = new URL(req.url).pathname;
    if (/^\/(api|\.well-known)(\/|$)/.test(pathname)) return problem(pathname);
    const meta = { title: TITLE, description: DESCRIPTION, canonical: pathname };
    const md = body(pathname);
    if (wantsMarkdown(req)) return markdownResponse(mdDocument(meta, md), 404);
    return htmlResponse(
        renderStandalone({
            meta: {
                path: pathname,
                title: TITLE,
                description: DESCRIPTION,
                noindex: true,
            },
            markdown: md,
        }),
        404,
    );
}
