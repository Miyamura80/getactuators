// "Size a joint" on actuator pages renders as one card per tool: the tool's
// line icon, the number the link opens at, and the tool name. The Markdown
// twin keeps the plain list.

const TOOL_ICONS: [string, string][] = [
    ["/tools/motor-torque-calculator", "M5 3v18M12 3v18M19 3v18M3 17 21 7"],
    [
        "/tools/robot-arm-torque-calculator",
        "M3 21h8M7 21v-5l6-6 5 3v4M7 16a1.6 1.6 0 1 0 0 .01M13 10a1.6 1.6 0 1 0 0 .01",
    ],
    [
        "/guides/humanoid-robot-actuators",
        "M12 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM7 9h10M12 9v6M9 21l3-6 3 6M7 9l-2 4M17 9l2 4",
    ],
];

export function withToolCards(html: string): string {
    return html.replace(
        /(<h2[^>]*>Size a joint<\/h2>\s*)<ul>([\s\S]*?)<\/ul>/,
        (_, heading: string, items: string) =>
            `${heading}<ul class="ga-tool-cards">${items.replace(
                /<li><a href="([^"]+)">([^<]+)<\/a>: <strong>([^<]+)<\/strong>\s*([\s\S]*?)<\/li>/g,
                (
                    _m: string,
                    href: string,
                    name: string,
                    figure: string,
                    note: string,
                ) => {
                    const d =
                        TOOL_ICONS.find(([path]) => href.startsWith(path))?.[1] ?? "";
                    return `<li><a class="ga-tool-card" href="${href}"><svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="${d}"/></svg><strong>${figure}</strong><span class="ga-tool-note">${note}</span><span class="ga-tool-name">${name} →</span></a></li>`;
                },
            )}</ul>`,
    );
}
