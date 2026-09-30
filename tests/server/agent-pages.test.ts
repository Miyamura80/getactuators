import { describe, expect, test } from "bun:test";
import { ACTUATORS } from "@/catalog";
import { documentTitle } from "@/server/agent/html/head";
import { findPage } from "@/server/agent/pages";
import { SITE_URL } from "@/server/site";
import homeCapture from "../../frontend/tests/fixtures/home.json";
import productCapture from "../../frontend/tests/fixtures/product.json";
import {
    expectFrontmatter,
    expectLeadingHeading,
    get,
    getMarkdown,
    visibleText,
} from "./agent-helpers";

const PAGES = [
    "/",
    "/all",
    "/actuators",
    "/robots",
    "/agents",
    "/about",
    "/contact",
    "/privacy",
];
const FIRST = ACTUATORS[0]?.id ?? "";

function jsonLdTypes(html: string): string[] {
    const m = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html);
    const doc = JSON.parse(m?.[1] ?? "{}") as { "@graph"?: { "@type": string }[] };
    return (doc["@graph"] ?? []).map((n) => n["@type"]);
}

describe("markdown negotiation", () => {
    test("Accept: text/markdown gets markdown on every page, with Vary", async () => {
        for (const p of [...PAGES, `/actuators/${FIRST}`]) {
            const res = await getMarkdown(p);
            expect({ p, type: res.headers.get("content-type") }).toEqual({
                p,
                type: "text/markdown; charset=utf-8",
            });
            expect(res.headers.get("vary")).toContain("Accept");
            expectFrontmatter(await res.text());
        }
    });

    test("browsers and bare */* clients get HTML, also with Vary", async () => {
        for (const accept of ["text/html,application/xhtml+xml,*/*;q=0.8", "*/*"]) {
            const res = await get("/", { accept });
            expect(res.headers.get("content-type")).toStartWith("text/html");
            expect(res.headers.get("vary")).toContain("Accept");
        }
    });

    test("AI reader user agents get markdown on the homepage", async () => {
        const res = await get("/", {
            accept: "text/html",
            "user-agent":
                "Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
        });
        expect(res.headers.get("content-type")).toStartWith("text/markdown");
    });

    test("?mode=agent returns the structured agent view", async () => {
        const body = await (await get("/?mode=agent")).text();
        expect(body).toContain("auth: none");
        expect(body).toContain(`${SITE_URL}/mcp`);
        expect(body).toContain("## Capabilities");
    });
});

describe("markdown twins", () => {
    test("every page has a .md URL with frontmatter", async () => {
        const twins = [
            "/index.md",
            "/all.md",
            "/actuators.md",
            "/robots.md",
            "/about.md",
            "/contact.md",
            "/privacy.md",
            `/actuators/${FIRST}.md`,
        ];
        for (const p of twins) {
            const res = await get(p);
            expect({ p, status: res.status }).toEqual({ p, status: 200 });
            expect(res.headers.get("content-type")).toBe(
                "text/markdown; charset=utf-8",
            );
            expectFrontmatter(await res.text());
        }
    });

    test("standalone agent docs start with an H1, not frontmatter", async () => {
        for (const p of ["/agents.md", "/auth.md", "/pricing.md"]) {
            const res = await get(p);
            expect({ p, status: res.status }).toEqual({ p, status: 200 });
            expect(res.headers.get("content-type")).toBe(
                "text/markdown; charset=utf-8",
            );
            const body = await res.text();
            expect({ p, head: body.slice(0, 2) }).toEqual({ p, head: "# " });
            expect(body).not.toStartWith("---");
            expectLeadingHeading(body);
        }
    });

    test("auth.md walks the auth.md sections without inventing endpoints", async () => {
        const body = await (await get("/auth.md")).text();
        for (const h of [
            "Discover",
            "Pick a method",
            "Register",
            "Use the access_token",
            "Errors",
            "Revocation",
        ]) {
            expect(body).toContain(`## ${h}`);
        }
        expect(body).not.toMatch(/oauth-authorization-server|token_endpoint/);
    });

    test("pricing.md states the free plan and rate limit", async () => {
        const body = await (await get("/pricing.md")).text();
        expect(body).toContain("$0");
        expect(body).toContain("120 requests per minute per IP");
        expect(body).toContain("MIT License");
        expect(body).toStartWith("# actuatorlist pricing\n");
        expect(body).toContain("| Free | $0 |");
        expect(body).toContain("There are no paid plans");
        expect(body).toContain("/mcp/docs");
        expect(body).toContain("/llms.txt");
        expect(body).not.toMatch(/\$\d+\s*\/\s*mo|Pro plan|Enterprise plan/i);
    });
});

