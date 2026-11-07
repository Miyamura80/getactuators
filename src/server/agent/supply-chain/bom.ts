import { getActuator } from "@/catalog";
import {
    BOM_AS_OF,
    BOM_CASES,
    BOM_PATH,
    BOM_UPDATED,
    type BomCase,
    bomCasePath,
    flatten,
    marginCapture,
    materialLabel,
    materialPrice,
    materialTotals,
    nodeMetrics,
} from "@/supply-chain/bom";
import { idiotText } from "@/supply-chain/bom/format";
import { formatValue, percentDigits } from "@/supply-chain/format";
import { getCompany } from "@/supply-chain/registry";
import { DATA_LICENSE, SITE_URL, absoluteUrl } from "../../site";
import { actuatorPath } from "../catalog-md";
import * as ld from "../jsonld";
import { mdTable, mdText } from "../md";
import type { Page } from "../page-types";
import { type Footnotes, footnotes } from "./footnotes";

// Markdown twins of /bom and /bom/<slug>: the comparison of the three cases,
// and per case the BOM table (node, qty, mass, cost, idiot index, maker,
// margin), raw materials, margin capture and method; plus Dataset JSON-LD,
// with a Product link when the actuator is in the catalog.

const INDEX_TITLE = "Actuator bills of materials";
const INDEX_DESCRIPTION =
    "Three actuator teardowns (Tesla Optimus roller-screw linear actuator, Unitree quasi-direct-drive motor, strain-wave cobot joint): what is inside, who makes each part, cost against raw material (the idiot index) and who keeps the margin, every number cited.";

const usd = (n: number) => formatValue(n, "USD");
const cents = (n: number) => (n < 1 ? `$${n.toFixed(2)}` : usd(n));

function makerText(
    fn: Footnotes,
    ids: readonly string[] | undefined,
    confidence: string | undefined,
): string {
    const names = (ids ?? []).flatMap((id) => {
        const c = getCompany(id);
        if (!c) return [];
        const gm = c.grossMargin ? `, margin ${fn.value(c.grossMargin)}` : "";
        return [`${mdText(c.name)}${gm}`];
    });
    if (names.length === 0) return "not public";
    const tag =
        confidence === "modeled"
            ? " (typical maker, stands in)"
            : confidence === "estimated"
              ? " (reported by analysts or press)"
              : "";
    return `${names.join("; ")}${tag}`;
}

function bomTable(fn: Footnotes, c: BomCase): string {
    const metrics = nodeMetrics(c);
    const rows = flatten(c.root)
        .filter(({ node }) => node.kind !== "material")
        .map(({ node, depth, count }) => {
            const m = metrics.get(node.id);
            const grams = flatten(node)
                .filter((p) => p.node.material)
                .reduce((s, p) => s + (p.node.material?.massG.value ?? 0) * p.count, 0);
            return [
                `${"· ".repeat(depth)}${mdText(node.label)} (\`${node.id}\`)${node.inferred ? " (inferred)" : ""}${fn.ref(node.sources)}`,
                String(count),
                `${Math.round(grams * count)} g (model)`,
                node.unitCost ? fn.value(node.unitCost) : "not public",
                m?.raw !== undefined ? cents(m.raw * count) : "",
                m?.idiot ? idiotText(m.idiot) : "n/a",
                m?.step ? idiotText(m.step) : "n/a",
                makerText(fn, node.makerIds, node.makerConfidence),
            ];
        });
    return mdTable(
        [
            "Node",
            "Qty",
            "Mass",
            "Unit cost",
            "Raw material",
            "Idiot index",
            "Step",
            "Maker, gross margin",
        ],
        rows,
    );
}

function materialsTable(fn: Footnotes, c: BomCase): string {
    const rows = materialTotals(c).map((t) => {
        const p = materialPrice(t.seriesId, c.month);
        return [
            mdText(materialLabel(t.seriesId)),
            `${t.grams < 1 ? t.grams.toFixed(2) : Math.round(t.grams)} g (model)`,
            p
                ? `${fn.value(p.price)}${p.carried ? " (latest reading carried forward)" : ""}`
                : "n/a",
            cents(t.cost),
        ];
    });
    return mdTable(["Material", "In one actuator", "Price per kg", "Cost"], rows);
}

