import type { benchmarkList } from "@/api/benchmarks";
import { actuatorPage, categoryCounts, compareQuery, robotPage } from "@/api/handlers";
import type { ApiContext } from "@/api/http";
import { findOpenRobot, openRobotQuery } from "@/api/open-robots";
import { sdkBrand, sdkList } from "@/api/sdk";
import { DIMENSION_SHORT, FORUM_LABEL } from "@/sdk";
import { countryListView } from "@/supply-chain/country-pages/views";
import { absoluteUrl } from "../../site";
import { actuatorTable } from "../catalog-md";
import { bullets, mdLink, mdTable, mdText, num, usd } from "../md";
import {
    OPEN_ROBOT_COLUMNS,
    openRobotRow,
    openRobotSection,
} from "../open-source/page";
import { apiMarkdownPath, filterSummary, pageSummary } from "./shared";

// Markdown twins of the catalog endpoints: actuators, robots, facets, open
// robots, measured runs, country pages and SDK scores.

export function listActuators(ctx: ApiContext): string {
    const page = actuatorPage(ctx);
    return [
        `# Actuators${filterSummary(ctx.url)}`,
        pageSummary(page, ctx.url, "actuators"),
        page.data.length > 0 ? actuatorTable(page.data) : "",
    ].join("\n\n");
}

export function compareActuators(ctx: ApiContext): string {
    const results = compareQuery(ctx);
    const found = results.flatMap((r) => (r.actuator ? [r.actuator] : []));
    const missing = results.filter((r) => !r.actuator).map((r) => mdText(r.id));
    return [
        "# Actuator comparison",
        `${found.length} of ${results.length} requested actuators found, in request order.`,
        found.length > 0 ? actuatorTable(found) : "",
        missing.length > 0 ? `## Not found\n\n${bullets(missing)}` : "",
    ].join("\n\n");
}

export function listRobots(ctx: ApiContext): string {
    const page = robotPage(ctx);
    const rows = page.data.map((r) => [
        mdLink(
            r.name,
            absoluteUrl(apiMarkdownPath(`/api/v1/robots/${encodeURIComponent(r.id)}`)),
        ),
        mdText(r.brand),
        num(r.dof),
        num(r.payload_kg, "kg"),
        num(r.weight_kg, "kg", 2),
        usd(r.price_usd),
        String(r.joints.reduce((n, j) => n + j.count, 0)),
    ]);
    return [
        `# Robots${filterSummary(ctx.url)}`,
        pageSummary(page, ctx.url, "robots"),
        rows.length > 0
            ? mdTable(
                  ["Robot", "Brand", "DOF", "Payload", "Weight", "Price", "Joints"],
                  rows,
              )
            : "",
    ].join("\n\n");
}

export function listCategories(): string {
    const rows = categoryCounts().map((c) => [
        mdLink(
            c.label,
            absoluteUrl(apiMarkdownPath("/api/v1/actuators", `category=${c.slug}`)),
        ),
        `\`${c.slug}\``,
        String(c.actuator_count),
        mdText(c.description),
    ]);
    return [
        "# Actuator categories",
        "Use a slug as the `category` filter on /api/v1/actuators.",
        mdTable(["Category", "Slug", "Actuators", "Description"], rows),
    ].join("\n\n");
}

export function namedCounts(
    title: string,
    filter: string,
    list: { name: string; actuator_count: number }[],
): string {
    const rows = list.map((b) => [
        mdLink(
            b.name,
            absoluteUrl(
                apiMarkdownPath(
                    "/api/v1/actuators",
                    `${filter}=${encodeURIComponent(b.name)}`,
                ),
            ),
        ),
        String(b.actuator_count),
    ]);
    return [
        `# ${title}`,
        `Use a name as the \`${filter}\` filter on /api/v1/actuators.`,
        mdTable(["Name", "Actuators"], rows),
    ].join("\n\n");
}

export function listOpenRobots(ctx: ApiContext): string {
    const robots = openRobotQuery(ctx);
    return [
        `# Open-source robots${filterSummary(ctx.url)}`,
        robots.length > 0
            ? `${robots.length} robots. One robot: /api/v1/open-robots/{id}.md`
            : "No robots match this query.",
        robots.length > 0 ? mdTable(OPEN_ROBOT_COLUMNS, robots.map(openRobotRow)) : "",
    ].join("\n\n");
}

