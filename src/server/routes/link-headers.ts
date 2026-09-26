import { PATHS } from "../agent/links";
import { findPage, findPageForMarkdown, markdownPath } from "../agent/pages";
import { absoluteUrl } from "../site";
import type { ResponseHook } from "../types";

// RFC 8288 Link headers on page responses (HTML and markdown), advertising the
// discovery documents. API and MCP responses are left alone: their route
// modules set their own Link values. Always appends, never replaces.

const SITE_LINKS = [
    `<${PATHS.sitemap}>; rel="sitemap"; type="application/xml"`,
    `<${PATHS.openapi}>; rel="service-desc"; type="application/vnd.oai.openapi+json"`,
    `<${PATHS.apiDocs}>; rel="service-doc"; type="text/html"`,
    `<${PATHS.apiCatalog}>; rel="api-catalog"; type="application/linkset+json"`,
    `<${PATHS.llms}>; rel="describedby"; type="text/plain"`,
    `<${PATHS.mcpCard}>; rel="mcp-server-card"; type="application/json"`,
    `<${PATHS.ard}>; rel="ard"; type="application/json"`,
];

const SKIP = /^\/(api|mcp|\.well-known)(\/|$)/;

function pageLinks(pathname: string, contentType: string): string[] {
    if (contentType.startsWith("text/markdown")) {
        const page = findPageForMarkdown(pathname) ?? findPage(pathname);
        return page ? [`<${absoluteUrl(page.path)}>; rel="canonical"`] : [];
    }
    const page = findPage(pathname);
    return page
        ? [`<${markdownPath(page)}>; rel="alternate"; type="text/markdown"`]
        : [];
}

const addLinks: ResponseHook = (req, res) => {
    const { pathname } = new URL(req.url);
    const type = res.headers.get("content-type") ?? "";
    const isPage = type.startsWith("text/html") || type.startsWith("text/markdown");
    if (!isPage || SKIP.test(pathname)) return res;
    const headers = new Headers(res.headers);
    for (const link of [...pageLinks(pathname, type), ...SITE_LINKS]) {
        headers.append("link", link);
    }
    return new Response(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers,
    });
};

export const hooks: ResponseHook[] = [addLinks];
