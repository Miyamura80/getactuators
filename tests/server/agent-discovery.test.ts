import { describe, expect, test } from "bun:test";
import { ACTUATORS } from "@/catalog";
import { SITE_URL } from "@/server/site";
import { get, isOwnedPath, siteLinks } from "./agent-helpers";

describe("robots.txt", () => {
    test("welcomes AI crawlers and points at the sitemap and schema map", async () => {
        const res = await get("/robots.txt");
        expect(res.status).toBe(200);
        expect(res.headers.get("content-type")).toStartWith("text/plain");
        const body = await res.text();
        for (const bot of [
            "GPTBot",
            "ClaudeBot",
            "OAI-SearchBot",
            "Claude-SearchBot",
            "PerplexityBot",
            "ChatGPT-User",
            "Claude-User",
            "Perplexity-User",
            "Google-Extended",
        ]) {
            expect(body).toContain(`User-agent: ${bot}`);
        }
        expect(body).toContain(
            "Content-Signal: search=yes, ai-input=yes, ai-train=yes",
        );
        expect(body).not.toMatch(/Disallow: \/\s*$/m);
        expect(body).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
        expect(body).toContain(`Schemamap: ${SITE_URL}/schemamap.xml`);
    });
});

describe("sitemap.xml", () => {
    test("lists every page with a W3C lastmod", async () => {
        const res = await get("/sitemap.xml");
        expect(res.headers.get("content-type")).toStartWith("application/xml");
        const xml = await res.text();
        const urls = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(
            (m) => m[1] ?? "",
        );
        expect(urls.length).toBeGreaterThan(ACTUATORS.length);
        for (const u of urls) {
            expect(u).toMatch(
                /<lastmod>\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?Z)?<\/lastmod>/,
            );
        }
        for (const a of ACTUATORS) {
            expect(xml).toContain(`<loc>${SITE_URL}/actuators/${a.id}</loc>`);
        }
        for (const p of [
            "/",
            "/actuators",
            "/robots",
            "/about",
            "/contact",
            "/privacy",
            "/llms.txt",
        ]) {
            expect(xml).toContain(`<loc>${SITE_URL}${p}</loc>`);
        }
    });

    test("every owned sitemap URL resolves", async () => {
        const xml = await (await get("/sitemap.xml")).text();
        const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
            (m[1] ?? "").slice(SITE_URL.length),
        );
        for (const p of paths.filter(isOwnedPath)) {
            expect({ p, status: (await get(p)).status }).toEqual({ p, status: 200 });
        }
    });
});

describe("schema map and feed", () => {
    test("schemamap points at a JSON Lines feed of schema.org objects", async () => {
        const map = await (await get("/schemamap.xml")).text();
        expect(map).toContain(`<loc>${SITE_URL}/feeds/actuators.jsonl</loc>`);
        expect(map).toContain("structuredData/schema.org");
        const feed = await (await get("/feeds/actuators.jsonl")).text();
        const lines = feed.trim().split("\n");
        expect(lines).toHaveLength(ACTUATORS.length);
        for (const line of lines) {
            const obj = JSON.parse(line) as Record<string, unknown>;
            expect(obj["@context"]).toBe("https://schema.org");
            expect(obj["@type"]).toBe("Product");
        }
    });
});

describe("llms.txt", () => {
    test("is a navigation index with when-to-use guidance", async () => {
        const res = await get("/llms.txt");
        expect(res.headers.get("content-type")).toStartWith("text/plain");
        const body = await res.text();
        expect(body).toStartWith("# actuatorlist");
        expect(body.length).toBeLessThan(30_000);
        expect(body).toContain("## When to use actuatorlist");
        expect(body).toMatch(/quadruped leg/);
        for (const p of [
            "/llms-full.txt",
            "/openapi.json",
            "/docs/api",
            "/mcp",
            "/auth.md",
        ]) {
            expect(body).toContain(`${SITE_URL}${p}`);
        }
    });

    test("every link this PR owns resolves to real content", async () => {
        const body = await (await get("/llms.txt")).text();
        const owned = siteLinks(body).filter(isOwnedPath);
        expect(owned.length).toBeGreaterThan(10);
        for (const p of owned) {
            const res = await get(p);
            const text = await res.text();
            expect({ p, status: res.status }).toEqual({ p, status: 200 });
            expect(text.trimStart().toLowerCase()).not.toStartWith("<!doctype html");
        }
    });

    test("llms-full.txt carries the whole catalog within budget", async () => {
        const body = await (await get("/llms-full.txt")).text();
        expect(body.length).toBeLessThan(100_000);
        for (const a of ACTUATORS) expect(body).toContain(`id: ${a.id}`);
    });

    test("section files exist", async () => {
        for (const p of ["/actuators/llms.txt", "/robots/llms.txt", "/docs/llms.txt"]) {
            const res = await get(p);
            expect(res.status).toBe(200);
            expect(await res.text()).toStartWith("# actuatorlist:");
        }
    });
});
