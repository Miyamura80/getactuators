import { countryFlag, countryName } from "@/country-flag";
import { SEGMENT_LABEL } from "@/supply-chain/companies";
import { concentration } from "@/supply-chain/concentration";
import {
    COUNTRY_AS_OF,
    type CountryPage,
    LIVE_COUNTRY_PAGES,
    clusterSites,
    countryCompanies,
    countryLinks,
    countrySites,
    worldShares,
} from "@/supply-chain/country-pages";
import { percent } from "@/supply-chain/format";
import {
    MEASURE_STATUS_LABEL,
    MEASURE_TYPE_LABEL,
    measuresForCountry,
} from "@/supply-chain/policy";
import { getCompany } from "@/supply-chain/registry";
import { STAGE_LABEL } from "@/supply-chain/stages";
import { SITE_URL, absoluteUrl } from "../../site";
import * as ld from "../jsonld";
import { mdTable, mdText } from "../md";
import type { Page } from "../page-types";
import { type Footnotes, footnotes } from "./footnotes";

// The country page template, server side: one markdown body builder and one
// Page entry per live country (/japan, ...), from the same data the React
// page draws (src/supply-chain/country-pages/).

const title = (p: CountryPage) => `${p.name}: actuator supply chain`;

const flagged = (code: string) => `${countryFlag(code)} ${code}`;

const companyName = (id: string) => getCompany(id)?.name ?? id;

function stageTable(p: CountryPage, fn: Footnotes): string {
    const rows = p.stages.map((s) => {
        const world = worldShares(s.stage);
        const top = world ? concentration(world.value)?.top : undefined;
        return [
            STAGE_LABEL[s.stage],
            s.share
                ? fn.value(s.share)
                : `no public split${fn.ref(s.gap?.sources ?? [])}`,
            mdText(s.of),
            top && world
                ? `${flagged(top.country)} ${percent(top.share)}${fn.ref(world.sources)}`
                : "-",
        ];
    });
    const gaps = p.stages
        .filter((s) => s.gap)
        .map((s) => `- ${STAGE_LABEL[s.stage]}: ${mdText(s.gap?.text ?? "")}`)
        .join("\n");
    return `${mdTable(["Stage", `${p.name}'s share`, "Share of", "World leader"], rows)}${gaps ? `\n\n${gaps}` : ""}`;
}

function policyList(p: CountryPage): string {
    return measuresForCountry(p.code)
        .map(
            (m) =>
                `- [${mdText(m.title)}](${absoluteUrl(`/policy#measure=${m.id}`)}): ${MEASURE_TYPE_LABEL[m.type].toLowerCase()}, ${MEASURE_STATUS_LABEL[m.status].toLowerCase()}`,
        )
        .join("\n");
}

function clusterList(p: CountryPage): string {
    const sites = countrySites(p.code);
    return p.clusters
        .map((c) => {
            const members = clusterSites(c, sites);
            const names = [...new Set(members.map((s) => companyName(s.companyId)))];
            return `- **${mdText(c.label)}** (${members.length} sites): ${mdText(c.blurb)} ${mdText(names.join(", "))}.`;
        })
        .join("\n");
}

function companyTable(p: CountryPage, fn: Footnotes): string {
    const sites = countrySites(p.code);
    const rows = countryCompanies(p.code).map((c) => [
        `**${mdText(c.name)}** (\`${c.id}\`)${c.localName ? ` ${c.localName}` : ""}`,
        SEGMENT_LABEL[c.segment],
        flagged(c.hqCountry),
        String(sites.filter((s) => s.companyId === c.id).length),
        c.revenue ? fn.value(c.revenue) : "-",
        c.grossMargin ? fn.value(c.grossMargin) : "-",
        c.ownership?.ticker ?? c.ownership?.kind ?? "-",
    ]);
    return mdTable(
        [
            "Company",
            "Segment",
            "HQ",
            `Sites in ${p.name}`,
            "Revenue (USD)",
            "Gross margin",
            "Listing",
        ],
        rows,
    );
}

function siteTable(p: CountryPage, fn: Footnotes): string {
    const rows = countrySites(p.code).map((s) => [
        mdText(s.name),
        mdText(companyName(s.companyId)),
        mdText(s.admin1 ?? ""),
        s.kind,
        mdText((s.makes ?? []).join(", ")) || "-",
        [s.status ?? "", s.opened ? `opened ${fn.value(s.opened)}` : ""]
            .filter(Boolean)
            .join(", "),
        `${s.lat.toFixed(3)}, ${s.lon.toFixed(3)} (${s.precision})`,
        fn.ref(s.sources),
    ]);
    return mdTable(
        [
            "Site",
            "Company",
            "Prefecture",
            "Kind",
            "Makes",
            "Status",
            "Lat, lon (pin)",
            "Source",
        ],
        rows,
    );
}

