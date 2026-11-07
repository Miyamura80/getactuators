// The /bom routes, apart from the case data so the app's entry chunk can
// route to the pages without bundling their 3D scene specs.
export const BOM_PATH = "/bom";

export const BOM_SLUGS = [
    "optimus-linear",
    "unitree-qdd",
    "harmonic-frameless",
] as const;
export type BomSlug = (typeof BOM_SLUGS)[number];

export function isBomSlug(s: string): s is BomSlug {
    return (BOM_SLUGS as readonly string[]).includes(s);
}

export function bomCasePath(slug: BomSlug): string {
    return `${BOM_PATH}/${slug}`;
}

// The slug of a /bom/<slug> path, or null for the index and anything else.
export function bomSlugOf(pathname: string): BomSlug | null {
    const m = /^\/bom\/([a-z0-9-]+)\/?$/.exec(pathname);
    return m?.[1] && isBomSlug(m[1]) ? m[1] : null;
}
