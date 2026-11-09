import type { SourceReuse } from "../reuse";
import { CHINA_EXTRA_SOURCES } from "./china-extra-sources";
import { CHINA_MORE_SOURCES } from "./china-more-sources";
import { CHINA_THIRD_SOURCES } from "./china-third-sources";

// Sources behind the /china dataset: trade press (Asian Metal, SMM, Yicai,
// Gasgoo), exchange and market-data profiles for headquarters, and company
// pages. The facts in this first batch were taken from search results on the
// day the dataset was built, so its sources carry no `accessed` date (see
// SourceRef). The later batches (./china-more-sources, ./china-extra-sources,
// ./china-third-sources) carry one on every page that was opened; only their
// Wikipedia headquarters entries, read from search results, go without.

// Structural copy of SourceRef: importing the type from ../sources would make
// an import cycle, since ../sources spreads this list into SOURCES.
type Kind =
    | "government"
    | "filing"
    | "industry-report"
    | "press"
    | "company-site"
    | "reference";

interface ChinaSource {
    id: string;
    title: string;
    publisher: string;
    url: string;
    kind: Kind;
    reuse: SourceReuse;
}

function src(
    id: string,
    publisher: string,
    title: string,
    url: string,
    kind: Kind = "press",
    reuse: SourceReuse = "facts",
): ChinaSource {
    return { id, publisher, title, url, kind, reuse };
}

const AM = "https://www.asianmetal.com/news";
const YICAI = "https://yicaiglobal.com/news";
const GASGOO = "https://autonews.gasgoo.com/articles/news";
const MS = "https://www.morningstar.com.au/investments/security";

const profile = (id: string, publisher: string, company: string, url: string) =>
    src(id, publisher, `${company}: company profile`, url, "reference");