function linkTable(p: CountryPage, fn: Footnotes): string {
    const rows = countryLinks(p.code).map((l) => {
        const from = getCompany(l.from);
        const to = getCompany(l.to);
        return [
            `${mdText(from?.name ?? l.from)} (${from?.hqCountry ?? "?"})`,
            `${mdText(to?.name ?? l.to)} (${to?.hqCountry ?? "?"})`,
            `${mdText(l.what)}${l.note ? `. ${mdText(l.note)}` : ""}`,
            l.confidence,
            fn.ref(l.sources),
        ];
    });
    return mdTable(["From", "To", "What", "Confidence", "Source"], rows);
}

export function countryBody(p: CountryPage): string {
    const fn = footnotes();
    const companies = countryCompanies(p.code);
    const sites = countrySites(p.code);
    const links = countryLinks(p.code);
    return `# ${title(p)}

${mdText(p.lede)} ${companies.length} companies, ${sites.length} sites and ${links.length} current supply links, as of ${COUNTRY_AS_OF}. Interactive map: ${absoluteUrl(p.path)}. JSON: ${absoluteUrl(`/api/v1/countries/${p.code}`)}. MCP: get_country("${p.code}").

Companies are those headquartered in ${p.name} or with a site there; a foreign owner keeps its own country in the HQ column. Revenue is the latest fiscal year converted from local currency (estimate, "~"); gross margin is gross profit over net sales.

## Share of each stage

${stageTable(p, fn)}

## Policies

${policyList(p)}

All measures with their status history: ${absoluteUrl("/policy")}.

## Clusters

${clusterList(p)}

## Companies

${companyTable(p, fn)}

## Sites

Pins marked "city" are the city centre, "region" the prefecture; "site" is the plant itself.

${siteTable(p, fn)}

## Supply links

Seller first. Links to companies abroad continue on those countries' pages once they are live.

${linkTable(p, fn)}

${fn.section()}`;
}

// JSON-LD: the country as a Place, and its companies as an ItemList of
// Organizations each located at its headquarters (or first site there).
function countryJsonLd(p: CountryPage): Record<string, unknown>[] {
    const sites = countrySites(p.code);
    const place = {
        "@type": "Country",
        "@id": `${SITE_URL}${p.path}#place`,
        name: countryName(p.code),
        identifier: p.code,
    };
    const companies = countryCompanies(p.code);
    return [
        ld.webPage("CollectionPage", p.path, title(p)),
        ld.breadcrumbs([
            { name: "Home", path: "/" },
            { name: title(p), path: p.path },
        ]),
        place,
        {
            "@type": "ItemList",
            "@id": `${SITE_URL}${p.path}#companies`,
            name: `Actuator supply chain companies in ${p.name}`,
            numberOfItems: companies.length,
            itemListElement: companies.map((c, i) => {
                const at =
                    sites.find((s) => s.companyId === c.id && s.kind === "hq") ??
                    sites.find((s) => s.companyId === c.id);
                return {
                    "@type": "ListItem",
                    position: i + 1,
                    item: {
                        "@type": "Organization",
                        name: c.name,
                        url: c.url,
                        ...(c.localName ? { alternateName: c.localName } : {}),
                        ...(at
                            ? {
                                  location: {
                                      "@type": "Place",
                                      name: at.name,
                                      address: {
                                          "@type": "PostalAddress",
                                          addressRegion: at.admin1,
                                          addressCountry: at.country,
                                      },
                                      geo: {
                                          "@type": "GeoCoordinates",
                                          latitude: at.lat,
                                          longitude: at.lon,
                                      },
                                      containedInPlace: { "@id": place["@id"] },
                                  },
                              }
                            : {}),
                    },
                };
            }),
        },
    ];
}

function countryPageEntry(p: CountryPage): Page {
    return {
        path: p.path,
        kind: "spa",
        title: title(p),
        description: `${p.lede} A map of ${countryCompanies(p.code).length} companies' headquarters and plants across rare earths, magnets and motors, gears and bearings, and robot makers, with supply links and sources.`,
        body: () => countryBody(p),
        jsonLd: () => countryJsonLd(p),
    };
}

export const COUNTRY_PAGE_ENTRIES: Page[] = LIVE_COUNTRY_PAGES.map(countryPageEntry);
