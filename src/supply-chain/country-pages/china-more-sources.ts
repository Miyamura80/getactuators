import type { SourceReuse } from "../reuse";

// Sources for the second /china batch (#80): humanoid, cobot and joint makers,
// the carmakers that buy or back them, and foreign-owned plants in China.
// Spread into CHINA_SOURCES (./china-sources); kept apart so neither file
// outgrows the line limit. Pages opened while building the batch carry that
// date in `accessed`; the Wikipedia headquarters entries were read from search
// results only, so they carry none (see SourceRef in ../sources).

// Structural copy of SourceRef, as in ./china-sources (import cycle).
type Kind =
    | "government"
    | "filing"
    | "industry-report"
    | "press"
    | "company-site"
    | "reference";

export interface ChinaSource {
    id: string;
    title: string;
    publisher: string;
    url: string;
    kind: Kind;
    reuse: SourceReuse;
    accessed?: string;
}

const ACCESSED = "2026-11-07";

export function src(
    id: string,
    publisher: string,
    title: string,
    url: string,
    kind: Kind = "press",
    reuse: SourceReuse = "facts",
): ChinaSource {
    return { id, publisher, title, url, kind, reuse, accessed: ACCESSED };
}

const ref = (id: string, publisher: string, title: string, url: string) =>
    src(id, publisher, title, url, "reference");

// A Wikipedia article whose facts came from search results, never opened.
const wiki = (id: string, title: string, slug: string): ChinaSource => ({
    id,
    publisher: "Wikipedia",
    title,
    url: `https://en.wikipedia.org/wiki/${slug}`,
    kind: "reference",
    reuse: "facts",
});

const GASGOO = "https://autonews.gasgoo.com/articles";
const YICAI = "https://www.yicaiglobal.com";
const ETHERCAT = "https://www.ethercat.org";
const WRC = "World Robot Conference";

