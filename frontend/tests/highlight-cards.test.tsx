import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { isRankable } from "../../src/catalog/evidence";
import { HighlightCards } from "../src/components/HighlightCards";
import { ACTUATORS } from "../src/lib/data";

afterEach(cleanup);

test("highlight charts rank verified actuators only", () => {
    const excluded = ACTUATORS.filter((a) => !isRankable(a));
    expect(excluded.some((a) => !a.verified)).toBe(true);
    expect(excluded.some((a) => a.id === "nabtesco-rv-42n")).toBe(true);
    const { container } = render(<HighlightCards actuators={ACTUATORS} onSelect={() => {}} />);
    const text = container.textContent ?? "";
    for (const a of excluded) expect(text).not.toContain(a.name);
    expect(text).toContain(ACTUATORS.find((a) => isRankable(a) && a.torque_density_nm_per_kg != null)?.name ?? "?");
});
