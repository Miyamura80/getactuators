export interface Page {
    path: string;
    kind: "spa" | "static";
    layout?: "editorial";
    visual?: () => string;
    title: string;
    description: string;
    updatedAt?: string;
    ogType?: "website" | "product" | "article";
    image?: string;
    body: () => string;
    // SPA pages: the Markdown heading from which the body stays visible after
    // React mounts (rendered below #root). Product pages use "## Specifications".
    persistentFrom?: string;
    persistentLabel?: string;
    // Give persistent h2s ids from their text, for in-page links.
    headingIds?: boolean;
    // Fold each persistent h2 section into a <details>, keyed by heading id to
    // the one-line payload shown beside the heading while closed ("{n}" is
    // the section's h3 count). The text stays in the page, one tap away.
    fold?: () => Record<string, string>;
    jsonLd: () => Record<string, unknown>[];
}
