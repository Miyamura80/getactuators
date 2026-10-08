import { SITE_NAME, absoluteUrl } from "../../site";
import { toAbsolute } from "../jsonld";
import { PATHS } from "../links";

// <head> tags shared by the enriched SPA shell and the server-rendered pages.

export interface HeadMeta {
    path: string;
    title: string;
    description: string;
    // Omitted on pages without a markdown twin (the 404 page).
    markdownPath?: string;
    ogType?: string;
    image?: string;
    jsonLd?: Record<string, unknown>;
    noindex?: boolean;
}

export function esc(s: string): string {
    return Bun.escapeHTML(s);
}

// JSON inside <script> must not be able to close the element.
function scriptJson(value: unknown): string {
    return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function documentTitle(title: string): string {
    return title.toLowerCase().includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
}

export function headTags(m: HeadMeta): string {
    const url = absoluteUrl(m.path);
    const image = toAbsolute(m.image ?? PATHS.ogImage);
    const title = documentTitle(m.title);
    const tags = [
        `<link rel="describedby" type="text/plain" href="${PATHS.llms}" title="llms.txt">`,
        `<link rel="service-desc" type="application/vnd.oai.openapi+json" href="${PATHS.openapi}">`,
        `<link rel="ard" type="application/json" href="${PATHS.ard}">`,
        `<link rel="sitemap" type="application/xml" href="${PATHS.sitemap}">`,
        `<meta property="og:site_name" content="${SITE_NAME}">`,
        `<meta property="og:type" content="${esc(m.ogType ?? "website")}">`,
        `<meta property="og:title" content="${esc(title)}">`,
        `<meta property="og:description" content="${esc(m.description)}">`,
        `<meta property="og:url" content="${esc(url)}">`,
        `<meta property="og:image" content="${esc(image)}">`,
        `<meta property="og:locale" content="en_US">`,
        `<meta name="twitter:card" content="summary_large_image">`,
        `<meta name="twitter:title" content="${esc(title)}">`,
        `<meta name="twitter:description" content="${esc(m.description)}">`,
        `<meta name="twitter:image" content="${esc(image)}">`,
    ];
    if (m.noindex) tags.push(`<meta name="robots" content="noindex, follow">`);
    if (!m.noindex || m.markdownPath)
        tags.unshift(`<link rel="canonical" href="${esc(url)}">`);
    if (m.markdownPath) {
        tags.unshift(
            `<link rel="alternate" type="text/markdown" href="${esc(m.markdownPath)}" title="Markdown">`,
        );
    }
    if (m.jsonLd) {
        tags.push(
            `<script type="application/ld+json">${scriptJson(m.jsonLd)}</script>`,
        );
    }
    return tags.join("\n    ");
}