function marginTable(fn: Footnotes, c: BomCase): string {
    const mc = marginCapture(c);
    const rows = mc.tiers.map((t) => {
        const co = getCompany(t.companyId);
        return [
            `${mdText(co?.name ?? t.companyId)}${t.representative ? " (typical maker)" : ""}`,
            `\`${t.nodeId}\``,
            usd(t.revenue),
            co?.grossMargin ? fn.value(co.grossMargin) : percentDigits(t.grossMargin),
            usd(t.grossProfit),
            percentDigits(t.share),
        ];
    });
    rows.push([
        "Raw material (miners' and mills' margins inside)",
        "",
        cents(mc.raw),
        "",
        "",
        percentDigits(mc.raw / mc.price, 2),
    ]);
    rows.push([
        "Everything else: makers' costs and margins we cannot attribute",
        "",
        usd(mc.other),
        "",
        "",
        percentDigits(mc.other / mc.price),
    ]);
    return mdTable(
        [
            "Who",
            "Tier",
            "Sells in this actuator",
            "Gross margin",
            "Gross profit",
            "Share of price",
        ],
        rows,
    );
}

export function bomCaseBody(c: BomCase): string {
    const fn = footnotes();
    const root = nodeMetrics(c).get(c.root.id);
    const a = c.actuatorId ? getActuator(c.actuatorId) : undefined;
    const table = bomTable(fn, c);
    const mats = materialsTable(fn, c);
    const margins = marginTable(fn, c);
    const price = fn.value(c.price);
    return `# ${mdText(c.name)}

${mdText(c.subject)}. ${mdText(c.why)}

- Price: ${price}. ${mdText(c.volumeAssumption)}
- Raw material in it: ${cents(root?.raw ?? 0)} at ${c.month} prices, so an idiot index of ${root?.idiot ? idiotText(root.idiot) : "n/a"}.
- ${mdText(c.takeaway)}${a ? `\n- Catalog entry: [${mdText(a.name)}](${absoluteUrl(`${actuatorPath(a.id)}.md`)}).` : ""}${c.massG ? `\n- Published mass: ${fn.value(c.massG)}.` : ""}

Interactive page: ${absoluteUrl(bomCasePath(c.slug))} (deep link \`#node=<id>\`). JSON: ${absoluteUrl(`/api/v1/bom/${c.slug}`)}. As of ${BOM_AS_OF}.

## Bill of materials

Unit cost is what the next tier pays for one unit. Raw material and the idiot index cover all units in one actuator. Idiot index is unit cost over raw-material cost; step is unit cost over the cost of its inputs, shown only where every input has a cost. Masses come from our model of each part's geometry, not from a scale. "Typical maker" means the real supplier is not public and a listed maker of that part stands in for its margin.

${table}

## Raw materials

${mats}

## Margin capture

Each tier's gross profit is what it sells into this actuator times its latest company gross margin (a group figure, not a product line). The rest of the price pays for labour, energy, machines and margins of makers we cannot name.

${margins}

## Method

- Costs: ${c.slug === "unitree-qdd" ? "Unitree makes the parts itself and publishes no internal costs, so only the shelf price and raw materials are known." : "the price is split by a published share of each part in an actuator of this type, so every part cost is a model."}
- Raw material: grams from our part geometry times cited densities, priced with /metals for rare earths and cited commodity readings for the rest.
- Magnets: an SH-grade recipe with grain-boundary diffused Dy, from /metals.
- See [/manufacturing](${absoluteUrl("/manufacturing.md")}) for how the magnet is made, and [/bom](${absoluteUrl(`${BOM_PATH}.md`)}) for all three cases.

${fn.section()}`;
}

