import { ACTUATORS, type Actuator, CATEGORIES, ROBOTS } from "@/catalog";
import { listBrands, queryActuators } from "@/catalog/query";
import { REPO_URL, absoluteUrl } from "../site";
import { actuatorLabel, actuatorPath, actuatorTable, robotSection } from "./catalog-md";
import { PATHS } from "./links";
import { bullets, mdLink, mdText, num, usd } from "./md";

// Markdown bodies for the SPA pages (/, /all, /actuators, /robots). The same
// text is rendered into the HTML shell as prerendered content, so crawlers
// without JavaScript and agents reading markdown see identical facts.

export interface FaqItem {
    q: string;
    a: string;
}

// Rankings list verified entries only: an unchecked spec must not headline a
// list. Unverified entries stay in the tables, gallery and API.
export function topBy(
    field: "torque_density_nm_per_kg",
    useCase?: string,
    n = 5,
): Actuator[] {
    return queryActuators({ sort: field, order: "desc", use_case: useCase })
        .filter((a) => a.verified && a[field] !== null)
        .slice(0, n);
}

function cheapestPerNm(n = 5): Actuator[] {
    return queryActuators({ sort: "price_per_nm", order: "asc" })
        .filter((a) => a.verified && a.price_per_nm !== null)
        .slice(0, n);
}

function names(list: Actuator[]): string {
    return list.map(actuatorLabel).join(", ");
}

export function catalogStats(): string {
    return `${ACTUATORS.length} actuators from ${listBrands().length} brands in ${CATEGORIES.length} categories, plus ${ROBOTS.length} robots with the motor in each joint`;
}

export function faqItems(): FaqItem[] {
    return [
        {
            q: "What is actuatorlist?",
            a: `A free, open directory of robot actuators: ${catalogStats()}. Every entry lists peak and rated torque, weight, torque density, price where public, and the sources the numbers came from.`,
        },
        {
            q: "Which actuators suit a quadruped leg?",
            a: `Usually quasi-direct-drive (QDD) motors or low-ratio integrated joints, because they are backdrivable and survive impacts. Among entries tagged for quadruped legs, the highest torque density belongs to ${names(topBy("torque_density_nm_per_kg", "quadruped_leg", 3))}.`,
        },
        {
            q: "Which actuators suit a humanoid joint?",
            a: `Integrated joints and QDD motors with enough peak torque for hips and knees. Among entries tagged for humanoid joints, the highest torque density belongs to ${names(topBy("torque_density_nm_per_kg", "humanoid_joint", 3))}.`,
        },
        {
            q: "Which actuators give the most torque per dollar?",
            a: `Among entries with a public USD price, the lowest price per Nm of peak torque belongs to ${names(cheapestPerNm(3))}.`,
        },
        {
            q: "How reliable are the specs?",
            a: "Each entry links its sources. Entries marked verified were spot-checked against manufacturer pages or datasheets; the rest are flagged unverified. Confirm critical numbers against the datasheet before you buy.",
        },
        {
            q: "Do I need an account or API key?",
            a: `No. The site, the REST API at ${absoluteUrl(PATHS.apiIndex)} and the MCP server at ${absoluteUrl(PATHS.mcp)} are public and read-only. There are no accounts, no keys and no fees.`,
        },
        {
            q: "How do I add or correct an actuator?",
            a: `Open an issue or a pull request on GitHub at ${REPO_URL}. The dataset lives in the repository and is published under the MIT License.`,
        },
    ];
}

export function faqSection(): string {
    return faqItems()
        .map((f) => `### ${f.q}\n\n${mdText(f.a)}`)
        .join("\n\n");
}

function categorySection(): string {
    return bullets(
        CATEGORIES.map((c) => {
            const count = ACTUATORS.filter((a) => a.category === c.slug).length;
            return `**${c.label}** (${count}): ${c.description}`;
        }),
    );
}

