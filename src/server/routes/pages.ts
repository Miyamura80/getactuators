import { ACTUATORS } from "@/catalog";
import {
    canonicalComparisonPath,
    comparisonDirectory,
} from "@/catalog/comparison-registry";
import { compareBody, compareVisual } from "../agent/compare";
import { renderSpaPage, renderStaticPage } from "../agent/html/render";
import { PATHS } from "../agent/links";
import { agentView } from "../agent/llms";
import { agentsBody, authBody, pricingBody } from "../agent/manifests";
import { mdDocument, mdStandalone } from "../agent/md";
import { htmlResponse, markdownResponse, wantsMarkdown } from "../agent/negotiate";
import { findPage, findPageForMarkdown, pageMarkdown } from "../agent/pages";
import { measurementHtml } from "../measurement";
import { CODE_LICENSE, DATA_LICENSE } from "../site";
import type { Handler, Route } from "../types";

// HTML pages and their markdown twins. Each page answers:
//   Accept: text/markdown or an AI reader's User-Agent -> markdown
//   /?mode=agent                                         -> agent view (markdown)
//   anything else                                         -> HTML
// and every page also serves `<path>.md` directly.

const comparisons = comparisonDirectory(ACTUATORS);
function comparisonRedirect(url: URL): Response | null {
    const canonical = canonicalComparisonPath(url.pathname, comparisons);
    return canonical && canonical !== url.pathname
        ? new Response(null, {
              status: 301,
              headers: { location: `${canonical}${url.search}` },
          })
        : null;
}

function comparisonRobots(response: Response, path: string, url: URL): Response {
    if (path === "/compare" && url.searchParams.has("compare")) {
        response.headers.set("X-Robots-Tag", "noindex, follow");
    }
    return response;
}

// Markdown twin of a page; a noindex page keeps noindex on its twin too,
// since the HTML robots meta tag does not reach markdown readers.
function twinResponse(p: Parameters<typeof pageMarkdown>[0]): Response {
    const res = markdownResponse(pageMarkdown(p));
    if (p.noindex) res.headers.set("x-robots-tag", "noindex");
    return res;
}

const page: Handler = async (req) => {
    const url = new URL(req.url);
    const redirect = comparisonRedirect(url);
    if (redirect) return redirect;
    const found = findPage(url.pathname);
    if (!found) return null;
    if (found.path === "/" && url.searchParams.get("mode") === "agent") {
        return markdownResponse(
            mdDocument(
                {
                    title: "actuatorlist agent view",
                    description: "Endpoints, auth and capabilities for AI agents.",
                    canonical: "/",
                },
                agentView(),
            ),
        );
    }
    const selected =
        found.path === "/compare"
            ? { ...found, body: () => compareBody(url.search) }
            : found;
    if (wantsMarkdown(req))
        return comparisonRobots(twinResponse(selected), found.path, url);
    const html =
        found.kind === "spa"
            ? await renderSpaPage(
                  selected,
                  found.path === "/compare" ? compareVisual(url.search) : undefined,
                  url.search,
                  (found.noindex ?? false) ||
                      (found.path === "/compare" && url.searchParams.has("compare")),
              )
            : renderStaticPage(found);
    return comparisonRobots(
        htmlResponse(measurementHtml(html, found.path)),
        found.path,
        url,
    );
};

const twin: Handler = (req) => {
    const url = new URL(req.url);
    const redirect = comparisonRedirect(url);
    if (redirect) return redirect;
    const found = findPageForMarkdown(url.pathname);
    return found
        ? comparisonRobots(
              twinResponse(
                  found.path === "/compare"
                      ? { ...found, body: () => compareBody(url.search) }
                      : found,
              ),
              found.path,
              url,
          )
        : null;
};

function doc(path: string, title: string, description: string, body: () => string) {
    return {
        method: "GET",
        path,
        handler: () =>
            markdownResponse(
                mdStandalone({ title, description, canonical: path }, body()),
            ),
    } satisfies Route;
}

const PAGE_PATHS = [
    "/",
    "/index.html",
    "/compare",
    "/actuators",
    "/actuators/:id",
    "/robots",
    "/robot",
    PATHS.agentsPage,
    "/startups",
    "/investors",
    "/faq",
    "/about",
    "/contributors",
    "/contact",
    "/privacy",
    "/guides",
    "/guides/:slug",
    "/comparisons/:slug",
    "/tools/:slug",
    "/lab/supply-chain",
    "/humanoids",
    "/metals",
    "/policy",
];

// Standalone agent documents open with their H1 (no frontmatter). /agents.md
// is registered before the generic `/:file` twin so it gets the same shape.
export const routes: Route[] = [
    doc(
        PATHS.agentsMd,
        "actuatorlist for AI agents",
        "Connect an AI agent to actuatorlist: MCP server, REST API, markdown twins and llms.txt. No key needed.",
        agentsBody,
    ),
    doc(
        PATHS.authMd,
        "actuatorlist auth.md",
        "No credentials needed: anonymous, read-only access to the REST API and MCP server.",
        authBody,
    ),
    doc(
        PATHS.pricingMd,
        "actuatorlist pricing",
        `actuatorlist is free: one plan, no keys, 120 requests per minute per IP, ${CODE_LICENSE.spdx} code and ${DATA_LICENSE.name} data.`,
        pricingBody,
    ),
    ...PAGE_PATHS.map((path): Route => ({ method: "GET", path, handler: page })),
    { method: "GET", path: "/:file", handler: twin },
    { method: "GET", path: "/actuators/:file", handler: twin },
    { method: "GET", path: "/guides/:file", handler: twin },
    { method: "GET", path: "/comparisons/:file", handler: twin },
    { method: "GET", path: "/tools/:file", handler: twin },
    { method: "GET", path: "/lab/:file", handler: twin },
];
