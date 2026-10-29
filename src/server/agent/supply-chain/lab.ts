import { countryFlag } from "@/country-flag";
import { countryName } from "@/country-flag";
import { COMPANIES, SEGMENTS, SEGMENT_LABEL } from "@/supply-chain/companies";
import { concentration, normalizeShares } from "@/supply-chain/concentration";
import { percent } from "@/supply-chain/format";
import { LAB_MINING_HHI, LAB_STAGE_SHARES } from "@/supply-chain/lab-fixtures";
import { labRobotFlow } from "@/supply-chain/lab-kit";
import { sitePins, supplyArcs } from "@/supply-chain/map";
import { marketOf } from "@/supply-chain/market-share";
import { getCompany } from "@/supply-chain/registry";
import { DEMO_SCENES, MAGNET_PRESS_LOOP } from "@/supply-chain/scenes/demos";
import { mdTable, mdText } from "../md";
import { type Footnotes, footnotes } from "./footnotes";
import { worldMapSvg } from "./map-svg";

const flagged = (code: string) => `${countryFlag(code)} ${code}`;

function segmentSection(fn: Footnotes, seg: (typeof SEGMENTS)[number]): string {
    const market = marketOf(seg);
    const companies = COMPANIES.filter((c) => c.segment === seg);
    const rows = companies.map((c) => {
        const s = market?.shares[c.id];
        return [mdText(c.name), flagged(c.hqCountry), s ? fn.value(s) : "-"];
    });
    if (market) {
        const named = Object.values(market.shares).reduce((t, s) => t + s.value, 0);
        rows.push(["Other", "", percent(Math.max(0, 1 - named))]);
    }
    const caption = market
        ? `Share of ${market.market.toLowerCase()}, ${market.asOf}.`
        : "";
    return `### ${SEGMENT_LABEL[seg]}\n\n${caption}\n\n${mdTable(["Company", "Country", "Share"], rows)}`;
}

const MAP_STAGE = "magnet";

function stageShareMap(stage: string): Record<string, number> {
    const row = LAB_STAGE_SHARES.find((r) => r.id === stage);
    if (!row) return {};
    return Object.fromEntries(
        normalizeShares(row.shares.value).countries.map((c) => [c.country, c.share]),
    );
}

// The lab's world map as static SVG for the HTML fallback.
export function supplyChainLabMap(): string {
    return worldMapSvg({
        label: "World share of magnet production by country, with company sites",
        values: stageShareMap(MAP_STAGE),
        max: 1,
        pins: sitePins(),
    });
}

// The map kit and flow kit as tables: what the maps and Sankey draw.
function kitSections(): string {
    const sites = sitePins().map((p) => [
        mdText(p.label),
        SEGMENT_LABEL[p.segment],
        flagged(p.country),
        p.precision,
        `${p.lat.toFixed(2)}, ${p.lon.toFixed(2)}`,
    ]);
    const arcs = supplyArcs().map((a) => [
        `${mdText(a.from.label)} (${a.from.country})`,
        `${mdText(a.to.label)} (${a.to.country})`,
        mdText(a.label),
        a.confidence,
    ]);
    const flow = labRobotFlow();
    const name = new Map(flow.nodes.map((n) => [n.id, n.label]));
    const usd = (v: number) => `$${Math.round(v).toLocaleString("en-US")}`;
    const flows = flow.links.map((l) => [
        mdText(name.get(l.source) ?? l.source),
        mdText(name.get(l.target) ?? l.target),
        usd(l.value),
    ]);
    const shares = Object.entries(stageShareMap(MAP_STAGE))
        .sort((a, b) => b[1] - a[1])
        .map(([iso, v]) => [`${countryName(iso)} (${iso})`, percent(v)]);
    return `## Map kit

World map shaded by each country's share of magnet production.

${mdTable(["Country", "Magnet share"], shares)}

### Sites

Pin shape encodes the segment; a city or region pin is drawn hollow.

${mdTable(["Site", "Segment", "Country", "Pin", "Lat, lon"], sites)}

### Supply links

${mdTable(["From", "To", "What", "Confidence"], arcs)}

## Flow kit

Berkeley Humanoid Lite's cost BOM as a value-added Sankey (from the /humanoids dataset).

${mdTable(["From", "To", "US$"], flows)}`;
}

// The 3D kit demos as text: each assembly's parts in explode order.
function explodeKitSection(): string {
    const scenes = DEMO_SCENES.map(
        (s) => `- **${s.title}**: ${s.parts.map((p) => mdText(p.label)).join(", ")}`,
    );
    const steps = (MAGNET_PRESS_LOOP.steps ?? []).map((s) => s.label).join(" > ");
    return `## 3D explode kit

Generic demo assemblies, not teardowns. Parts in explode order:

${scenes.join("\n")}

Process loop, ${MAGNET_PRESS_LOOP.title.toLowerCase()}: ${steps}.`;
}

// Markdown twin of /lab/supply-chain: the cited kit fixtures as text, with
// footnotes. Noindex and left out of the sitemap and llms.txt.
export function supplyChainLabBody(): string {
    const fn = footnotes();
    const stages = LAB_STAGE_SHARES.map((r) => {
        const c = concentration(r.shares.value);
        return [
            r.label,
            c
                ? `${flagged(c.top.country)} ${r.shares.confidence === "estimated" ? "~" : ""}${percent(c.top.share)}${fn.ref(r.shares.sources)}`
                : "n/a",
            c ? c.hhi.toLocaleString("en-US") : "n/a",
            r.shares.asOf,
        ];
    });
    const values = [
        ["MP Materials revenue", getCompany("mp-materials")?.revenue],
        [
            "China Northern Rare Earth revenue",
            getCompany("china-northern-rare-earth")?.revenue,
        ],
        ["Rare earth mining HHI", LAB_MINING_HHI],
    ] as const;
    return `# Supply-chain kit

Visual QA page for the shared supply-chain components. Not indexed.

## Country share by stage

${mdTable(["Stage", "Top country", "HHI", "As of"], stages)}

## Confidence styles

${values.map(([label, v]) => `- ${label}: ${v ? fn.value(v) : "n/a"}`).join("\n")}

Reported figures are plain; estimates carry "~" and models say so.

## Registry: market share by segment

A dash means no public share was found.

${SEGMENTS.map((seg) => segmentSection(fn, seg)).join("\n\n")}

${kitSections()}
${explodeKitSection()}

${fn.section()}`;
}
