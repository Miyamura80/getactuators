import type { ChinaSource } from "./china-more-sources";

// Sources for the fourth /china batch (#80): foreign gear, bearing, linear
// motion, servo and pneumatics plants in China, and the robot deals behind
// the new links. Every page was opened on the day the batch was built, so
// each carries that date in `accessed`. Spread into CHINA_SOURCES
// (./china-sources).

const ACCESSED = "2026-11-09";

type Kind = ChinaSource["kind"];

const src = (
    id: string,
    publisher: string,
    title: string,
    url: string,
    kind: Kind = "press",
): ChinaSource => ({
    id,
    publisher,
    title,
    url,
    kind,
    reuse: "facts",
    accessed: ACCESSED,
});

export const CHINA_THIRD_SOURCES: ChinaSource[] = [
    // Foreign plants in China
    src(
        "therobotreport-kuka-shanghai-2013",
        "The Robot Report",
        "KUKA opens Shanghai factory and announces orders",
        "https://www.therobotreport.com/kuka-opens-shanghai-factory-and-announces-orders/",
    ),
    src(
        "festo-jinan-2021",
        "Festo",
        "Festo Jinan fully operational",
        "https://www.festo.com.cn/cn/en/e/about-festo/news-center/festo-jinan-fully-operational-id_736711",
        "company-site",
    ),
    src(
        "shi-tangshan",
        "Sumitomo Drive Technologies",
        "Sumitomo Heavy Industries (Tangshan), Ltd.",
        "https://us.sumitomodrive.com/en-us/facility/sumitomo-heavy-industries-tangshan-ltd",
        "company-site",
    ),
    src(
        "shi-tianjin",
        "Sumitomo Drive Technologies",
        "Tianjin Factory of Sumitomo (SHI) Cyclo Drive China Ltd.",
        "https://japan.sumitomodrive.com/en-jp/facility/tianjin-factory-sumitomo-shi-cyclo-drive-china-ltd",
        "company-site",
    ),
    src(
        "wuxi-thk-base-2023",
        "Wuxi Municipal People's Government",
        "Investment memorandum signed for THK's new manufacturing base in Wuxi",
        "https://en.wuxi.gov.cn/2023-09/08/c_918932.htm",
        "government",
    ),
    src(
        "timken-xemc-xiangtan-2010",
        "Timken",
        "Timken-XEMC Joint Venture in China shipping ultra-large bore bearings from its Xiangtan, Hunan facility",
        "https://news.timken.com/2010-07-01-Timken-XEMC-Joint-Venture-in-China-Shipping-Ultra-Large-Bore-Bearings-from-Its-Xiangtan-Hunan-Facility",
        "company-site",
    ),
    src(
        "skf-dalian-2011",
        "SKF (via Cision)",
        "SKF continues expansion into China by opening 2nd bearing factory in Dalian",
        "https://news.cision.com/skf/r/skf-continues-expansion-into-china-by-opening-2nd-bearing-factory-in-dalian,c9165462",
        "company-site",
    ),
    src(
        "yaskawa-shenyang-2018",
        "Yaskawa Electric",
        "Completion of the third plant at Yaskawa Electric (Shenyang) Co., Ltd.",
        "https://www.yaskawa-global.com/newsrelease/news/13172",
        "company-site",
    ),
    // Robot deals behind the new links
    src(
        "36kr-leaderdrive-hk-ipo-2026",
        "36Kr",
        "The hidden champion behind humanoid robots is poised to launch an IPO in Hong Kong",
        "https://eu.36kr.com/en/p/3965936541654273",
    ),
    src(
        "gasgoo-joyson-h1-2025",
        "Gasgoo",
        "Joyson Electronics posts solid revenue, profit growth in H1 2025, steps up push into robotics",
        "https://autonews.gasgoo.com/articles/news/joyson-electronics-posts-solid-revenue-profit-growth-in-h1-2025-steps-up-push-into-robotics-70038752",
    ),
    src(
        "cs-zhaowei-hands-2025",
        "China Securities Journal (via Sina Finance)",
        "Zhaowei releases a new generation of dexterous hands",
        "https://finance.sina.com.cn/roll/2025-07-07/doc-inferrrh9737755.shtml",
    ),
];
