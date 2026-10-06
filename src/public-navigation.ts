// Dependency-neutral navigation shared by runtime HTML and the browser build.
export const PUBLIC_LINKS = [
    ["/", "Leaderboard"],
    ["/robots", "Robot types"],
    ["/all", "All actuators"],
    ["/actuators", "Gallery"],
    ["/compare", "Compare"],
    ["/guides", "Guides"],
    ["/agents", "Agents"],
    ["/faq", "FAQ"],
] as const;

export const FOOTER_GROUPS = [
    { label: "Catalog", links: PUBLIC_LINKS.slice(0, 5) },
    {
        label: "Resources",
        links: [
            ["/guides", "Engineering guides"],
            ["/guides/robot-actuator-selection", "Actuator selection"],
            ["/guides/humanoid-robot-actuators", "Humanoid actuators"],
            ["/tools/motor-torque-calculator", "Motor torque calculator"],
            ["/tools/robot-arm-torque-calculator", "Arm torque calculator"],
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
] as const;

export function publicHeader(path: string): string {
    return `<header class="site-header"><a href="/" class="site-brand" aria-label="actuatorlist home"><span><b>actuator</b>list.com</span><span class="alpha-tag">alpha</span></a><details class="site-menu"><summary aria-label="Menu" aria-controls="public-navigation"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path></svg></summary><nav id="public-navigation" aria-label="Site">${PUBLIC_LINKS.map(([href, label]) => `<a href="${href}"${path === href ? ' aria-current="page"' : ""}>${label}</a>`).join("")}</nav></details></header>`;
}

export function publicFooter(): string {
    return `<footer class="site-footer"><nav aria-label="Footer">${FOOTER_GROUPS.map((group) => `<section><h2>${group.label}</h2>${group.links.map(([href, label]) => `<a href="${href}">${label}</a>`).join("")}</section>`).join("")}</nav></footer>`;
}
