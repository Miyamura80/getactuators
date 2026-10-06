import { canonicalBrand, colorForBrand } from "../lib/brands";

// A brand's favicon-sized mark: its initials on its catalog colour, so a list
// of parts reads by maker at a glance. Drawn, not fetched: no third-party
// logo requests from the page.
export function BrandBadge({ brand, size = 16 }: { brand: string; size?: number }) {
    const name = canonicalBrand(brand);
    const initials = name
        .split(/[\s/-]+/)
        .filter(Boolean)
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
    const color = colorForBrand(brand);
    return (
        <span className="brand-badge" title={brand}>
            <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true">
                <rect x="0.5" y="0.5" width="15" height="15" rx="3" fill={color} />
                <text x="8" y={initials.length > 1 ? 10.8 : 11.6} textAnchor="middle" fontSize={initials.length > 1 ? 7.5 : 10}>
                    {initials}
                </text>
            </svg>
            <span>{name}</span>
        </span>
    );
}
