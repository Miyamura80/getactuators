import type { SourceId, Sourced } from "../sourced";
import { type Site, hq, plant } from "./types";

// Sites for the second /china batch (#80): headquarters of the companies in
// companies/china-more, their plants, and foreign-owned plants in China
// (ABB, Schaeffler, Neo). Pins are city centres ("city"); "region" means
// only the province is public. As in ./china-plants, a plant carries a
// status only when a source states one. HQs spread into CHINA_SITES, plants
// into CHINA_PLANTS.

const BEIJING: [number, number] = [39.9, 116.41];
const SHENZHEN: [number, number] = [22.54, 114.06];
const HANGZHOU: [number, number] = [30.27, 120.15];

export const head = (
    companyId: string,
    name: string,
    admin1: string,
    [lat, lon]: [number, number],
    sources: SourceId[],
    extra: Partial<Site> = {},
): Site => ({
    ...hq(`${companyId}-hq`, {
        companyId,
        name: `${name} headquarters`,
        country: "CN",
        admin1,
        lat,
        lon,
        sources,
    }),
    ...extra,
});

type P = Parameters<typeof plant>[1];

// A plant with no status unless the record gives one.
export const cnPlant = (id: string, p: Omit<P, "country">): Site => {
    const { status: _default, ...site } = plant(id, { country: "CN", ...p });
    return p.status ? { ...site, status: p.status } : site;
};

export const opened = (year: number, sources: SourceId[]): Sourced<number> => ({
    value: year,
    unit: "year",
    sources,
    asOf: String(year),
    confidence: "reported",
});

const ROBOTS: Site["stages"] = ["robot"];

export const CHINA_MORE_SITES: Site[] = [
    head(
        "guohua",
        "Guohua Intelligent",
        "Shandong",
        [36.07, 120.38],
        ["ethercat-guohua"],
        {
            name: "Qingdao headquarters and joint module line",
            makes: ["Harmonic reducers", "Planetary roller screws", "Joint modules"],
            stages: ["gearing", "screw", "actuator"],
            capacity: {
                value: 50000,
                unit: "sets/yr",
                sources: ["36kr-guohua-2025"],
                asOf: "2025-09",
                confidence: "reported",
                note: "Precision transmission components, as stated by the company in 2025.",
            },
        },
    ),
    head("cubemars", "CubeMars", "Jiangxi", [28.68, 115.86], ["wrc-cubemars"]),
    head("damiao", "DAMIAO", "Guangdong", SHENZHEN, ["wrc-damiao"]),
    head(
        "kepler",
        "Kepler",
        "Shanghai",
        [31.21, 121.6],
        ["gasgoo-kepler-binzhou-2026"],
    ),
    head("booster", "Booster Robotics", "Beijing", BEIJING, [
        "chinadailyhk-booster-2025",
    ]),
    head("engineai", "EngineAI", "Guangdong", SHENZHEN, ["ie-engineai-factory"]),
    head("deep-robotics", "Deep Robotics", "Zhejiang", HANGZHOU, [
        "yicai-deep-robotics-2025",
    ]),
    head(
        "agilex",
        "AgileX Robotics",
        "Guangdong",
        [22.53, 113.93],
        ["howtorobot-agilex"],
    ),
    head(
        "jaka",
        "JAKA Robotics",
        "Shanghai",
        [31.11, 121.38],
        ["technode-jaka-ipo-2023", "jaka-cobots-2026"],
    ),
    head("aubo", "AUBO Robotics", "Beijing", BEIJING, ["ethercat-aubo"]),
    head("rokae", "ROKAE", "Beijing", [39.98, 116.31], ["yicai-rokae-2021"]),
    head("byd", "BYD", "Guangdong", [22.69, 114.35], ["wiki-byd"]),
    head("geely", "Geely Holding", "Zhejiang", [30.21, 120.21], ["wiki-geely"]),
    head(
        "dongfeng-liuzhou",
        "Dongfeng Liuzhou Motor",
        "Guangxi",
        [24.33, 109.43],
        ["chinadaily-ubtech-factories-2025"],
    ),
];

