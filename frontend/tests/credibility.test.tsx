import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { ACTUATORS } from "../src/lib/data";
import { ExplodedView } from "../src/pages/ExplodedView";

import { DetailPanel } from "../src/components/DetailPanel";
import { ComparePanel } from "../src/components/ComparePanel";
import { evidenceFor } from "../../src/catalog/evidence";

afterEach(cleanup);

test("detail and compare publish bounded evidence for every unchanged record", () => {
    const original = JSON.stringify(ACTUATORS);
    for (const a of ACTUATORS) {
        const detail = render(<DetailPanel actuator={a} onClose={() => {}} />);
        expect(detail.container.textContent).toContain(evidenceFor(a).label);
        cleanup();
        const compare = render(<ComparePanel actuators={[a]} onClose={() => {}} onRemove={() => {}} />);
        expect(compare.container.textContent).toContain(evidenceFor(a).label);
        cleanup();
    }
    expect(JSON.stringify(ACTUATORS)).toBe(original);
});

test("conflicting fields and reducer placeholders are qualified beside their values", () => {
    const ids = ["cubemars-ak80-9", "leaderdrive-lcs", "leaderdrive-lhd", "leaderdrive-lhs", "nidec-flexwave-wpg", "nidec-smart-flexwave-srh"];
    for (const id of ids) {
        const a = ACTUATORS.find((record) => record.id === id)!;
        const detail = render(<DetailPanel actuator={a} onClose={() => {}} />);
        const fields = Array.from(detail.container.querySelectorAll('.spec'));
        for (const label of id === 'cubemars-ak80-9' ? ['Weight', 'Encoder', 'Torque density'] : ['Backdrivable', 'Backlash', 'Encoder']) {
            expect(fields.find((field) => field.querySelector('dt')?.textContent === label)?.querySelector('dd')?.textContent).toMatch(id === 'cubemars-ak80-9' ? /Revision conflict/ : /Legacy catalog placeholder; not measured/);
        }
        cleanup();
        const compare = render(<ComparePanel actuators={[a]} onClose={() => {}} onRemove={() => {}} />);
        const rows = Array.from(compare.container.querySelectorAll('tbody tr'));
        for (const label of id === 'cubemars-ak80-9' ? ['Weight', 'Torque density'] : ['Backlash']) {
            const cell = rows.find((row) => row.querySelector('td')?.textContent?.startsWith(label))?.querySelectorAll('td')[1];
            expect(cell?.textContent).toMatch(id === 'cubemars-ak80-9' ? /Revision conflict/ : /Legacy catalog placeholder; not measured/);
            expect(cell?.getAttribute('data-best')).toBe('false');
        }
        cleanup();
    }
});

test("product visual headers qualify conflict and family spec chips", () => {
    for (const a of ACTUATORS.filter((a) => a.id === "cubemars-ak80-9" || /^(leaderdrive-|nidec-)/.test(a.id))) {
        const view = render(<ExplodedView id={a.id} />);
        expect(view.container.querySelector('.xp-heading')?.textContent).toContain(evidenceFor(a).label);
        for (const label of a.id === "cubemars-ak80-9" ? ['Weight', 'Torque density'] : ['Rated torque', 'Weight']) {
            const chip = Array.from(view.container.querySelectorAll('.xp-spec')).find((el) => el.querySelector('.xp-spec-label')?.textContent === label);
            expect(chip?.textContent).toContain(a.id === "cubemars-ak80-9" ? 'Revision conflict' : 'Family-level');
        }
        cleanup();
    }
});

test("every catalog visualization is conceptual, not inferred model internals", () => {
    for (const a of ACTUATORS) {
        const view = render(<ExplodedView id={a.id} />);
        expect(view.container.querySelector('.xp-hint')?.textContent).toContain('Conceptual silhouette: not CAD or model-specific internals.');
        expect(view.container.querySelector('.xp-callouts')?.textContent).not.toMatch(/Cross-roller|Strain-wave gear|Wave generator|Rotor|Stator|Encoder/);
        expect(view.container.querySelectorAll('.xp-face')).toHaveLength(3);
        cleanup();
    }
});
