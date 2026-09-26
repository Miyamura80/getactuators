import { beforeAll, describe, expect, test } from "bun:test";
import {
    ActuatorDetailSchema,
    ActuatorListSchema,
    CategoryListSchema,
    CompareResultSchema,
    NamedCountListSchema,
    ProblemSchema,
    RobotDetailSchema,
    RobotListSchema,
} from "@/api/schemas";
import { ACTUATORS, ROBOTS, ROBOT_MOTORS } from "@/catalog";
import { type FetchHandler, createHandler } from "@/server/app";
import { loadRegistry } from "@/server/registry";

let handler: FetchHandler;
let ipCounter = 0;

beforeAll(async () => {
    handler = createHandler(await loadRegistry());
});

// Each call gets its own client IP so the shared rate limiter never trips here.
function call(path: string, init: RequestInit = {}, ip?: string): Promise<Response> {
    const headers = new Headers(init.headers);
    headers.set(
        "X-Forwarded-For",
        ip ?? `10.0.${Math.floor(ipCounter / 250)}.${ipCounter++ % 250}`,
    );
    return handler(new Request(`http://localhost${path}`, { ...init, headers }));
}

async function expectProblem(res: Response, status: number, code: string) {
    expect(res.status).toBe(status);
    expect(res.headers.get("content-type")).toBe("application/problem+json");
    const body = ProblemSchema.parse(await res.json());
    expect(body.code).toBe(code);
    expect(body.type).toContain("/docs/api#error-");
    return body;
}

describe("GET /api/v1/actuators", () => {
    test("returns the documented shape", async () => {
        const res = await call("/api/v1/actuators");
        expect(res.status).toBe(200);
        const body = ActuatorListSchema.parse(await res.json());
        expect(body.data.length).toBe(25);
        expect(body.pagination.total).toBe(ACTUATORS.length);
    });

    test("filters and sorts", async () => {
        const res = await call(
            "/api/v1/actuators?category=qdd_proprioceptive&min_peak_torque_nm=10&sort=peak_torque_nm&order=asc&limit=100",
        );
        const body = ActuatorListSchema.parse(await res.json());
        expect(body.data.length).toBeGreaterThan(0);
        const torques = body.data.map((a) => a.peak_torque_nm ?? 0);
        expect(torques).toEqual([...torques].sort((a, b) => a - b));
        for (const a of body.data) {
            expect(a.category).toBe("qdd_proprioceptive");
            expect(a.peak_torque_nm ?? 0).toBeGreaterThanOrEqual(10);
        }
    });

    test("boolean filters parse true/false", async () => {
        const res = await call("/api/v1/actuators?backdrivable=false&limit=100");
        const body = ActuatorListSchema.parse(await res.json());
        expect(body.data.every((a) => a.backdrivable === false)).toBe(true);
    });

    test("cursor pagination walks every item exactly once", async () => {
        const seen: string[] = [];
        let cursor: string | null = null;
        let pages = 0;
        do {
            const qs: string = cursor ? `&cursor=${encodeURIComponent(cursor)}` : "";
            const res = await call(`/api/v1/actuators?limit=7&sort=weight_g${qs}`);
            const body = ActuatorListSchema.parse(await res.json());
            seen.push(...body.data.map((a) => a.id));
            expect(body.pagination.has_more).toBe(body.pagination.next_cursor !== null);
            cursor = body.pagination.next_cursor;
            pages++;
        } while (cursor && pages < 50);
        expect(seen.length).toBe(ACTUATORS.length);
        expect(new Set(seen).size).toBe(ACTUATORS.length);
    });

    test("rejects bad params and foreign cursors with 400", async () => {
        const bad = await expectProblem(
            await call("/api/v1/actuators?limit=500&sort=nope"),
            400,
            "invalid_parameter",
        );
        expect(bad.errors?.map((e) => e.field).sort()).toEqual(["limit", "sort"]);
        const first = ActuatorListSchema.parse(
            await (await call("/api/v1/actuators?limit=2")).json(),
        );
        const cursor = first.pagination.next_cursor ?? "";
        await expectProblem(
            await call(`/api/v1/actuators?limit=2&brand=RobStride&cursor=${cursor}`),
            400,
            "invalid_cursor",
        );
        await expectProblem(
            await call("/api/v1/actuators?cursor=garbage"),
            400,
            "invalid_cursor",
        );
    });
});

