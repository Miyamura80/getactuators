import { ROBOT_CREDIT } from "@/catalog";
import { REPO_URL, absoluteUrl } from "../site";
import { CATALOG_UPDATED_DATE } from "./freshness";
import { PATHS, RATE_LIMIT_PER_MINUTE } from "./links";
import { bullets, mdLink } from "./md";
import { catalogStats } from "./pages-md";

// Bodies of the trust pages (/about, /contact, /privacy). Server-rendered as
// HTML and served as markdown twins from the same text.

const ISSUES_URL = `${REPO_URL}/issues`;

export function aboutBody(): string {
    return [
        "# About actuatorlist",
        `actuatorlist is a free, open directory of robot actuators. It holds ${catalogStats()}. The goal is one place where a robot builder can compare the parts that decide a design (peak torque, weight, torque density, backlash, price) without re-reading the same datasheets for every project.`,
        `## Where the numbers come from\n\nEach entry is compiled from manufacturer product pages, datasheets and retailer listings, and every entry links the sources it was built from. Entries marked verified have been spot-checked against those sources; the rest are labelled unverified until someone checks them. Torque density is peak torque divided by mass, and price per Nm is the public USD price divided by peak torque. The robot joint data (which motor sits in each joint) is credited to ${ROBOT_CREDIT.name} of ${mdLink(ROBOT_CREDIT.org, ROBOT_CREDIT.org_url)}.`,
        `## Independence\n\nThe site carries no advertising and no sponsored placements. Rankings are computed from the published numbers, and anyone can audit them because the dataset, the build scripts and the site code are all public in the ${mdLink("GitHub repository", REPO_URL)} under the MIT License.`,
        `## Who runs it\n\nactuatorlist is maintained by Eito Miyamura and open-source contributors. The catalog was last updated on ${CATALOG_UPDATED_DATE}. Corrections and new entries arrive as GitHub issues and pull requests; see the ${mdLink("contact page", absoluteUrl("/contact"))}.`,
        `## For software and AI agents\n\nThe same data is available as a JSON REST API (${absoluteUrl(PATHS.apiIndex)}), an MCP server (${absoluteUrl(PATHS.mcp)}) and markdown twins of every page. No account or key is needed. Start at ${absoluteUrl(PATHS.llms)}.`,
    ].join("\n\n");
}

export function contactBody(): string {
    return [
        "# Contact actuatorlist",
        "actuatorlist is run in the open, so every channel is on GitHub. There is no sales team, no support desk and no account to log in to: the catalog, API and MCP server are free and anonymous.",
        `## Report wrong data or suggest an actuator\n\nOpen an issue at ${mdLink("GitHub issues", ISSUES_URL)} with the actuator name, the field that is wrong or missing, and a link to the manufacturer page or datasheet that shows the right value. Sources matter more than anything else: entries are only marked verified once the numbers are checked against one.`,
        `## Contribute a fix\n\nThe dataset and the site live in ${mdLink("the repository", REPO_URL)}. Fork it, edit the data, run the checks described in the README, and open a pull request. Maintainers review and squash-merge changes into the main branch.`,
        "## Report a security issue\n\nUse a private GitHub Security Advisory on the repository so the details stay private until a fix ships. If advisories are unavailable, open a regular issue with minimal details and ask for a private channel.",
        `## Integration questions\n\nFor questions about the REST API or MCP server, open an issue too. The API reference is at ${absoluteUrl(PATHS.apiDocs)} and the agent guide at ${absoluteUrl(PATHS.agentsMd)}.`,
    ].join("\n\n");
}

export function privacyBody(): string {
    return [
        "# Privacy at actuatorlist",
        "actuatorlist has no accounts, no sign-up forms, no newsletter and no payments, so it never asks for personal information. This page lists everything that does happen when you visit.",
        `## Cookies and tracking\n\nThe site sets no cookies and runs no analytics, advertising or tracking scripts. The web app does not write to your browser's local storage.`,
        `## Requests to other services\n\n${bullets([
            "Fonts load from Google Fonts (fonts.googleapis.com and fonts.gstatic.com), so Google receives your IP address and browser details when the page loads. See Google's privacy policy for how it handles those requests.",
            "Some robot photos load from the manufacturer's own image host, which receives the same request details.",
            "Links to manufacturer sites, datasheets and GitHub take you to services with their own privacy policies.",
        ])}`,
        `## Server logs and rate limits\n\nThe site is hosted on Railway. The hosting platform may keep standard request logs (IP address, requested URL, user agent, time) for operations and abuse prevention. The API applies a rate limit of ${RATE_LIMIT_PER_MINUTE} requests per minute per IP address; the counter lives in memory and is discarded after the window passes. actuatorlist does not sell, share or profile visitors.`,
        `## Contributions\n\nIf you open an issue or pull request, that happens on GitHub under GitHub's privacy terms and is public.`,
        `## Changes and questions\n\nThis page changes through pull requests to the public repository, so its history is visible there. Questions go to ${mdLink("GitHub issues", ISSUES_URL)}.`,
    ].join("\n\n");
}
