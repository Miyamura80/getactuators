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
    jsonLd: () => Record<string, unknown>[];
}
