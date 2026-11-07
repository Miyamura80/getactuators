// Documents behind /bom. The site could not open these pages when the
// dataset was built (fetches were blocked), so every figure was taken from
// the page as shown in search results, and none carries an `accessed` date.
// Open each and add the date when it is checked.
//
// Reuse: analyst BOM estimates relayed by third parties are `restricted`
// (each backs one record here). Teardowns, shop pages, filings, news and
// price pages are `facts`; USGS statistics are `open`.

// Structural copy of SourceRef: importing the type from ../sources would make
// an import cycle, since ../sources spreads this list into SOURCES.
type Kind =
    | "government"
    | "filing"
    | "industry-report"
    | "teardown"
    | "press"
    | "company-site"
    | "reference";

type Reuse = "open" | "facts" | "restricted";

interface BomSource {
    id: string;
    title: string;
    publisher: string;
    url: string;
    kind: Kind;
    reuse: Reuse;
    paywalled?: boolean;
}

function src(
    id: string,
    publisher: string,
    title: string,
    url: string,
    kind: Kind,
    reuse: Reuse = "facts",
): BomSource {
    return { id, publisher, title, url, kind, reuse };
}

export const BOM_SOURCES: BomSource[] = [
    // Optimus linear actuator
    {
        ...src(
            "huibo-optimus-bom-sc",
            "Huibo research (via Zhihu)",
            "Optimus hardware BOM: rotary actuators CNY 57k, linear actuators CNY 44k, hands CNY 20k",
            "https://zhuanlan.zhihu.com/p/687045590",
            "industry-report",
            "restricted",
        ),
        paywalled: true,
    },
    {
        ...src(
            "ms-optimus-bom-sc",
            "XenoSpectrum (on Morgan Stanley)",
            "Optimus Gen 2 BOM about $55k, actuators 56% of it",
            "https://xenospectrum.com/en/humanoid-robot-bom-actuator-cost/",
            "industry-report",
            "restricted",
        ),
        paywalled: true,
    },
    src(
        "honpine-actuator-cost-2025",
        "HONPINE (RoboticsTomorrow)",
        "Linear actuators vs rotary actuators: the core choice for humanoid robot joints",
        "https://www.roboticstomorrow.com/content.php?post=25703",
        "industry-report",
    ),
    src(
        "optimusk-actuators",
        "Optimusk",
        "Tesla Optimus degrees of freedom and actuators",
        "https://optimusk.blog/blog/tesla-optimus-degrees-of-freedom-actuators/",
        "reference",
    ),
    src(
        "holistic-roller-screws-2025",
        "Holistic News",
        "The great game for a small screw: without it, humanoids won't move",
        "https://holistic.news/en/planetary-roller-screws-essential-for-robotics/",
        "press",
    ),
    src(
        "kgg-humanoid-screws",
        "KGG Robots",
        "The rise of Chinese humanoid robots: breakthrough from brain to body",
        "https://www.kggfa.com/news/the-rise-of-chinese-humanoid-robots-breakthrough-from-brain-to-body",
        "company-site",
    ),
    // Unitree joint motor
    src(
        "unitree-go1-motor-shop",
        "Unitree",
        "GO-M8010-6 Motor (Unitree shop)",
        "https://shop.unitree.com/products/go1-motor",
        "company-site",
    ),
    src(
        "unitree-go1-motor-page",
        "Unitree",
        "Bionic robot joint motor GO-M8010-6",
        "https://www.unitree.com/go1/motor",
        "company-site",
    ),
    src(
        "simplexity-go2-motor",
        "Simplexity Product Development",
        "Unitree Go2 motor teardown",
        "https://www.simplexitypd.com/blog/unitree-go2-motor-teardown/",
        "teardown",
    ),
    src(
        "simplefoc-go2-motor-2026",
        "SimpleFOC community",
        "Unitree Go2 / GO-M8018-6 motor as an open FOC platform?",
        "https://community.simplefoc.com/t/unitree-go2-go-m8018-6-motor-as-an-open-foc-platform/8140",
        "teardown",
    ),
    src(
        "hackaday-go-m8018-2026",
        "Hackaday",
        "Unitree GO-M8018-6 motor reverse engineering",
        "https://hackaday.com/2026/05/23/unitree-go-m8018-6-motor-reverse-engineering/",
        "press",
    ),
    src(
        "sse-unitree-pricing-2026",
        "Shanghai Stock Exchange (Global Times)",
        "Unitree Robotics kicks off STAR market IPO pricing, expected to exceed $5.9 billion in value",
        "https://english.sse.com.cn/news/newsrelease/voice/c/c_20260806_10828128.shtml",
        "press",
    ),
    // Strain-wave cobot joint
    src(
        "rcdrone-erob80",
        "RCDrone",
        "ZeroErr eRob 80 T integrated joint (shop listing)",
        "https://rcdrone.top/products/zeroerr-erob-80-t-motor",
        "company-site",
    ),
    src(
        "humanoidguide-joint-bom",
        "Humanoid Guide",
        "What does a humanoid robot joint cost? Inside the actuator bill of materials",
        "https://humanoid.guide/?p=17836",
        "industry-report",
    ),
    src(
        "accio-csf17",
        "Accio",
        "CSF-17-100-2UH strain wave gear (marketplace listings)",
        "https://www.accio.ai/find-product/csf-17-100-2uh",
        "reference",
    ),
    src(
        "renishaw-fy2025",
        "Renishaw (FCA National Storage Mechanism)",
        "Renishaw plc final results for the year to 30 June 2025",
        "https://data.fca.org.uk/artefacts/NSM/RNS/5825346.html",
        "filing",
    ),
    src(
        "leadshine-2025-annual",
        "Leadshine",
        "Leadshine 2025 annual report and 2026 Q1 report: revenue hits new highs",
        "https://en.leadshine.com/newsEvent/details/Leadshine%202025%20Annual%20Report%20&%202026%20Q1%20Report:%20Accelerating%20the%20Growth%20Flywheel,%20Revenue%20Hits%20New%20Highs.html",
        "company-site",
    ),
    src(
        "dealroom-cmsemicon",
        "Dealroom",
        "Cmsemicon (中微半导) company profile",
        "https://app.dealroom.co/companies/cmsemicon",
        "reference",
    ),
    src(
        "renishaw-encoders",
        "Renishaw",
        "Renishaw plc final results: position encoders drove manufacturing technologies growth",
        "https://www.lse.co.uk/rns/final-results-kxc3s13ouxmwkzg.html",
        "filing",
    ),
    // Gross margins (latest fiscal year)
    src(
        "stockanalysis-sanhua",
        "StockAnalysis",
        "Zhejiang Sanhua Intelligent Controls (HKG:2050) financials",
        "https://stockanalysis.com/quote/hkg/2050/financials",
        "reference",
    ),
    src(
        "gasgoo-tuopu-2025",
        "Gasgoo",
        "Tuopu Group's 2025 revenue hits RMB 29.58B, with new growth engines taking shape",
        "https://autonews.gasgoo.com/articles/news/tuopu-groups-2025-revenue-hits-rmb-2958b-with-new-growth-engines-taking-shape-2036461499797635072",
        "press",
    ),
    src(
        "stockanalysis-beite",
        "StockAnalysis",
        "Shanghai Beite Technology (SHA:603009) financials",
        "https://stockanalysis.com/quote/sha/603009/financials/",
        "reference",
    ),
    src(
        "stockanalysis-jlmag",
        "StockAnalysis",
        "JL Mag Rare-Earth (SHE:300748) financials",
        "https://stockanalysis.com/quote/she/300748/financials/",
        "reference",
    ),
    src(
        "stockanalysis-northern-re",
        "StockAnalysis",
        "China Northern Rare Earth (SHA:600111) income statement",
        "https://stockanalysis.com/quote/sha/600111/financials/income-statement/",
        "reference",
    ),
    src(
        "stockanalysis-leaderdrive",
        "StockAnalysis",
        "Leader Harmonious Drive Systems (SHA:688017) financials",
        "https://stockanalysis.com/quote/sha/688017/financials/",
        "reference",
    ),
    // Commodity prices and densities
    src(
        "cbonds-wb-copper",
        "Cbonds (World Bank Pink Sheet)",
        "Copper (World Bank) monthly price, USD/t",
        "https://cbonds.com/indexes/154158/",
        "reference",
    ),
    src(
        "cbonds-wb-aluminum",
        "Cbonds (World Bank Pink Sheet)",
        "Aluminum (World Bank) monthly price, USD/t",
        "https://cbonds.com/indexes/154154/",
        "reference",
    ),
    src(
        "smm-shagang-hrc-2026-06",
        "SMM",
        "Shagang June 2026 hot-rolled steel price adjustment",
        "https://news.metal.com/id/newscontent/103932178-Informasi-Penyesuaian-Harga-Baja-Canai-Panas-Shagang-Juni-2026",
        "press",
    ),
    src(
        "cbcc-gcr15-2025",
        "China Bearing Industry Association (CBCC)",
        "Bearing steel market report: GCr15 absolute price index",
        "https://bearing.com.cn/dev/read_news.php?id=73305",
        "press",
    ),
    src(
        "smm-silicon-steel-2026-06",
        "SMM",
        "SMM weekly summary: non-oriented silicon steel market",
        "https://news.metal.com/es/newscontent/103952808-SMM-Weekly-Summary-Leading-steel-mills-did-not-continue-to-push-up-prices-and-the-non-oriented-silicon-steel-market-may-",
        "press",
    ),
    src(
        "usgs-mis-silicon-2025-12",
        "USGS",
        "Mineral Industry Surveys: silicon, December 2025",
        "https://d9-wret.s3.us-west-2.amazonaws.com/assets/palladium/production/s3fs-public/media/files/mis-202512-simet.pdf",
        "government",
        "open",
    ),
    src(
        "civils-metal-density",
        "Civils.ai",
        "Density of metals table (steel, copper, aluminium)",
        "https://civils.ai/blog/steel-density-table/",
        "reference",
    ),
    src(
        "alliance-magnet-properties",
        "Alliance LLC",
        "Physical properties of permanent magnet materials",
        "https://www.allianceorg.com/pdfs/PhysicalPropertiesofMagnets.pdf",
        "reference",
    ),
    // Bought-in part prices (v2 teardowns). Distributor and marketplace
    // listings for the same or a comparable part, read from search results;
    // none of these pages was opened (fetches were blocked).
    src(
        "smm-ndfeb-blank-2026-08",
        "SMM",
        "Rare-earth magnet prices: NdFeB blank N52(Ce), US$/kg",
        "https://www-old.metal.com/price/Rare-Earth/Rare-Earth-Magnets",
        "press",
    ),
    src(
        "lcsc-stm32f103c8t6",
        "LCSC",
        "STM32F103C8T6 (C8734) price tiers",
        "https://www.lcsc.com/product-image/C8734.html",
        "reference",
    ),
    src(
        "lcsc-fd6288q",
        "LCSC",
        "Fortior Tech FD6288Q three-phase gate driver (C328453) price tiers",
        "https://lcsc.com/product-detail/Gate-Drivers_Fortior-Tech-FD6288Q_C328453.html",
        "reference",
    ),
    src(
        "lcsc-wsd4066dn",
        "LCSC",
        "Winsok WSD4066DN dual N-channel 40 V MOSFET (C377861)",
        "https://www.lcsc.com/datasheet/lcsc_datasheet_1912111437_Winsok-Semicon-WSD4066DN_C377861.pdf",
        "reference",
    ),
    src(
        "lcsc-sp3485",
        "LCSC",
        "UMW SP3485EN RS-485 transceiver (C44850899) price tiers",
        "https://www.lcsc.com/product-image/C44850899.html",
        "reference",
    ),
    src(
        "lcsc-mt6835",
        "LCSC",
        "Magn Tek MT6835GT-STD magnetic angle sensor (C2932578) price tiers",
        "https://www.lcsc.com/product-detail/Position-Sensors_Magn-Tek-MT6835GT-STD_C2932578.html",
        "reference",
    ),
    src(
        "findchips-as5045",
        "FindChips",
        "AS5045-ASST price and stock across distributors",
        "https://www.findchips.com/search/AS5045-ASST",
        "reference",
    ),
    src(
        "ebay-6800-thin-bearings",
        "eBay (China-based seller)",
        "Deep groove ball bearing 6800 to 6810, metal shielded thin wall",
        "https://www.ebay.de/itm/356092406455",
        "reference",
    ),
    src(
        "lkpb-crbh-ebay",
        "LKPB Bearing (eBay)",
        "CRBH208 to CRBH4510 crossed roller bearings, P5/P4",
        "https://www.ebay.de/itm/134251293069",
        "reference",
    ),
    src(
        "ato-brake-prices",
        "ATO",
        "Electromagnetic brake and clutch price list",
        "https://www.ato.com/electromagnetic-brake-and-clutch-price-list",
        "company-site",
    ),
];
