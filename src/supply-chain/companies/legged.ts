import type { Company } from "./types";

// Legged-robot makers the registry lacked: Ghost Robotics (US quadrupeds,
// controlled by LIG Nex1 since July 2024), ANYbotics (Swiss inspection
// quadrupeds) and LIG Nex1 itself, as the owner. Sources in ./legged-sources.

export const LEGGED_COMPANIES: Company[] = [
    {
        id: "ghost-robotics",
        name: "Ghost Robotics",
        hqCountry: "US",
        stages: ["robot"],
        segment: "robot-actuator-oem",
        ownership: { kind: "subsidiary", parent: "LIG Nex1" },
        products: [
            "Vision 60 quadruped unmanned ground vehicle",
            "Manipulator arm for Vision 60",
        ],
        url: "https://www.ghostrobotics.io/",
        sources: [
            "trr-lig-ghost-2024",
            "prn-ghost-lig-close-2024",
            "trr-ghost-arm-2025",
        ],
    },
    {
        id: "anybotics",
        name: "ANYbotics",
        hqCountry: "CH",
        stages: ["robot"],
        segment: "robot-actuator-oem",
        ownership: { kind: "private" },
        products: ["ANYmal inspection quadruped", "ANYmal X (explosion-proof version)"],
        url: "https://www.anybotics.com/",
        sources: ["siliconcanals-anybotics", "venturelab-anybotics-2025"],
    },
    {
        id: "lig-nex1",
        name: "LIG Nex1",
        localName: "LIG넥스원",
        hqCountry: "KR",
        stages: ["robot"],
        segment: "robot-actuator-oem",
        ownership: { kind: "listed", ticker: "KRX: 079550" },
        products: [
            "Guided weapons and defence electronics",
            "Controlling owner of Ghost Robotics",
        ],
        url: "https://www.lignex1.com/",
        sources: ["wiki-lig-nex1", "trr-lig-ghost-2024"],
    },
];
