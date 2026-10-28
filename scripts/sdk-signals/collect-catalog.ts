import { BRANDS, resolveBrand } from "@/brands";
import { ACTUATORS } from "@/catalog";
import type { CollectorRun, Evidence } from "@/sdk/types";

// Docs angle without a network call: documentation pages the catalog already
// cites (datasheet_url and sources) that sit on the maker's own domain and
// look like docs (a manual, a docs or wiki site, a download page, a PDF).

const DOCS_LIKE =
    /(docs?|emanual|manual|wiki|download|datasheet|instruction)|\.pdf($|\?)/i;

const host = (url: string) => new URL(url).hostname.replace(/^www\./, "");

// The maker's own documentation URLs among one actuator's catalog links.
function makerDocs(urls: (string | null)[], domain: string): string[] {
    return urls.filter((url): url is string => {
        if (!url || !DOCS_LIKE.test(url)) return false;
        const h = host(url);
        return h === domain || h.endsWith(`.${domain}`);
    });
}

export function collectCatalogDocs(): { run: CollectorRun; evidence: Evidence[] } {
    const out = new Map<string, Evidence>();
    for (const a of ACTUATORS) {
        const brand = resolveBrand(a.brand);
        const domain = BRANDS.find((b) => b.id === brand?.id)?.domain;
        if (!brand || !domain) continue;
        for (const url of makerDocs([a.datasheet_url, ...a.sources], domain)) {
            const id = `catalog:${brand.id}:${url}`;
            if (out.has(id)) continue;
            out.set(id, {
                id,
                brand: brand.id,
                signal: "docs-link",
                source: "catalog",
                url,
                title: `Maker documentation on ${host(url)}, cited by the catalog entry ${a.id}`,
                official: true,
            });
        }
    }
    const evidence = [...out.values()];
    return {
        run: {
            id: "catalog-docs",
            label: "Maker documentation cited by the catalog",
            status: "ok",
            detail: `${evidence.length} documentation pages on makers' own domains`,
            items: evidence.length,
        },
        evidence,
    };
}
