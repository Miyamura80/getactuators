// Canonical public origin. Override with SITE_URL for preview deployments so
// generated absolute URLs (sitemap, manifests) point at the right host.
export const SITE_URL = (process.env.SITE_URL ?? "https://actuatorlist.com").replace(
    /\/$/,
    "",
);

// Deploy environment (dev, staging or prod); read here so staging can branch on it later.
export const DEV_ENV = process.env.DEV_ENV ?? "dev";

export const SITE_NAME = "actuatorlist";

export const SITE_DESCRIPTION =
    "Open, spec-level directory of robot actuators (QDD motors, integrated joints, smart servos, harmonic and cycloidal reducers) and the robots that use them.";

export { REPO_URL } from "../public-navigation";

// License facts, stated once for every surface (pages, markdown twins,
// OpenAPI, JSON-LD). LICENSE and LICENSE-DATA hold the full terms.
export const CODE_LICENSE = { name: "MIT License", spdx: "MIT" } as const;

export const DATA_LICENSE = {
    name: "CC BY 4.0",
    url: "https://creativecommons.org/licenses/by/4.0/",
    credit: "actuatorlist.com (Eito Miyamura)",
} as const;

export const LICENSE_SPLIT = `The code is published under the ${CODE_LICENSE.name} and the dataset under ${DATA_LICENSE.name}.`;

export const LICENSE_EXCLUDES =
    "Product photos, logos and headshots are not covered: they belong to their owners and are shown only for identification.";

export function absoluteUrl(path: string): string {
    return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
