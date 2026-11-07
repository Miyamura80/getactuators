import { altList, altTech } from "@/api/alts";
import type { ApiContext } from "@/api/http";
import { toAbsolute } from "../jsonld";
import { bullets, mdLink, mdTable, mdText } from "../md";
import { country, filterSummary, idTwin, sourceNotes } from "./shared";

// Markdown twins of /api/v1/alts: alternative actuator technologies.

export function listAlts(ctx: ApiContext): string {
    const list = altList(ctx);
    const fn = sourceNotes();
    const rows = list.results.map((t) => [
        idTwin(t.name, "alts", t.id),
        t.family,
        t.magnets,
        fn.value(t.trl),
        fn.value(t.efficiency),
        fn.value(t.torque_density_nm_per_kg),
        String(t.players.length),
        String(t.deployments.length),
    ]);
    return [
        `# Alternative actuator technologies${filterSummary(ctx.url)}`,
        list.count > 0
            ? `${list.count} technologies, as of ${list.as_of}. Milestones, players, markets and deployments are on each technology's twin and in the JSON.`
            : "No technologies match this query.",
        rows.length
            ? mdTable(
                  [
                      "Technology",
                      "Family",
                      "Magnets",
                      "TRL",
                      "Efficiency",
                      "Torque density (N·m/kg)",
                      "Players",
                      "Deployments",
                  ],
                  rows,
              )
            : "",
        fn.section(),
    ].join("\n\n");
}

// A market cell keeps the publisher's caveat (scope, spread, forecast window),
// as the /alts page twin does.
const withNote = (text: string, note: string | null | undefined): string =>
    note ? `${text}: ${mdText(note)}` : text;

export function getAlt(ctx: ApiContext): string {
    const t = altTech(ctx);
    const fn = sourceNotes();
    const figures = [
        ["Efficiency", t.efficiency],
        ["Specific power (W/kg)", t.specific_power_w_per_kg],
        ["Torque density (N·m/kg)", t.torque_density_nm_per_kg],
        ["Cost (US$/N·m)", t.cost_usd_per_nm],
        ["Rare earth (kg/kW)", t.ree_intensity_kg_per_kw],
    ] as const;
    const facts = [
        `Id: \`${t.id}\`; family: ${t.family}`,
        `Magnets: ${t.magnets}`,
        `Technology readiness: ${fn.value(t.trl)}`,
        ...figures.map(([label, v]) => `${label}: ${fn.value(v)}`),
        ...t.facts.map((f) => `${mdText(f.label)}: ${fn.value(f.value)}`),
        `Page: ${mdLink("/alts", toAbsolute(t.url))}`,
    ];
    const milestones = t.milestones.map((m) => [
        fn.value(m.year),
        m.kind,
        mdText(m.label),
        m.announced ? "announced target" : "happened",
    ]);
    const players = t.players.map((p) => [
        idTwin(p.name, "companies", p.company_id),
        country(p.country),
        p.company_type,
    ]);
    const markets = t.markets.map((m) => [
        mdText(m.label),
        withNote(fn.value(m.revenue_usd), m.revenue_usd.note),
        withNote(fn.value(m.cagr), m.cagr.note),
        m.end_market,
    ]);
    const deployments = t.deployments.map((d) => [
        d.date,
        d.company_id ? idTwin(d.org, "companies", d.company_id) : mdText(d.org),
        mdText(d.product),
        d.status,
        d.place ? mdText(d.place) : country(d.country),
        fn.ref(d.sources),
    ]);
    return [
        `# ${mdText(t.name)}`,
        mdText(t.principle),
        bullets(facts),
        milestones.length
            ? `## Milestones\n\n${mdTable(["Year", "Kind", "Milestone", "Status"], milestones)}`
            : "",
        players.length
            ? `## Players\n\n${mdTable(["Company", "Country", "Type"], players)}`
            : "",
        markets.length
            ? `## Market sizes\n\n${mdTable(["Market", "Revenue", "Growth (CAGR)", "End market"], markets)}`
            : "",
        deployments.length
            ? `## Deployments\n\n${mdTable(["Date", "Organisation", "Product", "Status", "Place", "Sources"], deployments)}`
            : "",
        t.sources.length ? `Further sources: ${fn.ref(t.sources)}` : "",
        fn.section(),
    ].join("\n\n");
}
