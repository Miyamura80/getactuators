import {
    CRITERIA,
    DIRECTORY,
    DOMAIN_LABEL,
    type DirectoryPerson,
    EXCLUSIONS,
    PEOPLE_AS_OF,
    PEOPLE_DOMAINS,
    PEOPLE_PATH,
    orgOf,
} from "@/people";
import { affiliations, crossLinks, orgHubs } from "@/people/views";
import { absoluteUrl } from "../../site";
import * as ld from "../jsonld";
import { mdLink, mdTable, mdText } from "../md";
import type { Page } from "../page-types";
import { footnotes } from "../supply-chain/footnotes";

// Markdown twin and JSON-LD for /people: one table per domain (name,
// affiliation, why they matter, key works) with numbered source footnotes,
// the inclusion criteria and the affiliation clusters.

export const PEOPLE_TITLE = "Leading people in actuators and rare earths";
const DESCRIPTION =
    "Who shapes robot actuators and the rare-earth magnet supply chain: researchers, founders, magnet and rare earth executives, analysts and policy leads, each with affiliation, key works and sources.";

export function personAnchor(p: DirectoryPerson): string {
    return `${absoluteUrl(PEOPLE_PATH)}#${p.id}`;
}

function works(p: DirectoryPerson): string {
    return p.keyWorks
        .map((w) => mdLink(`${mdText(w.title)}${w.year ? ` (${w.year})` : ""}`, w.url))
        .join("; ");
}

function domainSection(
    fn: ReturnType<typeof footnotes>,
    domain: DirectoryPerson["domain"],
) {
    const rows = DIRECTORY.filter((p) => p.domain === domain).map((p) => {
        const org = orgOf(p);
        const links = crossLinks(p)
            .map((l) => mdLink(l.label, absoluteUrl(l.href)))
            .join(", ");
        return [
            `**${mdText(p.name)}**${fn.ref(p.sources)}`,
            `${mdText(p.role)} (${mdLink(org.name, org.url)})`,
            mdText(p.whyTheyMatter),
            works(p),
            links || "",
        ];
    });
    return `## ${DOMAIN_LABEL[domain]} (${rows.length})\n\n${mdTable(
        [
            "Name",
            "Role and affiliation",
            "Why they matter",
            "Key works",
            "On this site",
        ],
        rows,
    )}`;
}

export function peopleBody(): string {
    const fn = footnotes();
    const sections = PEOPLE_DOMAINS.map((d) => domainSection(fn, d)).join("\n\n");
    const criteria = Object.values(CRITERIA)
        .map((c) => `- ${c}`)
        .join("\n");
    const hubs = orgHubs()
        .map(
            (h) =>
                `- **${mdText(h.org.name)}**: ${h.people.map((p) => mdText(p.name)).join(", ")}`,
        )
        .join("\n");
    return `# ${PEOPLE_TITLE}

${DIRECTORY.length} people across four domains: actuator research, actuator and robot companies, rare earth and magnet companies, and analysts and policy. Roles were checked on ${PEOPLE_AS_OF}. Interactive page with domain filter, affiliation network and map: ${absoluteUrl(PEOPLE_PATH)}. JSON: ${absoluteUrl("/api/v1/people")}.

${sections}

## Shared affiliations

Organisations that connect two or more people here (main or earlier affiliation):

${hubs}

## Inclusion criteria

A person is listed when at least one of these holds, with a public source:

${criteria}

${EXCLUSIONS} To suggest someone, or to change or remove an entry, use the ${mdLink("contact page", absoluteUrl("/contact"))}. Headshots are shown only with a clear licence; everyone else gets initials.

${fn.section()}`;
}

function personNode(p: DirectoryPerson): Record<string, unknown> {
    const orgs = affiliations(p);
    return {
        "@type": "Person",
        "@id": personAnchor(p),
        name: p.name,
        ...(p.localName ? { alternateName: p.localName } : {}),
        jobTitle: p.role,
        description: p.whyTheyMatter,
        affiliation: orgs.map((o) => ({
            "@type": "Organization",
            name: o.name,
            url: o.url,
        })),
        ...(p.headshot ? { image: absoluteUrl(p.headshot.path) } : {}),
        sameAs: p.links.map((l) => l.url),
        subjectOf: p.keyWorks.map((w) => ({
            "@type": "CreativeWork",
            name: w.title,
            url: w.url,
            ...(w.year ? { dateCreated: String(w.year) } : {}),
        })),
    };
}

export const PEOPLE_PAGE: Page = {
    path: PEOPLE_PATH,
    kind: "spa",
    title: PEOPLE_TITLE,
    description: DESCRIPTION,
    body: peopleBody,
    jsonLd: () => [
        ld.webPage("CollectionPage", PEOPLE_PATH, PEOPLE_TITLE),
        ld.breadcrumbs([
            { name: "Home", path: "/" },
            { name: "People", path: PEOPLE_PATH },
        ]),
        {
            "@type": "ItemList",
            name: PEOPLE_TITLE,
            numberOfItems: DIRECTORY.length,
            itemListElement: DIRECTORY.map((p, i) => ({
                "@type": "ListItem",
                position: i + 1,
                item: personNode(p),
            })),
        },
    ],
};
