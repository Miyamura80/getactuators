import type { ApiContext } from "@/api/http";
import { policyList, policyMeasure } from "@/api/policy";
import { companyDetail, companyPage, sitePage } from "@/api/supply-chain";
import { getCompany as registryCompany } from "@/supply-chain/registry";
import { toAbsolute } from "../jsonld";
import { bullets, mdLink, mdTable, mdText } from "../md";
import {
    capped,
    country,
    filterSummary,
    idTwin,
    orNa,
    pageSummary,
    sourceNotes,
    stageList,
} from "./shared";

// Markdown twins of the supply-chain registry (/api/v1/companies, /sites) and
// the policy dataset (/api/v1/policy).

// A registry company by id, linked to its twin and named when known.
const companyTwin = (id: string, name = registryCompany(id)?.name ?? id) =>
    idTwin(name, "companies", id);

export function listCompanies(ctx: ApiContext): string {
    const page = companyPage(ctx);
    const fn = sourceNotes();
    const rows = page.data.map((c) => [
        companyTwin(c.id, c.name),
        country(c.hq_country),
        mdText(c.segment),
        stageList(c.stages),
        fn.value(c.revenue_usd),
        String(c.site_count),
    ]);
    return [
        `# Supply-chain companies${filterSummary(ctx.url)}`,
        pageSummary(page, ctx.url, "companies"),
        rows.length > 0
            ? mdTable(["Company", "HQ", "Segment", "Stages", "Revenue", "Sites"], rows)
            : "",
        fn.section(),
    ].join("\n\n");
}

type Link = ReturnType<typeof companyDetail>["supplies"][number];

function linkRows(links: readonly Link[], side: "from" | "to", fn = sourceNotes()) {
    return links.map((l) => [
        companyTwin(l[side]),
        mdText(l.what),
        l.kind,
        l.confidence,
        l.ended ? `ended ${l.ended}` : "active",
        fn.ref(l.sources),
    ]);
}

export function getCompany(ctx: ApiContext): string {
    const d = companyDetail(ctx);
    const c = d.company;
    const fn = sourceNotes();
    const own = c.ownership;
    const facts = [
        `Id: \`${c.id}\``,
        `Headquarters: ${country(c.hq_country)}`,
        `Segment: ${mdText(c.segment)}`,
        `Stages: ${stageList(c.stages)}`,
        own
            ? `Ownership: ${mdText(own.kind)}${own.ticker ? `, ticker ${mdText(own.ticker)}` : ""}${own.parent ? `, parent ${mdText(own.parent)}` : ""}`
            : "",
        c.revenue_usd
            ? `Revenue: ${fn.value(c.revenue_usd)} (${c.revenue_usd.as_of})`
            : "",
        c.gross_margin ? `Gross margin: ${fn.value(c.gross_margin)}` : "",
        c.products.length ? `Products: ${mdText(c.products.join(", "))}` : "",
        `Website: ${c.url}`,
        d.sources.length ? `Profile sources: ${fn.ref(d.sources)}` : "",
    ].filter(Boolean);
    const sites = d.sites.map((s) => [
        mdText(s.name),
        s.kind,
        country(s.country),
        orNa(s.admin1),
        stageList(s.stages),
        fn.value(s.capacity),
        s.status ?? "n/a",
        fn.ref(s.sources),
    ]);
    const linkHead = ["Company", "What", "Kind", "Confidence", "Status", "Sources"];
    return [
        `# ${mdText(c.name)}${c.local_name ? ` (${mdText(c.local_name)})` : ""}`,
        bullets(facts),
        sites.length
            ? `## Sites\n\n${mdTable(["Site", "Kind", "Country", "Region", "Stages", "Capacity", "Status", "Sources"], sites)}`
            : "",
        d.supplies.length
            ? `## Supplies\n\n${mdTable(linkHead, linkRows(d.supplies, "to", fn))}`
            : "",
        d.buys.length
            ? `## Buys from\n\n${mdTable(linkHead, linkRows(d.buys, "from", fn))}`
            : "",
        fn.section(),
    ].join("\n\n");
}

export function listSites(ctx: ApiContext): string {
    const page = sitePage(ctx);
    const fn = sourceNotes();
    const rows = page.data.map((s) => [
        mdText(s.name),
        companyTwin(s.company_id),
        s.kind,
        country(s.country),
        `${s.lat.toFixed(2)}, ${s.lon.toFixed(2)} (${s.precision})`,
        stageList(s.stages),
        s.status ?? "n/a",
        fn.ref(s.sources),
    ]);
    return [
        `# Supply-chain sites${filterSummary(ctx.url)}`,
        pageSummary(page, ctx.url, "sites"),
        rows.length > 0
            ? mdTable(
                  [
                      "Site",
                      "Company",
                      "Kind",
                      "Country",
                      "Lat, lon",
                      "Stages",
                      "Status",
                      "Sources",
                  ],
                  rows,
              )
            : "",
        fn.section(),
    ].join("\n\n");
}

const POLICY_ROWS = 60;

export function listPolicy(ctx: ApiContext): string {
    const list = policyList(ctx);
    const { rows, note } = capped(list.results, POLICY_ROWS, ctx.url);
    const table = rows.map((m) => [
        idTwin(m.title, "policy", m.id),
        mdText(m.jurisdiction),
        mdText(m.type_label),
        m.status,
        m.effective ?? m.announced ?? "n/a",
        stageList(m.stages),
    ]);
    return [
        `# Policy measures${filterSummary(ctx.url)}`,
        list.total > 0
            ? `${list.total} measures, oldest first, as of ${list.as_of}. Summaries, status histories and sources are on each measure's twin and in the JSON.`
            : "No measures match this query.",
        table.length
            ? mdTable(
                  ["Measure", "Jurisdiction", "Type", "Status", "Effective", "Stages"],
                  table,
              )
            : "",
        note,
    ].join("\n\n");
}

export function getPolicy(ctx: ApiContext): string {
    const m = policyMeasure(ctx);
    const fn = sourceNotes();
    const facts = [
        `Id: \`${m.id}\``,
        `Jurisdiction: ${country(m.jurisdiction)}`,
        `Type: ${mdText(m.type_label)}, scope ${m.scope}`,
        `Issuer: ${mdText(m.issuer)}`,
        `Status: ${m.status}`,
        `Announced: ${m.announced ?? "n/a"}; effective: ${m.effective ?? "n/a"}; expires: ${m.expires ?? "n/a"}`,
        `Stages: ${stageList(m.stages)}`,
        m.hs_codes.length ? `HS codes: ${mdText(m.hs_codes.join(", "))}` : "",
        m.elements.length ? `Elements: ${mdText(m.elements.join(", "))}` : "",
        m.amount_usd ? `Amount: ${fn.value(m.amount_usd)}` : "",
        `Page: ${mdLink("/policy", toAbsolute(m.url))}`,
        `Sources: ${fn.ref(m.sources)}`,
    ].filter(Boolean);
    const history = m.status_history.map((h) => [
        h.date,
        h.status,
        orNa(h.note),
        fn.ref(h.sources),
    ]);
    const companies = m.companies_affected.map((c) =>
        c.company_id ? companyTwin(c.company_id, c.name) : mdText(c.name),
    );
    return [
        `# ${mdText(m.title)}`,
        mdText(m.summary),
        bullets(facts),
        history.length
            ? `## Status history\n\n${mdTable(["Date", "Status", "Note", "Sources"], history)}`
            : "",
        companies.length ? `## Companies affected\n\n${bullets(companies)}` : "",
        fn.section(),
    ].join("\n\n");
}
