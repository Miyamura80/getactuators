import type { PolicyMeasure } from "./types";

// Japan, Korea and Australia: JOGMEC's stake in Lynas, Economic Security
// Promotion Act grants to magnet, reducer and servo makers, Korea's robot and
// mineral plans, and Australia's critical mineral programmes.

export const JP_MEASURES: PolicyMeasure[] = [
    {
        id: "jp-jare-lynas-2011",
        jurisdiction: "JP",
        type: "subsidy",
        title: "JOGMEC and Sojitz back Lynas through JARE",
        summary:
            "JOGMEC and Sojitz set up Japan Australia Rare Earths and committed about US$250 million in loans and equity to Lynas, securing rare earths from its Mt Weld mine for Japan.",
        issuer: "JOGMEC",
        announced: "2011-03",
        status: "in-force",
        statusHistory: [
            { date: "2011-03", status: "in-force", sources: ["jogmec-jare-2011"] },
        ],
        stages: ["mining", "separation"],
        scope: "product",
        companiesAffected: ["Lynas Rare Earths", "Sojitz"],
        sources: ["jogmec-jare-2011"],
    },
    {
        id: "jp-jare-lynas-2022",
        jurisdiction: "JP",
        type: "subsidy",
        title: "JARE equity for Mt Weld exploration",
        summary:
            "JARE made a further equity investment in Lynas to fund exploration at the Mt Weld deposit.",
        issuer: "JOGMEC",
        announced: "2022-09-20",
        status: "in-force",
        statusHistory: [
            { date: "2022-09-20", status: "in-force", sources: ["jogmec-jare-2022"] },
        ],
        stages: ["mining"],
        scope: "product",
        companiesAffected: ["Lynas Rare Earths"],
        sources: ["jogmec-jare-2022"],
    },
    {
        id: "jp-jare-lynas-hree-2023",
        jurisdiction: "JP",
        type: "subsidy",
        title: "JARE buys A$200 million of Lynas for heavy rare earths",
        summary:
            "JARE added A$200 million of Lynas equity for capacity growth and the start of heavy rare earth separation, with a contract to supply Japan up to 65% of the dysprosium and terbium Lynas makes from Mt Weld.",
        issuer: "JOGMEC",
        announced: "2023-03-07",
        status: "in-force",
        statusHistory: [
            { date: "2023-03-07", status: "in-force", sources: ["jogmec-jare-2023"] },
        ],
        stages: ["separation"],
        scope: "product",
        companiesAffected: ["Lynas Rare Earths", "Sojitz"],
        elements: ["Dy", "Tb"],
        sources: ["jogmec-jare-2023"],
    },
    {
        id: "jp-espa-critical-products-2022",
        jurisdiction: "JP",
        type: "subsidy",
        title: "Magnets, robots and critical minerals named critical products",
        summary:
            "A Cabinet Order under the Economic Security Promotion Act named 11 specified critical products, among them permanent magnets, machine tools and industrial robots, and critical minerals, opening subsidies for plans that secure their supply.",
        issuer: "Cabinet of Japan",
        announced: "2022-12-20",
        status: "in-force",
        statusHistory: [
            { date: "2022-12-20", status: "in-force", sources: ["cao-espa-2022"] },
        ],
        stages: ["mining", "separation", "magnet", "motor", "gearing", "robot"],
        scope: "sector",
        sources: ["cao-espa-2022", "cao-espa-supply-chain"],
    },
    {
        id: "jp-espa-hds-reducers-2023",
        jurisdiction: "JP",
        type: "subsidy",
        title: "Grant for Harmonic Drive reducer capacity, later revoked",
        summary:
            "METI approved Harmonic Drive Systems' plan to secure strain wave reducer supply for machine tools and robots in June 2023 and amended it in October 2024. The approval was revoked on 8 August 2025.",
        issuer: "METI",
        announced: "2023-06-16",
        status: "expired",
        statusHistory: [
            {
                date: "2023-06-16",
                status: "in-force",
                sources: ["meti-espa-approvals"],
            },
            {
                date: "2024-10-02",
                status: "in-force",
                note: "Plan amended.",
                sources: ["meti-espa-approvals"],
            },
            {
                date: "2025-08-08",
                status: "expired",
                note: "Approval revoked.",
                sources: ["meti-espa-approvals"],
            },
        ],
        stages: ["gearing"],
        scope: "product",
        companiesAffected: ["Harmonic Drive Systems"],
        sources: ["meti-espa-approvals", "meti-robot-programme"],
    },
    {
        id: "jp-espa-yaskawa-servo-2023",
        jurisdiction: "JP",
        type: "subsidy",
        title: "Grant for Yaskawa servo capacity",
        summary:
            "METI approved Yaskawa Electric's supply-securing plan for servo mechanisms, the servo motors and amplifiers inside machine tools and robots, under the Economic Security Promotion Act.",
        issuer: "METI",
        announced: "2023-06-30",
        status: "in-force",
        statusHistory: [
            {
                date: "2023-06-30",
                status: "in-force",
                sources: ["meti-espa-approvals"],
            },
        ],
        stages: ["motor", "electronics"],
        scope: "product",
        companiesAffected: ["Yaskawa Electric"],
        sources: ["meti-espa-approvals", "meti-robot-programme"],
    },
    {
        id: "jp-espa-nidec-reducers-2023",
        jurisdiction: "JP",
        type: "subsidy",
        title: "Grant for Nidec Drive Technology reducers",
        summary:
            "METI approved Nidec Drive Technology's plan to secure reducer supply for machine tools and industrial robots.",
        issuer: "METI",
        announced: "2023-07-28",
        status: "in-force",
        statusHistory: [
            {
                date: "2023-07-28",
                status: "in-force",
                sources: ["meti-espa-approvals"],
            },
        ],
        stages: ["gearing"],
        scope: "product",
        companiesAffected: ["Nidec"],
        sources: ["meti-espa-approvals", "meti-robot-programme"],
    },
    {
        id: "jp-espa-aichi-magnets-2023",
        jurisdiction: "JP",
        type: "subsidy",
        title: "First permanent magnet grant: Aichi Steel",
        summary:
            "The first supply-securing plan approved for permanent magnets under the Economic Security Promotion Act went to Aichi Steel.",
        issuer: "METI",
        announced: "2023-08-25",
        status: "in-force",
        statusHistory: [
            {
                date: "2023-08-25",
                status: "in-force",
                sources: ["meti-espa-approvals"],
            },
        ],
        stages: ["magnet"],
        scope: "product",
        companiesAffected: ["Aichi Steel"],
        sources: ["meti-espa-approvals", "meti-magnet-programme"],
    },
    {
        id: "jp-espa-shinetsu-recycling-2025",
        jurisdiction: "JP",
        type: "subsidy",
        title: "Grant for Shin-Etsu magnet recycling",
        summary:
            "METI approved up to about ¥3.7 billion for Shin-Etsu Chemical to install equipment that recovers rare earth feedstock from scrap magnets, its second permanent magnet plan after April 2024.",
        issuer: "METI",
        announced: "2025-04-30",
        status: "in-force",
        statusHistory: [
            {
                date: "2025-04-30",
                status: "in-force",
                sources: ["meti-magnet-shinetsu-2025"],
            },
        ],
        stages: ["separation", "magnet"],
        scope: "product",
        companiesAffected: ["Shin-Etsu Chemical"],
        sources: ["meti-magnet-shinetsu-2025", "meti-espa-approvals"],
    },
    {
        id: "jp-espa-shinetsu-refining-2026",
        jurisdiction: "JP",
        type: "subsidy",
        title: "Grant for Shin-Etsu rare earth refining in Japan",
        summary:
            "The first critical minerals plan of 2026: about ¥17.5 billion for Shin-Etsu Chemical to build new rare earth refining equipment in Japan. Santoku received the second, for a similar plan, in July.",
        issuer: "METI",
        announced: "2026-05-19",
        status: "in-force",
        statusHistory: [
            {
                date: "2026-05-19",
                status: "in-force",
                sources: ["meti-minerals-programme"],
            },
        ],
        stages: ["separation", "metal-alloy"],
        scope: "product",
        companiesAffected: ["Shin-Etsu Chemical", "Santoku"],
        sources: ["meti-minerals-programme"],
    },
    {
        id: "jp-us-minerals-framework-2025",
        jurisdiction: "JP",
        type: "subsidy",
        title: "Japan and US critical minerals framework",
        summary:
            "Japan and the US agreed to coordinate financing, permitting, stockpiling and recycling of critical minerals and rare earths, with a rapid-response group to find supply gaps and screening of asset sales. Not legally binding.",
        issuer: "Government of Japan, The White House",
        announced: "2025-10-28",
        status: "in-force",
        statusHistory: [
            {
                date: "2025-10-28",
                status: "in-force",
                sources: ["wh-us-jp-framework-2025"],
            },
        ],
        stages: ["mining", "separation", "metal-alloy", "magnet"],
        scope: "sector",
        sources: ["wh-us-jp-framework-2025"],
    },
];

