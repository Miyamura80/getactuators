import { ACTUATORS } from "@/catalog";
import { absoluteUrl } from "../site";
import { CATALOG_UPDATED_AT } from "./freshness";
import { product } from "./jsonld";
import { PATHS } from "./links";
import { allPages } from "./pages";

// Crawler-facing documents: robots.txt, sitemap.xml, the NLWeb schema map and
// the JSON Lines feed it points at.

// Named so audits see an explicit welcome, not just the wildcard.
const AI_AGENTS = [
    "GPTBot",
    "OAI-SearchBot",
    "ChatGPT-User",
    "ClaudeBot",
    "Claude-SearchBot",
    "Claude-User",
    "anthropic-ai",
    "PerplexityBot",
    "Perplexity-User",
    "Google-Extended",
    "Googlebot",
    "Bingbot",
    "Applebot",
    "Applebot-Extended",
    "Amazonbot",
    "Meta-ExternalAgent",
    "DuckAssistBot",
    "DeepSeekBot",
    "CCBot",
    "cohere-ai",
    "MistralAI-User",
];

const SIGNAL = "Content-Signal: search=yes, ai-input=yes, ai-train=yes";

export function robotsTxt(): string {
    return `# robots.txt for actuatorlist
# The whole catalog is public. AI agents and crawlers are welcome to search,
# answer from and train on it. Start at ${absoluteUrl(PATHS.llms)}.

User-agent: *
${SIGNAL}
Allow: /

${AI_AGENTS.map((a) => `User-agent: ${a}`).join("\n")}
${SIGNAL}
Allow: /

Sitemap: ${absoluteUrl(PATHS.sitemap)}
Schemamap: ${absoluteUrl(PATHS.schemamap)}
`;
}

function xmlEscape(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

// Documents that are not HTML pages but are worth crawling.
const EXTRA_URLS = [
    PATHS.apiDocs,
    PATHS.llms,
    PATHS.llmsFull,
    PATHS.agentsMd,
    PATHS.authMd,
    PATHS.pricingMd,
];

function priority(path: string): string {
    if (path === "/") return "1.0";
    if (path.startsWith("/actuators/")) return "0.7";
    return "0.8";
}

export function sitemapXml(): string {
    const pages = [
        ...allPages(),
        ...EXTRA_URLS.map((path) => ({ path, updatedAt: CATALOG_UPDATED_AT })),
    ];
    const entries = pages.map(
        (p) =>
            `  <url>\n    <loc>${xmlEscape(absoluteUrl(p.path))}</loc>\n    <lastmod>${p.updatedAt ?? CATALOG_UPDATED_AT}</lastmod>\n    <priority>${priority(p.path)}</priority>\n  </url>`,
    );
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>
`;
}

// NLWeb Schema Feeds: a sitemap-format index of structured-data feeds.
export function schemamapXml(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:sf="http://schema.org/schemas/schemafeed/0.1">
  <url>
    <loc>${absoluteUrl(PATHS.feed)}</loc>
    <lastmod>${CATALOG_UPDATED_AT}</lastmod>
    <sf:contentType>structuredData/schema.org</sf:contentType>
  </url>
</urlset>
`;
}

// One schema.org Product per line, identical to each actuator page's JSON-LD.
export function actuatorsJsonl(): string {
    const lines = ACTUATORS.map((a) =>
        JSON.stringify({ "@context": "https://schema.org", ...product(a) }),
    );
    return `${lines.join("\n")}\n`;
}
