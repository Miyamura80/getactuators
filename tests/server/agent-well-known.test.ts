import { describe, expect, test } from "bun:test";
import { HOST } from "@/server/agent/links";
import { SITE_URL } from "@/server/site";
import { get } from "./agent-helpers";

type Json = Record<string, unknown>;

async function json(path: string): Promise<Json> {
    const res = await get(path);
    expect(res.status).toBe(200);
    return (await res.json()) as Json;
}

describe("ARD catalog", () => {
    test("every entry is a valid ARD entry", async () => {
        const doc = await json("/.well-known/ard.json");
        const entries = doc.entries as Json[];
        expect(entries.length).toBeGreaterThanOrEqual(4);
        for (const e of entries) {
            expect(e.identifier).toMatch(
                new RegExp(
                    `^urn:air:${HOST.replace(/\./g, "\\.")}(:[a-zA-Z0-9._-]+)+$`,
                ),
            );
            expect(typeof e.displayName).toBe("string");
            expect(e.type).toMatch(/^[a-z]+\/[a-z0-9.+-]+$/);
            expect(("url" in e ? 1 : 0) + ("data" in e ? 1 : 0)).toBe(1);
            const trust = e.trustManifest as Json;
            expect(new URL(String(trust.identity)).host).toBe(HOST);
            const queries = e.representativeQueries as string[];
            expect(queries.length).toBeGreaterThanOrEqual(2);
            expect(queries.length).toBeLessThanOrEqual(5);
        }
        const types = entries.map((e) => e.type);
        expect(types).toContain("application/mcp-server-card+json");
        expect(types).toContain("application/vnd.oai.openapi+json");
        expect(types).toContain("application/ai-skill+md");
    });

    test("ai-catalog.json is the same document", async () => {
        expect(await json("/.well-known/ai-catalog.json")).toEqual(
            await json("/.well-known/ard.json"),
        );
    });
});

describe("agent skills index", () => {
    test("v0.2.0 index with a digest of the served SKILL.md bytes", async () => {
        const index = await json("/.well-known/agent-skills/index.json");
        expect(index.$schema).toBe(
            "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
        );
        const [skill] = index.skills as Json[];
        expect(skill?.type).toBe("skill-md");
        expect(skill?.name).toBe("getactuators");
        const res = await get(String(skill?.url));
        expect(res.headers.get("content-type")).toStartWith("text/markdown");
        const bytes = new Uint8Array(await res.arrayBuffer());
        const hex = new Bun.CryptoHasher("sha256").update(bytes).digest("hex");
        expect(skill?.digest).toBe(`sha256:${hex}`);
        expect(new TextDecoder().decode(bytes)).toStartWith(
            "---\nname: getactuators\n",
        );
    });
});

describe("A2A agent card", () => {
    test("has the required fields and points at a real surface", async () => {
        const card = await json("/.well-known/agent-card.json");
        for (const key of [
            "protocolVersion",
            "name",
            "description",
            "url",
            "version",
            "capabilities",
            "defaultInputModes",
            "defaultOutputModes",
            "skills",
        ]) {
            expect(card).toHaveProperty(key);
        }
        expect(card.url).toBe(`${SITE_URL}/mcp`);
        for (const s of card.skills as Json[]) {
            expect(s.id && s.name && s.description).toBeTruthy();
            expect(Array.isArray(s.tags)).toBe(true);
        }
    });
});

describe("API catalog (RFC 9727)", () => {
    test("is a linkset pointing at the OpenAPI description", async () => {
        const res = await get("/.well-known/api-catalog");
        expect(res.headers.get("content-type")).toBe(
            'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"',
        );
        const body = (await res.json()) as { linkset: Json[] };
        const desc = body.linkset[0]?.["service-desc"] as Json[];
        expect(desc[0]?.href).toBe(`${SITE_URL}/openapi.json`);
    });
});

describe("unknown well-known paths", () => {
    test("return a JSON 404, not the HTML shell", async () => {
        const res = await get("/.well-known/does-not-exist");
        expect(res.status).toBe(404);
        expect(res.headers.get("content-type")).toStartWith("application/problem+json");
    });
});
