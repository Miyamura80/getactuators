import { canonicalBrand } from "../lib/brands";
import { CompanyLogo } from "./CompanyLogo";

// A brand's favicon-sized mark beside its name, so a list of parts reads by
// maker at a glance. The mark is the company logo, or its initials without one.
export function BrandBadge({ brand, size = 16 }: { brand: string; size?: number }) {
    return (
        <span className="brand-badge" title={brand}>
            <CompanyLogo name={brand} size={size} />
            <span>{canonicalBrand(brand)}</span>
        </span>
    );
}
