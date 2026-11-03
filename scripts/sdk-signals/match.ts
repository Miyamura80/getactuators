import { SCORED_BRANDS, type SdkBrand } from "@/sdk/brands";
import type { RawPost } from "./common";

// Brand / product matcher: which scored brands a post talks about. Aliases
// match on word boundaries ("odrive" must not hit "robodrive"); an issue filed
// in a brand's own repository is about that brand even if it never names it.

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function aliasPattern(b: SdkBrand): RegExp {
    const alts = b.aliases.map((a) => escapeRe(a).replace(/[-_ ]/g, "[-_ ]?"));
    return new RegExp(`(^|[^a-z0-9])(${alts.join("|")})($|[^a-z0-9])`, "i");
}

const PATTERNS = SCORED_BRANDS.map((b) => ({
    brand: b,
    re: aliasPattern(b),
    repos: new Set(b.repos.map((r) => r.repo.toLowerCase())),
}));

export function matchBrands(p: Pick<RawPost, "title" | "text" | "venue">): string[] {
    const hay = `${p.title}\n${p.text}`;
    const venue = p.venue.toLowerCase();
    return PATTERNS.filter(({ re, repos }) => repos.has(venue) || re.test(hay)).map(
        ({ brand }) => brand.id,
    );
}
