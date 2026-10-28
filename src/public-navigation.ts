// Dependency-neutral navigation shared by runtime HTML and the browser build.
export const PUBLIC_LINKS = [
    ["/", "Leaderboard"],
    ["/robots", "Robot types"],
    ["/actuators", "Actuators"],
    ["/compare", "Compare"],
    ["/guides", "Guides"],
    ["/agents", "Agents"],
    ["/faq", "FAQ"],
] as const;

// The "Supply chain" menu. Each page appears once its path is in
// SUPPLY_CHAIN_PAGES_LIVE, so the menu grows as the atlas pages merge; with
// nothing live the menu is not rendered at all.
export const SUPPLY_CHAIN_GROUPS = [
    {
        label: "Chain",
        links: [
            ["/metals", "Metals"],
            ["/bom", "Bill of materials"],
            ["/manufacturing", "Manufacturing"],
            ["/alts", "Alternatives"],
        ],
    },
    {
        label: "Countries",
        links: [
            ["/japan", "Japan"],
            ["/china", "China"],
            ["/korea", "Korea"],
            ["/us", "United States"],
        ],
    },
] as const;

export const SUPPLY_CHAIN_PAGES_LIVE: ReadonlySet<string> = new Set<string>([
    "/metals",
]);

export interface SupplyChainMenuLink {
    href: string;
    label: string;
    live: boolean;
}

// Menu groups with live links only, or every planned link (flagged) when
// previewing on /lab/supply-chain. Empty groups are dropped.
export function supplyChainMenu(
    preview = false,
    live: ReadonlySet<string> = SUPPLY_CHAIN_PAGES_LIVE,
): { label: string; links: SupplyChainMenuLink[] }[] {
    return SUPPLY_CHAIN_GROUPS.map((g) => ({
        label: g.label,
        links: g.links
            .map(([href, label]) => ({ href, label, live: live.has(href) }))
            .filter((l) => preview || l.live),
    })).filter((g) => g.links.length > 0);
}

const liveSupplyChain = supplyChainMenu().flatMap((g) =>
    g.links.map((l) => [l.href, l.label] as const),
);

export const FOOTER_GROUPS = [
    { label: "Catalog", links: PUBLIC_LINKS.slice(0, 4) },
    {
        label: "Resources",
        links: [
            ["/guides", "Engineering guides"],
            ["/guides/robot-actuator-selection", "Actuator selection"],
            ["/guides/humanoid-robot-actuators", "Humanoid actuators"],
            ["/tools/motor-torque-calculator", "Motor torque calculator"],
            ["/tools/robot-arm-torque-calculator", "Arm torque calculator"],
            ["/startups", "Actuator startups"],
            ["/investors", "Actuator investors"],
            ["/humanoids", "Humanoid joint map"],
            ["/benchmarks", "Actuator benchmarks"],
            ["/comparisons/cubemars-ak80-9-vs-xiaomi-cybergear", "AK80-9 vs CyberGear"],
            ["/faq", "FAQ"],
            ["/agents", "For AI agents"],
            ["/docs/api", "API documentation"],
            ["/llms.txt", "llms.txt"],
        ],
    },
    {
        label: "Project",
        links: [
            ["/about", "About"],
            ["/contact", "Contact"],
            ["/privacy", "Privacy"],
            ["https://github.com/Miyamura80/getactuators", "GitHub"],
        ],
    },
    ...(liveSupplyChain.length > 0
        ? [{ label: "Supply chain", links: liveSupplyChain }]
        : []),
] as const;

function supplyChainHtml(path: string): string {
    const groups = supplyChainMenu();
    if (groups.length === 0) return "";
    const current = groups.some((g) => g.links.some((l) => l.href === path));
    return `<details class="site-sub"><summary${current ? ' class="is-current"' : ""}>Supply chain</summary><div class="site-sub-panel">${groups.map((g) => `<section><h3>${g.label}</h3>${g.links.map((l) => `<a href="${l.href}"${path === l.href ? ' aria-current="page"' : ""}>${l.label}</a>`).join("")}</section>`).join("")}</div></details>`;
}

export function publicHeader(path: string): string {
    return `<header class="site-header"><a href="/" class="site-brand" aria-label="actuatorlist home"><span><b>actuator</b>list.com</span><span class="alpha-tag">alpha</span></a><details class="site-menu"><summary aria-label="Menu" aria-controls="public-navigation"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path></svg></summary><nav id="public-navigation" aria-label="Site">${PUBLIC_LINKS.map(([href, label]) => `<a href="${href}"${path === href ? ' aria-current="page"' : ""}>${label}</a>`).join("")}${supplyChainHtml(path)}</nav></details></header>`;
}

export function publicFooter(): string {
    return `<footer class="site-footer"><nav aria-label="Footer">${FOOTER_GROUPS.map((group) => `<section><h2>${group.label}</h2>${group.links.map(([href, label]) => `<a href="${href}">${label}</a>`).join("")}</section>`).join("")}</nav></footer>`;
}
