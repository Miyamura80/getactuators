import { absoluteUrl } from "../site";
import { CATALOG_UPDATED_AT } from "./freshness";

// Shared markdown building blocks. Page twins open with a frontmatter block
// (title, description, canonical, last-updated) and then an H1, so agents get
// document metadata without scraping. Standalone agent documents (agents.md,
// auth.md, pricing.md) are read by checkers that expect the very first line to
// be an H1, so they carry the same metadata in a trailing line instead.

export interface MdMeta {
    title: string;
    description: string;
    // Canonical path of the page the document describes ("/actuators/x").
    canonical: string;
    updatedAt?: string;
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
        `last-updated: ${meta.updatedAt ?? CATALOG_UPDATED_AT}`,
        "---",
        "",
    ].join("\n");
}

// Frontmatter + body. The body must start with the document's H1.
export function mdDocument(meta: MdMeta, body: string): string {
    return `${frontmatter(meta)}${body.trim()}\n`;
}

// Body first (its first line must be the H1), then a metadata footer. No
// frontmatter, so the response opens with "# ".
export function mdStandalone(meta: MdMeta, body: string): string {
    const text = body.trim();
    if (!text.startsWith("# "))
        throw new Error(`${meta.canonical}: body must start with an H1`);
    const footer = `Canonical: ${absoluteUrl(meta.canonical)}. Last updated: ${CATALOG_UPDATED_AT}.`;
    return `${text}\n\n${footer}\n`;
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
