import {
    CRITERIA,
    DIRECTORY,
    DOMAIN_LABEL,
    type DirectoryPerson,
    KEY_WORK_KINDS,
    PEOPLE_AS_OF,
    PEOPLE_DOMAINS,
    PEOPLE_PATH,
    type PeopleDomain,
    getDirectoryPerson,
} from "@/people";
import { affiliations, crossLinks } from "@/people/views";
import { absoluteUrl } from "@/server/site";
import { getSource } from "@/supply-chain/sources";
import { z } from "zod";
import { type ApiContext, json } from "./http";
import { parseQuery } from "./params";
import { ApiError } from "./problem";
import { schemaRegistry } from "./schemas";

// /api/v1/people: the /people directory over REST. The same serializers back
// the MCP tool list_people.

function named<T extends z.ZodType>(id: string, schema: T): T {
    schemaRegistry.add(schema, { id });
    return schema;
}

const orgSchema = z.object({
    id: z.string(),
    name: z.string(),
    url: z.string(),
    country: z.string().nullable().describe("ISO 3166-1 alpha-2 code."),
    company_id: z
        .string()
        .nullable()
        .describe("Supply-chain company id (GET /api/v1/companies/{id}), when listed."),
});

export const PersonSchema = named(
    "Person",
    z
        .object({
            id: z.string(),
            name: z.string(),
            local_name: z.string().nullable(),
            role: z.string(),
            domain: z.enum(PEOPLE_DOMAINS),
            domain_label: z.string(),
            criterion: z
                .string()
                .describe("The inclusion criterion this person meets, in words."),
            why_they_matter: z.string(),
            affiliation: orgSchema.describe("Main affiliation."),
            other_affiliations: z.array(orgSchema),
            key_works: z.array(
                z.object({
                    title: z.string(),
                    year: z.number().nullable(),
                    url: z.string(),
                    kind: z.enum(KEY_WORK_KINDS),
                }),
            ),
            links: z.array(z.object({ kind: z.string(), url: z.string() })),
            site_links: z
                .array(z.object({ label: z.string(), url: z.string() }))
                .describe(
                    "Pages on this site for the person's affiliations: country page, humanoid joint map, catalog actuators.",
                ),
            headshot: z
                .object({
                    url: z.string(),
                    licence: z.string(),
                    credit: z.string().nullable(),
                    source_url: z.string(),
                })
                .nullable()
                .describe(
                    "Null when no clearly licensed photo exists (initials shown).",
                ),
            sources: z.array(
                z.object({ id: z.string(), title: z.string(), url: z.string() }),
            ),
            page_url: z.string(),
        })
        .describe("A leading voice in actuators or rare-earth magnet supply."),
);

export const PeopleListSchema = named(
    "PeopleList",
    z.object({
        data: z.array(PersonSchema),
        total: z.number(),
        as_of: z.string(),
        criteria: z.array(z.string()),
    }),
);

export const PeopleListParams = z.object({
    domain: z
        .enum(PEOPLE_DOMAINS)
        .optional()
        .describe("research, industry, magnets or policy. Omit for everyone."),
});

const org = (o: ReturnType<typeof affiliations>[number]) => ({
    id: o.id,
    name: o.name,
    url: o.url,
    country: o.country ?? null,
    company_id: o.companyId ?? null,
});

export function serializePerson(p: DirectoryPerson): z.infer<typeof PersonSchema> {
    const [main, ...rest] = affiliations(p);
    return {
        id: p.id,
        name: p.name,
        local_name: p.localName ?? null,
        role: p.role,
        domain: p.domain,
        domain_label: DOMAIN_LABEL[p.domain],
        criterion: CRITERIA[p.criterion],
        why_they_matter: p.whyTheyMatter,
        affiliation: org(main as NonNullable<typeof main>),
        other_affiliations: rest.map(org),
        key_works: p.keyWorks.map((w) => ({ ...w, year: w.year ?? null })),
        links: p.links,
        site_links: crossLinks(p).map((l) => ({
            label: l.label,
            url: absoluteUrl(l.href),
        })),
        headshot: p.headshot
            ? {
                  url: absoluteUrl(p.headshot.path),
                  licence: p.headshot.licence,
                  credit: p.headshot.credit ?? null,
                  source_url: p.headshot.sourceUrl,
              }
            : null,
        sources: p.sources.map((id) => {
            const s = getSource(id);
            return { id, title: s?.title ?? id, url: s?.url ?? "" };
        }),
        page_url: `${absoluteUrl(PEOPLE_PATH)}#${p.id}`,
    };
}

export function peopleList(domain?: PeopleDomain): z.infer<typeof PeopleListSchema> {
    const data = DIRECTORY.filter((p) => !domain || p.domain === domain).map(
        serializePerson,
    );
    return {
        data,
        total: data.length,
        as_of: PEOPLE_AS_OF,
        criteria: Object.values(CRITERIA),
    };
}

export function listPeopleHandler({ url }: ApiContext): Response {
    const { domain } = parseQuery(PeopleListParams, url);
    return json(peopleList(domain));
}

export function getPersonHandler({ params }: ApiContext): Response {
    const id = params.id ?? "";
    const p = getDirectoryPerson(id);
    if (!p)
        throw new ApiError("not_found", {
            detail: `No person with id "${id}".`,
            hint: "List valid ids with GET /api/v1/people.",
        });
    return json(serializePerson(p));
}
