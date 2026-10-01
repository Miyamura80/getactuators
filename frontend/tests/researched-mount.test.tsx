import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { ExplodedView } from "../src/pages/ExplodedView";

afterEach(() => { cleanup(); document.body.innerHTML = ""; });

test("all five researched reducer notes survive a real React mount without invented numeric unknowns", async () => {
    const file = Bun.file(new URL('./fixtures/researched.json', import.meta.url));
    expect(await file.exists()).toBe(true);
    const captures = await file.json() as { path: string; body: string }[];
    expect(captures).toHaveLength(5);
    for (const capture of captures) {
        document.body.innerHTML = capture.body;
        const root = document.getElementById('root')!;
        render(<ExplodedView id={capture.path.split('/').at(-1)!} />, { container: root });
        const notes = document.getElementById('catalog-content')!;
        expect(root.querySelector('.xp-hint')?.textContent).toContain('Generic reducer illustration');
        expect(root.querySelector('.xp-callouts')?.textContent).not.toMatch(/Rotor|Stator|Encoder/);
        expect(root.contains(notes)).toBe(false);
        for (const label of ['Engineering notes', 'Manufacturer specifications', 'Engineering inference', 'Unknown / confirmation required', 'not applicable to a reducer alone']) expect(notes.textContent).toContain(label);
        expect(notes.querySelector('a[href="/guides/robot-actuator-selection"]')).not.toBeNull();
        expect(notes.textContent).not.toMatch(/efficiency (?:is |of )?\d+%/);
        cleanup();
    }
});
