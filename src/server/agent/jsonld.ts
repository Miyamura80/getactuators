import { ACTUATORS, type Actuator } from "@/catalog";
import { REPO_URL, SITE_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl } from "../site";
import { actuatorPath, actuatorSummary, categoryLabel } from "./catalog-md";
import { contributorPeople, personId } from "./contributors";
import { CATALOG_UPDATED_AT } from "./freshness";
import { PATHS } from "./links";
import type { FaqItem } from "./pages-md";
import { productSummary } from "./product-content";

// schema.org JSON-LD builders. Pages combine these into one @graph.

type Node = Record<string, unknown>;

const ORG_ID = `${SITE_URL}/#organization`;
const SITE_ID = `${SITE_URL}/#website`;
const DATASET_ID = `${SITE_URL}/#dataset`;
const MIT = "https://opensource.org/licenses/MIT";
const FREE_OFFER = { "@type": "Offer", price: "0", priceCurrency: "USD" };

export function organization(): Node {
    return {
        "@type": "Organization",
        "@id": ORG_ID,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        logo: absoluteUrl("/favicon.svg"),
        image: absoluteUrl(PATHS.ogImage),
        description: SITE_DESCRIPTION,
        founder: { "@type": "Person", name: "Eito Miyamura" },
        sameAs: [REPO_URL],
        contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer support",
            url: `${REPO_URL}/issues`,
            availableLanguage: "English",
        },
    };
}

export function website(): Node {
    return {
        "@type": "WebSite",
        "@id": SITE_ID,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        description: SITE_DESCRIPTION,
        inLanguage: "en",
        publisher: { "@id": ORG_ID },
        contributor: contributorPeople().map((p) => ({ "@id": personId(p) })),
        potentialAction: {
            "@type": "SearchAction",
            target: {
                "@type": "EntryPoint",
                urlTemplate: `${SITE_URL}/actuators?view=list&q={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
        },
    };
}

export function dataset(): Node {
    return {
        "@type": "Dataset",
        "@id": DATASET_ID,
        name: "actuatorlist robot actuator catalog",
        description: `Specifications of ${ACTUATORS.length} robot actuators (QDD motors, integrated joints, smart servos, harmonic and cycloidal reducers) and the robots that use them: torque, speed, weight, torque density, backlash, price and sources.`,
        url: `${SITE_URL}/actuators`,
        license: MIT,
        isAccessibleForFree: true,
        creator: { "@id": ORG_ID },
        dateModified: CATALOG_UPDATED_AT,
        keywords: [
            "robot actuator",
            "QDD motor",
            "torque density",
            "humanoid",
            "quadruped",
        ],
        variableMeasured: [
            "peak torque (Nm)",
            "rated torque (Nm)",
            "weight (g)",
            "torque density (Nm/kg)",
            "price (USD)",
            "backlash (arcmin)",
        ],
        distribution: [
            {
                "@type": "DataDownload",
                encodingFormat: "application/jsonl",
                contentUrl: absoluteUrl(PATHS.feed),
            },
            {
                "@type": "DataDownload",
                encodingFormat: "application/json",
                contentUrl: absoluteUrl("/api/v1/actuators"),
            },
        ],
    };
}

export function software(): Node[] {
    return [
        {
            "@type": "SoftwareApplication",
            name: SITE_NAME,
            url: `${SITE_URL}/`,
            applicationCategory: "DeveloperApplication",
            operatingSystem: "Web",
            description: SITE_DESCRIPTION,
            offers: FREE_OFFER,
            publisher: { "@id": ORG_ID },
        },
        {
            "@type": "WebAPI",
            name: "actuatorlist REST API",
            description:
                "Anonymous, read-only JSON API over the actuator and robot catalog.",
            url: absoluteUrl(PATHS.apiIndex),
            documentation: absoluteUrl(PATHS.apiDocs),
            offers: FREE_OFFER,
            provider: { "@id": ORG_ID },
        },
    ];
}

// A free in-browser engineering tool (calculator) on its own page.
export function webApplication(path: string, name: string, description: string): Node {
    return {
        "@type": "WebApplication",
        "@id": `${absoluteUrl(path)}#app`,
        name,
        url: absoluteUrl(path),
        description,
        applicationCategory: "EngineeringApplication",
        operatingSystem: "Web",
        isAccessibleForFree: true,
        offers: FREE_OFFER,
        publisher: { "@id": ORG_ID },
    };
}

export function faqPage(items: FaqItem[]): Node {
    return {
        "@type": "FAQPage",
        "@id": `${absoluteUrl("/faq")}#faq`,
        url: absoluteUrl("/faq"),
        mainEntity: items.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
    };
}

export interface Crumb {
    name: string;
    path: string;
}

export function breadcrumbs(crumbs: Crumb[]): Node {
    return {
        "@type": "BreadcrumbList",
        itemListElement: crumbs.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: c.name,
            item: absoluteUrl(c.path),
        })),
    };
}

export function itemList(name: string, list: readonly Actuator[]): Node {
    return {
        "@type": "ItemList",
        name,
        numberOfItems: list.length,
        itemListElement: list.map((a, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: a.name,
            url: absoluteUrl(actuatorPath(a.id)),
        })),
    };
}

export function webPage(type: string, path: string, name: string): Node {
    return {
        "@type": type,
        "@id": `${absoluteUrl(path)}#webpage`,
        url: absoluteUrl(path),
        name,
        isPartOf: { "@id": SITE_ID },
        inLanguage: "en",
        dateModified: CATALOG_UPDATED_AT,
    };
}

export function toAbsolute(url: string): string {
    return /^https?:\/\//.test(url) ? url : absoluteUrl(url);
}

function property(name: string, value: number | null, unitText: string): Node[] {
    if (value === null) return [];
    return [{ "@type": "PropertyValue", name, value, unitText }];
}

export function product(a: Actuator): Node {
    const node: Node = {
        "@type": "Product",
        "@id": `${absoluteUrl(actuatorPath(a.id))}#product`,
        name: a.name,
        sku: a.id,
        brand: { "@type": "Brand", name: a.brand },
        category: categoryLabel(a.category),
        description: actuatorSummary(a),
        url: absoluteUrl(actuatorPath(a.id)),
        additionalProperty: [
            ...property("Peak torque", a.peak_torque_nm, "Nm"),
            ...property("Rated torque", a.rated_torque_nm, "Nm"),
            ...property("Weight", a.weight_g, "g"),
            ...property("Torque density", a.torque_density_nm_per_kg, "Nm/kg"),
            ...property("Max speed", a.max_speed_rpm, "rpm"),
            ...(productSummary(a.id)
                ? []
                : property("Backlash", a.backlash_arcmin, "arcmin")),
        ],
    };
    if (a.image_url) node.image = toAbsolute(a.image_url);
    if (a.country) node.countryOfOrigin = { "@type": "Country", name: a.country };
    if (a.price_usd !== null) {
        node.offers = {
            "@type": "Offer",
            price: String(a.price_usd),
            priceCurrency: "USD",
            url: a.product_url ?? absoluteUrl(actuatorPath(a.id)),
        };
    }
    return node;
}

export function graph(nodes: Node[]): Node {
    return { "@context": "https://schema.org", "@graph": nodes };
}
