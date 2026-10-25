import type { SourceId } from "./sourced";

// Every document the supply-chain registry cites. Ids are kebab-case
// "<publisher>-<topic>-<year>" and never change once published, because
// footnotes and the API reference them.

export const SOURCE_KINDS = [
    "government",
    "filing",
    "industry-report",
    "teardown",
    "press",
    "academic",
    "company-site",
    "reference",
] as const;

export interface SourceRef {
    id: SourceId;
    title: string;
    publisher: string;
    url: string;
    accessed: string;
    kind: (typeof SOURCE_KINDS)[number];
    // Only public excerpts of a paywalled source may be cited.
    paywalled?: boolean;
}

const ACCESSED = "2026-10-25";

function src(
    id: string,
    publisher: string,
    title: string,
    url: string,
    kind: SourceRef["kind"],
): SourceRef {
    return { id, publisher, title, url, kind, accessed: ACCESSED };
}

export const SOURCES: SourceRef[] = [
    // Statistics and intergovernmental reports
    src(
        "usgs-mcs-2026-ree",
        "USGS",
        "Mineral Commodity Summaries 2026: Rare Earths",
        "https://pubs.usgs.gov/periodicals/mcs2026/mcs2026-rare-earths.pdf",
        "government",
    ),
    src(
        "iea-rare-earths-2025",
        "IEA",
        "Rare earth elements: executive summary",
        "https://www.iea.org/reports/rare-earth-elements/executive-summary",
        "government",
    ),
    // Rare earth mining and refining
    src(
        "mp-results-fy2025",
        "MP Materials",
        "MP Materials Reports Fourth Quarter and Full Year 2025 Results",
        "https://mpmaterials.com/news/mp-materials-reports-fourth-quarter-and-full-year-2025-results",
        "filing",
    ),
    src(
        "mp-10k-2025",
        "MP Materials 10-K",
        "Form 10-K for fiscal year 2025",
        "https://www.sec.gov/Archives/edgar/data/1801368/000180136826000008/mp-20251231.htm",
        "filing",
    ),
    src(
        "mp-10q-q1-2025",
        "MP Materials 10-Q",
        "Form 10-Q for the quarter ended March 31, 2025",
        "https://s25.q4cdn.com/570172628/files/doc_financials/2025/q1/MPMC-Q1-2025-10-Q.pdf",
        "filing",
    ),
    src(
        "smm-northern-re-2025",
        "SMM",
        "China Northern Rare Earth: net profit in 2025 up 124.17% YoY",
        "https://news.metal.com/newscontent/103867901-china-northern-rare-earth-la-production-des-principaux-produits-atteint-des-sommets-historiques-le-bénéfice-net-en-2025",
        "press",
    ),
    src(
        "chinadaily-crg-2021",
        "China Daily",
        "State-owned enterprise seen changing rare earth market",
        "https://investinchina.chinadaily.com.cn/s/202112/24/WS61c58b2b498e6a12c121bb93/state-owned-enterprise-seen-changing-rare-earth-market.html",
        "press",
    ),
    src(
        "wikipedia-shenghe",
        "Wikipedia",
        "Shenghe Resources",
        "https://en.wikipedia.org/wiki/Shenghe_Resources",
        "reference",
    ),
    src(
        "alcircle-crg-shenghe-2026",
        "AlCircle",
        "China Rare Earth Group in talks to acquire Shenghe Resources, putting MP Materials stake in focus",
        "https://alcircle.com/news/china-rare-earth-group-in-talks-to-acquire-shenghe-resources-putting-mp-materials-stake-in-focus-121245",
        "press",
    ),
    // Magnets
    src(
        "jlmag-about",
        "JL MAG",
        "About JL MAG",
        "https://www.jlmag.com.cn/en/about.php?cid=58",
        "company-site",
    ),
    src(
        "asianmetal-jlmag-2025",
        "Asian Metal",
        "JL MAG posts record rare earth magnet sales in 2025",
        "https://www.asianmetal.com/news/2306079/JL-MAG-posts-record-rare-earth-magnet-sales-in-2025",
        "press",
    ),
    src(
        "yicai-jlmag-baotou-2025",
        "Yicai Global",
        "China's JL Mag to build USD143.6 million rare earth magnetic materials plant as demand soars",
        "https://www.yicaiglobal.com/news/chinas-jl-mag-to-build-usd1436-million-rare-earth-magnetic-materials-plant-as-demand-soars",
        "press",
    ),
    src(
        "nippon-shinetsu-2026",
        "Nippon.com (Jiji Press)",
        "Shin-Etsu Chemical to build new rare earth plant",
        "https://www.nippon.com/en/news/yjj2026061100578/",
        "press",
    ),
    // Gears, screws and bearings
    src(
        "filingreader-hds-fy2025",
        "FilingReader",
        "Harmonic Drive Systems FY25 profit drops amid sluggish sales",
        "https://filingreader.com/news-wire/tokyo/2025-05-22/harmonic-drive-systems-fy25-profit-drops-amid-sluggish-sales",
        "press",
    ),
    src(
        "jaxa-hds-hotaka",
        "JAXA",
        "Harmonic Drive Systems: producing high-precision products",
        "https://aerospacebiz.jaxa.jp/en/?p=127",
        "government",
    ),
    src(
        "researchandmarkets-reducers-2020",
        "Research and Markets via GlobeNewswire",
        "Global and China Industrial Robot Speed Reducer Industry Report, 2020-2026",
        "https://www.globenewswire.com/news-release/2020/09/25/2099122/0/en/Global-and-China-Industrial-Robot-Speed-Reducer-Industry-Report-2020-2026.html",
        "industry-report",
    ),
    src(
        "bloomberg-japangov-robots",
        "Bloomberg (sponsored by the Government of Japan)",
        "Japan: innovating the future of industrial robots",
        "https://sponsored.bloomberg.com/article/japangov/japan-innovating-the-future-industrial-robots",
        "press",
    ),
    src(
        "sse-leaderdrive",
        "Shanghai Stock Exchange",
        "STAR Market company snapshot: Leader Harmonious Drive Systems (688017)",
        "https://star.sse.com.cn/star/en/marketdata/snapshot/c/5545073.shtml",
        "filing",
    ),
    src(
        "gasgoo-leaderdrive-ipo-2026",
        "Gasgoo",
        "Leaderdrive plans Hong Kong IPO",
        "https://autonews.gasgoo.com/articles/news/leaderdrive-plans-hong-kong-ipo-2093357096908443649",
        "press",
    ),
    // Robots and actuators
    src(
        "mobis-boston-dynamics-2026",
        "Hyundai Mobis via PR Newswire Asia",
        "Hyundai Mobis forms strategic collaboration framework with Boston Dynamics",
        "https://en.prnasia.com/releases/global/hyundai-mobis-forms-strategic-collaboration-framework-with-boston-dynamics--518709.shtml",
        "press",
    ),
    src(
        "samsung-rainbow-2024",
        "Samsung Newsroom",
        "Samsung Electronics to become largest shareholder in Rainbow Robotics",
        "https://news.samsung.com/global/samsung-electronics-to-become-largest-shareholder-in-rainbow-robotics",
        "press",
    ),
    src(
        "cnevpost-optimus-audits-2026",
        "CnEVPost",
        "Tesla audits China suppliers ahead of Optimus mass production",
        "https://cnevpost.com/2026/09/21/tesla-audits-china-suppliers-optimus-mass-production/",
        "press",
    ),
    src(
        "wikipedia-unitree",
        "Wikipedia",
        "Unitree Robotics",
        "https://en.wikipedia.org/wiki/Unitree_Robotics",
        "reference",
    ),
    src(
        "tuopu-annual-report-2024",
        "Ningbo Tuopu Group",
        "2024 annual report",
        "https://static.cninfo.com.cn/finalpage/2025-05-01/1223450927.PDF",
        "filing",
    ),
    // Market shares (src/supply-chain/market-share.ts)
    src(
        "usgs-mcs-2025-ree",
        "USGS",
        "Mineral Commodity Summaries 2025: Rare Earths",
        "https://pubs.usgs.gov/periodicals/mcs2025/mcs2025-rare-earths.pdf",
        "government",
    ),
    {
        ...src(
            "fastmarkets-ree-quota-2024-1",
            "Fastmarkets",
            "China issues first batch of rare earths quotas for 2024",
            "https://fastmarkets.com/insights/china-issues-first-batch-of-rare-earths-quotas-for-2024",
            "press",
        ),
        paywalled: true,
    },
    src(
        "asianmetal-ree-quota-2024-2",
        "Asian Metal",
        "China issues second batch of rare earth production quotas for 2024",
        "https://www.asianmetal.com/news/2100201/China-issues-second-batch-of-rare-earth-production-quotas-for-2024",
        "press",
    ),
    src(
        "mp-results-fy2024",
        "MP Materials",
        "MP Materials Reports Fourth Quarter and Full Year 2024 Results",
        "https://mpmaterials.com/news/mp-materials-reports-fourth-quarter-and-full-year-2024-results",
        "filing",
    ),
    src(
        "smm-jlmag-2024-briefing",
        "SMM",
        "JL MAG 2024 online performance briefing",
        "https://www.metal.com/en/newscontent/103258211",
        "press",
    ),
    {
        ...src(
            "qyresearch-ndfeb-2025",
            "QYResearch via DRI",
            "NdFeB Magnets: Global Market Share and Ranking",
            "https://www.dri.co.jp/auto/report/qyr/251013-ndfeb-magnets-global-market-share-and.html",
            "industry-report",
        ),
        paywalled: true,
    },
    src(
        "technode-omdia-humanoid-2025",
        "TechNode",
        "China's AgiBot leads global humanoid robot shipments in 2025, Omdia says",
        "https://technode.com/2026/01/09/chinas-agibot-leads-global-humanoid-robot-shipments-in-2025-omdia-says/",
        "press",
    ),
    src(
        "chinadaily-humanoid-2025",
        "China Daily (Xinhua)",
        "Chinese firms lead global humanoid robot production in 2025: report",
        "https://investinchina.chinadaily.com.cn/s/202601/12/WS6964b698498e23165e06cba4/chinese-firms-lead-global-humanoid-robot-production-in-2025-report.html",
        "press",
    ),
    // Perspective references (src/supply-chain/perspective.ts)
    src(
        "tesla-10k-2025",
        "Tesla 10-K",
        "Form 10-K for fiscal year 2025",
        "https://www.sec.gov/Archives/edgar/data/1318605/000162828026003952/tsla-20251231.htm",
        "filing",
    ),
    src(
        "fai-robot-magnets",
        "Foundation for American Innovation",
        "The robot boom has a magnet problem",
        "https://policygradients.thefai.org/p/the-robot-boom-has-a-magnet-problem",
        "industry-report",
    ),
    {
        ...src(
            "thundersaid-ev-magnets",
            "Thunder Said Energy",
            "Electric vehicles: motors and magnets",
            "https://thundersaidenergy.com/downloads/electric-vehicles-motors-and-magnets/",
            "industry-report",
        ),
        paywalled: true,
    },
    src(
        "doj-ftc-merger-guidelines-2023",
        "US DOJ and FTC",
        "Merger Guidelines (2023)",
        "https://www.justice.gov/atr/2023-merger-guidelines",
        "government",
    ),
    src(
        "statcounter-search-2025-12",
        "StatCounter",
        "Search engine market share worldwide, December 2025",
        "https://gs.statcounter.com/search-engine-market-share/2025-12/worldwide",
        "industry-report",
    ),
    src(
        "foley-merger-guidelines-2023",
        "Foley & Lardner",
        "DOJ, FTC overhaul merger guidelines",
        "https://www.foley.com/insights/publications/2023/07/doj-ftc-overhaul-merger-guidelines/",
        "press",
    ),
    src(
        "doj-hhi",
        "US DOJ Antitrust Division",
        "Herfindahl-Hirschman Index",
        "https://www.justice.gov/atr/public/guidelines/hhi.html",
        "government",
    ),
    src(
        "idc-smartphones-2025",
        "IDC",
        "Smartphone market share: worldwide shipments by vendor, 2025",
        "https://www.idc.com/promo/smartphone-market-share",
        "industry-report",
    ),
    // Company sites, cited for headquarters and product lines
    src(
        "fanuc-site",
        "FANUC",
        "FANUC corporate site",
        "https://www.fanuc.co.jp/en/",
        "company-site",
    ),
    src(
        "yaskawa-site",
        "Yaskawa Electric",
        "Yaskawa global site",
        "https://www.yaskawa-global.com/",
        "company-site",
    ),
    src(
        "timken-site",
        "Timken",
        "The Timken Company",
        "https://www.timken.com/",
        "company-site",
    ),
    src("tesla-site", "Tesla", "Tesla", "https://www.tesla.com/", "company-site"),
    src(
        "bostondynamics-site",
        "Boston Dynamics",
        "Boston Dynamics",
        "https://bostondynamics.com/",
        "company-site",
    ),
    src(
        "nidec-site",
        "Nidec",
        "Nidec Corporation",
        "https://www.nidec.com/en/",
        "company-site",
    ),
    src(
        "ubtech-site",
        "UBTech Robotics",
        "UBTech",
        "https://www.ubtrobot.com/",
        "company-site",
    ),
    src("agibot-site", "AgiBot", "AgiBot", "https://www.agibot.com/", "company-site"),
    src(
        "mobis-site",
        "Hyundai Mobis",
        "Hyundai Mobis",
        "https://www.mobis.com/",
        "company-site",
    ),
    src(
        "shinetsu-site",
        "Shin-Etsu Chemical",
        "Shin-Etsu Chemical",
        "https://www.shinetsu.co.jp/en/",
        "company-site",
    ),
    src(
        "nabtesco-site",
        "Nabtesco",
        "Nabtesco",
        "https://www.nabtesco.com/en/",
        "company-site",
    ),
    src(
        "reht-site",
        "China Northern Rare Earth",
        "China Northern Rare Earth (Group) High-Tech",
        "https://www.reht.com/",
        "company-site",
    ),
    src(
        "hds-site",
        "Harmonic Drive Systems",
        "Harmonic Drive Systems",
        "https://www.hds.co.jp/english/",
        "company-site",
    ),
    src(
        "rainbow-site",
        "Rainbow Robotics",
        "Rainbow Robotics",
        "https://www.rainbow-robotics.com/",
        "company-site",
    ),
];

const byId = new Map(SOURCES.map((s) => [s.id, s]));

export function getSource(id: SourceId): SourceRef | undefined {
    return byId.get(id);
}
