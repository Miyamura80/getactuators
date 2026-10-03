import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { ACTUATORS } from "../src/lib/data";
import App from "../src/App";
import { ExplodedView } from "../src/pages/ExplodedView";
// Real server captures, checked against live server output by agent-pages.test.ts.
// Keep backend-only MCP dependencies out of the frontend's independent CI job.
import homePage from "./fixtures/home.json";
import productPage from "./fixtures/product.json";

afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
});

function loadPage(path: string) {
    const page = [homePage, productPage].find((candidate) => candidate.path === path);
    if (!page) throw new Error(`Missing captured page: ${path}`);
    document.body.innerHTML = page.body;
    return document.getElementById("root") as HTMLElement;
}

test("product catalog facts survive React mount alongside the exploded visual", async () => {
    const a = ACTUATORS.find((item) => item.notes && item.sources.length && item.use_cases.length)!;
    const root = await loadPage(`/actuators/${encodeURIComponent(a.id)}`);
    expect(document.body.textContent).toContain(a.notes!);
    render(<ExplodedView id={a.id} />, { container: root });
    expect(root.querySelector(".xp-stage")).not.toBeNull();
    expect(document.querySelectorAll("footer.site-footer")).toHaveLength(1);
    const footer = document.querySelector("footer.site-footer")!;
    const specifications = document.getElementById("catalog-content")!;
    expect(Boolean(specifications.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
    expect(document.body.textContent).toContain(a.notes!);
    expect(document.body.textContent).toContain(a.verified ? "verified against sources" : "unverified");
    expect(document.body.textContent).toContain("Use cases");
    for (const useCase of a.use_cases) {
        expect(document.body.textContent).toContain(useCase.replaceAll("_", " "));
    }
    for (const source of [a.product_url, a.datasheet_url, ...a.sources].filter(Boolean)) {
        expect(document.querySelector(`a[href="${source}"]`)).not.toBeNull();
    }
    const related = ACTUATORS.filter((item) => item.category === a.category && item.id !== a.id);
    expect(related.some((item) => document.querySelector(`a[href="https://actuatorlist.com/actuators/${encodeURIComponent(item.id)}"]`))).toBe(true);
});

test("product heading offers a native jump to persistent specifications", () => {
    const a = ACTUATORS.find((item) => item.notes && item.sources.length && item.use_cases.length)!;
    const root = loadPage(`/actuators/${encodeURIComponent(a.id)}`);
    const target = document.getElementById("catalog-content")!;
    const view = render(<ExplodedView id={a.id} />, { container: root });
    const link = view.getByRole("link", { name: "Jump to specifications" });
    expect(link.getAttribute("href")).toBe("#catalog-content");
    expect(link.closest(".xp-heading")?.querySelector("h1")?.textContent).toBe(a.name);
    expect(document.querySelectorAll("#catalog-content")).toHaveLength(1);
    expect(root.contains(target)).toBe(false);
    expect(target.querySelector("h2")?.textContent).toBe("Specifications");
    expect(target.querySelector("table")).not.toBeNull();
    expect(target.closest(".xp-stage")).toBeNull();
    const click = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 });
    link.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(false);
});

test("persistent specifications accept focus without entering the tab order", () => {
    const a = ACTUATORS.find((item) => item.notes && item.sources.length && item.use_cases.length)!;
    const root = loadPage(`/actuators/${encodeURIComponent(a.id)}`);
    render(<ExplodedView id={a.id} />, { container: root });
    const target = document.getElementById("catalog-content")!;
    expect(target.getAttribute("tabindex")).toBe("-1");
    expect(target.getAttribute("aria-label")).toBe("Specifications and catalog details");
    target.focus();
    expect(document.activeElement).toBe(target);
});

test("homepage mounts without FAQ content or duplicate footers", () => {
    const root = loadPage("/");
    render(<App />, { container: root });
    expect(root.querySelector(".hero")).not.toBeNull();
    expect(document.querySelectorAll(".ga-faq-item")).toHaveLength(0);
    expect(document.getElementById("catalog-content")).toBeNull();
    expect(document.querySelectorAll("footer.site-footer")).toHaveLength(1);
    expect(homePage.faq).toBeNull();
});
