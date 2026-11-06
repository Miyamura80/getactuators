// Documents behind the /people directory: who holds which role, what they
// built and why they are listed. Spread into the supply-chain SOURCES so the
// shared citation UI and the licence audit cover them.
//
// Almost every page here is a copyrighted page we take single facts from (a
// title, a founding year, a paper), so reuse is "facts". The exception is a
// US federal government work (public domain), which is "open". None was opened page by
// page: roles and works were confirmed from search results on PEOPLE_AS_OF,
// so `accessed` is left out (see SourceRef.accessed).

// Structural copy of SourceRef: importing it from ../supply-chain/sources
// would make an import cycle, since that file spreads this list.
type Kind =
    | "company-site"
    | "press"
    | "academic"
    | "reference"
    | "government"
    | "filing"
    | "industry-report";

interface PeopleSource {
    id: string;
    title: string;
    publisher: string;
    url: string;
    kind: Kind;
    reuse: "open" | "facts";
}

function s(
    id: string,
    publisher: string,
    title: string,
    url: string,
    kind: Kind = "press",
    reuse: PeopleSource["reuse"] = "facts",
): PeopleSource {
    return { id: `people-${id}`, publisher, title, url, kind, reuse };
}

export const PEOPLE_SOURCES: PeopleSource[] = [
    // Actuator research
    s(
        "wiki-sangbae-kim",
        "Wikipedia",
        "Sangbae Kim",
        "https://en.wikipedia.org/wiki/Sangbae_Kim",
        "reference",
    ),
    s(
        "mit-cheetah-proprioceptive-2017",
        "MIT DSpace",
        "Proprioceptive Actuator Design in the MIT Cheetah (IEEE T-RO, 2017)",
        "https://dspace.mit.edu/handle/1721.1/119863",
        "academic",
    ),
    s(
        "mit-news-mini-cheetah-backflip-2019",
        "MIT News",
        "Mini cheetah is the first four-legged robot to do a backflip",
        "https://news.mit.edu/2019/mit-mini-cheetah-first-four-legged-robot-to-backflip-0304",
    ),
    s(
        "mit-news-katz-2021",
        "MIT News",
        "From cheetah-noids to humanoids: Benjamin Katz",
        "https://news.mit.edu/2021/cheetah-noids-humanoids-benjamin-katz-1214",
    ),
    s(
        "nd-wensing",
        "University of Notre Dame",
        "Patrick M. Wensing, personal site",
        "https://sites.nd.edu/pwensing/",
        "academic",
    ),
    s(
        "toyota-gill-pratt",
        "Toyota Motor Corporation",
        "Gill A. Pratt, Executive Fellow",
        "https://global.toyota/en/company/profile/executives/fellow/gill_a_pratt.html",
        "company-site",
    ),
    s(
        "olin-gill-pratt",
        "Olin College",
        "Gill Pratt biography",
        "https://www.olin.edu/bios/gill-pratt",
        "academic",
    ),
    s(
        "dtic-series-elastic-1995",
        "DTIC",
        "Series elastic actuators (Pratt and Williamson, 1995)",
        "https://apps.dtic.mil/sti/tr/pdf/ADA299658.pdf",
        "academic",
    ),
    s(
        "techcrunch-persona-2024",
        "TechCrunch",
        "Persona's founders are certain the world can use another humanoid robot",
        "https://techcrunch.com/2024/06/26/personas-founders-are-certain-the-world-can-use-another-humanoid-robot",
    ),
    s(
        "mit-media-herr-publications",
        "MIT Media Lab",
        "Hugh Herr: publications",
        "https://www.media.mit.edu/people/hherr/publications/",
        "academic",
    ),
    s(
        "clinicaltrials-ami",
        "ClinicalTrials.gov",
        "Agonist-Antagonist Myoneural Interface for Functional Limb Restoration (NCT03913273)",
        "https://cdn.clinicaltrials.gov/large-docs/73/NCT03913273/ICF_002.pdf",
        "government",
    ),
    s(
        "mpi-keplinger",
        "Max Planck Institute for Intelligent Systems",
        "Christoph Keplinger",
        "https://is.mpg.de/en/person/ck",
        "academic",
    ),
    s(
        "cyber-valley-keplinger",
        "Cyber Valley",
        "Christoph Keplinger joins the Max Planck Institute for Intelligent Systems as new Director",
        "https://cyber-valley.de/en/news/christoph-keplinger-joins-the-max-planck-institute-for-intelligent-systems-as-new-director-cyvy",
    ),
    s(
        "utd-fishing-line-muscles-2014",
        "UT Dallas",
        "Researchers create powerful muscles from fishing line, thread",
        "https://news.utdallas.edu/science-technology/researchers-create-powerful-muscles-from-fishing-l",
    ),
    s(
        "wweek-hurst-2026",
        "Willamette Week",
        "OSU robotics professor Jonathan Hurst helped create a $2.5 billion company",
        "https://www.wweek.com/technology/2026/03/11/osu-robotics-professor-jonathan-hurst-helped-create-a-25-billion-company-that-makes-humanoid-robots-with-ai-intelligence",
    ),
    s(
        "osu-agility-2020",
        "Oregon State University",
        "OSU spinout Agility Robotics secures $20 million new investment",
        "https://news.oregonstate.edu/news/osu-spinout-agility-robotics-maker-legged-workplace-robots-secures-20-million-new-investment",
        "academic",
    ),
    s(
        "tum-albu-schaeffer",
        "Technical University of Munich",
        "Prof. Dr. Alin Albu-Schäffer",
        "https://www.professoren.tum.de/en/albu-schaeffer-alin",
        "academic",
    ),
    s(
        "kit-albu-schaeffer-2011",
        "KIT Humanoids 2011 workshop",
        "New bodies for humanoids: variable impedance actuation at DLR (slides)",
        "https://archive.iar.kit.edu/workshops/humanoids2011/talks/Albu-Schaeffer-Humanoids2011-WS-New-Bodies-for-Humanoids.pdf",
        "academic",
    ),
    s(
        "wiki-sami-haddadin",
        "Wikipedia",
        "Sami Haddadin",
        "https://en.wikipedia.org/wiki/Sami_Haddadin",
        "reference",
    ),
    s(
        "mbzuai-research",
        "MBZUAI",
        "Office of Research: about us",
        "https://research.mbzuai.ac.ae/about-us",
        "academic",
    ),
    s(
        "titech-hydraulic-muscle-2017",
        "Tokyo Institute of Technology",
        "Hydraulic high-power artificial muscle developed with Bridgestone",
        "https://www.titech.ac.jp/english/news/2017/037286.html",
        "academic",
    ),
    s(
        "jsme-thin-muscle-2020",
        "JSME",
        "Commercialization of high-quality, high-durability small-diameter artificial muscles",
        "https://jsme.or.jp/english/about/awards/2020-2/award2020-nt4",
        "academic",
    ),
    // Actuator and robot industry
    s(
        "wirechina-wang-xingxing",
        "The Wire China",
        "Wang Xingxing",
        "https://www.thewirechina.com/whos_who/wang-xingxing-%e7%8e%8b%e5%85%b4%e5%85%b4/",
    ),
    s(
        "scmp-unitree-ipo-2026",
        "South China Morning Post",
        "Inside Unitree's landmark IPO",
        "https://www.scmp.com/tech/article/3347611/inside-unitrees-landmark-ipo-what-know-about-chinas-humanoid-giant",
    ),
    s(
        "robot-report-cardenas",
        "The Robot Report",
        "Apptronik CEO Jeff Cardenas details the Apollo humanoid",
        "https://www.therobotreport.com/apptronik-ceo-jeff-cardenas-details-the-apollo-humanoid/",
    ),
    s(
        "dallas-innovates-apptronik-2026",
        "Dallas Innovates",
        "Apptronik nears $1B in total funding",
        "https://dallasinnovates.com/att-ventures-among-new-backers-as-humanoid-robotics-startup-apptronik-nears-1b-in-total-funding/",
    ),
    s(
        "maginative-clone-alpha",
        "Maginative",
        "Meet Clone Alpha: a humanoid robot built with synthetic organs and artificial muscles",
        "https://www.maginative.com/article/meet-clone-alpha-a-humanoid-robot-built-with-synthetic-organs-and-artificial-muscles/",
    ),
    s(
        "humanoid-guide-protoclone",
        "Humanoid Guide",
        "Clone Robotics details Protoclone V1 humanoid design",
        "https://humanoid.guide/?p=12355",
    ),
    s(
        "wiki-1x",
        "Wikipedia",
        "1X Technologies",
        "https://en.wikipedia.org/wiki/1X_Technologies",
        "reference",
    ),
    s(
        "businesswire-1x-neo-2025",
        "Business Wire",
        "1X launches NEO, the robot redefining life at home",
        "https://www.businesswire.com/news/home/20251027434628/en/1X-Launches-NEO-The-Robot-Redefining-Life-at-Home",
        "company-site",
    ),
    s(
        "vnexpress-leaderdrive",
        "VnExpress",
        "Chinese brothers behind robot joint maker Leaderdrive become billionaires",
        "https://e.vnexpress.net/news/tech/personalities/chinese-brothers-behind-robot-joint-maker-leaderdrive-become-billionaires-as-humanoid-demand-surges-5066573.html",
    ),
    s(
        "samsung-rainbow-2025",
        "Samsung Newsroom",
        "Samsung Electronics to become largest shareholder in Rainbow Robotics",
        "https://news.samsung.com/global/samsung-electronics-to-become-largest-shareholder-in-rainbow-robotics",
        "company-site",
    ),
    s(
        "ifr-kar-oh-2026",
        "IFR",
        "Dr. Junho Oh elected as new President of KAR",
        "https://ifr.org/ifr-press-releases/news/dr-junho-oh-elected-as-new-president-of-kar",
    ),
    s(
        "wiki-marc-raibert",
        "Wikipedia",
        "Marc Raibert",
        "https://en.wikipedia.org/wiki/Marc_Raibert",
        "reference",
    ),
    s(
        "hackaday-mjbots-quad",
        "Hackaday.io",
        "mjbots quad: an open-source, affordable, dynamic quadruped robot",
        "https://hackaday.io/project/167845-mjbots-quad",
    ),
    s(
        "hackaday-moteus",
        "Hackaday.io",
        "moteus brushless controller",
        "https://hackaday.io/project/179234-moteus-brushless-controller",
    ),
    s(
        "sz-gov-ubtech",
        "Shenzhen Government Online",
        "UBTech Robotics and founder Zhou Jian",
        "https://www.sz.gov.cn/en_szgov/news/latest/content/post_11247031.html",
        "government",
    ),
    s(
        "kr-asia-gu-jie",
        "KrASIA",
        "Fourier Intelligence's founder breaks down what's next for humanoid robots",
        "https://kr-asia.com/fourier-intelligences-founder-breaks-down-whats-next-for-humanoid-robots",
    ),
    s(
        "yicai-fourier-gr1-2023",
        "Yicai Global",
        "Fourier Intelligence debuts general-purpose humanoid robot at World AI Conference",
        "https://yicaiglobal.com/news/20230706-04-chinas-fourier-intelligence-debuts-general-purpose-humanoid-robot-at-world-ai-conference",
    ),
    s(
        "wiki-figure-ai",
        "Wikipedia",
        "Figure AI",
        "https://en.wikipedia.org/wiki/Figure_AI",
        "reference",
    ),
    s(
        "watkins-figure-ai",
        "Jared Watkins research notes",
        "Figure AI: in-house actuators and BotQ",
        "https://www.jaredwatkins.com/research/robotics/humanoid/us-companies/figure-ai/",
        "reference",
    ),
    // REE and magnet industry
    s(
        "mp-northlake-2026",
        "MP Materials",
        "MP Materials selects Northlake, Texas as the site of 10X",
        "https://mpmaterials.com/news/mp-materials-selects-northlake-texas-as-the-site-of-10x-a-new-us-rare-earth-magnet-manufacturing-campus/",
        "company-site",
    ),
    s(
        "businesswire-mp-magnets-2025",
        "Business Wire",
        "MP Materials restores U.S. rare earth magnet production",
        "https://www.businesswire.com/news/home/20250122740803/en/MP-Materials-Restores-U.S.-Rare-Earth-Magnet-Production",
        "company-site",
    ),
    s(
        "miningweekly-lacaze-2026",
        "Mining Weekly",
        "Lynas Rare Earths CEO to retire after over a decade in role",
        "https://www.miningweekly.com/article/lynas-rare-earths-ceo-to-retire-after-over-a-decade-in-role-2026-01-13",
    ),
    s(
        "miningweekly-lynas-japan-2023",
        "Mining Weekly",
        "Lynas gets an A$200m investment from Japanese partners",
        "https://www.miningweekly.com/print-version/lynas-gets-a-a200m-investment-from-japanese-partners-2023-03-07",
    ),
    s(
        "northernminer-neo-ceo",
        "The Northern Miner",
        "Neo Performance starts Estonia rare earth magnet plant build under new CEO",
        "https://northernminer.com/news/neo-performance-materials-begins-estonia-rare-earth-magnet-plant-build-under-new-ceo-reins/1003856575",
    ),
    s(
        "marketscreener-neo-narva-2025",
        "MarketScreener",
        "Neo Performance Materials opens permanent magnet facility in Europe",
        "https://www.marketscreener.com/news/neo-performance-materials-opens-state-of-the-art-permanent-magnet-facility-in-europe-ce7d58dfdc80f220",
    ),
    s(
        "noveon-about",
        "Noveon Magnetics",
        "About Noveon: leadership",
        "https://noveon.co/about-0",
        "company-site",
    ),
    s(
        "metal-powder-noveon-nidec",
        "Metal Powder Tech",
        "Nidec and Noveon sign five-year agreement for US-made rare earth magnets",
        "https://www.metal-powder.tech/?p=281219",
    ),
    s(
        "caa-rowntree",
        "Capital Analytics",
        "Jonathan Rowntree, CEO, Niron Magnetics",
        "https://capitalanalyticsassociates.com/jonathan-rowntree-ceo-niron-magnetics/",
    ),
    s(
        "businesswire-niron-sartell-2025",
        "Business Wire",
        "Niron Magnetics breaks ground on rare-earth-free magnet facility",
        "https://www.businesswire.com/news/home/20250929097968/en/Niron-Magnetics-Changes-Game-by-Breaking-Ground-on-Rare-Earth-Free-Magnet-Facility",
        "company-site",
    ),
    s(
        "hkex-jl-mag-2024",
        "HKEXnews",
        "JL MAG Rare-Earth: board and CEO appointments (June 2024)",
        "https://www1.hkexnews.hk/listedco/listconews/sehk/2024/0612/2024061201561.pdf",
        "filing",
    ),
    s(
        "qeprize-sagawa-2022",
        "Queen Elizabeth Prize for Engineering",
        "Nd-Fe-B permanent magnet developer wins 2022 QEPrize",
        "https://qeprize.org/news/nd-fe-b-permanent-magnet-developer-wins-2022-queen-elizabeth-prize-for-engineering",
    ),
    s(
        "japan-gov-sagawa",
        "Government of Japan (KIZUNA)",
        "Magnet innovation",
        "https://www.japan.go.jp/kizuna/2022/04/magnet_innovation.html",
        "government",
    ),
    s(
        "spectrum-ndfeb-magnet",
        "IEEE Spectrum",
        "The magnet that made the modern world",
        "https://spectrum.ieee.org/the-men-who-made-the-magnet-that-made-the-modern-world",
    ),
    s(
        "honda-prize-croat-2023",
        "Honda Foundation",
        "Honda Prize 2023 laureate",
        "https://www.hondafoundation.jp/winner/view_en/1661",
    ),
    s(
        "vac-sumter-opening-2026",
        "VACUUMSCHMELZE",
        "Opening ceremony of the Sumter, South Carolina magnet plant",
        "https://vacuumschmelze.com/02_Pressreleases/2026/2026-07-16_Opening%20Ceremony%20Sumter.pdf",
        "company-site",
    ),
    s(
        "fastmarkets-evac-sc",
        "Fastmarkets",
        "E-Vac to build rare earth magnet plant in South Carolina",
        "https://fastmarkets.com/insights/e-vac-to-build-rare-earth-magnet-plant-in-south-carolina",
    ),
    s(
        "northernminer-energy-fuels-ree",
        "The Northern Miner",
        "Energy Fuels begins commercial production of separated rare earths at White Mesa",
        "https://northernminer.com/news/energy-fuels-begins-commercial-production-of-separated-rare-earths-at-white-mesa/1003868391",
    ),
    s(
        "finviz-energy-fuels-phase2",
        "Finviz (Energy Fuels release)",
        "Energy Fuels US rare earth processing expansion feasibility study",
        "https://finviz.com/news/277059/energy-fuels-us-rare-earth-processing-expansion-boasts-lower-than-expected-capex-significant-annual-ebitda-and-among-the-lowest-cost-ndpr-production-in-the-world",
        "company-site",
    ),
    // Analysts and policy
    s(
        "mining-castilloux-hype",
        "MINING.COM",
        "Ryan Castilloux: sorting reality from hype in the crowded rare earth industry",
        "https://www.mining.com/web/ryan-castilloux-sorting-reality-from-hype-in-the-crowded-rare-earth-industry/",
    ),
    s(
        "adamas-magnet-outlook-2040",
        "Adamas Intelligence",
        "Rare Earth Magnet Market Outlook to 2040",
        "https://www.adamasintel.com/report/rare-earth-magnet-market-outlook-to-2040/",
        "industry-report",
    ),
    s(
        "csis-baskaran-2024",
        "CSIS",
        "CSIS names Gracelin Baskaran Director of Critical Minerals Security Program",
        "https://www.csis.org/news/csis-names-gracelin-baskaran-director-critical-minerals-security-program",
    ),
    s(
        "senate-baskaran-testimony",
        "US Government Publishing Office",
        "Building our critical minerals workforce (Senate HELP subcommittee hearing, June 12, 2024)",
        "https://www.govinfo.gov/content/pkg/CHRG-118shrg57243/pdf/CHRG-118shrg57243.pdf",
        "government",
        // A US federal government work: public domain.
        "open",
    ),
    s(
        "ameslab-lograsso-2025",
        "Ames National Laboratory",
        "CMI Director Tom Lograsso named 2025 R&D Leader of the Year",
        "https://www.ameslab.gov/cmi/research-highlights/cmi-director-tom-lograsso-named-2025-r-d-leader-of-the-year",
        "government",
    ),
    s(
        "house-lograsso-testimony",
        "US House Science Committee",
        "Testimony of Dr. Thomas Lograsso",
        "https://republicans-science.house.gov/_cache/files/8/0/808fcf3a-be92-4cad-b21c-e86378f5a89d/D9209E1E1FC8252C5AE9D9DD2530AE4DCFB115F5117804B4BF5EA036DFF52BBE.dr.-thomas-lograsso-testimony.pdf",
        "government",
    ),
    s(
        "benchmark-events-tae-yoon-kim",
        "Benchmark Mineral Intelligence events",
        "Tae-Yoon Kim, Head of Critical Minerals Division, IEA",
        "https://benchmarkevents.benchmarkminerals.com/summit-toronto/speaker/2162420/tae-yoon-kim",
    ),
    s(
        "iea-gcmo-2026",
        "IEA",
        "Global Critical Minerals Outlook 2026",
        "https://iea.org/reports/global-critical-minerals-outlook-2026",
        "government",
    ),
    s(
        "cae-chen-zhanheng",
        "Chinese Academy of Engineering",
        "International cooperation: Association of China Rare Earth Industry delegation",
        "https://en.cae.cn/cae/html/en/col2061/2021-11/12/20211112206111111110242_1.html",
        "government",
    ),
    s(
        "anchorhouse-chen-zhanheng",
        "The Anchor House",
        "Interview with Dr. Chen Zhanheng, Chinese Society of Rare Earths",
        "https://www.theanchorhouse.com/?cat=3",
    ),
    s(
        "benchmark-mukherjee",
        "Benchmark Mineral Intelligence",
        "Neha Mukherjee, author page",
        "https://source.benchmarkminerals.com/authors/neha-mukherjee",
        "company-site",
    ),
    s(
        "tribune-mukherjee-2025",
        "The Tribune (ANI)",
        "Secure rare earths supply chain by diversifying sources: expert Neha Mukherjee",
        "https://www.tribuneindia.com/news/business/secure-rare-earths-supply-chain-by-diversifying-sources-expert-neha-mukherjee-as-china-tightens-grip/amp",
    ),
    s(
        "umt-vekasi",
        "University of Montana Mansfield Center",
        "Rare earths and shared futures: Kristin Vekasi",
        "https://www.umt.edu/mansfield/dialogues/mansfield-dialogues/speaker-pages/kristin_vekasi.php",
        "academic",
    ),
    s(
        "uscc-vekasi-2022",
        "U.S.-China Economic and Security Review Commission",
        "Testimony of Kristin Vekasi (2022)",
        "https://www.uscc.gov/sites/default/files/2022-06/Kristin_Vekasi_Testimony.pdf",
        "government",
    ),
    s(
        "cfr-bazilian",
        "Council on Foreign Relations",
        "Critical minerals and China with Morgan Bazilian",
        "https://www.cfr.org/podcasts/critical-minerals-and-china-morgan-bazilian",
    ),
    s(
        "mines-critical-minerals-report-2023",
        "Colorado School of Mines",
        "Payne Institute releases first annual State of Critical Minerals Report",
        "https://www.mines.edu/news/all-news/2023/payne-institute-for-public-policy-releases-first-annual-state-of-critical-minerals-report.html",
        "academic",
    ),
];
