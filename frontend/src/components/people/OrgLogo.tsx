import type { Org } from "../../../../src/people";
import { CompanyLogo } from "../CompanyLogo";

// An affiliation, shown only as identification. A self-hosted logo is drawn
// as a monochrome silhouette (CSS mask: Graphene Grey, white on card hover)
// so third-party brand colours never fight the HUD palette. An org that is
// also in the brand registry (src/brands) reuses that CompanyLogo tile.
// Otherwise the name itself becomes a mono wordmark.
export function OrgLogo({ org }: { org: Org }) {
    if (org.logo) {
        return (
            <span className="org-logo">
                <i
                    className="org-mark"
                    role="img"
                    aria-label={`${org.name} logo`}
                    style={{ maskImage: `url(${org.logo.path})`, WebkitMaskImage: `url(${org.logo.path})` }}
                />
                <span className="org-name">{org.name}</span>
            </span>
        );
    }
    if (org.brandId) {
        return (
            <span className="org-logo">
                <CompanyLogo name={org.brandId} size={18} />
                <span className="org-name">{org.name}</span>
            </span>
        );
    }
    return (
        <span className="org-logo org-wordmark" title={org.name}>
            {org.name}
        </span>
    );
}
