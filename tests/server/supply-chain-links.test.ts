import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { BENCHMARK_RUNS } from "@/benchmarks";
import { ROBOTS } from "@/catalog";
import { HUMANOIDS } from "@/humanoids";
import { supplyChainMenu } from "@/public-navigation";
import { ALT_TECHS } from "@/supply-chain/alts";
import { BOM_SLUGS, bomCasePath } from "@/supply-chain/bom/path";
import { COUNTRY_PAGE } from "@/supply-chain/map";
import { PRICE_DRIVERS } from "@/supply-chain/metals/drivers";
import { METAL_EVENTS } from "@/supply-chain/metals/events";
import { POLICY_MEASURES } from "@/supply-chain/policy";
import { PROCESS_CHAINS, PROCESS_STEP_IDS } from "@/supply-chain/processes";
import { get as getShared } from "./agent-helpers";

// Every internal link the supply-chain atlas hands out (page HTML, markdown
// twins, the JSON datasets and the hard-coded links in the data modules)
// must resolve: the path is a real route and a deep-link id names a record.

const ORIGIN = "https://actuatorlist.com";

// This crawl makes a few hundred requests; a client key of its own keeps it
// from using up the shared API rate-limit window the other tests run in.
const get = (path: string) =>
    getShared(path, { "x-forwarded-for": "supply-chain-links-test" });
const PUBLIC_DIR = join(import.meta.dir, "../../frontend/public");

const PAGES = [
    ...supplyChainMenu().flatMap((g) => g.links.map((l) => l.href)),
    ...BOM_SLUGS.map(bomCasePath),
    "/humanoids",
    "/benchmarks",
    "/trends",
];

const DATASETS = [
    "/api/v1/metals",
    "/api/v1/policy",
    "/api/v1/processes",
    "/api/v1/bom",
    "/api/v1/alts",
    "/api/v1/humanoids",
    "/api/v1/trends",
    "/api/v1/benchmarks",
];

// Deep-link keys (query or hash) and the ids each may name.
const DEEP_IDS: Record<string, ReadonlySet<string>> = {
    measure: new Set(POLICY_MEASURES.map((m) => m.id)),
    chain: new Set(PROCESS_CHAINS.map((c) => c.id)),
    step: PROCESS_STEP_IDS,
    robot: new Set(HUMANOIDS.map((h) => h.id)),
    tech: new Set(ALT_TECHS.map((t) => t.id)),
    event: new Set(METAL_EVENTS.map((e) => e.id)),
    run: new Set(BENCHMARK_RUNS.map((r) => `${r.actuatorId}/${r.runId}`)),
};
const ROBOT_IDS = new Set(ROBOTS.map((r) => r.id));
const ASSET = /^\/(actuator-images|robot-images|posters|logos|orgs|people|geo)\//;

function internal(href: string): string | null {
    if (href.startsWith(ORIGIN)) return href.slice(ORIGIN.length) || "/";
    return href.startsWith("/") && !href.startsWith("//") ? href : null;
}

function collect(x: unknown, out: Set<string>): void {
    if (typeof x === "string") {
        const href = internal(x);
        if (href && /^\/[a-z0-9.]/i.test(href) && !/\s/.test(href)) out.add(href);
    } else if (Array.isArray(x)) for (const v of x) collect(v, out);
    else if (x && typeof x === "object")
        for (const v of Object.values(x)) collect(v, out);
}

function linksIn(text: string, out: Set<string>): void {
    for (const m of text.matchAll(/href="([^"]+)"/g)) collect(m[1], out);
    for (const m of text.matchAll(/\]\(([^)\s]+)\)/g)) collect(m[1], out);
}

// Problems with one link: an unknown deep-link id or a /robots anchor that
// names no robot. The route itself is checked separately.
function deepLinkErrors(href: string): string[] {
    const url = new URL(href, ORIGIN);
    const errors: string[] = [];
    const pairs = [
        ...url.searchParams.entries(),
        ...new URLSearchParams(url.hash.slice(1)).entries(),
    ];
    for (const [key, value] of pairs) {
        const ids = DEEP_IDS[key];
        if (ids && value && !ids.has(value))
            errors.push(`${href}: unknown ${key} "${value}"`);
    }
    if (url.pathname === "/robots" && url.hash) {
        const id = decodeURIComponent(url.hash.slice(1)).replace(/^robot-/, "");
        if (!ROBOT_IDS.has(id)) errors.push(`${href}: unknown robot "${id}"`);
    }
    return errors;
}

async function allLinks(): Promise<Set<string>> {
    const out = new Set<string>();
    for (const page of PAGES) {
        linksIn(await (await get(page)).text(), out);
        linksIn(await (await get(`${page}.md`)).text(), out);
    }
    for (const path of DATASETS) collect(await (await get(path)).json(), out);
    for (const d of PRICE_DRIVERS) if (d.link) out.add(d.link);
    for (const path of Object.values(COUNTRY_PAGE)) if (path) out.add(path);
    return out;
}

describe("supply-chain cross-links", () => {
    test("every page, twin and dataset in the atlas is served", async () => {
        for (const page of PAGES) {
            expect({ page, status: (await get(page)).status }).toEqual({
                page,
                status: 200,
            });
            expect({ page, status: (await get(`${page}.md`)).status }).toEqual({
                page,
                status: 200,
            });
        }
        for (const path of DATASETS)
            expect({ path, status: (await get(path)).status }).toEqual({
                path,
                status: 200,
            });
    });

    test("every internal href and deep link resolves to a real route and record", async () => {
        const links = await allLinks();
        expect(links.size).toBeGreaterThan(100);
        const errors: string[] = [];
        const checked = new Map<string, number>();
        for (const href of links) {
            errors.push(...deepLinkErrors(href));
            const path = new URL(href, ORIGIN).pathname;
            if (ASSET.test(path)) {
                if (!existsSync(join(PUBLIC_DIR, decodeURIComponent(path))))
                    errors.push(`${href}: missing asset`);
                continue;
            }
            if (!checked.has(path)) checked.set(path, (await get(path)).status);
            const status = checked.get(path);
            if (status !== 200) errors.push(`${href}: ${path} returned ${status}`);
        }
        expect(errors).toEqual([]);
    });

    test("deep-link checks catch a dangling id", () => {
        expect(deepLinkErrors("/policy#measure=no-such-measure")).toHaveLength(1);
        expect(deepLinkErrors("/manufacturing?chain=no-such-chain")).toHaveLength(1);
        expect(deepLinkErrors("/robots#no-such-robot")).toHaveLength(1);
    });
});

describe("agent docs cover the atlas", () => {
    test("llms.txt and agents.md link every page's markdown twin and dataset", async () => {
        const llms = await (await get("/llms.txt")).text();
        const agents = await (await get("/agents.md")).text();
        for (const page of [...new Set(PAGES.filter((p) => !p.startsWith("/bom/")))]) {
            expect({ page, llms: llms.includes(`${ORIGIN}${page}.md`) }).toEqual({
                page,
                llms: true,
            });
            expect({ page, agents: agents.includes(`${ORIGIN}${page}.md`) }).toEqual({
                page,
                agents: true,
            });
        }
        for (const path of [...DATASETS, "/api/v1/companies", "/api/v1/sites"]) {
            expect({ path, llms: llms.includes(path) }).toEqual({ path, llms: true });
            expect({ path, agents: agents.includes(path) }).toEqual({
                path,
                agents: true,
            });
        }
    });
});
