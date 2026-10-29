import { expect, test } from "bun:test";
import { REPO_URL, isRepoHref, withRepoMarks } from "@/repo-link";
import { get } from "./agent-helpers";

const MARK = 'class="gh-mark"';
const count = (s: string, needle: string) => s.split(needle).length - 1;

test("repo links match the repository and its deep links only", () => {
    expect(isRepoHref(REPO_URL)).toBe(true);
    expect(isRepoHref(`${REPO_URL}/issues`)).toBe(true);
    expect(isRepoHref(`${REPO_URL}#readme`)).toBe(true);
    expect(isRepoHref(`${REPO_URL}-fork`)).toBe(false);
    expect(isRepoHref("https://github.com/Miyamura80")).toBe(false);
    expect(isRepoHref("/about")).toBe(false);
});

test("the mark is added once, even when rendering twice", () => {
    const html = `<p><a href="${REPO_URL}/pulls">PRs</a> <a href="/faq">FAQ</a></p>`;
    const once = withRepoMarks(html);
    expect(count(once, MARK)).toBe(1);
    expect(withRepoMarks(once)).toBe(once);
});

test("the server footer GitHub link starts with the mark", async () => {
    const html = await (await get("/actuators")).text();
    const footer = html.slice(html.indexOf('<footer class="site-footer"'));
    expect(footer).toContain(`<a href="${REPO_URL}"><svg ${MARK}`);
    expect(count(footer, MARK)).toBe(1);
});

test("the API docs page marks its repository link", async () => {
    const html = await (await get("/docs/api")).text();
    expect(html).toContain(`<a href="${REPO_URL}"><svg ${MARK}`);
    expect(await (await get("/docs/api.md")).text()).not.toContain("gh-mark");
});