export const KR_MEASURES: PolicyMeasure[] = [
    {
        id: "kr-robot-basic-plan-4",
        jurisdiction: "KR",
        type: "subsidy",
        title: "4th Intelligent Robot Basic Plan, 2024 to 2028",
        summary:
            "MOTIE plans over 3 trillion won of public and private investment to 2030, eight core technologies including reducers, controllers, sensors and grippers, one million intelligent robots in use and over 80% local content in robot parts.",
        issuer: "MOTIE",
        announced: "2024-01-16",
        expires: "2028-12-31",
        status: "in-force",
        statusHistory: [
            {
                date: "2024-01-16",
                status: "in-force",
                sources: ["korea-robot-plan-2024"],
            },
        ],
        stages: ["gearing", "electronics", "actuator", "robot"],
        scope: "sector",
        sources: ["korea-robot-plan-2024"],
    },
    {
        id: "kr-supply-chain-act-2024",
        jurisdiction: "KR",
        type: "subsidy",
        title: "Framework Act on supply chain stabilisation",
        summary:
            "Creates a supply chain committee, economic security items and a Supply Chain Stabilisation Fund at the Export-Import Bank of Korea that lends to companies securing critical inputs such as minerals.",
        issuer: "Ministry of Economy and Finance",
        announced: "2023-12-26",
        effective: "2024-06-27",
        status: "in-force",
        statusHistory: [
            {
                date: "2023-12-26",
                status: "announced",
                sources: ["law-go-kr-supply-chain"],
            },
            {
                date: "2024-06-27",
                status: "in-force",
                sources: ["law-go-kr-supply-chain"],
            },
        ],
        stages: ["mining", "separation", "metal-alloy"],
        scope: "economy",
        sources: ["law-go-kr-supply-chain"],
    },
    {
        id: "kr-k-humanoid-2025",
        jurisdiction: "KR",
        type: "subsidy",
        title: "K-Humanoid Alliance",
        summary:
            "MOTIE launched an alliance of about 40 companies, universities and institutes to make Korea a leading humanoid power by 2030, with over one trillion won of investment expected.",
        issuer: "MOTIE",
        announced: "2025-04-10",
        status: "in-force",
        statusHistory: [
            {
                date: "2025-04-10",
                status: "in-force",
                sources: ["korea-humanoid-2025"],
            },
        ],
        stages: ["actuator", "robot"],
        scope: "sector",
        sources: ["korea-humanoid-2025"],
    },
    {
        id: "kr-ree-plan-2026",
        jurisdiction: "KR",
        type: "subsidy",
        title: "Rare earth supply plan: all 17 rare earths made critical",
        summary:
            "Korea's rare earth plan raised overseas resource development loans from 39 to 67.5 billion won with 70% coverage and proposed naming all 17 rare earths critical minerals. In September 2026 the critical list grew from 38 to 51.",
        issuer: "MOTIR",
        announced: "2026-02-05",
        status: "in-force",
        statusHistory: [
            {
                date: "2026-02-05",
                status: "announced",
                sources: ["korea-ree-plan-2026"],
            },
            {
                date: "2026-09-23",
                status: "in-force",
                note: "Designation plan confirmed.",
                sources: ["korea-ree-designation-2026"],
            },
        ],
        stages: ["mining", "separation", "metal-alloy"],
        scope: "sector",
        sources: ["korea-ree-plan-2026", "korea-ree-designation-2026"],
    },
];

