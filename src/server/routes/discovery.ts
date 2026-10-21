import { join } from "node:path";
import { actuatorsJsonl, robotsTxt, schemamapXml, sitemapXml } from "../agent/crawl";
import { PATHS } from "../agent/links";
import {
    actuatorsLlmsTxt,
    docsLlmsTxt,
    llmsFullTxt,
    llmsTxt,
    robotsLlmsTxt,
} from "../agent/llms";
import { textResponse } from "../agent/negotiate";
import type { Route } from "../types";

// Crawl and index documents: robots.txt, sitemaps, llms.txt family, feeds.

const TEXT = "text/plain; charset=utf-8";
const XML = "application/xml; charset=utf-8";

const MEDIA = join(import.meta.dir, "..", "..", "..", "media");

// Link-preview cards: the site-wide default plus page-specific ones.
function ogImage(path: string, file: string): Route {
    return {
        method: "GET",
        path,
        handler: async () => {
            const image = Bun.file(join(MEDIA, file));
            if (!(await image.exists())) return null;
            return new Response(image, {
                headers: {
                    "content-type": "image/png",
                    "cache-control": "public, max-age=86400",
                },
            });
        },
    };
}

function text(path: string, build: () => string, type = TEXT): Route {
    return { method: "GET", path, handler: () => textResponse(build(), type) };
}

export const routes: Route[] = [
    text("/robots.txt", robotsTxt),
    text(PATHS.sitemap, sitemapXml, XML),
    text(PATHS.schemamap, schemamapXml, XML),
    text(PATHS.feed, actuatorsJsonl, "application/jsonl; charset=utf-8"),
    text(PATHS.llms, llmsTxt),
    text(PATHS.llmsFull, llmsFullTxt),
    text("/actuators/llms.txt", actuatorsLlmsTxt),
    text("/robots/llms.txt", robotsLlmsTxt),
    text("/docs/llms.txt", docsLlmsTxt),
    ogImage(PATHS.ogImage, "og-image.png"),
    ogImage(PATHS.ogStartups, "og-startups.png"),
];
