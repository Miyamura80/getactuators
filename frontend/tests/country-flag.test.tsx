import "./happydom";
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import actuators from "../src/data/actuators.json";
import robots from "../src/data/robots.json";
import { CompanyLogo } from "../src/components/CompanyLogo";
import { CountryFlag } from "../src/components/CountryFlag";
import { countryCode } from "../src/lib/country";

afterEach(cleanup);

describe("country flags", () => {
    test("every dataset country resolves to a code", () => {
        const names = [
            ...actuators.map((a) => a.country),
            ...Object.values(robots.robots).map((r) => r.country),
        ].filter((n): n is string => Boolean(n));
        const missing = [...new Set(names)].filter((n) => !countryCode(n));
        expect(missing).toEqual([]);
        expect(countryCode("South Korea")).toBe("KR");
        expect(countryCode("United Kingdom")).toBe("GB");
    });

    test("the flag keeps the country name as its label", () => {
        const { container } = render(<CountryFlag country="Japan" />);
        const flag = container.querySelector(".flag");
        expect(flag?.textContent).toBe("🇯🇵");
        expect(flag?.getAttribute("aria-label")).toBe("Japan");
    });
});

describe("CompanyLogo", () => {
    test("without a client id it draws a decorative monogram", () => {
        const { container } = render(<CompanyLogo name="Harmonic Drive LLC" size={16} />);
        const mono = container.querySelector(".company-logo-mono");
        expect(mono?.textContent).toBe("HD");
        expect(mono?.getAttribute("aria-hidden")).toBe("true");
    });

    test("a self-hosted logo wins, with explicit size and lazy loading", () => {
        // Prerendered markup, as the gallery build emits it.
        const html = renderToString(<CompanyLogo name="westmag" size={22} standalone />);
        expect(html).toContain('src="/logos/startups/westmag.png"');
        expect(html).toContain('width="22"');
        expect(html).toContain('height="22"');
        expect(html).toContain('loading="lazy"');
        expect(html).toContain('alt="Westmag"');
    });
});
