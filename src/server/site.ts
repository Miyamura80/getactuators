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

export const REPO_URL = "https://github.com/Miyamura80/getactuators";

export function absoluteUrl(path: string): string {
    return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
