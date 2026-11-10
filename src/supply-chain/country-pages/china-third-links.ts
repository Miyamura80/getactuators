import type { ChinaLink } from "./china-more-links";

// Links for the fourth /china batch (#80): Leaderdrive's reducers in Unitree
// arms, Joyson's robot parts for AgiBot and Galbot, and Zhaowei's dexterous
// hand pact with Galbot. Spread into CHINA_LINKS (./china-links). Framework
// agreements and memoranda are partnerships, not supply.

const JOYSON_H1 = ["gasgoo-joyson-h1-2025"];

export const CHINA_THIRD_LINKS: ChinaLink[] = [
    {
        from: "leaderdrive",
        to: "unitree",
        what: "Harmonic reducers",
        sources: ["36kr-leaderdrive-hk-ipo-2026"],
        confidence: "estimated",
        note: "Unitree is named among Leaderdrive's humanoid customers in an article citing unnamed industry data; no volumes or contract are given.",
    },
    {
        from: "joyson",
        to: "agibot",
        what: "Joint development of humanoid core technology, custom solutions and test platforms",
        kind: "partnership",
        sources: JOYSON_H1,
        confidence: "reported",
        note: "Strategic cooperation agreement signed in the first half of 2025.",
    },
    {
        from: "joyson",
        to: "galbot",
        what: "Robot components",
        sources: JOYSON_H1,
        confidence: "estimated",
        note: "Galbot is listed among Joyson's robotics clients in its 2025 interim results; the parts supplied are not named.",
    },
    {
        from: "zhaowei",
        to: "galbot",
        what: "Dexterous hand development and deployment",
        kind: "partnership",
        sources: ["cs-zhaowei-hands-2025"],
        confidence: "reported",
        note: "One of 12 strategic memoranda Zhaowei signed at its July 2025 dexterous hand launch.",
    },
];
