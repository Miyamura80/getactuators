import "./happydom";
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { ACTUATORS } from "../src/lib/data";
import {
    DEFAULT_STATE,
    fmt,
    knownSi,
    motorSide,
    solve,
    stateFromQuery,
    stateToQuery,
} from "../src/lib/motor-torque";
import { MotorTorqueCalculator } from "../src/pages/MotorTorqueCalculator";
import { shortlist } from "../../src/catalog/shortlist";

afterEach(cleanup);

function setUrl(url: string) {
    (window as unknown as { happyDOM: { setURL: (u: string) => void } }).happyDOM.setURL(url);
}

describe("shaft relation", () => {
    test("solves each quantity from the other two", () => {
        const t = solve("torque", { powerW: 100, speedRpm: 300 });
        expect(t.ok && t.shaft.torqueNm).toBeCloseTo(3.1831, 4);
        const p = solve("power", { torqueNm: 18, speedRpm: 200 });
        expect(p.ok && p.shaft.powerW).toBeCloseTo(376.99, 2);
        const n = solve("speed", { powerW: 200, torqueNm: 0.63662 });
        expect(n.ok && n.shaft.speedRpm).toBeCloseTo(3000, 0);
    });

    test("refuses to invent stall torque at zero speed", () => {
        const r = solve("torque", { powerW: 100, speedRpm: 0 });
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.reason).toContain("Stall torque is a motor rating");
        expect(solve("power", { torqueNm: -1, speedRpm: 10 }).ok).toBe(false);
    });

    test("converts units to SI before solving", () => {
        // 1 hp at 5252 rpm is 1 lbf·ft.
        const s = { ...DEFAULT_STATE, values: { torque: "", power: "1", speed: "5252" }, units: { torque: "lbfft", power: "hp", speed: "rpm" } };
        const r = solve("torque", knownSi(s));
        expect(r.ok && r.shaft.torqueNm / 1.3558179483314).toBeCloseTo(1, 3);
    });

    test("reflects an output requirement through a lossy gearbox", () => {
        const m = motorSide({ torqueNm: 18, speedRpm: 200, powerW: 376.99 }, { ratio: 9, efficiency: 0.9 });
        expect(m?.torqueNm).toBeCloseTo(2.222, 3);
        expect(m?.speedRpm).toBe(1800);
        expect(m?.powerW).toBeCloseTo(418.88, 1);
        expect(motorSide({ torqueNm: 1, speedRpm: 1, powerW: 1 }, { ratio: 9, efficiency: 1.2 })).toBeNull();
    });

    test("formats to three significant figures", () => {
        expect(fmt(3.18309)).toBe("3.18");
        expect(fmt(376.99)).toBe("377");
        expect(fmt(1800)).toBe("1,800");
    });
});

describe("shareable state", () => {
    test("round-trips through the query string and drops junk", () => {
        const s = stateFromQuery("?solve=power&t=18&n=200&tu=lbfft&ratio=9&eff=90");
        expect(s.solve).toBe("power");
        expect(s.values).toEqual({ torque: "18", power: "", speed: "200" });
        expect(stateFromQuery(stateToQuery(s))).toEqual(s);
        const junk = stateFromQuery("?solve=toString&t=<script>&tu=bogus");
        expect(junk.solve).toBe("torque");
        expect(junk.values.torque).toBe("");
        expect(junk.units.torque).toBe("Nm");
    });
});

describe("catalog handoff", () => {
    test("rated fits rank before peak-only fits and too-slow entries drop out", () => {
        const list = shortlist(ACTUATORS, { torqueNm: 18, speedRpm: 200 }, 100);
        expect(list.total).toBeGreaterThan(0);
        const fits = list.rows.map((r) => r.torque);
        expect(fits.indexOf("peak") === -1 || fits.lastIndexOf("rated") < fits.indexOf("peak")).toBe(true);
        for (const { actuator: a, torque, speed } of list.rows) {
            if (torque === "rated") expect(a.rated_torque_nm).toBeGreaterThanOrEqual(18);
            else expect(a.peak_torque_nm).toBeGreaterThanOrEqual(18);
            if (speed === "meets") expect(a.max_speed_rpm).toBeGreaterThanOrEqual(200);
            if (speed === "unknown") expect(a.max_speed_rpm).toBeNull();
        }
        expect(list.rows.some((r) => r.actuator.max_speed_rpm != null && r.actuator.max_speed_rpm < 200)).toBe(false);
        expect(shortlist(ACTUATORS, { torqueNm: 0 }).total).toBe(0);
    });
});

test("the page solves from the URL, redraws the nomograph and hands off to compare", () => {
    setUrl("http://localhost/tools/motor-torque-calculator?solve=torque&p=100&n=300");
    const view = render(<MotorTorqueCalculator />);
    expect(view.container.querySelector("output.calc-value")?.textContent).toContain("3.18");
    expect(view.getByRole("img", { name: /3\.18 N·m at 300 rpm is 100 W/ })).toBeTruthy();
    const compare = view.getByRole("link", { name: /Compare top \d side by side/ });
    expect(compare.getAttribute("href")).toStartWith("/compare?compare=");
    fireEvent.click(view.getByRole("button", { name: /Leg joint/ }));
    expect(view.container.querySelector("output.calc-value")?.textContent).toContain("377");
    expect(new URLSearchParams(window.location.search).get("solve")).toBe("power");
});

test("zero speed explains why torque is unknown and offers no shortlist", () => {
    setUrl("http://localhost/tools/motor-torque-calculator?solve=torque&p=100&n=0");
    const view = render(<MotorTorqueCalculator />);
    expect(view.container.textContent).toContain("Stall torque is a motor rating");
    expect(view.queryByRole("link", { name: /Compare top/ })).toBeNull();
});
