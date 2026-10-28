import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { act, cleanup, render } from "@testing-library/react";
import { mountApp } from "../src/startup";
import { Contributors } from "../src/pages/Contributors";
import { PersonCard } from "../src/components/people/PersonCard";
import { OrgLogo } from "../src/components/people/OrgLogo";
import { CONTRIBUTORS, ORGS, PEOPLE } from "../../src/people";
import { FOOTER_GROUPS } from "../../src/public-navigation";

afterEach(cleanup);

test("the app routes /contributors to the contributors page", async () => {
    (window as unknown as { happyDOM: { setURL: (url: string) => void } }).happyDOM.setURL("http://localhost:1/contributors");
    document.body.innerHTML = '<div id="root"></div>';
    const root = document.getElementById("root")!;
    let mounted: ReturnType<typeof mountApp> | undefined;
    try {
        await act(async () => {
            mounted = mountApp(root);
        });
        expect(root.querySelector("h1")?.textContent).toBe("Who builds actuatorlist");
    } finally {
        await act(async () => {
            mounted?.unmount();
        });
        document.body.innerHTML = "";
    }
});

test("/contributors shows the core card first, then every contributor", () => {
    const view = render(<Contributors />);
    const cards = [...view.container.querySelectorAll("article.pc")];
    expect(cards.map((c) => c.getAttribute("aria-label"))).toEqual(CONTRIBUTORS.map((p) => p.name));
    expect(cards.map((c) => c.classList.contains("pc-core"))).toEqual(CONTRIBUTORS.map((p) => p.contributor === "core"));
});

test("one CTA, a /contact route for changes, and the shared footer", () => {
    const view = render(<Contributors />);
    expect(view.container.querySelectorAll(".req-cta")).toHaveLength(1);
    expect(view.container.querySelector('main a[href="/contact"]')).not.toBeNull();
    for (const group of FOOTER_GROUPS) for (const [href, label] of group.links) {
        expect(view.container.querySelector(`footer a[href="${href}"]`)?.textContent).toBe(label);
    }
});

test("a person without a headshot gets a monogram, never a borrowed photo", () => {
    for (const person of PEOPLE) {
        const view = render(<PersonCard person={person} />);
        const img = view.container.querySelector(".pc-face img");
        if (person.headshot) expect(img?.getAttribute("src")).toBe(person.headshot.path);
        else {
            expect(img).toBeNull();
            expect(view.container.querySelector(".pc-monogram")?.textContent).toMatch(/^[A-Z]{1,2}$/);
        }
        cleanup();
    }
});

test("contributor cards show their affiliation; the core card and every card skip commit counts", () => {
    const view = render(<Contributors />);
    const core = view.container.querySelector(".pc-core")!;
    expect(core.querySelector(".org-logo, .org-wordmark")).toBeNull();
    for (const card of view.container.querySelectorAll("article.pc:not(.pc-core)"))
        expect(card.querySelector(".org-logo, .org-wordmark")).not.toBeNull();
    expect(view.container.querySelector(".pc-stats, .pc-what")).toBeNull();
    expect(view.container.textContent).not.toContain("commit");
});

test("org logos: a mask silhouette, the shared CompanyLogo for a registry brand, else a wordmark", () => {
    for (const org of Object.values(ORGS)) {
        const view = render(<OrgLogo org={org} />);
        if (org.logo) {
            const mark = view.container.querySelector<HTMLElement>(".org-mark");
            expect(mark?.getAttribute("aria-label")).toBe(`${org.name} logo`);
            expect(mark?.getAttribute("style")).toContain(org.logo.path);
        } else if (org.brandId) {
            expect(view.container.querySelector(".company-logo")).not.toBeNull();
            expect(view.container.querySelector(".org-name")?.textContent).toBe(org.name);
        } else {
            expect(view.container.querySelector(".org-wordmark")?.textContent).toBe(org.name);
        }
        cleanup();
    }
});

test("profile links are labelled icon links that open safely", () => {
    const person = PEOPLE.find((p) => p.links.length > 0)!;
    const view = render(<PersonCard person={person} />);
    const links = [...view.container.querySelectorAll(".pc-links a")];
    expect(links).toHaveLength(person.links.length);
    for (const a of links) {
        expect(a.getAttribute("aria-label")).toStartWith(`${person.name} on `);
        expect(a.getAttribute("rel")).toBe("noopener");
    }
});