export const CHINA_MORE_PLANTS: Site[] = [
    // Screws and joints
    cnPlant("wuzhou-xinchun-xinchang", {
        companyId: "wuzhou-xinchun",
        name: "Xinchang High-tech Park roller screw project",
        admin1: "Zhejiang",
        lat: 29.49,
        lon: 120.91,
        precision: "city",
        makes: ["Planetary roller screws", "Micro ball screws", "Robot bearings"],
        stages: ["screw", "bearing"],
        status: "announced",
        sources: ["yicai-wuzhou-prs-2025"],
    }),
    cnPlant("cubemars-hangzhou", {
        companyId: "cubemars",
        name: "Hangzhou CubeMars Intelligent Technology",
        admin1: "Zhejiang",
        lat: HANGZHOU[0],
        lon: HANGZHOU[1],
        precision: "city",
        makes: ["Rotary actuators", "Encoders", "Motor drives"],
        stages: ["actuator", "electronics"],
        sources: ["ethercat-cubemars-hangzhou"],
    }),
    // Robot makers
    cnPlant("kepler-binzhou", {
        companyId: "kepler",
        name: "Binzhou manufacturing hub and data centre",
        admin1: "Shandong",
        lat: 37.38,
        lon: 118.0,
        precision: "city",
        makes: ["Specialised robots"],
        stages: ROBOTS,
        sources: ["gasgoo-kepler-binzhou-2026"],
    }),
    cnPlant("engineai-honghualing", {
        companyId: "engineai",
        name: "Honghualing manufacturing base",
        admin1: "Guangdong",
        lat: 22.59,
        lon: 113.95,
        precision: "city",
        makes: ["T800 humanoids"],
        stages: ROBOTS,
        sources: ["ie-engineai-factory"],
    }),
    cnPlant("engineai-zhengzhou", {
        companyId: "engineai",
        name: "Zhengzhou intelligent manufacturing base",
        admin1: "Henan",
        lat: 34.75,
        lon: 113.62,
        precision: "city",
        makes: ["Humanoid robots"],
        stages: ROBOTS,
        status: "construction",
        sources: ["ie-engineai-factory"],
    }),
    cnPlant("jaka-changzhou", {
        companyId: "jaka",
        name: "Changzhou facility",
        admin1: "Jiangsu",
        lat: 31.81,
        lon: 119.97,
        precision: "city",
        stages: ROBOTS,
        sources: ["technode-jaka-ipo-2023"],
    }),
    cnPlant("jaka-shenzhen", {
        companyId: "jaka",
        name: "Shenzhen facility",
        admin1: "Guangdong",
        lat: SHENZHEN[0],
        lon: SHENZHEN[1],
        precision: "city",
        stages: ROBOTS,
        sources: ["technode-jaka-ipo-2023"],
    }),
    cnPlant("aubo-zibo", {
        companyId: "aubo",
        name: "AUBO (Shandong) cobot components factory",
        admin1: "Shandong",
        lat: 36.81,
        lon: 118.05,
        precision: "city",
        makes: ["Collaborative robots", "Cobot core components"],
        stages: ["actuator", "robot"],
        opened: opened(2022, ["chinadaily-aubo-zibo-2023"]),
        sources: ["chinadaily-aubo-zibo-2023"],
    }),
    cnPlant("rokae-shandong", {
        companyId: "rokae",
        name: "Shandong smart robot factory",
        admin1: "Shandong",
        lat: 37.0,
        lon: 119.0,
        precision: "region",
        makes: ["Light industrial robots"],
        stages: ROBOTS,
        capacity: {
            value: 10000,
            unit: "units/yr",
            sources: ["yicai-rokae-2021"],
            asOf: "2021-05",
            confidence: "reported",
            note: "Planned annual output when the factory was under construction in 2021.",
        },
        sources: ["yicai-rokae-2021"],
    }),
    // Foreign-owned plants
    cnPlant("abb-kangqiao", {
        companyId: "abb",
        name: "ABB Robotics mega factory, Kangqiao",
        admin1: "Shanghai",
        lat: 31.14,
        lon: 121.57,
        precision: "city",
        makes: ["Industrial robots"],
        stages: ROBOTS,
        opened: opened(2022, ["ran-abb-kangqiao-2022"]),
        sources: ["ran-abb-kangqiao-2022"],
    }),
    cnPlant("schaeffler-taicang-humanoid", {
        companyId: "schaeffler",
        name: "Taicang Humanoid Lighthouse",
        admin1: "Jiangsu",
        lat: 31.46,
        lon: 121.13,
        precision: "city",
        makes: ["Humanoid joint modules", "Roller screws", "Bearings"],
        stages: ["bearing", "screw", "actuator"],
        opened: opened(2026, ["humanoidguide-schaeffler-taicang-2026"]),
        sources: [
            "humanoidguide-schaeffler-taicang-2026",
            "gasgoo-schaeffler-leju-2026",
        ],
    }),
    cnPlant("neo-magnequench-tianjin", {
        companyId: "neo-performance",
        name: "Neo Magnequench Tianjin plant",
        admin1: "Tianjin",
        lat: 39.13,
        lon: 117.2,
        precision: "city",
        makes: ["NdFeB magnetic powders", "Compression-moulded magnets"],
        stages: ["magnet"],
        opened: opened(1998, ["neo-tianjin-2019"]),
        sources: ["neo-tianjin-2019"],
    }),
    cnPlant("jamr-jiangyin", {
        companyId: "shenghe-resources",
        kind: "refinery",
        name: "Jiangyin Jiahua Advanced Material Resources (JAMR)",
        admin1: "Jiangsu",
        lat: 31.92,
        lon: 120.28,
        precision: "city",
        makes: ["Heavy rare earth products"],
        stages: ["separation"],
        sources: ["magneticsmag-neo-shenghe-2025"],
    }),
];