export function homeBody(): string {
    const densest = topBy("torque_density_nm_per_kg", undefined, 10);
    const value = cheapestPerNm(5);
    return [
        "# actuatorlist: compare robot actuators by torque, weight and price",
        `actuatorlist is an independent, open catalog of the actuators that move robots: quasi-direct-drive motors, integrated joints, smart servos, harmonic and cycloidal reducers, and frameless motor kits. It holds ${catalogStats()}. Robot builders use it to shortlist actuators for quadruped legs, humanoid joints and robot arms by the numbers that decide a build: peak torque, weight, torque density and price.`,
        `## Browse the catalog\n\n${bullets([
            `${mdLink("Leaderboard", absoluteUrl("/"))}: torque density rankings and a torque versus cost scatter.`,
            `${mdLink("All actuators", absoluteUrl("/all"))}: every entry in one sortable table.`,
            `${mdLink("Actuator gallery", absoluteUrl("/actuators"))}: photos and spec cards by category.`,
            `${mdLink("Robots", absoluteUrl("/robots"))}: which motors sit in each joint of real robots.`,
            `${mdLink("For AI agents", absoluteUrl(PATHS.agentsPage))}: REST API, MCP server and markdown views.`,
        ])}`,
        `## Actuator categories\n\n${categorySection()}`,
        `## Highest torque density\n\n${actuatorTable(densest)}`,
        `## Lowest price per Nm\n\n${bullets(
            value.map(
                (a) =>
                    `${mdLink(actuatorLabel(a), absoluteUrl(actuatorPath(a.id)))}: $${num(a.price_per_nm, "", 2)} per Nm, ${usd(a.price_usd)}`,
            ),
        )}`,
        `## Robots in the catalog\n\n${bullets(ROBOTS.map((r) => `${mdText(r.name)} by ${mdText(r.brand)}: ${r.dof} DOF, ${usd(r.price_usd)}`))}`,
        `## For AI agents\n\n${bullets([
            `Index for language models: ${absoluteUrl(PATHS.llms)}`,
            `REST API (JSON, no key): ${absoluteUrl(PATHS.apiIndex)}, spec at ${absoluteUrl(PATHS.openapi)}`,
            `MCP server (Streamable HTTP, no auth): ${absoluteUrl(PATHS.mcp)}`,
            "Every page has a markdown twin: append .md or send Accept: text/markdown.",
        ])}`,
    ].join("\n\n");
}

export function allBody(): string {
    const list = [...ACTUATORS].sort((a, b) => a.name.localeCompare(b.name));
    return [
        "# All robot actuators",
        `Every actuator in the actuatorlist catalog (${ACTUATORS.length} entries), alphabetical. Unknown values read n/a; price reads quote only when no public USD price exists. Follow a name for the full spec sheet.`,
        actuatorTable(list),
    ].join("\n\n");
}

export function galleryBody(): string {
    const sections = CATEGORIES.map((c) => {
        const list = ACTUATORS.filter((a) => a.category === c.slug).sort(
            (a, b) => (b.peak_torque_nm ?? -1) - (a.peak_torque_nm ?? -1),
        );
        return `## ${c.label}\n\n${c.description}\n\n${bullets(
            list.map(
                (a) =>
                    `${mdLink(actuatorLabel(a), absoluteUrl(actuatorPath(a.id)))}: ${num(a.peak_torque_nm, "Nm")} peak, ${num(a.weight_g, "g", 0)}`,
            ),
        )}`;
    });
    return [
        "# Actuator gallery by category",
        `The ${ACTUATORS.length} actuators in the catalog grouped by drive type, heaviest hitters first.`,
        ...sections,
    ].join("\n\n");
}

export function robotsBody(): string {
    return [
        "# Robots and the actuators inside them",
        `${ROBOTS.length} robots with the motor used in each joint, linked to the actuator spec sheet where the catalog has one. Use it to see which parts real builds rely on.`,
        ...ROBOTS.map((r) => robotSection(r)),
    ].join("\n\n");
}
