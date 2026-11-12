import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { ExplodedView } from "../src/pages/ExplodedView";

afterEach(cleanup);

test("actuator page links to the humanoids using it and its patent landscape", () => {
    const view = render(<ExplodedView id="robstride-04" />);
    const panel = view.getByRole("region", { name: /Related to/ });
    const hrefs = [...panel.querySelectorAll("a")].map((a) => a.getAttribute("href"));
    expect(hrefs.some((h) => h?.startsWith("/humanoids?robot=kscale-kbot&joint="))).toBe(true);
    expect(hrefs.some((h) => h?.startsWith("/patents?technology="))).toBe(true);
});

test("an actuator no humanoid uses shows only the patent group", () => {
    const view = render(<ExplodedView id="dynamixel-xm430-w350-t" />);
    const panel = view.getByRole("region", { name: /Related to/ });
    expect(panel.textContent).not.toContain("In humanoids");
    expect(panel.textContent).toContain("Patents since 2010");
});
