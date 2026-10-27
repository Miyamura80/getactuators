import { ACTUATORS, getActuator } from "@/catalog";
import { compareBody } from "./compare";

import { INVESTORS_PATH } from "@/investors";
import { CONTRIBUTORS_PATH } from "@/people";
import { STARTUPS_PATH } from "@/startups";
import {
    actuatorBody,
    actuatorPath,
    actuatorSummary,
    categoryLabel,
} from "./catalog-md";
import { contributorPeople, contributorsBody, personNode } from "./contributors";
import { EDITORIAL_PAGES } from "./editorial";
import { HUMANOID_GUIDE } from "./humanoid-guide";
import { HUMANOIDS_PAGE } from "./humanoids";
import { investorsBody } from "./investors";
import * as ld from "./jsonld";
import { PATHS } from "./links";
import { agentsBody } from "./manifests";
import { mdDocument } from "./md";
import {
    actuatorsBody,
    faqItems,
    faqSection,
    homeBody,
    robotsBody,
    topBy,
} from "./pages-md";
import { actuatorSeoTitle } from "./seo-titles";
import { startupsBody } from "./startups";
import { HIDDEN_PAGES } from "./supply-chain/pages";
import { TOOL_PAGES } from "./tools";
import { aboutBody, contactBody, privacyBody } from "./trust";

// Every HTML page the site serves, with the metadata and markdown body shared
// by the HTML head, the prerendered root, the .md twin and the sitemap.
//
// "spa" pages are the React app's routes: the server enriches the built shell.
// "static" pages are rendered entirely on the server.

export type { Page } from "./page-types";
import type { Page } from "./page-types";

const HOME: ld.Crumb = { name: "Home", path: "/" };

function sub(
    path: string,
    kind: Page["kind"],
    title: string,
    description: string,
    body: () => string,
    pageType = "CollectionPage",
): Page {
    return {
        path,
        kind,
        title,
        description,
        body,
        jsonLd: () => [
            ld.webPage(pageType, path, title),
            ld.breadcrumbs([HOME, { name: title, path }]),
        ],
    };
}

const STATIC_PAGES: Page[] = [
    sub(
        "/compare",
        "spa",
        "Compare actuators",
        "Pick two to four robot actuators for a visual, shareable specification comparison with source and revision caveats.",
        compareBody,
    ),
    {
        ...sub(
            "/faq",
            "static",
            "Frequently asked questions",
            "Answers about robot actuators, catalog sources and free API access.",
            () => `# Frequently asked questions\n\n${faqSection()}`,
            "FAQPage",
        ),
        jsonLd: () => [
            ld.faqPage(faqItems()),
            ld.breadcrumbs([HOME, { name: "FAQ", path: "/faq" }]),
        ],
    },
    ...EDITORIAL_PAGES,
    HUMANOID_GUIDE,
    ...TOOL_PAGES,
    {
        path: "/",
        kind: "spa",
        title: "actuatorlist: robot actuator leaderboard and spec database",
        description:
            "Compare robot actuators by torque, weight, torque density and price. Browse QDD motors, integrated joints, smart servos and reducers.",
        body: homeBody,
        jsonLd: () => [
            ld.website(),
            ld.organization(),
            ld.dataset(),
            ...ld.software(),
            ld.itemList(
                "Highest torque density actuators",
                topBy("torque_density_nm_per_kg", undefined, 10),
            ),
        ],
    },
    sub(
        "/actuators",
        "spa",
        "All robot actuators",
        `Every actuator in the catalog (${ACTUATORS.length}) as a photo gallery or one sortable table: peak torque, weight, torque density and price.`,
        actuatorsBody,
    ),
    sub(
        "/robots",
        "spa",
        "Robots and the actuators inside them",
        "Which motor sits in each joint of real robot arms and legged robots, linked to actuator specs.",
        robotsBody,
    ),
    {
        ...sub(
            STARTUPS_PATH,
            "spa",
            "Actuator startups",
            "Venture-backed robot actuator and motor startups compared by money raised and reported production volume.",
            startupsBody,
        ),
        image: PATHS.ogStartups,
    },
    {
        ...sub(
            INVESTORS_PATH,
            "spa",
            "Actuator investors",
            "Which of 29 top venture funds have backed actuator makers or robot hardware, and which are still on the sidelines.",
            investorsBody,
        ),
        image: PATHS.ogInvestors,
    },
    HUMANOIDS_PAGE,
    sub(
        PATHS.agentsPage,
        "spa",
        "actuatorlist for AI agents",
        "Connect an AI agent to actuatorlist: MCP server, REST API, markdown twins and llms.txt. No key needed.",
        agentsBody,
        "WebPage",
    ),
    sub(
        "/about",
        "static",
        "About actuatorlist",
        "Who runs actuatorlist, where the actuator data comes from and how it is verified.",
        aboutBody,
        "AboutPage",
    ),
    {
        ...sub(
            CONTRIBUTORS_PATH,
            "spa",
            "Contributors",
            "The people who build actuatorlist, their affiliations and what they contributed, from the repository's git history.",
            contributorsBody,
            "AboutPage",
        ),
        jsonLd: () => [
            ld.webPage("AboutPage", CONTRIBUTORS_PATH, "Contributors"),
            ld.website(),
            ...contributorPeople().map(personNode),
            ld.breadcrumbs([HOME, { name: "Contributors", path: CONTRIBUTORS_PATH }]),
        ],
    },
    sub(
        "/contact",
        "static",
        "Contact actuatorlist",
        "Report wrong actuator data, contribute entries or ask about the API through GitHub.",
        contactBody,
        "ContactPage",
    ),
    sub(
        "/privacy",
        "static",
        "Privacy at actuatorlist",
        "No accounts or advertising: optional opt-in analytics, browser preferences and what happens when you visit actuatorlist.",
        privacyBody,
        "WebPage",
    ),
];

