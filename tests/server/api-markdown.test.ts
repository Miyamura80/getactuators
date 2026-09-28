import { beforeAll, describe, expect, test } from "bun:test";
import { ProblemSchema } from "@/api/schemas";
import { API_OPERATIONS } from "@/api/surface";
import { ACTUATORS, CATEGORIES, ROBOTS } from "@/catalog";
import { type FetchHandler, createHandler } from "@/server/app";
import { loadRegistry } from "@/server/registry";
import { SITE_URL } from "@/server/site";

let handler: FetchHandler;
let ipCounter = 0;

beforeAll(async () => {
    handler = createHandler(await loadRegistry());
});

// Own client IP per call so the shared rate limiter never trips.
function call(path: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    headers.set(
        "X-Forwarded-For",
        `10.9.${Math.floor(ipCounter / 250)}.${ipCounter++ % 250}`,
    );
    return handler(new Request(`http://localhost${path}`, { ...init, headers }));
}

async function expectMarkdown(res: Response): Promise<string> {
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
    const text = await res.text();
    expect(text.startsWith("# ")).toBe(true);
    return text;
}

const TWINS: [string, string][] = [
    ["/api.md", "# actuatorlist API v1"],
    ["/api/v1.md", "# actuatorlist API v1"],
    ["/api/v1/actuators.md", "# Actuators"],
    ["/api/v1/actuators/robstride-02.md", "# RobStride 02 by RobStride"],
    [
        "/api/v1/actuators/compare.md?ids=robstride-02,cubemars-ak80-9",
        "# Actuator comparison",
    ],
    ["/api/v1/robots.md", "# Robots"],
    ["/api/v1/robots/i2rt-yam.md", "# YAM by"],
    ["/api/v1/categories.md", "# Actuator categories"],
    ["/api/v1/brands.md", "# Actuator brands"],
    ["/api/v1/use-cases.md", "# Use-case tags"],
];

describe("API markdown twins (.md)", () => {
    for (const [path, heading] of TWINS) {
        test(`${path} is heading-led markdown pointing at its JSON`, async () => {
            const text = await expectMarkdown(await call(path));
            expect(text.split("\n")[0]).toStartWith(heading);
            const [jsonPath] = path.replace(".md", "").split("?");
            expect(text).toContain("## JSON");
            expect(text).toContain(`${SITE_URL}${jsonPath}`);
        });
    }

    test("the index lists every operation", async () => {
        const text = await expectMarkdown(await call("/api.md"));
        for (const op of API_OPERATIONS) expect(text).toContain(op.summary);
    });

    test("query strings filter like the JSON endpoint", async () => {
        const slug = CATEGORIES[0]?.slug ?? "";
        const text = await expectMarkdown(
            await call(`/api/v1/actuators.md?category=${slug}&limit=100`),
        );
        const expected = ACTUATORS.filter((a) => a.category === slug);
        expect(text).toContain(`${expected.length} of ${expected.length} matching`);
        const other = ACTUATORS.find((a) => a.category !== slug);
        expect(text).not.toContain(`/actuators/${other?.id})`);
        expect(text).toContain(`/api/v1/actuators?category=${slug}&limit=100`);
    });

    test("pagination links to the next markdown page", async () => {
        const text = await expectMarkdown(await call("/api/v1/actuators.md?limit=2"));
        const next = text.match(/\[markdown\]\(([^)]+)\)/)?.[1] ?? "";
        expect(next).toStartWith(`${SITE_URL}/api/v1/actuators.md?limit=2&cursor=`);
        await expectMarkdown(await call(next.slice(SITE_URL.length)));
    });

    test("compare lists unknown ids", async () => {
        const text = await expectMarkdown(
            await call("/api/v1/actuators/compare.md?ids=robstride-02,not-a-real-id"),
        );
        expect(text).toContain("## Not found");
        expect(text).toContain("not-a-real-id");
    });

    test("robot list covers every robot", async () => {
        const text = await expectMarkdown(await call("/api/v1/robots.md?limit=100"));
        for (const r of ROBOTS) expect(text).toContain(`/api/v1/robots/${r.id}.md`);
    });

    test("HEAD works and non-GET methods get a 405", async () => {
        const head = await call("/api/v1/brands.md", { method: "HEAD" });
        expect(head.status).toBe(200);
        const post = await call("/api/v1/brands.md", { method: "POST" });
        expect(post.status).toBe(405);
    });
});

describe("API markdown errors", () => {
    async function expectProblem(path: string, status: number, code: string) {
        const res = await call(path);
        expect(res.status).toBe(status);
        expect(res.headers.get("content-type")).toBe("application/problem+json");
        expect(ProblemSchema.parse(await res.json()).code).toBe(code);
    }

    test("unknown ids 404 like the JSON endpoint", async () => {
        await expectProblem("/api/v1/actuators/not-a-real-id.md", 404, "not_found");
        await expectProblem("/api/v1/robots/not-a-real-id.md", 404, "not_found");
    });

    test("unknown .md paths 404", async () => {
        await expectProblem("/api/v1/nope.md", 404, "unknown_endpoint");
        await expectProblem("/api/openapi.json.md", 404, "unknown_endpoint");
    });

    test("invalid filters are a 400", async () => {
        await expectProblem(
            "/api/v1/actuators.md?category=bogus",
            400,
            "invalid_parameter",
        );
        await expectProblem("/api/v1/actuators/compare.md", 400, "invalid_parameter");
    });
});

describe("Accept: text/markdown on API routes", () => {
    test("returns the markdown twin on the JSON URL", async () => {
        const res = await call("/api/v1/categories", {
            headers: { Accept: "text/markdown" },
        });
        const text = await expectMarkdown(res);
        expect(text).toStartWith("# Actuator categories");
        expect(res.headers.get("vary")).toContain("Accept");
    });

    test("JSON stays the default", async () => {
        for (const accept of [
            "*/*",
            "application/json",
            "application/json, text/markdown;q=0.5",
        ]) {
            const res = await call("/api/v1/categories", {
                headers: { Accept: accept },
            });
            expect(res.headers.get("content-type")).toBe(
                "application/json; charset=utf-8",
            );
            expect(res.headers.get("vary")).toContain("Accept");
        }
    });

    test("AI crawler user agents still get JSON", async () => {
        const res = await call("/api/v1/brands", {
            headers: { "User-Agent": "ClaudeBot/1.0" },
        });
        expect(res.headers.get("content-type")).toBe("application/json; charset=utf-8");
    });

    test("the index negotiates too, including aliases", async () => {
        for (const path of ["/api", "/api/", "/api/v1"]) {
            const res = await call(path, { headers: { Accept: "text/markdown" } });
            expect(await expectMarkdown(res)).toStartWith("# actuatorlist API v1");
        }
    });

    test("the OpenAPI document is always JSON", async () => {
        const res = await call("/openapi.json", {
            headers: { Accept: "text/markdown" },
        });
        expect(res.headers.get("content-type")).toBe("application/json; charset=utf-8");
    });
});
