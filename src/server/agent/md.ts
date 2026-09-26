import { absoluteUrl } from "../site";
import { CATALOG_UPDATED_AT } from "./freshness";

// Shared markdown building blocks. Every served markdown document opens with a
// frontmatter block (title, description, canonical, last-updated) and then an
// H1, so agents get document metadata without scraping.

export interface MdMeta {
    title: string;
    description: string;
    // Canonical path of the page the document describes ("/actuators/x").
    canonical: string;
}

function yamlString(s: string): string {
    return JSON.stringify(s);
}

export function frontmatter(meta: MdMeta): string {
    return [
        "---",
        `title: ${yamlString(meta.title)}`,
        `description: ${yamlString(meta.description)}`,
        `canonical: ${absoluteUrl(meta.canonical)}`,
        `last-updated: ${CATALOG_UPDATED_AT}`,
        "---",
        "",
    ].join("\n");
}

// Frontmatter + body. The body must start with the document's H1.
export function mdDocument(meta: MdMeta, body: string): string {
    return `${frontmatter(meta)}${body.trim()}\n`;
}

// Drop the frontmatter block (used when rendering a markdown body to HTML).
export function stripFrontmatter(md: string): string {
    return md.replace(/^---\n[\s\S]*?\n---\n/, "");
}

// Escape text for a GFM table cell or inline run: pipes split cells, and angle
// brackets and brackets could be read as markup.
export function mdText(s: string): string {
    return s
        .replace(/\\/g, "\\\\")
        .replace(/\|/g, "\\|")
        .replace(/[<>[\]*_`]/g, (c) => `\\${c}`)
        .replace(/\s+/g, " ")
        .trim();
}

export function mdLink(text: string, href: string): string {
    return `[${mdText(text)}](${href})`;
}

export function mdTable(head: string[], rows: string[][]): string {
    const line = (cells: string[]) => `| ${cells.join(" | ")} |`;
    return [line(head), line(head.map(() => "---")), ...rows.map(line)].join("\n");
}

export function bullets(items: string[]): string {
    return items.map((i) => `- ${i}`).join("\n");
}

// Number with unit, or "n/a" for unknown values.
export function num(value: number | null | undefined, unit = "", digits = 1): string {
    if (value === null || value === undefined) return "n/a";
    const rounded = Number.isInteger(value) ? String(value) : value.toFixed(digits);
    return unit ? `${rounded} ${unit}` : rounded;
}

export function usd(value: number | null | undefined): string {
    if (value === null || value === undefined) return "quote only";
    return `$${value.toLocaleString("en-US")}`;
}

export function humanize(slug: string): string {
    return slug.replace(/_/g, " ");
}
