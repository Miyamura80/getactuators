import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import App from "../src/App";
import { Home } from "../src/pages/Home";
import { ActuatorsPage } from "../src/pages/actuators/ActuatorsPage";
import { Agents } from "../src/pages/Agents";

afterEach(cleanup);

// Guides left the header; the footer links them. The product page's footer is
// server-rendered outside the SPA view (tests/server/public-navigation.test.ts).
test("visible SPA navigation exposes native document links to engineering guides", () => {
    for (const view of [<App />, <Home />, <ActuatorsPage />, <Agents />]) {
        const { container, unmount } = render(view);
        const link = container.querySelector<HTMLAnchorElement>('a[href="/guides"]');
        expect(link).not.toBeNull();
        expect(link!.closest('nav, .side-pages')).not.toBeNull();
        const click = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 });
        link!.dispatchEvent(click);
        expect(click.defaultPrevented).toBe(false);
        unmount();
    }
});

test("homepage footer retains a discoverable guide link after mount", () => {
    const { container } = render(<App />);
    expect(container.querySelector('footer a[href="/guides"]')).not.toBeNull();
});
