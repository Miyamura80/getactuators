import "./happydom";
import { readFileSync } from "node:fs";
import { afterEach, expect, test } from "bun:test";
import { act, cleanup, fireEvent, render, within } from "@testing-library/react";
import { countryCompanies, getCountryPage, type CountryPage as Page } from "../../src/supply-chain/country-pages";
import type { MapTopology } from "../src/components/maps/geo";
import { CompanyDrawer } from "../src/components/supply-chain/CompanyDrawer";
import { CompanyTable } from "../src/components/supply-chain/CompanyTable";
import { FootnotesProvider } from "../src/components/supply-chain/footnotes";
import { CountryPage } from "../src/pages/supply-chain/country/CountryPage";
import { readCountryState, withCountryState } from "../src/pages/supply-chain/country/url-state";

const JP = JSON.parse(readFileSync(new URL("../public/geo/jp-admin1.json", import.meta.url), "utf8")) as MapTopology;
const JAPAN = getCountryPage("japan") as Page;
const COMPANIES = countryCompanies("JP");

const setURL = (path: string) =>
    (window as unknown as { happyDOM: { setURL: (u: string) => void } }).happyDOM.setURL(`http://localhost${path}`);
const mount = () => render(<CountryPage page={JAPAN} topology={JP} />);

afterEach(cleanup);

test("renders the overview strip, the map, the table and one call to action", () => {
    setURL("/japan");
    const view = mount();
    const c = view.container;
    expect(view.getByRole("heading", { level: 1 }).textContent).toBe("Japan: actuator supply chain");
    expect(c.querySelectorAll(".cp-stage")).toHaveLength(JAPAN.stages.length);
    // Stages /metals covers carry the world leader's concentration badge.
    expect(c.querySelector('[data-stage="magnet"] .fk-badge-concentration')).not.toBeNull();
    expect(c.querySelector('[data-stage="robot"] .fk-badge-concentration')).toBeNull();
    expect(c.querySelector('[data-stage="separation"] .cp-gap')).not.toBeNull();
    expect(c.querySelectorAll(".cp-policy").length).toBeGreaterThan(1);
    expect(c.querySelector('.cp-policy[href^="/policy#measure=jp-"]')).not.toBeNull();
    expect(c.querySelectorAll(".mk-land")).toHaveLength(47);
    expect(c.querySelectorAll(".sc-ctable tbody tr")).toHaveLength(COMPANIES.length);
    expect(c.querySelectorAll(".cp-cta")).toHaveLength(1);
    expect(c.querySelector(".mk-drawer")).toBeNull();
    // Every named cluster is listed under the map.
    expect(c.querySelectorAll(".mk-cluster-index button")).toHaveLength(JAPAN.clusters.length);
});

test("?company= opens the company card; a plant expands its detail; close clears the URL", () => {
    setURL("/japan?company=harmonic-drive-systems");
    const c = mount().container;
    const drawer = c.querySelector(".mk-drawer") as HTMLElement;
    expect(drawer.querySelector("h3")?.textContent).toBe("Harmonic Drive Systems");
    const facts = within(drawer).getAllByRole("term").map((t) => t.textContent);
    expect(facts).toEqual(expect.arrayContaining(["Revenue", "Gross margin", "Ownership", "Role", "Products"]));
    expect(drawer.querySelector(".fk-badge-margin")).not.toBeNull();
    // Japanese plants first, then the US subsidiary.
    const sites = [...drawer.querySelectorAll(".sc-sites li button > span")].map((s) => s.textContent);
    expect(sites.at(-1)).toBe("Harmonic Drive LLC, Beverly");
    act(() => { fireEvent.click(within(drawer).getByText("Ariake plant")); });
    expect(readCountryState(window.location.search).site).toBe("hds-ariake");
    expect(c.querySelector('.mk-drawer .sc-site[data-site="hds-ariake"]')).not.toBeNull();
    act(() => { fireEvent.click(c.querySelector(".mk-drawer-close") as Element); });
    expect(window.location.search).toBe("");
    expect(c.querySelector(".mk-drawer")).toBeNull();
});

test("a foreign-owned company gets an owner chip; partners abroad stay inert until their page is live", () => {
    setURL("/japan?company=jare");
    const c = mount().container;
    const drawer = c.querySelector(".mk-drawer") as HTMLElement;
    const partners = [...drawer.querySelectorAll(".sc-partner")];
    const lynas = partners.find((p) => p.textContent?.includes("Lynas"));
    expect(lynas?.tagName).toBe("SPAN");
    // Sojitz is on this map: picking it opens its card in place.
    const sojitz = partners.find((p) => p.textContent?.endsWith("Sojitz")) as HTMLElement;
    expect(sojitz.tagName).toBe("BUTTON");
    act(() => { fireEvent.click(sojitz); });
    expect(readCountryState(window.location.search).company).toBe("sojitz");
    // The arc to Australia ends in a chip that is not a link (no /australia page).
    expect(c.querySelector(".mk-chip")?.tagName).toBe("SPAN");
    cleanup();
    setURL("/japan?site=hd-llc-beverly");
    const owner = mount().container.querySelector(".mk-drawer .sc-owner-chip");
    expect(owner).toBeNull();
    cleanup();
    // A company abroad (Caremag, France) gets an owner chip on a map of Japan;
    // the country page itself only opens cards for its own companies.
    const card = render(<FootnotesProvider><CompanyDrawer companyId="caremag" country="JP" onClose={() => {}} /></FootnotesProvider>);
    expect(card.container.querySelector(".mk-drawer .sc-owner-chip")?.textContent).toBe("Owner: France");
    cleanup();
    setURL("/japan?company=caremag");
    expect(mount().container.querySelector(".mk-drawer")).toBeNull();
});

