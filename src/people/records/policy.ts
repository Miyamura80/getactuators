import type { DirectoryRecord } from "../directory";
import { src, web } from "./shared";

// /people records: Analysts and policy.
export const POLICY: DirectoryRecord[] = [
    {
        id: "ryan-castilloux",
        name: "Ryan Castilloux",
        role: "Founder and managing director, Adamas Intelligence",
        orgId: "adamas",
        domain: "policy",
        criterion: "cited",
        whyTheyMatter:
            "His firm's magnet and rare earth demand forecasts are quoted by producers, investors and the press.",
        keyWorks: [
            {
                title: "Rare Earth Magnet Market Outlook to 2040",
                url: "https://www.adamasintel.com/report/rare-earth-magnet-market-outlook-to-2040/",
                kind: "report",
            },
        ],
        sources: src("mining-castilloux-hype", "adamas-magnet-outlook-2040"),
        links: web(
            "https://www.mining.com/web/ryan-castilloux-sorting-reality-from-hype-in-the-crowded-rare-earth-industry/",
        ),
    },
    {
        id: "gracelin-baskaran",
        name: "Gracelin Baskaran",
        role: "Director, Critical Minerals Security Program, CSIS",
        orgId: "csis",
        domain: "policy",
        criterion: "cited",
        whyTheyMatter:
            "Mining economist whose CSIS work on rare earth processing and export controls is cited by Congress and press.",
        keyWorks: [
            {
                title: "Senate HELP Committee testimony",
                url: "https://www.help.senate.gov/download/baskaran-testimonypdf",
                kind: "report",
            },
        ],
        sources: src("csis-baskaran-2024", "senate-baskaran-testimony"),
        links: web(
            "https://www.csis.org/news/csis-names-gracelin-baskaran-director-critical-minerals-security-program",
        ),
    },
    {
        id: "tom-lograsso",
        name: "Tom Lograsso",
        role: "Director, Critical Materials Innovation Hub (US DOE), Ames National Laboratory",
        orgId: "ames-lab",
        domain: "policy",
        criterion: "programme",
        whyTheyMatter:
            "Directs the DOE hub for research on rare earth supply, magnet substitutes and recycling.",
        keyWorks: [
            {
                title: "R&D 100 Leader of the Year",
                year: 2025,
                url: "https://www.ameslab.gov/cmi/research-highlights/cmi-director-tom-lograsso-named-2025-r-d-leader-of-the-year",
                kind: "award",
            },
            {
                title: "House Science Committee testimony",
                url: "https://republicans-science.house.gov/_cache/files/8/0/808fcf3a-be92-4cad-b21c-e86378f5a89d/D9209E1E1FC8252C5AE9D9DD2530AE4DCFB115F5117804B4BF5EA036DFF52BBE.dr.-thomas-lograsso-testimony.pdf",
                kind: "report",
            },
        ],
        sources: src("ameslab-lograsso-2025", "house-lograsso-testimony"),
        links: web(
            "https://www.ameslab.gov/cmi/research-highlights/cmi-director-tom-lograsso-named-2025-r-d-leader-of-the-year",
        ),
    },
    {
        id: "tae-yoon-kim",
        name: "Tae-Yoon Kim",
        role: "Head of the Critical Minerals Division, International Energy Agency",
        orgId: "iea",
        domain: "policy",
        criterion: "programme",
        whyTheyMatter:
            "Lead author of the IEA's critical minerals outlooks and head of its Critical Minerals Security Programme.",
        keyWorks: [
            {
                title: "Global Critical Minerals Outlook 2026",
                year: 2026,
                url: "https://iea.org/reports/global-critical-minerals-outlook-2026",
                kind: "report",
            },
        ],
        sources: src("benchmark-events-tae-yoon-kim", "iea-gcmo-2026"),
        links: web(
            "https://benchmarkevents.benchmarkminerals.com/summit-toronto/speaker/2162420/tae-yoon-kim",
        ),
    },
    // To verify: sources differ on the exact title.
    {
        id: "chen-zhanheng",
        name: "Chen Zhanheng",
        role: "Deputy Secretary-General, Association of China Rare Earth Industry",
        orgId: "china-rare-earth-assoc",
        domain: "policy",
        criterion: "cited",
        whyTheyMatter:
            "A long-standing industry voice on Chinese rare earth policy, quoted on consolidation and export rules.",
        keyWorks: [
            {
                title: "Interview on China's rare earth industry (Chinese Society of Rare Earths)",
                url: "https://www.theanchorhouse.com/?cat=3",
                kind: "report",
            },
        ],
        sources: src("cae-chen-zhanheng", "anchorhouse-chen-zhanheng"),
        links: web("https://www.theanchorhouse.com/?cat=3"),
    },
    {
        id: "neha-mukherjee",
        name: "Neha Mukherjee",
        role: "Senior analyst, rare earths, Benchmark Mineral Intelligence",
        orgId: "benchmark",
        domain: "policy",
        criterion: "cited",
        whyTheyMatter:
            "Covers rare earth supply, demand and prices at Benchmark; widely quoted on China's 2025 export controls.",
        keyWorks: [
            {
                title: "Interview on diversifying rare earth supply",
                year: 2025,
                url: "https://www.tribuneindia.com/news/business/secure-rare-earths-supply-chain-by-diversifying-sources-expert-neha-mukherjee-as-china-tightens-grip/amp",
                kind: "report",
            },
        ],
        sources: src("benchmark-mukherjee", "tribune-mukherjee-2025"),
        links: web("https://source.benchmarkminerals.com/authors/neha-mukherjee"),
    },
    // To verify: the move to Montana is undated in our sources.
    {
        id: "kristin-vekasi",
        name: "Kristin Vekasi",
        role: "Mansfield Chair of Japanese and Indo-Pacific Affairs, University of Montana",
        orgId: "u-montana",
        domain: "policy",
        criterion: "cited",
        whyTheyMatter:
            "Political scientist on Japan's rare earth strategy after the 2010 embargo; has testified to the US-China Commission.",
        keyWorks: [
            {
                title: "Testimony to the U.S.-China Economic and Security Review Commission",
                year: 2022,
                url: "https://www.uscc.gov/sites/default/files/2022-06/Kristin_Vekasi_Testimony.pdf",
                kind: "report",
            },
        ],
        sources: src("umt-vekasi", "uscc-vekasi-2022"),
        links: web(
            "https://www.umt.edu/mansfield/dialogues/mansfield-dialogues/speaker-pages/kristin_vekasi.php",
        ),
    },
    {
        id: "morgan-bazilian",
        name: "Morgan Bazilian",
        role: "Director, Payne Institute for Public Policy, Colorado School of Mines",
        orgId: "colorado-mines",
        domain: "policy",
        criterion: "cited",
        whyTheyMatter:
            "Testifies to Congress on critical minerals and China's hold on rare earth processing.",
        keyWorks: [
            {
                title: "State of Critical Minerals Report (first edition)",
                year: 2023,
                url: "https://www.mines.edu/news/all-news/2023/payne-institute-for-public-policy-releases-first-annual-state-of-critical-minerals-report.html",
                kind: "report",
            },
        ],
        sources: src("cfr-bazilian", "mines-critical-minerals-report-2023"),
        links: web(
            "https://www.cfr.org/podcasts/critical-minerals-and-china-morgan-bazilian",
        ),
    },
];