export const AU_MEASURES: PolicyMeasure[] = [
    {
        id: "au-critical-minerals-strategy-2023",
        jurisdiction: "AU",
        type: "subsidy",
        title: "Critical Minerals Strategy 2023 to 2030",
        summary:
            "Australia's framework to move from mining into processing, with six focus areas from project development to international partnerships and A$500 million targeted through the Northern Australia Infrastructure Facility.",
        issuer: "Department of Industry, Science and Resources",
        announced: "2023-06-20",
        expires: "2030-12-31",
        status: "in-force",
        statusHistory: [
            {
                date: "2023-06-20",
                status: "in-force",
                sources: ["au-cm-strategy-2023"],
            },
        ],
        stages: ["mining", "separation"],
        scope: "sector",
        sources: ["au-cm-strategy-2023"],
    },
    {
        id: "au-cmpti-2027",
        jurisdiction: "AU",
        type: "subsidy",
        title: "Critical Minerals Production Tax Incentive",
        summary:
            "A refundable tax offset of 10% of eligible processing and refining costs for the 31 minerals on Australia's critical list, rare earths included, for income years from 1 July 2027 to 2040.",
        issuer: "Australian Treasury, ATO",
        announced: "2025-02-14",
        effective: "2027-07-01",
        expires: "2040-06-30",
        status: "announced",
        statusHistory: [
            {
                date: "2025-02-14",
                status: "announced",
                note: "Legislated; applies from 1 July 2027.",
                sources: ["au-cmpti-act-2025"],
            },
        ],
        stages: ["separation", "metal-alloy"],
        scope: "sector",
        sources: ["au-cmpti-act-2025", "ato-cmpti"],
    },
    {
        id: "au-us-framework-2025",
        jurisdiction: "AU",
        type: "subsidy",
        title: "Australia and US critical minerals framework",
        summary:
            "Each government committed at least US$1 billion within six months to a US$8.5 billion pipeline of mining and processing projects, Arafura's Nolans rare earth project among the first, plus a joint group on supply gaps.",
        issuer: "Government of Australia, The White House",
        announced: "2025-10-20",
        status: "in-force",
        statusHistory: [
            {
                date: "2025-10-20",
                status: "in-force",
                sources: ["wh-us-au-framework-2025", "au-us-framework-2025"],
            },
        ],
        stages: ["mining", "separation"],
        scope: "sector",
        sources: ["au-us-framework-2025", "wh-us-au-framework-2025"],
    },
    {
        id: "au-strategic-reserve-2026",
        jurisdiction: "AU",
        type: "subsidy",
        title: "Critical Minerals Strategic Reserve",
        summary:
            "A$1.2 billion reserve that buys rights to Australian output of rare earths, gallium and antimony and resells it. Enabling law passed in March 2026; its first rare earth commitment, 500 t from Arafura's Nolans project, helped that project reach a final investment decision.",
        issuer: "Department of Industry, Science and Resources",
        announced: "2026-01",
        status: "in-force",
        statusHistory: [
            { date: "2026-01", status: "announced", sources: ["au-cmsr"] },
            {
                date: "2026-03-31",
                status: "in-force",
                note: "Enabling act passed.",
                sources: ["au-cmsr"],
            },
            {
                date: "2026-05-21",
                status: "in-force",
                note: "First rare earth offtake commitment.",
                sources: ["au-cmsr-arafura-2026"],
            },
        ],
        stages: ["mining", "separation"],
        scope: "sector",
        companiesAffected: ["Arafura Rare Earths"],
        sources: ["au-cmsr", "au-cmsr-arafura-2026"],
    },
];
