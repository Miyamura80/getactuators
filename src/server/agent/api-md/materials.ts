import type { ApiContext } from "@/api/http";
import { metalPrices, metalSupply } from "@/api/metals";
import { processChain } from "@/api/processes";
import { SUPPLY_CHAIN_PAGES_LIVE } from "@/public-navigation";
import { metalListView } from "@/supply-chain/metals/views";
import { processChainListView } from "@/supply-chain/processes/views";
import { STAGE_LABEL, type Stage } from "@/supply-chain/stages";
import { absoluteUrl } from "../../site";
import { toAbsolute } from "../jsonld";
import { bullets, mdLink, mdTable, mdText } from "../md";
import {
    capped,
    country,
    filterSummary,
    idTwin,
    share,
    sourceNotes,
    twinLink,
} from "./shared";

// Markdown twins of the /metals dataset (/api/v1/metals, /metal-prices) and
// the /manufacturing process graphs (/api/v1/processes).

const leader = (code: string | null, x: number | null) =>
    code ? `${mdText(code)} ${share(x)}` : "gap";

const stageLabel = (s: string) => STAGE_LABEL[s as Stage] ?? s;

export function listMetals(): string {
    const list = metalListView();
    const fn = sourceNotes();
    const stages = list.data[0]?.stages.map((s) => stageLabel(s.stage)) ?? [];
    const rows = list.data.map((m) => [
        idTwin(`${m.name} (${m.symbol})`, "metals", m.id),
        m.magnet,
        m.class,
        mdText(m.role),
        ...m.stages.map((s) => leader(s.top_country, s.top_share)),
        fn.ref(m.sources),
    ]);
    return [
        "# Magnet metals",
        "The six metals in an actuator's permanent magnet, with the leading country at each stage. One metal: /api/v1/metals/{element}.md.",
        mdTable(["Metal", "Magnet", "Class", "Role", ...stages, "Sources"], rows),
        "Country shares behind each stage, with their sources, are on each metal's twin.",
        fn.section(),
    ].join("\n\n");
}

export function getMetal(ctx: ApiContext): string {
    const d = metalSupply(ctx);
    const fn = sourceNotes();
    // Cite the role first so footnotes number in reading order.
    const role = `${mdText(d.metal.role)} ${fn.ref(d.metal.sources)}`;
    const stages = d.stages.map((s) => [
        mdText(s.label),
        s.status === "gap"
            ? `gap: ${mdText(s.note ?? "")}`
            : [
                  ...s.shares.map((x) => `${mdText(x.country)} ${share(x.share)}`),
                  ...(s.other_share ? [`other ${share(s.other_share)}`] : []),
              ].join(", "),
        s.hhi === null ? "n/a" : String(Math.round(s.hhi)),
        s.as_of ?? "n/a",
        fn.ref(s.sources),
    ]);
    const r = d.reserves;
    const reserves = r.rows.map((row) => [
        country(row.country),
        fn.value(row.production_2024),
        fn.value(row.production_2025),
        fn.value(row.reserves),
        fn.value(row.years_of_supply),
    ]);
    const prices = d.prices.map((p) => [
        twinLink(p.label, `metal-prices/${p.id}`),
        mdText(p.market_label),
        `${p.latest.date} (${p.latest.basis})`,
        fn.value(p.latest.price),
    ]);
    return [
        `# ${mdText(d.metal.name)} (${mdText(d.metal.symbol)}): who supplies it${filterSummary(ctx.url)}`,
        role,
        bullets([
            `Magnet: ${d.metal.magnet}; class: ${d.metal.class}`,
            `Page: ${mdLink("/metals", absoluteUrl(`/metals?element=${d.metal.id}`))}`,
        ]),
        `## Country shares by stage\n\n${mdTable(["Stage", "Shares", "HHI", "As of", "Sources"], stages)}`,
        `## ${mdText(r.label)}: production and reserves (${mdText(r.basis)})\n\n${mdTable(
            ["Country", "Mine production 2024", "2025", "Reserves", "Years of supply"],
            reserves,
        )}\n\nWorld: ${fn.value(r.world_production_2025)} mined in 2025, ${fn.value(r.world_reserves)} in reserves.`,
        prices.length
            ? `## Latest prices\n\n${mdTable(["Series", "Market", "Date", "Price"], prices)}`
            : "",
        fn.section(),
    ].join("\n\n");
}

const PRICE_ROWS = 120;