export const CHINA_MORE_SOURCES: ChinaSource[] = [
    // Humanoid and robot makers
    src(
        "gasgoo-kepler-binzhou-2026",
        "Gasgoo",
        "Kepler Robot establishes base in Binzhou, Shandong",
        `${GASGOO}/ICV/kepler-robot-establishes-base-in-binzhou-shandong-2021209419952435201`,
    ),
    src(
        "gasgoo-booster-2026",
        "Gasgoo",
        "Embodied AI company Booster Robotics completes nearly 1 billion yuan financing",
        `${GASGOO}/news/embodied-ai-company-booster-robotics-completes-nearly-1-billion-yuan-financing-2046225660790435840`,
    ),
    src(
        "chinadailyhk-booster-2025",
        "China Daily Hong Kong",
        "Sci-tech sector maturing rapidly amid incentives",
        "https://www.chinadailyhk.com/article/614947",
    ),
    src(
        "globalventuring-agilex-2021",
        "Global Corporate Venturing",
        "AgileX access series A funding",
        "https://globalventuring.com/university/agilex-access-series-a-funding/",
    ),
    ref(
        "howtorobot-agilex",
        "HowToRobot",
        "AgileX Robotics: supplier profile",
        "https://www.howtorobot.com/robot-suppliers/agilex-robotics",
    ),
    src(
        "technode-jaka-ipo-2023",
        "TechNode",
        "Jaka Robotics files for $108 million IPO",
        "https://technode.com/2023/05/11/jaka-robotics-files-for-108-million-ipo/",
    ),
    src(
        "jaka-cobots-2026",
        "JAKA Robotics",
        "Why are collaborative robots crucial for SMEs and industry giants?",
        "https://www.jaka.com/en/newsDetail/1221",
        "company-site",
    ),
    src(
        "chinadaily-aubo-zibo-2023",
        "China Daily",
        "Collaborative robot industry supply chain formed in Zibo",
        "https://shandong.chinadaily.com.cn/2023-02/09/c_858271.htm",
    ),
    ref(
        "ethercat-aubo",
        "EtherCAT Technology Group",
        "Member profile: AUBO (Beijing) Robotics Technology",
        `${ETHERCAT}/de/members/members_F72BB8BD1C8D46699BE612B485A33AB5.htm`,
    ),
    src(
        "yicai-rokae-2021",
        "Yicai Global",
        "Chinese robot maker Rokae bags USD31.4 million in new funding led by Shenzhen Capital, Grand Flight",
        `${YICAI}/news/chinese-robot-maker-rokae-bags-usd314-million-in-new-funding-led-by-shenzhen-capital-grand-flight-`,
    ),
    src(
        "prn-engineai-2025",
        "PR Newswire (via TechNode Global)",
        "EngineAI raises nearly RMB 1 billion in Pre-A++ and A1 rounds, led by JD.com",
        "https://technode.global/prnasia/engineai-raises-nearly-rmb-1-billion-in-pre-a-and-a1-rounds-led-by-jd-com/",
    ),
    src(
        "ie-engineai-factory",
        "Interesting Engineering",
        "ENGINEAI's 129,000 sq ft factory claims to build one humanoid robot every 15 mins",
        "https://interestingengineering.com/ai-robotics/china-engineai-humanoid-robot-factory",
    ),
    src(
        "yicai-deep-robotics-2025",
        "Yicai Global",
        "China's Deep Robotics raises USD70.7 million to beef up embodied AI research, production",
        `${YICAI}/news/chinas-deep-robotics-raises-usd707-million-to-speed-rd-of-embodied-ai-robot-adoption`,
    ),
    // Motors, joints, reducers and screws
    ref(
        "wrc-cubemars",
        WRC,
        "Exhibitor: Nanchang Kude Intelligent Technology (CubeMars)",
        "https://wrc.cie.org.cn/list_339/645.html",
    ),
    ref(
        "ethercat-cubemars-hangzhou",
        "EtherCAT Technology Group",
        "Member profile: Hangzhou CubeMars Intelligent Technology",
        `${ETHERCAT}/en/members/members_08C827BF564D4330B816F557AFC770F1.htm`,
    ),
    ref(
        "wrc-damiao",
        WRC,
        "Exhibitor: Shenzhen Damiao Technology",
        "https://www.worldrobotconference.com/list_339/550.html",
    ),
    src(
        "36kr-guohua-2025",
        "36Kr",
        "Xiaomi expands into core components of robotics, invests in joint technology company Guohua Intelligence",
        "https://eu.36kr.com/en/p/3454790669260416",
    ),
    ref(
        "ethercat-guohua",
        "EtherCAT Technology Group",
        "Member profile: Guohua (Qingdao) Intelligent Equipment",
        `${ETHERCAT}/cn/members/members_C68DCD7A31ED4806A84CCC2B7931D6D6.htm`,
    ),
    src(
        "yicai-wuzhou-prs-2025",
        "Yicai Global (STAR50 news)",
        "Humanoid robot concept stocks plan planetary roller screw projects (Wuzhou Xinchun item, 28 Feb 2025)",
        `${YICAI}/star50news/2025_02_286798911192308908066`,
    ),
    // Carmakers that buy or back robots
    wiki("wiki-byd", "BYD Company", "BYD_Company"),
    wiki("wiki-geely", "Geely Holding Group", "Geely_Holding_Group"),
    src(
        "cnevpost-zeekr-ubtech-2024",
        "CnEVPost",
        "Zeekr follows Nio in piloting use of humanoid robots in factory",
        "https://cnevpost.com/2024/08/05/zeekr-piloting-use-humanoid-robots-in-factory/",
    ),
    src(
        "chinadaily-ubtech-factories-2025",
        "China Daily",
        "Humanoids in factories share knowledge as they learn",
        "https://ningbo.chinadaily.com.cn/2025-05/08/c_1091152.htm",
    ),
    // Foreign-owned plants and partnerships
    wiki("wiki-schaeffler", "Schaeffler Group", "Schaeffler_Group"),
    src(
        "gasgoo-schaeffler-rokae-2026",
        "Gasgoo",
        "Schaeffler teams up with ROKAE to accelerate humanoid robot industrialization in China",
        `${GASGOO}/icv/2042493218917101569`,
    ),
    src(
        "gasgoo-schaeffler-leju-2026",
        "Gasgoo",
        "Schaeffler partners with Leju: why are Tier 1 giants racing into humanoid robotics?",
        `${GASGOO}/news/2029182654044278784`,
    ),
    src(
        "humanoidguide-schaeffler-taicang-2026",
        "Humanoid Guide",
        "Schaeffler opens Taicang humanoid factory with six robots",
        "https://humanoid.guide/?p=20657",
    ),
    src(
        "ran-abb-kangqiao-2022",
        "Robotics & Automation News",
        "ABB opens state-of-the-art robotics mega factory in Shanghai",
        "https://roboticsandautomationnews.com/2022/12/05/abb-opens-state-of-the-art-robotics-mega-factory-in-shanghai/58438",
    ),
    src(
        "neo-tianjin-2019",
        "Neo Performance Materials",
        "Neo Magnequench facility named as Top 100 manufacturer in Tianjin, China",
        "https://www.neomaterials.com/neo-magnequench-facility-named-as-top-100-manufacturer-in-tianjin-china/",
        "company-site",
    ),
    src(
        "magneticsmag-neo-shenghe-2025",
        "Magnetics Magazine",
        "Neo reports robust performance, new Euro PM plant nearing completion, China operation sold to Shenghe Resources",
        "https://magneticsmag.com/neo-reports-robust-performance-new-euro-pm-plant-nearing-completion-china-operation-sold-to-shenghe-resources/",
    ),
];
