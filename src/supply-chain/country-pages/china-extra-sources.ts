import { type ChinaSource, src } from "./china-more-sources";

// Sources for the third /china batch (#80): humanoid factories, Xiaomi's car
// plant, Northern Rare Earth's smelting and recycling units, and the robot
// deals behind the new links. Every page was opened on the day the batch was
// built, so each carries that date in `accessed` (set by src). Spread into
// CHINA_SOURCES (./china-sources).

const GASGOO = "https://autonews.gasgoo.com/articles/news";

export const CHINA_EXTRA_SOURCES: ChinaSource[] = [
    // Humanoid and robot factories
    src(
        "lingang-agibot-2024",
        "Lin-gang Special Area",
        "Humanoid robot production set to come to Shanghai's Lin-gang Special Area",
        "https://en.lingang.gov.cn/html/website/lg/English/News1630758253379031042/Updates/1764951244388995074.html",
        "government",
    ),
    src(
        "gasgoo-lyitech-agibot-2026",
        "Gasgoo",
        "Partnering with AgiBot, LY iTech rolls off 200 general-purpose humanoid robots for delivery",
        `${GASGOO}/partnering-with-agibot-ly-itech-rolls-off-200-general-purpose-humanoid-robots-for-delivery-2058923574767915009`,
    ),
    src(
        "computelabs-ubtech-liuzhou-2026",
        "Compute Labs",
        "UBTECH began production at its Liuzhou humanoid-robot factory, with planned annual capacity exceeding 10,000 robots",
        "https://www.computelabs.ai/research/2026-09-12/ubtech-began-production-liuzhou-humanoid-robot-factory-annual-capacity-exceeding",
    ),
    src(
        "gasgoo-ubtech-fawvw-2026",
        "Gasgoo",
        "UBTECH, FAW-Volkswagen partner on humanoid robots for logistics and smart manufacturing",
        `${GASGOO}/ubtech-faw-volkswagen-partner-on-humanoid-robots-for-logistics-and-smart-manufacturing-2108068987505434624`,
    ),
    src(
        "ran-ubtech-walker-s2-2025",
        "Robotics & Automation News",
        "UBTECH starts mass production of humanoid robots after receiving orders of $112 million",
        "https://roboticsandautomationnews.com/2025/11/17/ubtech-starts-mass-production-of-humanoid-robots-after-receiving-orders-of-112-million-and-a-data-center-contract-worth-22-million/96647/",
    ),
    src(
        "scmp-unitree-factory-2025",
        "South China Morning Post",
        "Chinese robotics star Unitree opens Hangzhou factory amid humanoid frenzy",
        "https://www.scmp.com/tech/tech-trends/article/3307315/chinese-robotics-star-unitree-opens-hangzhou-factory-amid-humanoid-frenzy",
    ),
    src(
        "gasgoo-unitree-ipo-2026",
        "Gasgoo",
        "Unitree wins IPO approval as robot makers face tougher profit challenges",
        `${GASGOO}/unitree-wins-ipo-approval-as-robot-makers-face-tougher-profit-challenges-2061816669448765440`,
    ),
    src(
        "gasgoo-galbot-catl-2026",
        "Gasgoo",
        "Galbot's Galbot S1 begins operations at CATL's factory",
        `${GASGOO}/galbots-galbot-s1-begins-operations-at-catls-factory-2070399392245612544`,
    ),
    src(
        "cnevpost-catl-galbot-2026",
        "CnEVPost",
        "CATL teams with Galbot to scale humanoid robots in battery factories",
        "https://cnevpost.com/2026/06/24/catl-galbot-scale-humanoid-robots-battery-factories/",
    ),
    src(
        "36kr-galbot-catl-2025",
        "36Kr",
        "1.1 billion yuan: largest single financing for a robot company this year refreshed",
        "https://eu.36kr.com/en/p/3348355744504450",
    ),
    // Carmakers and parts makers
    src(
        "businesstimes-xiaomi-ev-2025",
        "The Business Times",
        "Xiaomi plans to expand Beijing EV factory to meet surging demand",
        "https://www.businesstimes.com.sg/companies-markets/xiaomi-plans-expand-beijing-ev-factory-meet-surging-demand",
    ),
    src(
        "jiemian-sanhua-2025",
        "Jiemian Global",
        "Sanhua's Tesla order rumor fuels China's robot frenzy, tests industrial reality",
        "https://en.jiemian.com/article/13528295.html",
    ),
    src(
        "gasgoo-tuopu-2025-results",
        "Gasgoo",
        "Tuopu Group's 2025 revenue hits RMB 29.58B, with new growth engines taking shape",
        `${GASGOO}/tuopu-groups-2025-revenue-hits-rmb-2958b-with-new-growth-engines-taking-shape-2036461499797635072`,
    ),
    src(
        "gasgoo-tier1-robotics-2026",
        "Gasgoo",
        "Tier 1 suppliers' second battlefield: more profitable than autos, but harder than imagined",
        `${GASGOO}/tier-1-suppliers-second-battlefield-more-profitable-than-autos-but-harder-than-imagined-2037709209863352321`,
    ),
    src(
        "minth-annual-report-2025",
        "Minth Group",
        "Annual Report 2025",
        "https://www.minthgroup.com/ENG/upload/files/2026/4/e_00425ar-20260429.pdf",
        "filing",
    ),
    src(
        "gasgoo-skf-leaderdrive-2026",
        "Gasgoo",
        "SKF partners with Leaderdrive to establish joint venture targeting humanoid robot precision components",
        "https://autonews.gasgoo.com/articles/market-industry/skf-partners-with-leaderdrive-to-establish-joint-venture-targeting-humanoid-robot-precision-components-2073279071470268417",
    ),
    // Rare earths
    src(
        "smm-northern-ir-2026",
        "Shanghai Metals Market",
        "China Northern Rare Earth: rare earth prices are expected to remain range-bound in the short term",
        "https://news.metal.com/newscontent/104026540-china-northern-rare-earth-affected-by-the-industry-supply-demand-pace-and-downstream-procurement-cycles-rare-earth-price",
    ),
    src(
        "chinadaily-northern-smelting-2024",
        "China Daily",
        "Rare earth production gets major upgrade",
        "https://www.chinadaily.com.cn/a/202410/16/WS670fa1eea310f1265a1c7f76.html",
    ),
    src(
        "peculiar-northern-2026",
        "Peculiar Materials",
        "China Northern Rare Earth (Group) High-Tech Co., Ltd.: rare-earth magnet supply chain profile",
        "https://peculiarmaterials.com/insights/rare-earth-magnet-supply-chain-atlas/china-northern-rare-earth/",
        "reference",
    ),
];
