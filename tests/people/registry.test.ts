import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { resolveBrand } from "@/brands";
import { LICENCES, ORGS, PEOPLE } from "@/people";
import type { ImageAsset } from "@/people";
import sharp from "sharp";
import { MAX_BYTES, headshot, logo } from "../../scripts/people-assets";

const PUBLIC = "frontend/public";

const assets: [string, ImageAsset][] = [
    ...PEOPLE.flatMap((p) =>
        p.headshot ? [[p.id, p.headshot] as [string, ImageAsset]] : [],
    ),
    ...Object.values(ORGS).flatMap((o) =>
        o.logo ? [[o.id, o.logo] as [string, ImageAsset]] : [],
    ),
];

describe("people registry", () => {
    test("person ids are unique", () => {
        expect(new Set(PEOPLE.map((p) => p.id)).size).toBe(PEOPLE.length);
    });

    test("every asset has a licence, a source and a retrieved date, and fits 80 KB", () => {
        expect(assets.length).toBeGreaterThan(0);
        for (const [id, a] of assets) {
            expect({
                id,
                licence: (LICENCES as readonly string[]).includes(a.licence),
            }).toEqual({
                id,
                licence: true,
            });
            expect(a.sourceUrl).toMatch(/^https?:\/\//);
            // Signed CDN links expire; record the page the image came from.
            expect({ id, signed: a.sourceUrl.includes("licdn.com") }).toEqual({
                id,
                signed: false,
            });
            expect(a.retrieved).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            const file = join(PUBLIC, a.path);
            expect({ id, exists: existsSync(file) }).toEqual({ id, exists: true });
            expect(statSync(file).size).toBeLessThanOrEqual(MAX_BYTES);
        }
    });

    test("every image in public/people and public/orgs has a record", () => {
        const recorded = new Set(assets.map(([, a]) => a.path));
        for (const dir of ["people", "orgs"]) {
            for (const f of readdirSync(join(PUBLIC, dir)))
                expect(recorded.has(`/${dir}/${f}`)).toBe(true);
        }
    });

    test("every org brandId resolves in the brand registry", () => {
        for (const o of Object.values(ORGS))
            if (o.brandId) expect(resolveBrand(o.brandId)?.id).toBe(o.brandId);
    });
});

describe("people asset pipeline", () => {
    test("headshots become 512px square WebP within budget", async () => {
        const src = await sharp({
            create: { width: 900, height: 600, channels: 3, background: "#808080" },
        })
            .png()
            .toBuffer();
        const out = await headshot(src);
        const meta = await sharp(out).metadata();
        expect([meta.format, meta.width, meta.height]).toEqual(["webp", 512, 512]);
        expect(out.length).toBeLessThanOrEqual(MAX_BYTES);
    });

    test("raster logos fit a 256px WebP; SVG logos stay SVG", async () => {
        const src = await sharp({
            create: { width: 800, height: 200, channels: 4, background: "#ffffff" },
        })
            .png()
            .toBuffer();
        const raster = await logo(src, false);
        const meta = await sharp(raster.data).metadata();
        expect([raster.ext, meta.width, meta.height]).toEqual(["webp", 256, 256]);
        const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>');
        expect((await logo(svg, true)).ext).toBe("svg");
    });
});