describe("single resources", () => {
    test("actuator detail includes robots_using", async () => {
        const linked = Object.values(ROBOT_MOTORS).find((m) => m.actuator_id);
        const id = linked?.actuator_id ?? "robstride-02";
        const res = await call(`/api/v1/actuators/${id}`);
        const body = ActuatorDetailSchema.parse(await res.json());
        expect(body.id).toBe(id);
        if (linked) expect(body.robots_using.length).toBeGreaterThan(0);
    });

    test("robot detail resolves joints to motors", async () => {
        const res = await call("/api/v1/robots/i2rt-yam");
        const body = RobotDetailSchema.parse(await res.json());
        expect(body.joints.length).toBeGreaterThan(0);
        expect(body.joints[0]?.motor.name).toBeTruthy();
    });

    test("robots list paginates", async () => {
        const body = RobotListSchema.parse(await (await call("/api/v1/robots")).json());
        expect(body.pagination.total).toBe(ROBOTS.length);
    });

    test("unknown ids are 404 problems", async () => {
        await expectProblem(await call("/api/v1/actuators/nope"), 404, "not_found");
        await expectProblem(await call("/api/v1/robots/nope"), 404, "not_found");
    });

    test("taxonomy endpoints", async () => {
        CategoryListSchema.parse(await (await call("/api/v1/categories")).json());
        const brands = NamedCountListSchema.parse(
            await (await call("/api/v1/brands")).json(),
        );
        const total = brands.data.reduce((n, b) => n + b.actuator_count, 0);
        expect(total).toBe(ACTUATORS.length);
        NamedCountListSchema.parse(await (await call("/api/v1/use-cases")).json());
    });
});

describe("compare (batch)", () => {
    test("POST returns per-id results and not_found", async () => {
        const res = await call("/api/v1/actuators/compare", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Idempotency-Key": "k1" },
            body: JSON.stringify({ ids: ["robstride-02", "missing", "robstride-02"] }),
        });
        expect(res.status).toBe(200);
        const body = CompareResultSchema.parse(await res.json());
        expect(body.data.map((d) => d.id)).toEqual(["robstride-02", "missing"]);
        expect(body.not_found).toEqual(["missing"]);
    });

    test("GET ?ids= matches POST", async () => {
        const res = await call("/api/v1/actuators/compare?ids=robstride-02,missing");
        const body = CompareResultSchema.parse(await res.json());
        expect(body.not_found).toEqual(["missing"]);
    });

    test("validates the body", async () => {
        const post = (body: string, type = "application/json") =>
            call("/api/v1/actuators/compare", {
                method: "POST",
                headers: { "Content-Type": type },
                body,
            });
        const tooMany = JSON.stringify({
            ids: Array.from({ length: 21 }, (_, i) => `a${i}`),
        });
        await expectProblem(await post(tooMany), 422, "validation_failed");
        await expectProblem(await post("{nope"), 400, "invalid_json");
        await expectProblem(
            await post("ids=a", "text/plain"),
            415,
            "unsupported_media_type",
        );
        await expectProblem(
            await call("/api/v1/actuators/compare"),
            400,
            "invalid_parameter",
        );
    });
});

describe("protocol behavior", () => {
    test("wrong method is 405 with Allow", async () => {
        const res = await call("/api/v1/actuators", { method: "DELETE" });
        await expectProblem(res, 405, "method_not_allowed");
        expect(res.headers.get("allow")).toBe("GET, HEAD, OPTIONS");
    });

    test("unknown /api paths never fall through to the SPA", async () => {
        for (const p of ["/api/v2", "/api/v1/nothing/here", "/api/a/b/c/d/e/f"]) {
            await expectProblem(await call(p), 404, "unknown_endpoint");
        }
    });

    test("OPTIONS preflight allows any origin", async () => {
        const res = await call("/api/v1/actuators/compare", { method: "OPTIONS" });
        expect(res.status).toBe(204);
        expect(res.headers.get("access-control-allow-origin")).toBe("*");
        expect(res.headers.get("access-control-allow-methods")).toContain("POST");
    });

    test("responses carry version, CORS, discovery and rate-limit headers", async () => {
        const res = await call("/api/v1/categories");
        expect(res.headers.get("api-version")).toBe("1");
        expect(res.headers.get("access-control-allow-origin")).toBe("*");
        expect(res.headers.get("link")).toContain('rel="service-desc"');
        expect(res.headers.get("cache-control")).toContain("max-age");
        expect(res.headers.get("ratelimit-policy")).toBe('"default";q=120;w=60');
        expect(res.headers.get("ratelimit")).toMatch(/^"default";r=\d+;t=\d+$/);
        expect(res.headers.get("x-ratelimit-limit")).toBe("120");
    });

    test("121st request in a window is a 429 with Retry-After", async () => {
        // Loop past 2 windows' worth so a minute rollover mid-test cannot flake.
        let res = await call("/api/v1/categories", {}, "203.0.113.7, 10.0.0.1");
        for (let i = 0; i < 250 && res.status !== 429; i++) {
            res = await call("/api/v1/categories", {}, "203.0.113.7, 10.0.0.1");
        }
        await expectProblem(res, 429, "rate_limited");
        expect(Number(res.headers.get("retry-after"))).toBeGreaterThan(0);
        expect(res.headers.get("x-ratelimit-remaining")).toBe("0");
    });
});
