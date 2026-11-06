import { describe, expect, test } from "bun:test";
import { resolveBrand } from "@/brands";
import { CRITERIA, DIRECTORY, PEOPLE_DOMAINS, getDirectoryPerson } from "@/people";
import { PEOPLE_SOURCES } from "@/people/sources";
import {
    affiliations,
    crossLinks,
    netRadius,
    orgHubs,
    peopleByCountry,
    peopleNetwork,
} from "@/people/views";
import { getSource } from "@/supply-chain/sources";

const words = (s: string) => s.trim().split(/\s+/).length;

describe("/people directory", () => {
    test("40 to 80 people across all four domains, unique ids", () => {
        expect(DIRECTORY.length).toBeGreaterThanOrEqual(40);
        expect(DIRECTORY.length).toBeLessThanOrEqual(80);
        for (const d of PEOPLE_DOMAINS)
            expect(
                DIRECTORY.filter((p) => p.domain === d).length,
            ).toBeGreaterThanOrEqual(8);
        expect(new Set(DIRECTORY.map((p) => p.id)).size).toBe(DIRECTORY.length);
        expect(getDirectoryPerson("masato-sagawa")?.domain).toBe("magnets");
    });

    test("each person meets a written criterion with a resolvable facts source", () => {
        for (const p of DIRECTORY) {
            expect({ id: p.id, criterion: p.criterion in CRITERIA }).toEqual({
                id: p.id,
                criterion: true,
            });
            expect(p.sources.length).toBeGreaterThan(0);
            for (const id of p.sources) {
                const s = getSource(id);
                expect({ id: p.id, source: id, found: Boolean(s) }).toEqual({
                    id: p.id,
                    source: id,
                    found: true,
                });
                expect(s?.reuse).toBe("facts");
            }
        }
    });

    test("why they matter fits 20 words; key works and links are https", () => {
        for (const p of DIRECTORY) {
            expect({ id: p.id, ok: words(p.whyTheyMatter) <= 20 }).toEqual({
                id: p.id,
                ok: true,
            });
            expect(p.keyWorks.length).toBeGreaterThanOrEqual(1);
            expect(p.keyWorks.length).toBeLessThanOrEqual(3);
            for (const u of [
                ...p.keyWorks.map((w) => w.url),
                ...p.links.map((l) => l.url),
            ])
                expect(u).toMatch(/^https:\/\//);
        }
    });

    test("no em dashes in any record or source", () => {
        const text = JSON.stringify([DIRECTORY, PEOPLE_SOURCES]);
        expect(text).not.toContain(String.fromCharCode(0x2014));
    });

    test("every affiliation has a country and a logo through the brand registry", () => {
        for (const p of DIRECTORY) {
            for (const o of affiliations(p)) {
                expect(o.country).toMatch(/^[A-Z]{2}$/);
                expect(resolveBrand(o.brandId ?? "")?.id).toBe(o.brandId as string);
            }
        }
    });

    test("cross-links, clusters, map counts and network are consistent", () => {
        const all = DIRECTORY.flatMap(crossLinks).map((l) => l.href);
        expect(all).toContain("/humanoids?robot=unitree-g1");
        expect(all).toContain("/japan");
        expect(orgHubs()[0]?.org.id).toBe("mit");
        const counts = Object.values(peopleByCountry()).reduce((a, b) => a + b, 0);
        expect(counts).toBe(DIRECTORY.length);
        const net = peopleNetwork(720, 520);
        const again = peopleNetwork(720, 520);
        expect(net.nodes).toEqual(again.nodes);
        for (const n of net.nodes) {
            expect(n.x).toBeGreaterThanOrEqual(24);
            expect(n.x).toBeLessThanOrEqual(720 - 24);
            expect(n.y).toBeGreaterThanOrEqual(24);
            expect(n.y).toBeLessThanOrEqual(520 - 24);
        }
        // No two drawn marks overlap, at the page's canvas size either.
        for (const { nodes } of [net, peopleNetwork(960, 620)])
            for (const [i, a] of nodes.entries())
                for (const b of nodes.slice(i + 1))
                    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(
                        netRadius(a) + netRadius(b),
                    );
        expect(net.edges.filter((e) => e.main)).toHaveLength(DIRECTORY.length);
    });
});