export const CHINA_SOURCES: ChinaSource[] = [
    // Rare earth mining and refining
    src(
        "asianmetal-baotou-steel-concentrate",
        "Asian Metal",
        "Baotou Steel to re-sign rare earth concentrate supply contract with Northern Rare Earth",
        `${AM}/1824334/Baotou-Steel-to-resign-rare-earth-concentrate-supply-contract-with-Northern-Rare-Earth-`,
    ),
    src(
        "yicai-baotou-northern-price",
        "Yicai Global",
        "Baotou Steel, Northern Rare Earth gain after reaching deal on rare-earth concentrate prices",
        "https://www2.yicaiglobal.com/news/baotou-steel-northern-rare-earth-gain-after-reaching-deal-on-rare-earth-concentrate-prices",
    ),
    src(
        "asianmetal-golden-dragon-baotou-2025",
        "Asian Metal",
        "Baotou Golden Dragon commissions high performance NdFeB magnet project",
        `${AM}/2205198/Baotou-Golden-Dragon-commissions-high-performance-NdFeB-magnet-project`,
    ),
    src(
        "asianmetal-golden-dragon-phase2-2026",
        "Asian Metal",
        "Golden Dragon Rare Earth launches Phase II NdFeB magnet project",
        `${AM}/2318162/Golden-Dragon-Rare-Earth-launches-Phase-II-NdFeB-magnet-project`,
    ),
    src(
        "asianmetal-crg-rising-nonferrous",
        "Asian Metal",
        "China Rare Earth Group becomes actual controller of Rising Nonferrous Metal",
        `${AM}/2021946/China-Rare-Earth-Group-becomes-actual-controller-of-Rising-Nonferrous-Metal`,
    ),
    src(
        "asianmetal-mianning-2010",
        "Asian Metal",
        "Mianning Rare Earth Resources Comprehensive Development Project started",
        `${AM}/553535/Mianning-Rare-Earth-Resources-Comprehensive-Development-Project-started`,
    ),
    src(
        "cgtn-maoniuping-2026",
        "CGTN",
        "World's 2nd largest rare earth mine expands China's resource advantage",
        "https://news.cgtn.com/news/2026-03-21/World-s-2nd-largest-rare-earth-mine-expands-China-s-resource-advantage-1LHdejtBtTO/index.html",
    ),
    src(
        "asianmetal-grirem-visit-2021",
        "Asian Metal",
        "Company visit: Grirem Advanced Materials",
        "https://cdn.asianmetal.com/cag/2021/visit2021041301en.shtml",
    ),
    // Magnets and motors
    src(
        "asianmetal-yunsheng-baotou",
        "Asian Metal",
        "Ningbo Yunsheng raises RMB1 billion for high-performance rare earth permanent magnetic material project",
        `${AM}/1878643/Ningbo-Yunsheng-raises-RMB1-billion-for-high-performance-rare-earth-permanent-magnetic-material-project-`,
    ),
    src(
        "smm-zksh-hitachi-jv",
        "SMM",
        "Zhongke Sanhuan, Hitachi Metals to build JV for NdFeB production",
        "https://news.metal.com/newscontent/100074360/%5BRare-Earth%5D-Zhongke-Sanhuan-Hitachi-Metals-to-Build-JV-for-NdFeB-Production",
    ),
    src(
        "smm-zksh-southern-jv",
        "SMM",
        "Zhongke Sanhuan takes a stake in Southern Rare Earth to set up a joint venture for high-performance magnets",
        "https://news.metal.com/newscontent/101194956-zhongke-sanhuan-takes-a-stake-in-southern-rare-earth-to-set-up-a-joint-venture-company-to-produce-high-performance-rare",
    ),
    src(
        "jdamagnet-china-top10-2023",
        "JDA Magnet",
        "Top 10 magnet manufacturers in China for 2023",
        "https://jdamagnet.com/?p=11544",
        "reference",
    ),
    src(
        "asianmetal-zhmag-2023",
        "Asian Metal",
        "ZHmag reports increased annual NdFeB production and sales",
        `${AM}/2053029/ZHmag-reports-increased-annual-NdFeB-production-and-sales`,
    ),
    src(
        "asianmetal-earth-panda-baotou",
        "Asian Metal",
        "Earth Panda's Baotou 5ktpa NdFeB project begins production",
        `${AM}/2001814/Earth-Panda's-Baotou-5ktpa-NdFeB-project-begins-production`,
    ),
    profile(
        "morningstar-earth-panda",
        "Morningstar",
        "Earth-Panda Advanced Magnetic Material",
        `${MS}/SHSE/688077`,
    ),
    src(
        "asianmetal-ysm-fushan",
        "Asian Metal",
        "YSM kicks off construction of magnets project in Fushan",
        `${AM}/2168007/YSM-kicks-off-construction-of-magnets-project-in-Fushan`,
    ),
    src(
        "asianmetal-tianhe-output",
        "Asian Metal",
        "Tianhe Magnetics reports record high annual magnet blank output",
        `${AM}/2183391/Tianhe-Magnetics-reports-record-high-annual-magnet-blank-output`,
    ),
    src(
        "asianmetal-tianhe-invest",
        "Asian Metal",
        "Tianhe Magnetics to invest in rare earth magnet projects",
        `${AM}/2241298/Tianhe-Magnetics-to-invest-in-rare-earth-magnet-projects/1`,
    ),
    profile(
        "morningstar-galaxy-magnets",
        "Morningstar",
        "Chengdu Galaxy Magnets",
        `${MS}/SZSE/300127`,
    ),
    src(
        "asianmetal-galaxy-output",
        "Asian Metal",
        "Galaxy Magnets reports steady growth in annual production and sales",
        `${AM}/2308968/Galaxy-Magnets-reports-steady-growth-in-annual-production-and-sales`,
    ),
    src(
        "inovance-profile-2024",
        "Inovance",
        "Inovance company profile 2024",
        "https://www.inovance.eu/fileadmin/downloads/Brochures/EN/Inovance_Company_Profile-2024_A03-V3.0.pdf",
        "company-site",
    ),
    src(
        "glueup-inovance-suzhou",
        "Glue Up",
        "Industry insight tour to Inovance Suzhou super factory",
        "https://app.glueup.cn/event/industry-insight-tour-to-inovance-suzhou-super-factory-47743",
    ),
    src(
        "hkex-inovance-2026",
        "HKEX",
        "Shenzhen Inovance Technology: Hong Kong listing document (2026)",
        "https://www1.hkexnews.hk/app/sehk/2026/108472/a132325/sehk26042802286.pdf",
        "filing",
    ),
    src(
        "marklines-inovance-changzhou",
        "MarkLines",
        "Inovance Technology's subsidiary to build manufacturing site for NEV powertrains in Changzhou",
        "https://www.marklines.com/en/news/275605",
    ),
    src(
        "chinadaily-wolong-2019",
        "China Daily",
        "Wolong Holding Group Co Ltd",
        "https://zhejiang.chinadaily.com.cn/2019-04/19/c_420334.htm",
    ),
    src(
        "smm-wolong-robots-2026",
        "SMM",
        "Wolong Electric Drive rushes for H share listing and keeps investing in robots",
        "https://news.metal.com/newscontent/103383087/Wolong-Electric-Drives-Rushes-for-H-Share-Listing-Sheds-%22Burden%22-of-New-Energy-at-the-Beginning-of-the-Year-Continues-to-Increase-Investment-in-the-Robot-Sector-%7C-Quick-Read-of-the-Announcement",
    ),
    src(
        "chinadaily-hechuan-2022",
        "China Daily",
        "Company breaks foreign brands' dominance",
        "https://govt.chinadaily.com.cn/s/202210/13/WS6347acad498ea274927a5904/company-breaks-foreign-brands-dominance.html",
    ),
    profile(
        "morningstar-moons",
        "Morningstar",
        "Shanghai Moons' Electric",
        "https://morningstar.com.au/investments/security/SHSE/603728",
    ),
    src(
        "leadshine-about",
        "Leadshine",
        "About Leadshine: corporate overview",
        "https://en.leadshine.com/abouts/about_corporate_overview.html",
        "company-site",
    ),
    src(
        "prnasia-leadshine-ces-2026",
        "PR Newswire Asia",
        "Leadshine's dexterous hands and frameless motors shine at CES 2026",
        "https://en.prnasia.com/releases/global/leadshine-s-dexterous-hands-and-frameless-motors-shine-at-ces-2026-519017.shtml",
    ),
    src(
        "technode-zhaowei-ces-2025",
        "TechNode Global",
        "ZHAOWEI's dexterous hand debuts at CES 2025",
        "https://technode.global/?p=91891",
    ),
    // Gears, screws and bearings
    profile(
        "ethercat-shuanghuan",
        "EtherCAT Technology Group",
        "Zhejiang Shuanghuan Driveline",
        "https://www.ethercat.org/cn/members/members_FC320B48279A451F86170BE41E13EBB0.htm",
    ),
    src(
        "yicai-shuanghuan-efort",
        "Yicai Global",
        "Shuanghuan wins order for 10,000 joint reducers from robot developer",
        `${YICAI}/shuanghuan-wins-order-for-10000-joint-reducers-from-robot-developer`,
    ),
    profile(
        "morningstar-zd-leader",
        "Morningstar",
        "Ningbo Zhongda Leader Intelligent Transmission",
        `${MS}/SZSE/002896`,
    ),
    src(
        "36kr-laifual",
        "36Kr",
        "Laifual: from Shengzhou to robot harmonic reducers",
        "https://eu.36kr.com/en/p/3875028576490500",
    ),
    src(
        "gasgoo-laifual-ipo-2026",
        "Gasgoo",
        "Laifual Drive launches IPO, plans to list on June 30",
        `${GASGOO}/laifual-drive-launches-ipo-plans-to-list-on-june-30-2069799357594185729`,
    ),
    src(
        "ipox-laifual-2026",
        "IPOX",
        "IPO calendar: Laifual Drive",
        "https://www.ipox.com/ipo-calendar/laifual-drive",
        "reference",
    ),
    src(
        "itiger-beite-prs-2024",
        "Tiger Brokers",
        "Beite Technology to invest 1.85 billion yuan to build planetary roller screw production base",
        "https://itiger.com/news/2475595965",
    ),
    src(
        "dcf-beite-2026",
        "DCF Model",
        "Shanghai Beite Technology (603009.SS): SWOT analysis",
        "https://dcf-model.com/fr/products/603009ss-swot-analysis",
        "reference",
    ),
    profile(
        "morningstar-best-precision",
        "Morningstar",
        "Wuxi Best Precision Machinery",
        `${MS}/SZSE/300580`,
    ),
    src(
        "filingreader-best-2026",
        "FilingReader",
        "Best Precision Machinery clarifies humanoid robot revenue after stock surge",
        "https://filingreader.com/news-wire/shenzhen/2026-07-05/best-precision-machinery-clarifies-humanoid-robot-revenue-after-stock-surge",
    ),
    profile(
        "justia-zwz",
        "Justia Trademarks",
        "Wafangdian Bearing Group Corp. Ltd.",
        "https://trademarks.justia.com/owners/wafangdian-bearing-group-corp-ltd-5960925",
    ),
    profile(
        "dealroom-lyc",
        "Dealroom",
        "Luoyang LYC Bearing",
        "https://app.dealroom.co/companies/luoyang_lyc_bearing",
    ),
    src(
        "chinadaily-hrb-2017",
        "China Daily",
        "Harbin Bearing Group Co",
        "https://govt.chinadaily.com.cn/s/201711/24/WS5b783ffc498e855160e8cb4a/harbin-bearing-group-co.html",
    ),
    src(
        "gasgoo-zhenhua-bearings-2026",
        "Gasgoo",
        "Zhenhua Bearing's robot joint bearings enter volume supply",
        `${GASGOO}/2112803843330428929`,
    ),
    profile(
        "dealroom-nousbot",
        "Dealroom",
        "Nousbot",
        "https://app.dealroom.co/companies/nousbot",
    ),
    src(
        "pedaily-nousbot-2026",
        "Pedaily",
        "Nousbot closes Series A",
        "https://news.pedaily.cn/202603/561493.shtml",
    ),
    src(
        "10jqka-juxie-2026",
        "10jqka",
        "Juxie closes Series A+",
        "https://news.10jqka.com.cn/20261010/c680548800.shtml",
    ),
    // Robot and actuator makers
    src(
        "pedaily-encos-2026",
        "Pedaily",
        "Encos closes Series B",
        "https://news.pedaily.cn/202609/569015.shtml",
    ),
    src(
        "bjnews-quanzhibo-2026",
        "Beijing News",
        "Quanzhibo closes Series B",
        "https://www.bjnews.com.cn/detail/1788600417129849.html",
    ),
    src(
        "ithome-zeroerr-2026",
        "IT Home",
        "ZeroErr closes Series C++",
        "https://www.ithome.com/0/975/925.htm",
    ),
    src(
        "pedaily-inspire-2026",
        "Pedaily",
        "Inspire Robots closes Series C1 and C2",
        "https://news.pedaily.cn/202602/561144.shtml",
    ),
    src(
        "robotshop-inspire-h2",
        "RobotShop",
        "Inspire RH56DFTP dexterous hand for Unitree H2",
        "https://www.robotshop.com/products/inspire-rh56dftp-dexterous-hand-for-unitree-h2-pair",
        "company-site",
    ),
    src(
        "36kr-robstride-2025",
        "36Kr",
        "RobStride closes Pre-A and Pre-A+ rounds",
        "https://www.36kr.com/p/3459194287216261",
    ),
    src(
        "myactuator-site",
        "MyActuator",
        "MyActuator corporate site",
        "https://www.myactuator.com/",
        "company-site",
    ),
    src(
        "pudong-fourier-2025",
        "Pudong New Area government",
        "Fourier in Zhangjiang",
        "https://english.pudong.gov.cn/2025-05/12/c_1097470.htm",
        "government",
    ),
    src(
        "technode-fourier-2023",
        "TechNode",
        "Chinese robotics firm Fourier aims for mass production of humanoid robots in two years",
        "https://technode.com/2023/07/13/chinese-robotics-firm-fourier-aims-for-mass-production-of-humanoid-robots-in-two-years/",
    ),
    profile(
        "cbinsights-galbot",
        "CB Insights",
        "Galbot (Yinhe Tongyong Jiqiren)",
        "https://www.cbinsights.com/company/yinhe-tongyong-jiqiren",
    ),
    src(
        "technode-galbot-2026",
        "TechNode",
        "Humanoid robot maker Galbot raises RMB 2.5 billion",
        "https://technode.com/2026/03/02/humanoid-robot-maker-galbot-raises-rmb-2-5-billion/",
    ),
    src(
        "gasgoo-xpeng-base-2026",
        "Gasgoo",
        "XPENG to build full-chain humanoid robot mass production base in Guangzhou",
        `${GASGOO}/xpeng-to-build-full-chain-humanoid-robot-mass-production-base-in-guangzhou-2026901200610291712`,
    ),
    src(
        "gasgoo-xpeng-lines-2026",
        "Gasgoo",
        "XPENG officially establishes full-chain mass production base for humanoid robots",
        `${GASGOO}/xpeng-officially-establishes-full-chain-mass-production-base-for-humanoid-robots-2026958902107578369`,
    ),
    src(
        "technode-cyberdog2-2023",
        "TechNode",
        "Xiaomi releases the CyberDog 2, a smart quadruped bio robot",
        "https://technode.com/2023/08/15/xiaomi-releases-the-cyberdog-2-a-smart-quadruped-bio-robot/",
    ),
    src(
        "techzephyr-china-robotics",
        "TechZephyr",
        "The rise of China's robotics and automation sector, part 1",
        "https://techzephyr.substack.com/p/the-rise-of-chinas-robotics-and-automation",
        "reference",
    ),
    src(
        "evsint-china-robot-makers",
        "EVS",
        "Top 10 Chinese industrial robot manufacturers (2026 guide)",
        "https://www.evsint.com/pt/china-industrial-robot-manufacturers/",
        "reference",
    ),
    src(
        "yicai-efort-super-plant",
        "Yicai Global",
        "Efort surges after industrial robot maker unveils plan for super plant, global HQ",
        `${YICAI}/eforts-stock-surges-on-plan-to-invest-usd263-million-to-build-robot-super-plant-global-hq`,
    ),
    profile(
        "yahoo-siasun",
        "Yahoo Finance",
        "Siasun Robot & Automation (300024.SZ)",
        "https://de.finance.yahoo.com/quote/300024.SZ/profile",
    ),
    src(
        "chinaservices-siasun-2017",
        "China Daily",
        "Siasun Robot & Automation Co",
        "https://chinaservicesinfo.com/s/201711/28/WS5b77fb7f498e855160e8a451/siasun-robot-automation-co.html",
    ),
    profile(
        "yahoo-sanhua",
        "Yahoo Finance",
        "Zhejiang Sanhua Intelligent Controls (002050.SZ)",
        "https://uk.finance.yahoo.com/quote/002050.SZ/profile",
    ),
    src(
        "yicai-sanhua-base",
        "Yicai Global",
        "Sanhua rises after unveiling plan to invest USD703.4 million in smart parts production base",
        `${YICAI}/chinas-sanhua-to-invest-usd7034-million-to-build-smart-parts-production-base`,
    ),
    src(
        "counterpoint-optimus-2026",
        "Counterpoint Research",
        "Tesla to leverage EV experience and Chinese partners to ace humanoids market",
        "https://counterpointresearch.com/cn/insights/blog-tesla-to-leverage-ev-experience-and-chinese-partners-to-ace-humanoids-market-unlock-huge-revenue-potential",
        "industry-report",
    ),
    src(
        "kuka-china-2018",
        "KUKA",
        "KUKA expands China business",
        "https://www.kuka.com/en-ca/company/press/news/2018/03/kuka-expands-china-business",
        "company-site",
    ),
    src(
        "yicai-midea-kuka-base",
        "Yicai Global",
        "Midea-Kuka robot manufacturing base breaks ground in southeast China",
        `${YICAI}/midea-kuka-robot-manufacturing-base-breaks-ground-in-southeast-china`,
    ),
    src(
        "robohub-midea-kuka",
        "Robohub",
        "Midea's masterplan to become China's robot powerhouse",
        "https://robohub.org/mideas-masterplan-to-become-chinas-robot-powerhouse",
    ),
    src(
        "gasgoo-midea-welling-2026",
        "Gasgoo",
        "Midea Welling Robotics lands in Foshan Shunde, production to start in 2027",
        `${GASGOO}/midea-welling-robotics-lands-in-foshan-shunde-production-to-start-in-2027-2075141064233897985`,
    ),
    src(
        "therobotreport-yaskawa-midea",
        "The Robot Report",
        "Yaskawa, Midea join forces for robot ventures",
        "https://www.therobotreport.com/yaskawa-midea-join-forces-for-robot-ventures/",
    ),
    src(
        "yicai-shanghai-electric-fanuc",
        "Yicai Global",
        "Shanghai Electric hits limit-up on plan to take over robotics JV Shanghai Fanuc",
        "https://www2.yicaiglobal.com/news/shanghai-electric-hits-limit-up-on-plan-to-take-over-robotics-jv-shanghai-fanuc",
    ),
    src(
        "sheitc-shanghai-fanuc-phase3",
        "Shanghai Municipal Commission of Economy and Informatization",
        "Foundation laying ceremony of Shanghai FANUC Intelligent Factory Phase III",
        "https://english.sheitc.sh.gov.cn/news/687561.htm",
        "government",
    ),
    src(
        "shanghai-electric-site",
        "Shanghai Electric",
        "Shanghai Electric group site",
        "https://www.shanghai-electric.com/group_en/fnkjqrjtjj",
        "company-site",
    ),
    src(
        "yicai-dobot-ipo",
        "Yicai Global",
        "Chinese cobot maker Dobot bags USD87.6 million in Hong Kong debut",
        `${YICAI}/chinese-cobot-maker-dobot-bags-usd876-million-in-hong-kong-debut`,
    ),
    src(
        "yicai-dobot-atom",
        "Yicai Global",
        "Dobot gains as pre-sales begin for first humanoid robot Atom",
        `${YICAI}/chinas-dobot-gains-as-pre-sales-begin-for-first-humanoid-robot-atom`,
    ),
    src(
        "mikekalil-leju-factory",
        "Mike Kalil",
        "China's new robot factory claims 10,000 annual production capacity",
        "https://mikekalil.com/blog/china-leju-robot-humanoid-factory/",
    ),
    src(
        "globalventuring-leju",
        "Global Venturing",
        "Leju Robotics fetches series B funding",
        "https://globalventuring.com/leju-robotics-fetches-series-b-funding",
    ),
    // Financials and customer links
    src(
        "sse-unitree-ipo-2026",
        "Shanghai Stock Exchange (China Daily)",
        "Unitree IPO draws spotlight to China's fast-growing humanoid robot sector",
        "https://english.sse.com.cn/news/newsrelease/voice/c/c_20260811_10828578.shtml",
    ),
    src(
        "krasia-unitree-ipo",
        "KrASIA",
        "Unitree targets IPO after revenue quadruples on robotics demand",
        "https://amp.kr-asia.com/unitree-targets-ipo-after-revenue-quadruples-on-robotics-demand",
    ),
    src(
        "jlmag-results-2021",
        "JL MAG (via Financial Content)",
        "JL MAG achieved robust revenue and profit growth in 2021",
        "https://markets.financialcontent.com/pennwell.oilgasjournal/article/acn-2022-3-31-jl-mag-achieved-robust-revenue-and-profit-growth-in-2021",
    ),
    src(
        "yicai-jlmag-tesla",
        "Yicai Global",
        "JL Mag Rare Earth hits limit up on Tesla permanent magnet deal",
        "https://www2.yicaiglobal.com/news/china-jl-mag-rare-earth-hits-limit-up-on-tesla-permanent-magnet-deal",
    ),
    ...CHINA_MORE_SOURCES,
    ...CHINA_EXTRA_SOURCES,
    ...CHINA_THIRD_SOURCES,
];
