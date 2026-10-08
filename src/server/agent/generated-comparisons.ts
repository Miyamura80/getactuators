import { ACTUATORS, getActuator } from "@/catalog";
import {
    type ComparisonPair,
    comparisonDirectory,
} from "@/catalog/comparison-registry";
import { fieldCaveat } from "@/catalog/evidence";
import { compareBody, compareContent } from "./compare";
import { catalogComparisonLinks } from "./comparison-links";
import { EDITORIAL_PAGES } from "./editorial";
import { markdownToHtml } from "./html/body";
import { esc } from "./html/head";
import { breadcrumbs, webPage } from "./jsonld";
import type { Page } from "./page-types";

const authoredPaths = new Set(EDITORIAL_PAGES.map((page) => page.path));
const registry = comparisonDirectory(ACTUATORS).filter(
    (pair) => !authoredPaths.has(pair.path),
);

function pairPage(pair: ComparisonPair): Page {
    const rows = pair.ids.map((id) => {
        const model = getActuator(id);
        if (!model) throw new Error(`Unknown comparison model: ${id}`);
        return model;
    });
    const [a, b] = rows;
    if (!a || !b) throw new Error("Comparison registry contains an unknown model");
    const title = `${a.name} vs ${b.name}`;
    const description = `Compare ${a.name} and ${b.name}: catalog torque, mass, speed, price and source/revision caveats. Not a matched-condition test or compatibility recommendation.`;
    const differences = (
        [
            ["peak_torque_nm", "Peak torque", "N·m"],
            ["rated_torque_nm", "Rated torque", "N·m"],
            ["max_speed_rpm", "Maximum speed", "rpm"],
            ["weight_g", "Mass", "g"],
        ] as const
    ).flatMap(([field, label, unit]) => {
        const left = a[field];
        const right = b[field];
        if (
            left === null ||
            right === null ||
            !Number.isFinite(left) ||
            !Number.isFinite(right)
        )
            return [];
        const delta = Number((left - right).toFixed(3));
        const caveats = [
            ...new Set([fieldCaveat(a, field), fieldCaveat(b, field)].filter(Boolean)),
        ].join(" ");
        return [
            `${label}: ${a.name} (${left} ${unit}) minus ${b.name} (${right} ${unit}) = ${delta} ${unit}.${caveats ? ` ${caveats}` : ""}`,
        ];
    });
    const related = catalogComparisonLinks(
        pair.ids,
        "Related catalog comparisons",
        pair.path,
    );
    const heading = "Arithmetic from catalog values";
    const limitations =
        "Differences are subtraction of retained catalog values, not measured advantages. Ratings may have different test conditions. Unknown means not documented; manufacturer claims and catalog spot-checks are not independent validation.";
    const sourceLinks = rows.map((row) => ({
        row,
        links: [
            row.product_url
                ? { label: "Catalog-linked product page", url: row.product_url }
                : null,
            row.datasheet_url
                ? { label: "Catalog-linked datasheet", url: row.datasheet_url }
                : null,
        ].filter((link) => link !== null),
    }));
    const arithmeticMd = `## ${heading}\n\n${limitations}\n\n${differences.map((line) => `- ${line}`).join("\n")}`;
    const sourcesMd = sourceLinks
        .map(
            ({ row, links }) =>
                `### ${row.name} / catalog sources\n\n${links.length ? links.map((link) => `[${link.label}](${link.url})`).join(" · ") : "Source link unknown: not documented."}`,
        )
        .join("\n\n");
    const visual = () =>
        `<div class="comparison-document"><h1>${esc(title)}</h1><p>${esc(description)}</p>${compareContent(rows)}<section><h2>${heading}</h2><p>${esc(limitations)}</p><ul>${differences.map((line) => `<li>${esc(line)}</li>`).join("")}</ul></section><section><h2>Catalog source links</h2>${sourceLinks.map(({ row, links }) => `<h3>${esc(row.name)}</h3><p>${links.length ? links.map((link) => `<a href="${esc(link.url)}">${esc(link.label)}</a>`).join(" · ") : "Source link unknown: not documented."}</p>`).join("")}</section>${markdownToHtml(related)}<p><a href="/compare">Browse actuator comparisons</a> · <a href="/actuators">Choose other catalog models</a></p></div>`;
    return {
        path: pair.path,
        kind: "static",
        title,
        description,
        body: () =>
            `${compareBody(`?compare=${pair.ids.join(",")}`).replace("# Compare actuators", `# ${title}`)}\n\n${arithmeticMd}\n\n## Catalog source links\n\n${sourcesMd}\n\n${related}\n\n[Browse actuator comparisons](/compare) · [Choose other catalog models](/actuators)`,
        visual,
        jsonLd: () => [
            webPage("WebPage", pair.path, title),
            breadcrumbs([
                { name: "Home", path: "/" },
                { name: "Compare actuators", path: "/compare" },
                { name: title, path: pair.path },
            ]),
        ],
    };
}

export const GENERATED_COMPARISON_PAGES: Page[] = registry.map(pairPage);
