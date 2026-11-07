import type { Company } from "./types";

// The second /china batch (#80): humanoid, cobot and joint makers, two
// component makers, and three carmakers that buy or back Chinese robots.
// Spread into CHINA_COMPANIES (./china). Ownership is left out where no
// source read for this batch states it.

type Seg = Company["segment"];

function cn(
    id: string,
    name: string,
    segment: Seg,
    rest: Omit<Company, "id" | "name" | "segment" | "hqCountry">,
): Company {
    return { id, name, segment, hqCountry: "CN", ...rest };
}

const GEAR: Seg = "gears-screws-bearings";
const OEM: Seg = "robot-actuator-oem";
const PRIVATE = { kind: "private" } as const;

export const CHINA_MORE_COMPANIES: Company[] = [
    // Gears, screws and joint parts
    cn("guohua", "Guohua Intelligent", GEAR, {
        stages: ["gearing", "screw", "actuator"],
        ownership: PRIVATE,
        products: [
            "Harmonic reducers",
            "Planetary roller screws",
            "Rotary and linear joint modules",
        ],
        url: "https://eu.36kr.com/en/p/3454790669260416",
        sources: ["36kr-guohua-2025", "ethercat-guohua"],
    }),
    cn("wuzhou-xinchun", "Wuzhou Xinchun", GEAR, {
        stages: ["screw", "bearing"],
        ownership: { kind: "listed", ticker: "SHA: 603667" },
        products: [
            "Planetary roller screws and robot bearings (project planned in 2025)",
            "Automotive screws",
        ],
        url: "https://www.yicaiglobal.com/star50news/2025_02_286798911192308908066",
        sources: ["yicai-wuzhou-prs-2025"],
    }),
    // Motors and joint actuators
    cn("cubemars", "CubeMars", OEM, {
        stages: ["motor", "actuator"],
        products: [
            "AK series actuator modules",
            "Frameless torque motors",
            "Outrunner brushless motors",
        ],
        url: "https://wrc.cie.org.cn/list_339/645.html",
        sources: ["wrc-cubemars", "ethercat-cubemars-hangzhou"],
    }),
    cn("damiao", "DAMIAO", OEM, {
        stages: ["motor", "electronics", "actuator"],
        products: ["DM-J joint motors", "Motor drives"],
        url: "https://www.worldrobotconference.com/list_339/550.html",
        sources: ["wrc-damiao"],
    }),
    // Humanoids, quadrupeds and cobots
    cn("kepler", "Kepler", OEM, {
        stages: ["robot"],
        products: ["K2 Bumblebee humanoid (roller screw and rotary actuators)"],
        url: "https://autonews.gasgoo.com/articles/ICV/kepler-robot-establishes-base-in-binzhou-shandong-2021209419952435201",
        sources: ["gasgoo-kepler-binzhou-2026"],
    }),
    cn("booster", "Booster Robotics", OEM, {
        stages: ["robot"],
        ownership: PRIVATE,
        products: ["K1 and T1 small humanoids"],
        url: "https://autonews.gasgoo.com/articles/news/embodied-ai-company-booster-robotics-completes-nearly-1-billion-yuan-financing-2046225660790435840",
        sources: ["gasgoo-booster-2026", "chinadailyhk-booster-2025"],
    }),
    cn("engineai", "EngineAI", OEM, {
        stages: ["actuator", "robot"],
        ownership: PRIVATE,
        products: ["T800 and PM01 humanoids", "In-house joint modules"],
        url: "https://interestingengineering.com/ai-robotics/china-engineai-humanoid-robot-factory",
        sources: ["prn-engineai-2025", "ie-engineai-factory"],
    }),
    cn("deep-robotics", "Deep Robotics", OEM, {
        stages: ["actuator", "robot"],
        ownership: PRIVATE,
        products: [
            "Jueying X30 and Lite3 quadrupeds",
            "LYNX M20 quadruped",
            "DR02 humanoid",
            "J-series joint modules",
        ],
        url: "https://www.deeprobotics.cn/en",
        sources: [
            "yicai-deep-robotics-2025",
            "deeprobotics-site",
            "deeprobotics-x30-2023",
        ],
    }),
    cn("agilex", "AgileX Robotics", OEM, {
        stages: ["robot"],
        ownership: PRIVATE,
        products: ["Mobile robot chassis (UGV, AGV, tracked)", "Mobile manipulators"],
        url: "https://www.howtorobot.com/robot-suppliers/agilex-robotics",
        sources: ["globalventuring-agilex-2021", "howtorobot-agilex"],
    }),
    cn("jaka", "JAKA Robotics", OEM, {
        stages: ["robot"],
        ownership: PRIVATE,
        products: ["Collaborative robots"],
        url: "https://www.jaka.com/",
        sources: ["technode-jaka-ipo-2023", "jaka-cobots-2026"],
    }),
    cn("aubo", "AUBO Robotics", OEM, {
        stages: ["robot"],
        products: ["Collaborative robots", "Cobot core components"],
        url: "https://www.ethercat.org/de/members/members_F72BB8BD1C8D46699BE612B485A33AB5.htm",
        sources: ["ethercat-aubo", "chinadaily-aubo-zibo-2023"],
    }),
    cn("rokae", "ROKAE", OEM, {
        stages: ["robot"],
        ownership: PRIVATE,
        products: [
            "Light industrial robots",
            "Humanoid joint modules (with Schaeffler)",
        ],
        url: "https://www.yicaiglobal.com/news/chinese-robot-maker-rokae-bags-usd314-million-in-new-funding-led-by-shenzhen-capital-grand-flight-",
        sources: ["yicai-rokae-2021", "gasgoo-schaeffler-rokae-2026"],
    }),
    // Carmakers that buy or back robots
    cn("byd", "BYD", OEM, {
        stages: ["robot"],
        products: ["Electric vehicles", "Investor in AgiBot", "Buyer of cobots"],
        url: "https://en.wikipedia.org/wiki/BYD_Company",
        sources: ["wiki-byd", "gasgoo-schaeffler-leju-2026"],
    }),
    cn("geely", "Geely Holding", OEM, {
        stages: ["robot"],
        products: [
            "Vehicles (Geely Auto, Zeekr)",
            "Factory partner for UBTech humanoids",
        ],
        url: "https://en.wikipedia.org/wiki/Geely_Holding_Group",
        sources: ["wiki-geely", "cnevpost-zeekr-ubtech-2024"],
    }),
    cn("dongfeng-liuzhou", "Dongfeng Liuzhou Motor", OEM, {
        stages: ["robot"],
        products: ["Vehicles", "Buyer of UBTech humanoids"],
        url: "https://ningbo.chinadaily.com.cn/2025-05/08/c_1091152.htm",
        sources: ["chinadaily-ubtech-factories-2025"],
    }),
];
