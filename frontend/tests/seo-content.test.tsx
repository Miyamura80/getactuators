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

test("homepage FAQ remains visible and equivalent to JSON-LD after React mount", async () => {
    const root = await loadPage("/");
    const faq = homePage.faq!;
    render(<App />, { container: root });
    expect(root.querySelector(".hero")).not.toBeNull();
    for (const question of faq.mainEntity) {
        expect(document.body.textContent).toContain(question.name);
        expect(document.body.textContent).toContain(question.acceptedAnswer.text);
        expect(Array.from(document.querySelectorAll("h3")).filter((h) => h.textContent === question.name)).toHaveLength(1);
    }
});
