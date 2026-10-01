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
    jsonLd: () => Record<string, unknown>[];
}
