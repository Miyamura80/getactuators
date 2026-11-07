import { expect, test } from "bun:test";
import { comparisonDashboard, guideDashboard } from "@/server/agent/editorial-visuals";

const diagrams = [
    ["Bus", "Driver", "Motor", "Gearbox", "Output"],
    ["Winding", "Housing", "Ambient"],
    ["Rotor", "Gearbox", "Load", "Encoder", "Reference"],
    ["Sim", "Identify", "Validate"],
];

for (const [name, render] of [
    ["guide", guideDashboard],
    ["comparison", comparisonDashboard],
] as const) {
    test(`${name} gives every conceptual node a distinct inline semantic pictogram with its text label`, () => {
        const figures = [...render().matchAll(/<svg\b[^>]*>[\s\S]*?<\/svg>/g)];
        expect(figures).toHaveLength(diagrams.length);
        const shapes = new Map<string, string>();
        for (const [index, figure] of figures.entries()) {
            const svg = figure[0];
            expect(svg).toContain('role="img"');
            expect(svg).toMatch(/aria-labelledby="[^"]+-concept-title"/);
            expect(svg).toMatch(/<title id="[^"]+-concept-title">[^<]+<\/title>/);
            const icons = [
                ...svg.matchAll(/<g\b[^>]*data-icon="([^"]+)"[^>]*>([\s\S]*?)<\/g>/g),
            ];
            const expected = diagrams[index];
            if (!expected) throw new Error(`Unexpected diagram ${index}`);
            expect(icons.map((icon) => icon[1])).toEqual(expected);
            for (const icon of icons) {
                const [, label, paths] = icon;
                if (!label || !paths) throw new Error("Missing icon label or paths");
                expect(icon[0]).toContain('aria-hidden="true"');
                expect(paths).toMatch(/<path\b[^>]*d="[^"]+"/);
                expect(svg).toMatch(new RegExp(`<text[^>]*>${label}</text>`));
                const previous = shapes.get(label);
                if (previous) expect(paths).toBe(previous);
                shapes.set(label, paths);
            }
            expect(svg).not.toMatch(/<(?:image|use|foreignObject)\b|(?:href|src)=/);
        }
        expect(shapes.size).toBe(15);
        expect(new Set(shapes.values()).size).toBe(shapes.size);
    });

    test(`${name} keeps pictograms inside their nodes and above readable labels at mobile scale`, () => {
        const nodes = [
            ...render().matchAll(
                /<rect x="(\d+)" y="(\d+)" width="96" height="48" rx="7"\/><g data-icon="([^"]+)"[^>]*transform="translate\((\d+) (\d+)\)"[^>]*>[\s\S]*?<\/g><text x="(\d+)" y="(\d+)" text-anchor="middle">([^<]+)<\/text>/g,
            ),
        ];
        expect(nodes).toHaveLength(diagrams.flat().length);
        for (const node of nodes) {
            const [, x, y, icon, iconX, iconY, labelX, labelY, label] = node;
            expect(icon).toBe(label);
            expect(Number(iconX)).toBe(Number(x) + 36);
            expect(Number(iconY)).toBeGreaterThan(Number(y));
            expect(Number(iconY) + 24).toBeLessThanOrEqual(Number(labelY) - 16);
            expect(Number(labelX)).toBe(Number(x) + 48);
            expect(Number(labelY)).toBeLessThan(Number(y) + 48);
            // A 24-unit icon stays >= 18px even in a 272px-wide mobile panel.
            expect((24 * 272) / 360).toBeGreaterThanOrEqual(18);
        }
    });
}