test("?segment= filters pins and table rows and is set by the filter", () => {
    setURL("/japan");
    const view = mount();
    const gears = COMPANIES.filter((c) => c.segment === "gears-screws-bearings").length;
    const radio = view.getAllByRole("radio").find((r) => r.textContent?.startsWith("Gears")) as HTMLElement;
    act(() => { fireEvent.click(radio); });
    expect(readCountryState(window.location.search).segment).toBe("gears-screws-bearings");
    expect(radio.getAttribute("aria-checked")).toBe("true");
    expect(view.container.querySelectorAll(".sc-ctable tbody tr")).toHaveLength(gears);
    // Back: the browser restores the unfiltered view.
    act(() => {
        setURL("/japan");
        window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(readCountryState(window.location.search).segment).toBeNull();
    expect(radio.getAttribute("aria-checked")).toBe("false");
    expect(view.container.querySelectorAll(".sc-ctable tbody tr")).toHaveLength(COMPANIES.length);
});

test("changing segment clears the company and site selection", () => {
    setURL("/japan?company=harmonic-drive-systems&site=hds-ariake");
    const view = mount();
    expect(view.container.querySelector(".mk-drawer")).not.toBeNull();
    const radio = view.getAllByRole("radio").find((r) => r.textContent?.startsWith("Magnets")) as HTMLElement;
    act(() => { fireEvent.click(radio); });
    expect(readCountryState(window.location.search)).toEqual({ segment: "magnets-motors", company: null, site: null, cluster: null, region: null });
    expect(view.container.querySelector(".mk-drawer")).toBeNull();
});

test("a site abroad picked in the drawer opens its detail; ?company= outside the country is ignored", () => {
    setURL("/japan?company=harmonic-drive-systems");
    const c = mount().container;
    const drawer = c.querySelector(".mk-drawer") as HTMLElement;
    act(() => { fireEvent.click(within(drawer).getByText("Harmonic Drive LLC, Beverly")); });
    expect(readCountryState(window.location.search).site).toBe("hd-llc-beverly");
    expect(c.querySelector(".mk-drawer h3")?.textContent).toBe("Harmonic Drive Systems");
    expect(c.querySelector('.mk-drawer .sc-site[data-site="hd-llc-beverly"]')).not.toBeNull();
    cleanup();
    expect(COMPANIES.some((x) => x.id === "lynas")).toBe(false);
    setURL("/japan?company=lynas");
    expect(mount().container.querySelector(".mk-drawer")).toBeNull();
});

test("?cluster= opens the cluster panel listing its members", () => {
    setURL("/japan?cluster=nagano-precision");
    const view = mount();
    const panel = view.container.querySelector(".cp-cluster") as HTMLElement;
    expect(panel.querySelector("h2")?.textContent).toContain("Nagano precision belt");
    const names = [...panel.querySelectorAll("li button")].map((b) => b.textContent);
    expect(names).toEqual(expect.arrayContaining(["Harmonic Drive Systems", "Seiko Epson", "Sanyo Denki"]));
    act(() => { fireEvent.click(within(panel).getByText("Seiko Epson")); });
    expect(readCountryState(window.location.search).company).toBe("seiko-epson");
    expect(view.container.querySelector(".mk-drawer h3")?.textContent).toBe("Seiko Epson");
});

test("company table sorts by a column and selects a company", () => {
    let picked = "";
    const view = render(<FootnotesProvider><CompanyTable companies={COMPANIES} sitesOf={() => 1} caption="All" onSelect={(id) => { picked = id; }} /></FootnotesProvider>);
    const header = view.getByRole("button", { name: "Revenue" });
    act(() => { fireEvent.click(header); });
    expect(header.closest("th")?.getAttribute("aria-sort")).toBe("descending");
    const first = view.container.querySelector(".sc-ctable tbody th button") as HTMLElement;
    const top = [...COMPANIES].sort((a, b) => (b.revenue?.value ?? -1) - (a.revenue?.value ?? -1))[0];
    expect(first.textContent).toBe(top?.name);
    act(() => { fireEvent.click(first); });
    expect(picked).toBe(top?.id);
});

test("company table sorts unknown revenue last in both directions", () => {
    const view = render(<FootnotesProvider><CompanyTable companies={COMPANIES} sitesOf={() => 1} caption="All" /></FootnotesProvider>);
    const header = view.getByRole("button", { name: "Revenue" });
    const unknown = COMPANIES.filter((c) => !c.revenue).length;
    expect(unknown).toBeGreaterThan(0);
    const lastNames = () => [...view.container.querySelectorAll(".sc-ctable tbody th button")].slice(-unknown).map((b) => b.textContent);
    const missing = new Set(COMPANIES.filter((c) => !c.revenue).map((c) => c.name));
    for (const dir of ["descending", "ascending"]) {
        act(() => { fireEvent.click(header); });
        expect(header.closest("th")?.getAttribute("aria-sort")).toBe(dir);
        expect(lastNames().every((n) => missing.has(n ?? ""))).toBe(true);
    }
});

test("url state round-trips and keeps other params", () => {
    expect(withCountryState("/japan?x=1#m", { segment: "magnets-motors", company: "tdk" })).toBe("/japan?x=1&segment=magnets-motors&company=tdk#m");
    expect(withCountryState("/japan?segment=magnets-motors&company=tdk", { company: null })).toBe("/japan?segment=magnets-motors");
    expect(readCountryState("?segment=nope&cluster=kanto-hq")).toEqual({ segment: null, company: null, site: null, cluster: "kanto-hq", region: null });
});

test("a busy country opens calm: links draw only once a company is picked", () => {
    const US = JSON.parse(readFileSync(new URL("../public/geo/us-admin1.json", import.meta.url), "utf8")) as MapTopology;
    const page = getCountryPage("us") as Page;
    setURL("/us");
    let c = render(<CountryPage page={page} topology={US} />).container;
    expect(c.querySelectorAll(".mk-arc")).toHaveLength(0);
    expect(c.querySelectorAll(".mk-chip")).toHaveLength(0);
    cleanup();
    setURL("/us?company=mp-materials");
    c = render(<CountryPage page={page} topology={US} />).container;
    expect(c.querySelectorAll(".mk-arc").length).toBeGreaterThan(0);
});

const US_TOPO = JSON.parse(readFileSync(new URL("../public/geo/us-admin1.json", import.meta.url), "utf8")) as MapTopology;
const US_PAGE = getCountryPage("us") as Page;
const mountUS = () => render(<CountryPage page={US_PAGE} topology={US_TOPO} />);

test("a busy country opens on regional hubs, named after them", () => {
    setURL("/us");
    const c = mountUS().container;
    const hubs = [...c.querySelectorAll(".mk-cluster")].map((b) => b.getAttribute("aria-label") ?? "");
    expect(hubs.length).toBeGreaterThanOrEqual(6);
    expect(hubs.length).toBeLessThanOrEqual(8);
    expect(hubs.some((l) => l.startsWith("Great Lakes"))).toBe(true);
    // No scattered single pins while zoomed out: every site sits in a hub.
    expect(c.querySelectorAll(".mk-pin")).toHaveLength(0);
});

test("?region= zooms to a state: pins, links and table narrow to it, and there is a way back", () => {
    setURL("/us?region=TX");
    const view = mountUS();
    const c = view.container;
    const texas = US_PAGE.regions?.list.find((r) => r.code === "TX");
    expect(texas?.name).toBe("Texas");
    expect(c.querySelector('.mk-land[data-id="US-TX"]')?.getAttribute("aria-pressed")).toBe("true");
    expect(c.querySelector(".mk-country.has-region")).not.toBeNull();
    // Only Texas companies in the table, links touching them on the map.
    const rows = c.querySelectorAll(".sc-ctable tbody tr");
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThan(countryCompanies("US").length);
    expect(c.querySelectorAll(".mk-arc").length).toBeGreaterThan(0);
    expect(c.querySelector(".cp-regions summary")?.textContent).toContain("Texas");
    act(() => { fireEvent.keyDown(window, { key: "Escape" }); });
    expect(readCountryState(window.location.search).region).toBeNull();
});

test("the state picker lists only states with sites; ?state= is read as ?region=", () => {
    setURL("/us?state=ma");
    const c = mountUS().container;
    expect(readCountryState(window.location.search).region).toBe("MA");
    const picks = [...c.querySelectorAll(".cp-regions-list button")].map((b) => b.textContent ?? "");
    expect(picks[0]).toContain("All states");
    expect(picks.some((t) => t.startsWith("Massachusetts"))).toBe(true);
    expect(picks.some((t) => t.startsWith("Alaska"))).toBe(false);
    act(() => { fireEvent.click(c.querySelector(".cp-back") as HTMLElement); });
    expect(readCountryState(window.location.search).region).toBeNull();
    expect(window.location.search).not.toContain("state=");
});

test("clicking a state outline zooms to it", () => {
    setURL("/us");
    const c = mountUS().container;
    act(() => { fireEvent.click(c.querySelector('.mk-land[data-id="US-CO"]') as Element); });
    expect(readCountryState(window.location.search).region).toBe("CO");
    // States without sites are not buttons.
    expect(c.querySelector('.mk-land[data-id="US-AK"]')?.getAttribute("role")).toBeNull();
});