export function getMetalPrices(ctx: ApiContext): string {
    const d = metalPrices(ctx);
    const fn = sourceNotes();
    const { rows, note } = capped(d.points, PRICE_ROWS, ctx.url);
    const points = rows.map((p) => [p.date, p.basis, fn.value(p.price)]);
    const events = d.events.map((e) => [
        e.date,
        e.kind,
        `${mdText(e.title)}: ${mdText(e.detail)}`,
        fn.ref(e.sources),
    ]);
    const s = d.series;
    return [
        `# ${mdText(s.label)} price history${filterSummary(ctx.url)}`,
        bullets([
            `Series: \`${s.id}\`, ${s.form} of ${mdText(s.element === "ndpr" ? "NdPr" : s.element.charAt(0).toUpperCase() + s.element.slice(1))}`,
            `Market: ${mdText(s.market_label)}; unit: ${s.unit}`,
        ]),
        points.length
            ? `## Price points\n\n${mdTable(["Date", "Basis", "Price"], points)}`
            : "No price points in this range.",
        note,
        events.length
            ? `## Events\n\n${mdTable(["Date", "Kind", "Event", "Sources"], events)}`
            : "",
        fn.section(),
    ].join("\n\n");
}

export function listProcesses(): string {
    const list = processChainListView();
    const rows = list.results.map((c) => [
        idTwin(c.title, "processes", c.id),
        `\`${c.id}\``,
        mdText(c.product),
        String(c.step_count),
        mdLink(c.url, toAbsolute(c.url)),
    ]);
    return [
        "# Manufacturing process chains",
        `As of ${list.as_of}. One chain, step by step: /api/v1/processes/{chain}.md.`,
        mdTable(["Chain", "Id", "Product", "Steps", "Page"], rows),
    ].join("\n\n");
}

export function getProcess(ctx: ApiContext): string {
    const c = processChain(ctx);
    const fn = sourceNotes();
    const byId = new Map(c.steps.map((s) => [s.id, s]));
    // Upstream and downstream steps, /bom nodes and /metals elements.
    const stepLink = (id: string) =>
        mdLink(byId.get(id)?.label ?? id, toAbsolute(`${c.url}#step=${id}`));
    const bomLive = SUPPLY_CHAIN_PAGES_LIVE.has("/bom");
    const graph = (s: (typeof c.steps)[number]) =>
        [
            s.upstream.length ? `from ${s.upstream.map(stepLink).join(", ")}` : "",
            s.downstream.length ? `to ${s.downstream.map(stepLink).join(", ")}` : "",
            s.bom_node_ids.length
                ? `BOM ${s.bom_node_ids
                      .map((id) =>
                          bomLive
                              ? mdLink(
                                    id,
                                    absoluteUrl(`/bom#node=${encodeURIComponent(id)}`),
                                )
                              : `\`${id}\``,
                      )
                      .join(", ")}`
                : "",
            s.element_ids.length
                ? `metals ${s.element_ids.map((e) => twinLink(e, `metals/${e}`)).join(", ")}`
                : "",
        ]
            .filter(Boolean)
            .join("; ") || "n/a";
    const clusters = c.clusters.map((cl) => {
        const sh = cl.country_shares;
        const shares = sh
            ? `Country shares (${sh.tier ?? "untiered"}): ${sh.shares.map((x) => `${mdText(x.country)} ${share(x.share)}`).join(", ")}${sh.other_share ? `, other ${share(sh.other_share)}` : ""} ${fn.ref(sh.sources)}`
            : "";
        const rows = cl.step_ids.flatMap((id) => {
            const s = byId.get(id);
            if (!s) return [];
            return [
                [
                    mdLink(s.label, toAbsolute(s.url)),
                    mdText(s.caption),
                    mdText(
                        `${s.inputs.join(", ") || "n/a"} to ${s.outputs.join(", ") || "n/a"}`,
                    ),
                    s.key_numbers
                        .map((k) => `${mdText(k.label)} ${fn.value(k.value)}`)
                        .join("; ") || "n/a",
                    s.companies
                        .map((co) => idTwin(co.name, "companies", co.id))
                        .join(", ") || "n/a",
                    graph(s),
                    fn.ref(s.sources),
                ],
            ];
        });
        return [
            `## ${mdText(cl.label)} (${STAGE_LABEL[cl.stage] ?? cl.stage})`,
            shares,
            mdTable(
                [
                    "Step",
                    "What happens",
                    "Inputs to outputs",
                    "Key numbers",
                    "Companies",
                    "Links",
                    "Sources",
                ],
                rows,
            ),
        ]
            .filter(Boolean)
            .join("\n\n");
    });
    const edges = c.edges.map(
        (e) =>
            `${e.from} to ${e.to} (${e.kind}${e.label ? `: ${mdText(e.label)}` : ""})`,
    );
    return [
        `# ${mdText(c.title)}${filterSummary(ctx.url)}`,
        `${mdText(c.product)}. ${c.steps.length} ${c.steps.length === 1 ? "step" : "steps"}, as of ${c.as_of}. Page: ${mdLink(c.url, toAbsolute(c.url))}.`,
        ...clusters,
        edges.length ? `## Edges\n\n${bullets(edges)}` : "",
        fn.section(),
    ].join("\n\n");
}