const ALIASES: Record<string, string> = { "/robot": "/robots", "/index.html": "/" };

const byPath = new Map([...STATIC_PAGES, ...HIDDEN_PAGES].map((p) => [p.path, p]));

function actuatorPage(id: string): Page | null {
    const a = getActuator(id);
    if (!a) return null;
    const path = actuatorPath(a.id);
    const title = actuatorSeoTitle(a);
    return {
        path,
        kind: "spa",
        title,
        description:
            a.id === "harmonic-drive-cha-series"
                ? "Harmonic Drive CHA hollow-shaft servo actuator family. Torque, mass and price are unspecified in this catalog; confirm model-specific data."
                : actuatorSummary(a),
        ogType: "product",
        image: a.image_url ?? undefined,
        body: () => actuatorBody(a),
        jsonLd: () => [
            ld.webPage("ItemPage", path, title),
            ld.product(a),
            ld.breadcrumbs([
                HOME,
                { name: "Actuators", path: "/actuators" },
                { name: categoryLabel(a.category), path: "/actuators" },
                { name: a.name, path },
            ]),
        ],
    };
}

// The page served at `pathname`, or null when there is none.
export function findPage(pathname: string): Page | null {
    const path = ALIASES[pathname] ?? pathname;
    const direct = byPath.get(path);
    if (direct) return direct;
    const m = /^\/actuators\/([^/]+)$/.exec(path);
    if (!m?.[1]) return null;
    try {
        return actuatorPage(decodeURIComponent(m[1]));
    } catch {
        return null;
    }
}

// Every indexable page, for the sitemap.
export function allPages(): Page[] {
    const actuators = [...ACTUATORS]
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((a) => actuatorPage(a.id))
        .filter((p): p is Page => p !== null);
    return [...STATIC_PAGES, ...actuators];
}

export function markdownPath(page: Page): string {
    return page.path === "/" ? "/index.md" : `${page.path}.md`;
}

export function pageMarkdown(page: Page): string {
    return mdDocument(
        {
            title: page.title,
            description: page.description,
            canonical: page.path,
            updatedAt: page.updatedAt,
        },
        page.body(),
    );
}

// The page a `.md` URL is the twin of ("/index.md" is the homepage).
export function findPageForMarkdown(pathname: string): Page | null {
    if (!pathname.endsWith(".md")) return null;
    const base = pathname.slice(0, -".md".length);
    return findPage(base === "/index" ? "/" : base);
}