export function getOpenRobot(ctx: ApiContext): string {
    const r = findOpenRobot(ctx);
    const joints = r.joints.map((j) => [
        mdText(j.role),
        String(j.count),
        mdText(`${j.brand} ${j.name}`),
        j.actuatorId
            ? mdLink(j.actuatorId, absoluteUrl(`/actuators/${j.actuatorId}`))
            : "unlisted",
    ]);
    return [
        openRobotSection(r).replace(/^### /, "# "),
        joints.length > 0
            ? `## Joints\n\n${mdTable(["Role", "Count", "Actuator", "Catalog"], joints)}`
            : "",
    ].join("\n\n");
}

type BenchmarkList = ReturnType<typeof benchmarkList>;

export function benchmarkRuns(title: string, list: BenchmarkList): string {
    const ratio = (
        v: BenchmarkList["results"][number]["vs_datasheet"]["peak_torque"],
    ) => (v ? `${num(v.measured, "N·m")} (${v.ratio.toFixed(2)}x)` : "n/a");
    const rows = list.results.map((r) => [
        mdLink(`${r.actuator_id}/${r.run_id}`, r.url),
        r.date,
        `${r.origin}${r.source_kind ? ` (${r.source_kind})` : ""}${r.other_revision ? ", other revision" : r.not_ranked ? ", not ranked" : ""}`,
        r.data_method,
        mdText(r.groups.join(", ")),
        ratio(r.vs_datasheet.peak_torque),
        num(r.continuous_torque_nm, "N·m"),
        r.source
            ? mdLink(r.source.title, r.source.url)
            : `@${r.submitter ?? "unknown"}`,
    ]);
    return [
        `# ${title}`,
        `${list.total} runs on ${list.actuators} actuators, as of ${list.as_of}. Curves, uncertainties and notes are in the JSON; protocol: ${list.protocol_url}.`,
        rows.length > 0
            ? mdTable(
                  [
                      "Run",
                      "Date",
                      "Origin",
                      "Method",
                      "Groups",
                      "Peak vs datasheet",
                      "Continuous",
                      "Source",
                  ],
                  rows,
              )
            : "No runs match this query.",
    ].join("\n\n");
}

export function listCountries(): string {
    const list = countryListView();
    const rows = list.results.map((c) => [
        mdLink(c.name, absoluteUrl(apiMarkdownPath(`/api/v1/countries/${c.code}`))),
        `\`${c.code}\``,
        mdLink(c.url, absoluteUrl(`${c.url}.md`)),
        String(c.coverage.companies),
        String(c.coverage.sites),
        `${c.coverage.links} (${c.coverage.supply_links} supply)`,
    ]);
    return [
        "# Country pages",
        `Live country pages of the actuator supply-chain atlas, as of ${mdText(list.as_of)}. Use a code or slug with /api/v1/countries/{code}.`,
        mdTable(["Country", "Code", "Page", "Companies", "Sites", "Links"], rows),
    ].join("\n\n");
}

const pct = (x: number) => `${Math.round(x * 100)}%`;

export function sdkScores(ctx: ApiContext): string {
    const list = sdkList(ctx);
    const rows = list.results.map((r) => [
        String(r.rank),
        mdLink(
            r.name,
            absoluteUrl(apiMarkdownPath(`/api/v1/sdk/${r.id}`, ctx.url.search)),
        ),
        `\`${r.id}\``,
        String(Math.round(r.overall)),
        ...r.dimensions.map(
            (d) => `${DIMENSION_SHORT[d.dimension]} ${Math.round(d.score)}`,
        ),
    ]);
    const agreement = list.method.agreement
        .map((a) =>
            a.gold_items === 0
                ? `${DIMENSION_SHORT[a.dimension]} n/a (0 gold claims)`
                : `${DIMENSION_SHORT[a.dimension]} ${pct(a.agreement)} (${a.gold_items} gold claims)`,
        )
        .join(", ");
    return [
        `# Actuator SDK scores (${list.preset} preset)`,
        `${list.total} brands, as of ${list.as_of}. Method, checks and evidence: ${absoluteUrl("/sdk.md")}. Label agreement with ${list.method.gold_items} gold posts: ${agreement}.`,
        mdTable(
            ["#", "Brand", "Id", "Overall", "Dimensions"],
            rows.map((r) => [...r.slice(0, 4), r.slice(4).join(", ")]),
        ),
        list.unscored.length
            ? `Not scored: ${list.unscored.map((u) => `${mdText(u.name)} (\`${u.id}\`)`).join(", ")}.`
            : "",
    ].join("\n\n");
}

export function sdkBrandBody(ctx: ApiContext): string {
    const b = sdkBrand(ctx);
    const dims = b.dimensions.map((d) => [
        d.label,
        String(Math.round(d.score)),
        d.objective === null ? "n/a" : `${Math.round(d.objective)}%`,
        `${d.positive} / ${d.negative}`,
    ]);
    const checks = b.checks.map(
        (c) =>
            `${DIMENSION_SHORT[c.dimension]}: ${c.value === 1 ? "yes" : c.value === 0.5 ? "partly" : "no"}, ${mdText(c.label)} (${c.sources.map((s) => mdLink(s.title, s.url)).join(", ")})`,
    );
    const evidence = b.evidence.map(
        (e) =>
            `${e.date}, ${FORUM_LABEL[e.forum]} ${mdText(e.venue)}, ${DIMENSION_SHORT[e.dimension]}, ${e.polarity}: ${mdText(e.claim)} ${e.url}`,
    );
    return [
        `# ${mdText(b.name)} SDK score: ${Math.round(b.overall)}`,
        `Rank ${b.rank}, ${b.confidence} confidence, ${b.evidence_count} evidence items. Page: ${b.url}.`,
        mdTable(["Dimension", "Score", "Checks", "Posts + / -"], dims),
        checks.length ? `## Checks\n\n${bullets(checks)}` : "",
        evidence.length
            ? `## Evidence (${evidence.length}, newest first)\n\n${bullets(evidence)}`
            : "",
    ].join("\n\n");
}
