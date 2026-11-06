import type { DirectoryRecord } from "../directory";
import { src, web } from "./shared";

// /people records: REE and magnets.
export const MAGNETS: DirectoryRecord[] = [
    {
        id: "james-litinsky",
        name: "James Litinsky",
        role: "Founder, chairman and CEO, MP Materials",
        orgId: "mp-materials",
        domain: "magnets",
        criterion: "leads",
        whyTheyMatter:
            "Runs the main US rare earth miner and restarted US NdFeB magnet production in 2025.",
        keyWorks: [
            {
                title: "US rare earth magnet production restored at Independence",
                year: 2025,
                url: "https://www.businesswire.com/news/home/20250122740803/en/MP-Materials-Restores-U.S.-Rare-Earth-Magnet-Production",
                kind: "product",
            },
            {
                title: "10X magnet campus in Northlake, Texas",
                year: 2026,
                url: "https://mpmaterials.com/news/mp-materials-selects-northlake-texas-as-the-site-of-10x-a-new-us-rare-earth-magnet-manufacturing-campus/",
                kind: "company",
            },
        ],
        sources: src("mp-northlake-2026", "businesswire-mp-magnets-2025"),
        links: web(
            "https://mpmaterials.com/news/mp-materials-selects-northlake-texas-as-the-site-of-10x-a-new-us-rare-earth-magnet-manufacturing-campus/",
        ),
    },
    {
        id: "amanda-lacaze",
        name: "Amanda Lacaze",
        role: "Former CEO and managing director, Lynas Rare Earths (2014 to June 2026)",
        orgId: "lynas",
        domain: "magnets",
        criterion: "leads",
        whyTheyMatter:
            "Ran the largest rare earth producer outside China for twelve years, including heavy rare earth supply deals with Japan.",
        keyWorks: [
            {
                title: "A$200m Japanese investment for Dy and Tb supply",
                year: 2023,
                url: "https://www.miningweekly.com/print-version/lynas-gets-a-a200m-investment-from-japanese-partners-2023-03-07",
                kind: "company",
            },
        ],
        sources: src("miningweekly-lacaze-2026", "miningweekly-lynas-japan-2023"),
        links: web(
            "https://www.miningweekly.com/article/lynas-rare-earths-ceo-to-retire-after-over-a-decade-in-role-2026-01-13",
        ),
    },
    {
        id: "rahim-suleman",
        name: "Rahim Suleman",
        role: "President and CEO, Neo Performance Materials",
        orgId: "neo-performance",
        domain: "magnets",
        criterion: "leads",
        whyTheyMatter:
            "Opened Neo's sintered magnet plant in Narva, Estonia, a first step towards a European magnet supply.",
        keyWorks: [
            {
                title: "Narva permanent magnet plant opens",
                year: 2025,
                url: "https://www.marketscreener.com/news/neo-performance-materials-opens-state-of-the-art-permanent-magnet-facility-in-europe-ce7d58dfdc80f220",
                kind: "product",
            },
        ],
        sources: src("northernminer-neo-ceo", "marketscreener-neo-narva-2025"),
        links: web(
            "https://northernminer.com/news/neo-performance-materials-begins-estonia-rare-earth-magnet-plant-build-under-new-ceo-reins/1003856575",
        ),
    },
    {
        id: "scott-dunn",
        name: "Scott Dunn",
        role: "Co-founder and CEO, Noveon Magnetics",
        orgId: "noveon",
        domain: "magnets",
        criterion: "leads",
        whyTheyMatter:
            "Runs Noveon, described as the only operating US sintered NdFeB maker, which can use recycled magnet scrap as feed.",
        keyWorks: [
            {
                title: "Five-year magnet supply agreement with Nidec",
                url: "https://www.metal-powder.tech/?p=281219",
                kind: "company",
            },
        ],
        sources: src("noveon-about", "metal-powder-noveon-nidec"),
        links: web("https://noveon.co/about-0"),
    },
    {
        id: "jonathan-rowntree",
        name: "Jonathan Rowntree",
        role: "CEO, Niron Magnetics",
        orgId: "niron",
        domain: "magnets",
        criterion: "leads",
        whyTheyMatter:
            "Scaling iron nitride, a magnet with no rare earths, from pilot line to a 1,500 t a year plant.",
        keyWorks: [
            {
                title: "Ground broken on the Sartell, Minnesota magnet plant",
                year: 2025,
                url: "https://www.businesswire.com/news/home/20250929097968/en/Niron-Magnetics-Changes-Game-by-Breaking-Ground-on-Rare-Earth-Free-Magnet-Facility",
                kind: "company",
            },
        ],
        sources: src("caa-rowntree", "businesswire-niron-sartell-2025"),
        links: web(
            "https://capitalanalyticsassociates.com/jonathan-rowntree-ceo-niron-magnetics/",
        ),
    },
    {
        id: "cai-baogui",
        name: "Cai Baogui",
        role: "Co-founder, chairman and CEO, JL MAG Rare-Earth",
        orgId: "jl-mag",
        domain: "magnets",
        criterion: "leads",
        whyTheyMatter:
            "Chairs and runs JL MAG, a Ganzhou NdFeB magnet maker listed in Shenzhen and Hong Kong.",
        keyWorks: [
            {
                title: "Re-elected chairman and appointed CEO (HKEX filing)",
                year: 2024,
                url: "https://www1.hkexnews.hk/listedco/listconews/sehk/2024/0612/2024061201561.pdf",
                kind: "report",
            },
        ],
        sources: src("hkex-jl-mag-2024"),
        links: web(
            "https://www1.hkexnews.hk/listedco/listconews/sehk/2024/0612/2024061201561.pdf",
        ),
    },
    {
        id: "masato-sagawa",
        name: "Masato Sagawa",
        role: "Inventor of the sintered NdFeB magnet; adviser to Daido Steel",
        orgId: "daido-steel",
        domain: "magnets",
        criterion: "invented",
        whyTheyMatter:
            "Invented the sintered NdFeB magnet in 1982, the strongest type of permanent magnet in use.",
        keyWorks: [
            {
                title: "Queen Elizabeth Prize for Engineering",
                year: 2022,
                url: "https://qeprize.org/news/nd-fe-b-permanent-magnet-developer-wins-2022-queen-elizabeth-prize-for-engineering",
                kind: "award",
            },
            {
                title: "Sintered Nd-Fe-B permanent magnet",
                year: 1982,
                url: "https://www.japan.go.jp/kizuna/2022/04/magnet_innovation.html",
                kind: "product",
            },
        ],
        sources: src(
            "qeprize-sagawa-2022",
            "japan-gov-sagawa",
            "spectrum-ndfeb-magnet",
        ),
        links: web(
            "https://qeprize.org/news/nd-fe-b-permanent-magnet-developer-wins-2022-queen-elizabeth-prize-for-engineering",
        ),
    },
    {
        id: "john-croat",
        name: "John Croat",
        role: "Co-inventor of the NdFeB magnet at General Motors Research; former Magnequench managing director",
        orgId: "general-motors",
        domain: "magnets",
        criterion: "invented",
        whyTheyMatter:
            "Found NdFeB independently at GM by melt spinning, the process GM's Magnequench later commercialised.",
        keyWorks: [
            {
                title: "Honda Prize, shared for the neodymium magnet",
                year: 2023,
                url: "https://www.hondafoundation.jp/winner/view_en/1661",
                kind: "award",
            },
        ],
        sources: src("spectrum-ndfeb-magnet", "honda-prize-croat-2023"),
        links: web(
            "https://spectrum.ieee.org/the-men-who-made-the-magnet-that-made-the-modern-world",
        ),
    },
    {
        id: "erik-eschen",
        name: "Erik Eschen",
        role: "CEO, VAC Group (VACUUMSCHMELZE and eVAC Magnetics)",
        orgId: "vac",
        domain: "magnets",
        criterion: "leads",
        whyTheyMatter:
            "Leads the German magnet maker that opened a US sintered magnet plant in South Carolina in 2026.",
        keyWorks: [
            {
                title: "eVAC magnet plant opens in Sumter, South Carolina",
                year: 2026,
                url: "https://vacuumschmelze.com/02_Pressreleases/2026/2026-07-16_Opening%20Ceremony%20Sumter.pdf",
                kind: "company",
            },
        ],
        sources: src("fastmarkets-evac-sc", "vac-sumter-opening-2026"),
        links: web(
            "https://fastmarkets.com/insights/e-vac-to-build-rare-earth-magnet-plant-in-south-carolina",
        ),
    },
    {
        id: "mark-chalmers",
        name: "Mark Chalmers",
        role: "President and CEO, Energy Fuels",
        orgId: "energy-fuels",
        domain: "magnets",
        criterion: "leads",
        whyTheyMatter:
            "Added NdPr oxide separation to the White Mesa uranium mill in Utah, in commercial production since 2024.",
        keyWorks: [
            {
                title: "Commercial separated NdPr at the White Mesa mill",
                year: 2024,
                url: "https://northernminer.com/news/energy-fuels-begins-commercial-production-of-separated-rare-earths-at-white-mesa/1003868391",
                kind: "product",
            },
            {
                title: "Phase 2 rare earth expansion feasibility study",
                year: 2026,
                url: "https://finviz.com/news/277059/energy-fuels-us-rare-earth-processing-expansion-boasts-lower-than-expected-capex-significant-annual-ebitda-and-among-the-lowest-cost-ndpr-production-in-the-world",
                kind: "report",
            },
        ],
        sources: src("northernminer-energy-fuels-ree", "finviz-energy-fuels-phase2"),
        links: web(
            "https://northernminer.com/news/energy-fuels-begins-commercial-production-of-separated-rare-earths-at-white-mesa/1003868391",
        ),
    },
];
