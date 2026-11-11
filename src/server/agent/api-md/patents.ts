import type { ApiContext } from "@/api/http";
import { patentLandscape } from "@/api/patents";
import { pctText } from "@/patents/format";
import { mdLink, mdTable, mdText, sourcesList } from "../md";

// Markdown twin of /api/v1/patents/{technology}.

const pct = (v: number) => pctText(v, 1);

export function getPatentLandscapeMd(ctx: ApiContext): string {
    const v = patentLandscape(ctx);
    const codes = v.cpc_codes.map((c) => [
        `\`${c.code}\``,
        c.filtered ? "yes" : "",
        mdText(c.rationale),
    ]);
    return [
        `# Patent landscape: ${mdText(v.label)}`,
        `${mdText(v.scope)} ${v.families} families since ${v.years[0]}, ${v.assignees} first assignees, top five ${pct(v.top5_share)}. As of ${v.as_of}; priority dates from ${v.incomplete_from} are still being published. Page: ${mdLink("/patents", v.url)}.`,
        codes.length ? mdTable(["CPC", "Filtered", "Rationale"], codes) : "",
        v.title_filter.length
            ? `Title filter: ${v.title_filter.map((s) => `\`${s}\``).join(", ")}${v.co_codes.length ? `; or co-code ${v.co_codes.join(", ")}` : ""}.`
            : "",
        mdTable(
            ["Year", "Families", "Granted", "2+ offices", "US+EP+JP", ""],
            v.per_year.map((y) => [
                String(y.year),
                String(y.families),
                String(y.granted),
                String(y.intl),
                String(y.triadic),
                y.incomplete ? "incomplete" : "",
            ]),
        ),
        `Value vs volume, priority ${v.value.years.join("-")}: ${pct(v.value.rest_intl_share)} of non-Chinese and ${pct(v.value.cn_intl_share)} of Chinese families filed in 2+ offices.`,
        mdTable(
            ["Assignee", "Country", "Families", "2+ offices", "Granted"],
            v.value.assignees.map((a) => [
                mdText(a.name),
                a.country,
                String(a.families),
                pct(a.intl_share),
                String(a.granted),
            ]),
        ),
        `Application areas (CPC co-classification, a proxy for use), share of families; early ${v.area_windows.early.join("-")}, late ${v.area_windows.late.join("-")}:`,
        mdTable(
            ["Area", "Families", "Share", "Early", "Late"],
            v.application_areas.map((a) => [
                a.label,
                String(a.families),
                pct(a.share),
                pct(a.share_early),
                pct(a.share_late),
            ]),
        ),
        mdTable(
            ["Country", "Families"],
            v.by_country.map((c) => [c.country, String(c.families)]),
        ),
        mdTable(
            ["#", "Assignee", "Country", "Families", "Share", "3-year CAGR"],
            v.top_assignees.map((a) => [
                String(a.rank),
                mdText(a.name),
                a.country,
                String(a.families),
                pct(a.share),
                a.cagr_3y === null ? "n/a" : pct(a.cagr_3y),
            ]),
        ),
        v.top_families.length
            ? mdTable(
                  ["Family", "Title", "Assignee", "Priority", "Offices"],
                  v.top_families.map((f) => [
                      mdLink(f.publication_number, f.url),
                      mdText(f.title),
                      mdText(f.assignee),
                      f.priority_date,
                      String(f.jurisdictions),
                  ]),
              )
            : "",
        `Sources:\n\n${sourcesList(v.sources)}`,
    ]
        .filter(Boolean)
        .join("\n\n");
}