export function bomIndexBody(): string {
    const fn = footnotes();
    const rows = BOM_CASES.map((c) => {
        const root = nodeMetrics(c).get(c.root.id);
        const mc = marginCapture(c);
        const top = [...mc.tiers].sort((x, y) => y.share - x.share)[0];
        const who = top
            ? `${mdText(getCompany(top.companyId)?.name ?? top.companyId)} ${percentDigits(top.share)}`
            : "not public";
        return [
            `[${mdText(c.name)}](${absoluteUrl(`${bomCasePath(c.slug)}.md`)}) (\`${c.slug}\`)`,
            fn.value(c.price),
            cents(root?.raw ?? 0),
            root?.idiot ? idiotText(root.idiot) : "n/a",
            who,
            mdText(c.takeaway),
        ];
    });
    return `# ${INDEX_TITLE}

${INDEX_DESCRIPTION} As of ${BOM_AS_OF}. Interactive page: ${absoluteUrl(BOM_PATH)}. JSON: ${absoluteUrl("/api/v1/bom")}.

## Cases

${mdTable(["Case", "Price", "Raw material", "Idiot index", "Largest gross profit (share of price)", "Finding"], rows)}

Idiot index is the price over the cost of the raw materials inside, at ${BOM_CASES[0]?.month ?? ""} prices. Most part costs are models from published shares, so read them as estimates.

${fn.section()}`;
}

const crumbsFor = (c?: BomCase) => [
    { name: "Home", path: "/" },
    { name: INDEX_TITLE, path: BOM_PATH },
    ...(c ? [{ name: c.name, path: bomCasePath(c.slug) }] : []),
];

function dataset(c: BomCase): ld.Node {
    const a = c.actuatorId ? getActuator(c.actuatorId) : undefined;
    const path = bomCasePath(c.slug);
    return {
        "@type": "Dataset",
        "@id": `${SITE_URL}${path}#bom`,
        name: `${c.name}: bill of materials`,
        description: `${c.subject}. ${c.takeaway}`,
        url: absoluteUrl(path),
        isAccessibleForFree: true,
        license: DATA_LICENSE.url,
        creditText: DATA_LICENSE.credit,
        dateModified: BOM_UPDATED,
        variableMeasured: [
            "Unit cost (USD)",
            "Raw material cost (USD)",
            "Idiot index",
            "Step multiplier",
            "Gross margin",
            "Mass (g)",
        ],
        ...(a
            ? { about: { "@id": `${absoluteUrl(actuatorPath(a.id))}#product` } }
            : {}),
        distribution: [
            {
                "@type": "DataDownload",
                encodingFormat: "application/json",
                contentUrl: absoluteUrl(`/api/v1/bom/${c.slug}`),
            },
            {
                "@type": "DataDownload",
                encodingFormat: "text/markdown",
                contentUrl: absoluteUrl(`${path}.md`),
            },
        ],
    };
}

export const BOM_INDEX_PAGE: Page = {
    path: BOM_PATH,
    kind: "spa",
    title: INDEX_TITLE,
    description: INDEX_DESCRIPTION,
    body: bomIndexBody,
    updatedAt: BOM_UPDATED,
    jsonLd: () => [
        ld.webPage("CollectionPage", BOM_PATH, INDEX_TITLE),
        ld.breadcrumbs(crumbsFor()),
        ...BOM_CASES.map(dataset),
    ],
};

export const BOM_CASE_PAGES: Page[] = BOM_CASES.map((c) => {
    const a = c.actuatorId ? getActuator(c.actuatorId) : undefined;
    return {
        path: bomCasePath(c.slug),
        kind: "spa",
        title: `${c.name}: bill of materials`,
        description: `${c.subject}: what is inside, who makes each part, cost against raw material and who keeps the margin. ${c.takeaway}`,
        body: () => bomCaseBody(c),
        updatedAt: BOM_UPDATED,
        jsonLd: () => [
            ld.webPage("WebPage", bomCasePath(c.slug), c.name),
            ld.breadcrumbs(crumbsFor(c)),
            dataset(c),
            ...(a ? [ld.product(a)] : []),
        ],
    };
});
