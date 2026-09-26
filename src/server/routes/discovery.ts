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

const OG_IMAGE = join(import.meta.dir, "..", "..", "..", "media", "banner.png");

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
    {
        method: "GET",
        path: PATHS.ogImage,
        handler: async () => {
            const file = Bun.file(OG_IMAGE);
            if (!(await file.exists())) return null;
            return new Response(file, {
                headers: {
                    "content-type": "image/png",
                    "cache-control": "public, max-age=86400",
                },
            });
        },
    },
];
