import { ACTUATORS, getActuator } from "@/catalog";
import { queryActuators } from "@/catalog/query";
import { SITE_DESCRIPTION } from "../site";
import {
    actuatorBody,
    actuatorPath,
    actuatorSummary,
    categoryLabel,
} from "./catalog-md";
import * as ld from "./jsonld";
import { PATHS } from "./links";
import { agentsBody } from "./manifests";
import { mdDocument } from "./md";
import { allBody, faqItems, galleryBody, homeBody, robotsBody } from "./pages-md";
import { aboutBody, contactBody, privacyBody } from "./trust";

// Every HTML page the site serves, with the metadata and markdown body shared
// by the HTML head, the prerendered root, the .md twin and the sitemap.
//
// "spa" pages are the React app's routes: the server enriches the built shell.
// "static" pages are rendered entirely on the server.

export interface Page {
    path: string;
    kind: "spa" | "static";
    title: string;
    description: string;
    ogType?: "website" | "product" | "article";
    image?: string;
    body: () => string;
    jsonLd: () => Record<string, unknown>[];
}

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
    {
        path: "/",
        kind: "spa",
        title: "actuatorlist: robot actuator leaderboard and spec database",
        description: `${SITE_DESCRIPTION} Compare torque, weight, torque density and price.`,
        body: homeBody,
        jsonLd: () => [
            ld.website(),
            ld.organization(),
            ld.dataset(),
            ...ld.software(),
            ld.faqPage(faqItems()),
            ld.itemList(
                "Highest torque density actuators",
                queryActuators({ sort: "torque_density_nm_per_kg" }).slice(0, 10),
            ),
        ],
    },
    sub(
        "/all",
        "spa",
        "All robot actuators",
        `Every actuator in the catalog (${ACTUATORS.length}) in one table: peak torque, weight, torque density and price.`,
        allBody,
    ),
    sub(
        "/actuators",
        "spa",
        "Actuator gallery by category",
        "Robot actuators grouped by drive type: QDD, integrated joints, smart servos, harmonic, cycloidal and frameless kits.",
        galleryBody,
    ),
    sub(
        "/robots",
        "spa",
        "Robots and the actuators inside them",
        "Which motor sits in each joint of real robot arms and legged robots, linked to actuator specs.",
        robotsBody,
    ),
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
        "No accounts, no cookies, no analytics: what happens to your data when you visit actuatorlist.",
        privacyBody,
        "WebPage",
    ),
];

const ALIASES: Record<string, string> = { "/robot": "/robots", "/index.html": "/" };

const byPath = new Map(STATIC_PAGES.map((p) => [p.path, p]));

function actuatorPage(id: string): Page | null {
    const a = getActuator(id);
    if (!a) return null;
    const path = actuatorPath(a.id);
    const title = `${a.name} by ${a.brand}: specs, torque and price`;
    return {
        path,
        kind: "spa",
        title,
        description: actuatorSummary(a),
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
        { title: page.title, description: page.description, canonical: page.path },
        page.body(),
    );
}

// The page a `.md` URL is the twin of ("/index.md" is the homepage).
export function findPageForMarkdown(pathname: string): Page | null {
    if (!pathname.endsWith(".md")) return null;
    const base = pathname.slice(0, -".md".length);
    return findPage(base === "/index" ? "/" : base);
}
