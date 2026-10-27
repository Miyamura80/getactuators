import type { PolicyMeasure } from "./types";

// International standards bodies (ISO/TC 299 Robotics, IEC TC 2 and TC 22):
// the safety and efficiency standards an actuator or robot is built against.
// Draft status is as listed on the catalogue page when the dataset was built.

export const INTL_MEASURES: PolicyMeasure[] = [
    {
        id: "iso-10218-2011",
        jurisdiction: "INTL",
        type: "standard",
        title: "ISO 10218-1 and -2:2011 industrial robot safety",
        summary:
            "The second edition of the industrial robot safety standard: Part 1 for the robot, Part 2 for robot systems and integration. Withdrawn when the 2025 edition was published.",
        issuer: "ISO/TC 299",
        effective: "2011",
        expires: "2025-02",
        status: "expired",
        statusHistory: [
            { date: "2011", status: "in-force", sources: ["iso-10218-1-2011"] },
            {
                date: "2025-02",
                status: "expired",
                note: "Replaced by ISO 10218-1:2025.",
                sources: ["iso-10218-1-2011", "iso-10218-1-2025"],
            },
        ],
        stages: ["actuator", "robot"],
        scope: "sector",
        sources: ["iso-10218-1-2011"],
    },
    {
        id: "iso-10218-2025",
        jurisdiction: "INTL",
        type: "standard",
        title: "ISO 10218-1 and -2:2025 industrial robot safety",
        summary:
            "Third edition: Part 1 treats the robot as partly completed machinery, Part 2 covers applications and cells. Adds Class I and II robots for functional safety, cybersecurity, and folds in the collaborative requirements from ISO/TS 15066.",
        issuer: "ISO/TC 299",
        effective: "2025-02",
        status: "in-force",
        statusHistory: [
            {
                date: "2025-02",
                status: "in-force",
                sources: ["iso-10218-1-2025", "iso-10218-2-2025"],
            },
        ],
        stages: ["actuator", "robot"],
        scope: "sector",
        sources: ["iso-10218-1-2025", "iso-10218-2-2025"],
    },
    {
        id: "iso-ts-15066-2016",
        jurisdiction: "INTL",
        type: "standard",
        title: "ISO/TS 15066 collaborative robots",
        summary:
            "Technical specification for robots working beside people, with the force and pressure limits used to size power and force limited joints. Reviewed and confirmed in 2022.",
        issuer: "ISO/TC 299",
        effective: "2016",
        status: "in-force",
        statusHistory: [
            { date: "2016", status: "in-force", sources: ["iso-ts-15066"] },
            {
                date: "2022",
                status: "in-force",
                note: "Reviewed and confirmed.",
                sources: ["iso-ts-15066"],
            },
        ],
        stages: ["actuator", "robot"],
        scope: "sector",
        sources: ["iso-ts-15066"],
    },
    {
        id: "iso-13482-2014",
        jurisdiction: "INTL",
        type: "standard",
        title: "ISO 13482:2014 personal care robots",
        summary:
            "Safety requirements for mobile servant robots, physical assistant robots and person carriers, the closest published standard for service humanoids. Confirmed in 2020; a second edition is at final draft.",
        issuer: "ISO/TC 299",
        effective: "2014",
        status: "in-force",
        statusHistory: [
            { date: "2014", status: "in-force", sources: ["iso-13482-2014"] },
            {
                date: "2020",
                status: "in-force",
                note: "Reviewed and confirmed.",
                sources: ["iso-13482-2014"],
            },
        ],
        stages: ["actuator", "robot"],
        scope: "sector",
        sources: ["iso-13482-2014"],
    },
    {
        id: "iso-fdis-13482",
        jurisdiction: "INTL",
        type: "standard",
        title: "ISO 13482 second edition: service robots",
        summary:
            "Retitled Safety requirements for service robots, the revision widens ISO 13482 from personal care to service robots in personal and professional use. Listed as a final draft in the approval stage.",
        issuer: "ISO/TC 299",
        status: "draft",
        statusHistory: [
            {
                date: "2026-10",
                status: "draft",
                note: "FDIS, approval stage.",
                sources: ["iso-fdis-13482"],
            },
        ],
        stages: ["actuator", "robot"],
        scope: "sector",
        sources: ["iso-fdis-13482"],
    },
    {
        id: "iso-25785-1",
        jurisdiction: "INTL",
        type: "standard",
        title: "ISO 25785-1 dynamically stable mobile robots (legged)",
        summary:
            "The first ISO safety standard written for robots that must actively balance and can fall without power: bipeds, quadrupeds and wheeled balancers in industry. Part 2 will cover their integration.",
        issuer: "ISO/TC 299",
        status: "draft",
        statusHistory: [
            {
                date: "2026-10",
                status: "draft",
                note: "Committee draft.",
                sources: ["iso-cd-25785-1"],
            },
        ],
        stages: ["actuator", "robot"],
        scope: "sector",
        sources: ["iso-cd-25785-1"],
    },
    {
        id: "iec-61800-5-2",
        jurisdiction: "INTL",
        type: "standard",
        title: "IEC 61800-5-2 functional safety of drives",
        summary:
            "Requirements for safety-related servo and variable speed drives within the IEC 61508 framework: the safe torque off, safe stop and safely limited speed functions in robot joint drives. The 2016 edition replaced the 2007 one.",
        issuer: "IEC",
        effective: "2016-04-18",
        status: "in-force",
        statusHistory: [
            { date: "2007", status: "in-force", sources: ["iec-61800-5-2-2007"] },
            {
                date: "2016-04-18",
                status: "in-force",
                note: "Second edition.",
                sources: ["iec-61800-5-2-2016", "iec-61800-5-2-2007"],
            },
        ],
        stages: ["motor", "electronics", "actuator"],
        scope: "product",
        sources: ["iec-61800-5-2-2016"],
    },
    {
        id: "iec-60034-30-1",
        jurisdiction: "INTL",
        type: "standard",
        title: "IEC 60034-30-1 motor efficiency classes (IE code)",
        summary:
            "Defines the IE efficiency classes for single-speed motors from 0.12 to 1,000 kW that efficiency laws such as the EU ecodesign rules cite. Edition 2.0 in 2025 replaced the 2014 edition.",
        issuer: "IEC",
        effective: "2014-03",
        status: "in-force",
        statusHistory: [
            { date: "2014-03", status: "in-force", sources: ["iec-60034-30-1-2014"] },
            {
                date: "2025",
                status: "in-force",
                note: "Edition 2.0.",
                sources: ["iec-60034-30-1-2025"],
            },
        ],
        stages: ["motor"],
        scope: "product",
        sources: ["iec-60034-30-1-2025", "iec-60034-30-1-2014"],
    },
];
