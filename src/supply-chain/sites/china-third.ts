import { cnPlant, opened } from "./china-more";
import type { Site } from "./types";

// Plants for the fourth /china batch (#80): foreign-owned reducer, bearing,
// linear motion, servo, pneumatics and robot plants in China (Sumitomo,
// Timken, SKF, THK, Yaskawa, Festo, KUKA). Pins are city centres or a point
// in the named district ("city"). A plant carries a status only when a
// source states one. Spread into CHINA_PLANTS.

const THK = ["thk-overseas-plants"];
const SHI_TANGSHAN = ["shi-tangshan"];
const TIMKEN = ["timken-xemc-xiangtan-2010"];
const SKF = ["skf-dalian-2011"];
const YASKAWA = ["yaskawa-shenyang-2018"];

// A THK manufacturing subsidiary in China, as listed among THK's overseas
// production bases (no products or dates given there).
const thkPlant = (
    id: string,
    unit: string,
    admin1: string,
    [lat, lon]: [number, number],
    sources: string[] = THK,
): Site =>
    cnPlant(`thk-${id}`, {
        companyId: "thk",
        name: `THK Manufacturing of China (${unit})`,
        admin1,
        lat,
        lon,
        precision: "city",
        makes: ["Linear motion components"],
        stages: ["bearing", "screw"],
        status: "operating",
        sources,
    });

export const CHINA_THIRD_PLANTS: Site[] = [
    // Reducers
    cnPlant("sumitomo-heavy-tangshan", {
        companyId: "sumitomo-heavy",
        name: "Tangshan large reducer plant",
        admin1: "Hebei",
        lat: 39.63,
        lon: 118.18,
        precision: "city",
        makes: ["Large industrial reducers"],
        stages: ["gearing"],
        opened: opened(2009, SHI_TANGSHAN),
        sources: SHI_TANGSHAN,
    }),
    cnPlant("sumitomo-heavy-tianjin", {
        companyId: "sumitomo-heavy",
        name: "Sumitomo (SHI) Cyclo Drive China, Tianjin",
        admin1: "Tianjin",
        lat: 39.09,
        lon: 117.31,
        precision: "city",
        makes: ["Reducers and gearmotors"],
        stages: ["gearing"],
        sources: ["shi-tianjin"],
    }),
    // Bearings
    cnPlant("timken-xiangtan", {
        companyId: "timken",
        name: "Timken-XEMC wind bearing plant, Xiangtan",
        admin1: "Hunan",
        lat: 27.83,
        lon: 112.94,
        precision: "city",
        makes: ["Ultra-large bore wind turbine bearings"],
        stages: ["bearing"],
        opened: opened(2010, TIMKEN),
        sources: TIMKEN,
    }),
    cnPlant("timken-wuxi", {
        companyId: "timken",
        name: "Wuxi wind bearing plant",
        admin1: "Jiangsu",
        lat: 31.49,
        lon: 120.31,
        precision: "city",
        makes: ["Wind turbine bearings"],
        stages: ["bearing"],
        sources: TIMKEN,
    }),
    cnPlant("skf-dalian", {
        companyId: "skf",
        name: "SKF Dalian large and medium bearing factories",
        admin1: "Liaoning",
        lat: 39.06,
        lon: 121.8,
        precision: "city",
        makes: ["Large and medium industrial bearings"],
        stages: ["bearing"],
        opened: opened(2006, SKF),
        sources: SKF,
    }),
    // Linear motion
    thkPlant(
        "wuxi",
        "Wuxi",
        "Jiangsu",
        [31.55, 120.36],
        [...THK, "wuxi-thk-base-2023"],
    ),
    thkPlant("liaoning", "Liaoning", "Liaoning", [39.06, 121.82]),
    thkPlant("dalian", "Dalian", "Liaoning", [39.1, 121.73]),
    thkPlant("changzhou", "Changzhou", "Jiangsu", [31.87, 119.97]),
    // Servo motors, pneumatics and robots
    cnPlant("yaskawa-shenyang", {
        companyId: "yaskawa",
        name: "Yaskawa Electric (Shenyang) servo plants",
        admin1: "Liaoning",
        lat: 41.73,
        lon: 123.27,
        precision: "city",
        makes: ["AC servo motors", "Servo amplifiers", "Robot controllers"],
        stages: ["motor", "electronics"],
        status: "operating",
        sources: YASKAWA,
    }),
    cnPlant("festo-jinan", {
        companyId: "festo",
        name: "Jinan Global Production Center",
        admin1: "Shandong",
        lat: 36.65,
        lon: 117.12,
        precision: "city",
        makes: ["Valves", "Cylinders", "Electric drives"],
        stages: ["actuator"],
        status: "operating",
        sources: ["festo-jinan-2021"],
    }),
    cnPlant("kuka-shanghai", {
        companyId: "kuka",
        name: "Shanghai robot and controller factory",
        admin1: "Shanghai",
        lat: 31.03,
        lon: 121.23,
        precision: "region",
        makes: ["QUANTEC industrial robots", "Robot controllers"],
        stages: ["robot"],
        opened: opened(2013, ["therobotreport-kuka-shanghai-2013"]),
        sources: ["therobotreport-kuka-shanghai-2013"],
    }),
];
