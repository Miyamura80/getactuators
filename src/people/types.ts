// Shared people registry: who appears on /contributors (and later /people),
// with a headshot and the logo of their main affiliation.

export const LICENCES = ["consent", "own", "press-kit"] as const;
export type Licence = (typeof LICENCES)[number];

// A self-hosted image. `path` is the served URL; the file lives under
// frontend/public at the same path (frontend/public/people/<id>.webp,
// frontend/public/orgs/<id>.svg). Written by scripts/people-assets.ts.
export interface ImageAsset {
    path: string;
    sourceUrl: string;
    licence: Licence;
    credit?: string;
    // ISO date the source was fetched.
    retrieved: string;
}

// src/people/assets.json: image records keyed by person id and org id.
export interface AssetFile {
    people: Record<string, ImageAsset>;
    orgs: Record<string, ImageAsset>;
}

export type LinkKind = "github" | "web" | "x" | "linkedin" | "scholar";

export interface Org {
    id: string;
    name: string;
    url: string;
    logo?: ImageAsset;
    // src/brands registry id: without a self-hosted logo, the org is drawn
    // with that brand's CompanyLogo tile.
    brandId?: string;
}
