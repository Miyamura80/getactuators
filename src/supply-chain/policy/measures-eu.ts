import type { PolicyMeasure } from "./types";

// European Union: the Critical Raw Materials Act and its strategic project
// rounds, RESourceEU, and the machinery and motor rules that reach actuators.

export const EU_MEASURES: PolicyMeasure[] = [
    {
        id: "eu-crma-2024",
        jurisdiction: "EU",
        type: "subsidy",
        title: "Critical Raw Materials Act",
        summary:
            "Regulation 2024/1252 lists strategic raw materials, rare earths for magnets among them, sets 2030 benchmarks for EU extraction, processing and recycling and a cap on reliance on one country, and gives strategic projects faster permits and funding access.",
        issuer: "European Parliament and Council",
        announced: "2024-05-03",
        effective: "2024-05-23",
        status: "in-force",
        statusHistory: [
            {
                date: "2024-05-03",
                status: "announced",
                note: "Published in the Official Journal.",
                sources: ["eurlex-crma-2024"],
            },
            { date: "2024-05-23", status: "in-force", sources: ["eurlex-crma-2024"] },
        ],
        stages: ["mining", "separation", "metal-alloy", "magnet"],
        scope: "sector",
        sources: ["eurlex-crma-2024"],
    },
    {
        id: "eu-crma-projects-2025",
        jurisdiction: "EU",
        type: "subsidy",
        title: "First 47 CRMA strategic projects",
        summary:
            "The Commission selected 47 strategic projects in 13 member states covering extraction, processing, recycling and substitution, including Carester's Caremag rare earth plant in France, with permits capped at 27 months for mines and 15 for processing.",
        issuer: "European Commission",
        announced: "2025-03-25",
        status: "in-force",
        statusHistory: [
            {
                date: "2025-03-25",
                status: "in-force",
                sources: ["ec-crma-projects-2025"],
            },
        ],
        stages: ["mining", "separation", "metal-alloy", "magnet"],
        scope: "product",
        companiesAffected: ["Carester"],
        sources: ["ec-crma-projects-2025"],
    },
    {
        id: "eu-crma-third-countries-2025",
        jurisdiction: "EU",
        type: "subsidy",
        title: "13 CRMA strategic projects outside the EU",
        summary:
            "The Commission recognised 13 strategic projects in third countries and overseas territories, seven of them in strategic partner countries, needing about €5.5 billion of investment to start operating.",
        issuer: "European Commission",
        announced: "2025-06-04",
        status: "in-force",
        statusHistory: [
            { date: "2025-06-04", status: "in-force", sources: ["ec-crma-third-2025"] },
        ],
        stages: ["mining", "separation"],
        scope: "product",
        sources: ["ec-crma-third-2025"],
    },
    {
        id: "eu-crma-projects-2026",
        jurisdiction: "EU",
        type: "subsidy",
        title: "46 more CRMA strategic projects, four for magnet rare earths",
        summary:
            "The second selection round added 46 projects, four on rare earths for the permanent magnet chain: Rhodia's BREES separation expansion in France, HyProMag GmbH recycling in Germany, Neo's Silmet 2.0 in Estonia and the Sokli mine in Finland.",
        issuer: "European Commission",
        announced: "2026-10-09",
        status: "in-force",
        statusHistory: [
            {
                date: "2026-10-09",
                status: "in-force",
                sources: ["ec-crma-projects-2026"],
            },
        ],
        stages: ["mining", "separation", "metal-alloy", "magnet"],
        scope: "product",
        companiesAffected: [
            "Rhodia (Solvay)",
            "HyProMag",
            "Neo Performance Materials",
            "Sokli Oy",
        ],
        sources: ["ec-crma-projects-2026", "fastmarkets-crma-ree-2026"],
    },
    {
        id: "eu-resourceeu-2025",
        jurisdiction: "EU",
        type: "subsidy",
        title: "RESourceEU action plan",
        summary:
            "Up to €3 billion over 12 months for projects that can supply critical raw materials soon, a European Critical Raw Materials Centre for joint purchasing and stockpiling, and a first matchmaking round on rare earth magnets. Aims to cut single-supplier reliance by up to 50% by 2029.",
        issuer: "European Commission",
        announced: "2025-12-03",
        status: "in-force",
        statusHistory: [
            { date: "2025-12-03", status: "in-force", sources: ["ec-resourceeu-2025"] },
        ],
        stages: ["separation", "metal-alloy", "magnet"],
        scope: "sector",
        sources: ["ec-resourceeu-2025", "ec-resourceeu-com-2025"],
    },
    {
        id: "eu-magnet-scrap-export-2026",
        jurisdiction: "EU",
        type: "export-control",
        title: "Planned limits on exporting magnet scrap",
        summary:
            "RESourceEU commits the Commission to propose restrictions on exporting permanent magnet scraps and waste, after an assessment, to keep rare earth feedstock in Europe. No proposal had been published by October 2026.",
        issuer: "European Commission",
        announced: "2025-12-03",
        status: "announced",
        statusHistory: [
            {
                date: "2025-12-03",
                status: "announced",
                sources: ["ec-resourceeu-com-2025"],
            },
        ],
        stages: ["magnet"],
        scope: "product",
        sources: ["ec-resourceeu-com-2025"],
    },
    {
        id: "eu-machinery-regulation-2023",
        jurisdiction: "EU",
        type: "standard",
        title: "Machinery Regulation",
        summary:
            "Regulation 2023/1230 replaces the Machinery Directive and sets the safety rules every robot and powered machine sold in the EU must meet, including AI-driven and autonomous mobile machinery. It applies from 20 January 2027.",
        issuer: "European Parliament and Council",
        announced: "2023-06-29",
        effective: "2027-01-20",
        status: "announced",
        statusHistory: [
            {
                date: "2023-06-29",
                status: "announced",
                note: "Published; applies from 20 January 2027.",
                sources: ["eurlex-machinery-2023"],
            },
        ],
        stages: ["actuator", "robot"],
        scope: "sector",
        sources: ["eurlex-machinery-2023"],
    },
    {
        id: "eu-ecodesign-motors-2019",
        jurisdiction: "EU",
        type: "standard",
        title: "Ecodesign rules for motors and drives",
        summary:
            "Regulation 2019/1781 sets minimum efficiency for induction motors from 0.12 to 1,000 kW and for variable speed drives, IE3 for most three-phase motors from July 2021. Permanent magnet servo motors sit outside its induction-motor scope.",
        issuer: "European Commission",
        announced: "2019-10-01",
        effective: "2021-07-01",
        status: "in-force",
        statusHistory: [
            {
                date: "2019-10-01",
                status: "announced",
                sources: ["eurlex-motors-2019"],
            },
            { date: "2021-07-01", status: "in-force", sources: ["eurlex-motors-2019"] },
        ],
        stages: ["motor", "electronics"],
        scope: "product",
        sources: ["eurlex-motors-2019"],
    },
];
