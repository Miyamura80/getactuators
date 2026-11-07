import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { type Arm, DEFAULT_ARM, G, armFromQuery, armToQuery, jointLoads } from "../../src/engineering/arm-torque";
import { ArmTorqueCalculator } from "../src/pages/ArmTorqueCalculator";

afterEach(cleanup);

function setUrl(url: string) {
    (window as unknown as { happyDOM: { setURL: (u: string) => void } }).happyDOM.setURL(url);
}

const twoLink: Arm = {
    payload: 1,
    comFraction: 0.5,
    links: [
        { length: 0.4, mass: 2, actuatorMass: 1 },
        { length: 0.2, mass: 1, actuatorMass: 0 },
    ],
};

test("each joint holds every mass outboard of it, at its lever arm", () => {
    const [shoulder, elbow] = jointLoads(twoLink);
    // 2 kg at 0.2, 1 kg actuator at 0.4, 1 kg link at 0.5, 1 kg payload at 0.6.
    expect(shoulder?.torqueNm).toBeCloseTo(G * (2 * 0.2 + 1 * 0.4 + 1 * 0.5 + 1 * 0.6), 9);
    // The elbow actuator sits on the elbow axis and adds nothing there.
    expect(elbow?.torqueNm).toBeCloseTo(G * (1 * 0.1 + 1 * 0.2), 9);
    expect(elbow?.x).toBe(0.4);
});

test("distal actuator mass loads every joint behind it", () => {
    const heavier = { ...twoLink, links: [{ ...twoLink.links[0]!, actuatorMass: 1.5 }, twoLink.links[1]!] };
    const delta = (jointLoads(heavier)[0]?.torqueNm ?? 0) - (jointLoads(twoLink)[0]?.torqueNm ?? 0);
    expect(delta).toBeCloseTo(0.5 * G * 0.4, 9);
    expect(jointLoads(heavier)[1]?.torqueNm).toBeCloseTo(jointLoads(twoLink)[1]?.torqueNm ?? 0, 9);
});

test("the documented worked example matches the model", () => {
    const loads = jointLoads(DEFAULT_ARM).map((l) => Number(l.torqueNm.toFixed(1)));
    expect(loads).toEqual([33.9, 13.5, 2.5]);
});

test("setups round-trip through the URL and junk falls back to the default", () => {
    expect(armFromQuery(armToQuery(twoLink))).toEqual(twoLink);
    expect(armFromQuery("?L=0.4,abc&m=1,1&a=0,0&p=1")).toEqual(DEFAULT_ARM);
    expect(armFromQuery("?L=0,0.2&m=1,1&a=0,0&p=1")).toEqual(DEFAULT_ARM);
    expect(armFromQuery("?L=1,1,1,1,1&m=1,1,1,1,1&a=0,0,0,0,0&p=1")).toEqual(DEFAULT_ARM);
    // One link is outside the supported 2 to 4, and "1," is a truncated vector.
    expect(armFromQuery("?L=0.4&m=1&a=0&p=1")).toEqual(DEFAULT_ARM);
    expect(armFromQuery("?L=0.4,0.2&m=1,&a=0,0&p=1")).toEqual(DEFAULT_ARM);
    // Fractional center-of-mass percentages survive the round trip.
    expect(armFromQuery(armToQuery({ ...twoLink, comFraction: 0.355 })).comFraction).toBeCloseTo(0.355, 9);
});

test("choosing a catalog actuator feeds its mass back into the shoulder load", () => {
    setUrl(`http://localhost/tools/robot-arm-torque-calculator${armToQuery(DEFAULT_ARM)}`);
    const view = render(<ArmTorqueCalculator />);
    const values = () => [...view.container.querySelectorAll(".arm-val")].map((e) => e.textContent);
    expect(values()).toEqual(["33.9 N·m", "13.5 N·m", "2.53 N·m"]);
    // The shoulder actuator sits on the base: no mass feedback offered.
    expect(view.container.querySelector(".req-use")).toBeNull();
    fireEvent.click(view.getByRole("button", { name: "Show actuators for τ2 Elbow" }));
    expect(view.getByRole("heading", { name: "Actuators for τ2 Elbow" })).toBeTruthy();
    const use = view.container.querySelector(".req-use") as HTMLButtonElement;
    const kg = Number(/Use ([\d.]+) kg/.exec(use.textContent ?? "")?.[1]);
    fireEvent.click(use);
    const expected = 33.91 + (kg - 1) * G * 0.4;
    expect(Number.parseFloat(values()[0] ?? "")).toBeCloseTo(expected, 1);
    expect(new URLSearchParams(window.location.search).get("a")).toBe(`${kg},0.5,0`);
});
