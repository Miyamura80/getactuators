import type { Org } from "../../../../src/people";

// An affiliation, shown only as identification. A self-hosted logo is drawn
// as a monochrome silhouette (CSS mask: Graphene Grey, white on card hover)
// so third-party brand colours never fight the HUD palette. Without a logo
// the name itself becomes a mono wordmark.
export function OrgLogo({ org }: { org: Org }) {
    if (!org.logo) {
        return (
            <span className="org-logo org-wordmark" title={org.name}>
                {org.name}
            </span>
        );
    }
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