describe("HTML pages", () => {
    test("product specifications provide a focusable native fragment target", async () => {
        const html = await (await get(`/actuators/${FIRST}`)).text();
        const targets: { tabindex: string | null; label: string | null }[] = [];
        new HTMLRewriter()
            .on("section#catalog-content", {
                element: (el) => {
                    targets.push({
                        tabindex: el.getAttribute("tabindex"),
                        label: el.getAttribute("aria-label"),
                    });
                },
            })
            .transform(html);
        expect(targets).toEqual([
            { tabindex: "-1", label: "Specifications and catalog details" },
        ]);
    });

    test("frontend mount captures match the actual server markup and FAQ graph", async () => {
        for (const capture of [homeCapture, productCapture]) {
            const html = await (await get(capture.path)).text();
            expect(/<div id="root">[\s\S]*?<\/section>/.exec(html)?.[0]).toBe(
                capture.body,
            );
            const graph = JSON.parse(
                /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(
                    html,
                )?.[1] ?? "{}",
            )["@graph"] as Record<string, unknown>[];
            expect(graph.find((node) => node["@type"] === "FAQPage") ?? null).toEqual(
                capture.faq,
            );
        }
    });

    test("document navigation targets have matching heads in either visit order", async () => {
        const paths = [
            ...PAGES,
            `/actuators/${FIRST}`,
            `/actuators/${ACTUATORS.at(-1)?.id}`,
        ];
        for (const path of [...paths, ...paths.toReversed()]) {
            const page = findPage(path);
            if (!page) throw new Error(`Missing page: ${path}`);
            const response = await get(path);
            expect(response.status).toBe(200);
            let title = "";
            let description = "";
            let canonical = "";
            let jsonLd = "";
            new HTMLRewriter()
                .on("title", {
                    text: (chunk) => {
                        title += chunk.text;
                    },
                })
                .on('meta[name="description"]', {
                    element: (el) => {
                        description = el.getAttribute("content") ?? "";
                    },
                })
                .on('link[rel="canonical"]', {
                    element: (el) => {
                        canonical = el.getAttribute("href") ?? "";
                    },
                })
                .on('script[type="application/ld+json"]', {
                    text: (chunk) => {
                        jsonLd += chunk.text;
                    },
                })
                .transform(await response.text());
            expect(title).toBe(documentTitle(page.title));
            expect(description).toBe(page.description);
            expect(canonical).toBe(`${SITE_URL}${page.path}`);
            const nodes = JSON.parse(jsonLd)["@graph"] as Record<string, unknown>[];
            expect(nodes).toEqual(page.jsonLd());
            expect(nodes.some((node) => node["@type"] === "Product")).toBe(
                path.startsWith("/actuators/"),
            );
        }
    });

    test("homepage carries metadata, JSON-LD and prerendered content", async () => {
        const res = await get("/");
        const html = await res.text();
        expect(html).toContain('<html lang="en"');
        expect(html).toContain(`<link rel="canonical" href="${SITE_URL}/">`);
        expect(html).toContain(
            '<link rel="alternate" type="text/markdown" href="/index.md"',
        );
        expect(html).toMatch(/<meta property="og:image" content="https:\/\//);
        expect(html).toContain('<meta property="og:type" content="website">');
        const types = jsonLdTypes(html);
        for (const t of [
            "WebSite",
            "Organization",
            "Dataset",
            "SoftwareApplication",
            "FAQPage",
        ]) {
            expect(types).toContain(t);
        }
        let rootText = "";
        let rootHeading = false;
        new HTMLRewriter()
            .on("#root", {
                text: (chunk) => {
                    rootText += chunk.text;
                },
            })
            .on("#root h1", {
                element: () => {
                    rootHeading = true;
                },
            })
            .transform(html);
        expect(rootHeading).toBe(true);
        expect(rootText.length).toBeGreaterThan(500);
    });

    test("actuator pages have their own title, Product JSON-LD and breadcrumbs", async () => {
        const a = ACTUATORS[0];
        const html = await (await get(`/actuators/${a?.id}`)).text();
        expect(html).toContain(`<title>${a?.name}`);
        const types = jsonLdTypes(html);
        expect(types).toContain("Product");
        expect(types).toContain("BreadcrumbList");
    });

    test("trust pages are real pages with at least 500 characters", async () => {
        for (const p of ["/about", "/contact", "/privacy"]) {
            const res = await get(p);
            expect(res.status).toBe(200);
            const html = await res.text();
            const main = /<main[^>]*>([\s\S]*)<\/main>/.exec(html)?.[1] ?? "";
            expect(visibleText(main).length).toBeGreaterThan(500);
        }
    });

    test("Link header advertises discovery documents and appends to existing values", async () => {
        const link = (await get("/")).headers.get("link") ?? "";
        for (const rel of [
            "sitemap",
            "alternate",
            "service-desc",
            "api-catalog",
            "describedby",
        ]) {
            expect(link).toContain(`rel="${rel}"`);
        }
        const { hooks } = await import("@/server/routes/link-headers");
        const hook = hooks[0];
        if (!hook) throw new Error("no hook");
        const res = await hook(
            new Request("http://localhost/about"),
            new Response("x", {
                headers: { "content-type": "text/html", link: '</x>; rel="preload"' },
            }),
        );
        expect(res.headers.get("link")).toStartWith('</x>; rel="preload", ');
        const api = await hook(
            new Request("http://localhost/api/v1/actuators"),
            new Response("{}", { headers: { "content-type": "text/html" } }),
        );
        expect(api.headers.get("link")).toBeNull();
    });
});

describe("real 404s", () => {
    test("unknown pages 404 with HTML or markdown", async () => {
        const html = await get("/definitely-not-a-page");
        expect(html.status).toBe(404);
        expect(html.headers.get("content-type")).toStartWith("text/html");
        const md = await getMarkdown("/definitely-not-a-page");
        expect(md.status).toBe(404);
        expect(md.headers.get("content-type")).toStartWith("text/markdown");
        expect(await md.text()).toContain("/llms.txt");
    });

    test("unknown actuator ids 404 while known ones are 200", async () => {
        expect((await get("/actuators/not-a-real-actuator")).status).toBe(404);
        expect((await get(`/actuators/${FIRST}`)).status).toBe(200);
    });

    test("unknown API paths get problem+json", async () => {
        const res = await get("/api/definitely-not-here");
        expect(res.status).toBe(404);
        expect(res.headers.get("content-type")).toStartWith("application/problem+json");
    });
});
