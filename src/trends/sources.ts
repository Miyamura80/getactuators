import type { ReuseAllowlist, SourceReuse } from "../supply-chain/reuse";

// Every source cited on /trends, keyed by a short id. We take single dated
// facts (a list price on a snapshot date, a share, a rate) and never copy a
// source's table, chart or prose. Epoch AI's and Karthik Tadepalli's work is
// "facts": neither the publication nor its data repository states an open
// licence, so the page charts the handful of summary figures they publish and
// links the originals.

export interface Source {
    title: string;
    url: string;
    reuse: SourceReuse;
}

const WB = "https://web.archive.org/web";

export const SOURCES = {
    // Actuator list prices: Wayback snapshots of vendor and retailer pages
    "wb-xm430-2017": {
        title: "Wayback, 30 Dec 2017: ROBOTIS US store, DYNAMIXEL XM430-W350-T at $229.90",
        url: `${WB}/20171230170330/http://www.robotis.us/dynamixel-xm430-w350-t`,
        reuse: "facts",
    },
    "wb-xm430-2020": {
        title: "Wayback, 28 Sep 2020: ROBOTIS US store, XM430-W350-T at $229.90",
        url: `${WB}/20200928213757/http://www.robotis.us/dynamixel-xm430-w350-t/`,
        reuse: "facts",
    },
    "wb-xm430-2024": {
        title: "Wayback, 24 Feb 2024: ROBOTIS US store, XM430-W350-T at $269.90",
        url: `${WB}/20240224040938/https://www.robotis.us/dynamixel-xm430-w350-t/`,
        reuse: "facts",
    },
    "arxiv-2110-01562": {
        title: "arXiv 2110.01562 (Oct 2021): exoskeleton paper picks the AK80-9 for its US$580 cost",
        url: "https://arxiv.org/abs/2110.01562",
        reuse: "facts",
    },
    "wb-ak80-9-2024": {
        title: "Wayback, 10 Oct 2024: CubeMars store, AK80-9 KV100 at $479.90 bare or $579.90 with driver board",
        url: `${WB}/20241010175004/https://store.cubemars.com/products/ak80-9`,
        reuse: "facts",
    },
    "cubemars-ak80-9-v1": {
        title: "CubeMars store: AK80-9 KV100 (first version), 9 N·m rated, 18 N·m peak",
        url: "https://store.cubemars.com/products/ak80-9",
        reuse: "facts",
    },
    "wb-qdd100-2022": {
        title: "Wayback, 16 Aug 2022: mjbots, qdd100 beta 3 at $539",
        url: `${WB}/20220816165036/https://mjbots.com/products/qdd100-beta-3`,
        reuse: "facts",
    },
    "wb-qdd100-2025": {
        title: "Wayback, 18 Jan 2025: mjbots, qdd100 beta 3 still $539 (volume tiers from $479)",
        url: `${WB}/20250118011450/https://mjbots.com/products/qdd100-beta-3`,
        reuse: "facts",
    },
    "wb-go-m8010-2024": {
        title: "Wayback, 6 Jan 2024: Unitree shop, GO-M8010-6 motor at $500",
        url: `${WB}/20240106075807/https://shop.unitree.com/products/go1-motor`,
        reuse: "facts",
    },
    "simplefoc-cybergear-2023": {
        title: "SimpleFOC forum, Sep 2023: CyberGear on AliExpress for about $88",
        url: "https://community.simplefoc.com/t/xiaomi-cyber-dog-geared-motor-60/3855?page=2",
        reuse: "facts",
    },
    "hackaday-gim6010-cybergear-2025": {
        title: "Hackaday.io, 17 Mar 2025: CyberGear $91 vs GIM6010-8 $50 to $85 on AliExpress",
        url: "https://hackaday.io/project/202366-the-unnamed-spider-bot/log/239239-steadywin-gim6010-8-vs-xiaomi-cybergear-micromotor",
        reuse: "facts",
    },
    "wb-robstride-04-2026": {
        title: "Wayback, 5 Jun 2026: Seeed Studio, RobStride 04 at $255",
        url: `${WB}/20260605101824/https://www.seeedstudio.com/Robostride-04-Actuator-p-6775.html`,
        reuse: "facts",
    },
    // Rated life
    "tqg-csg-csf-life": {
        title: "TQG gear: CSG series rated life 10,000 h, 43% above the CSF series",
        url: "https://www.tqggear.com/is/csg-csf-component-set-harmonic-gearbox.html",
        reuse: "facts",
    },
    // Roller screws
    "baidu-roller-screw-2023": {
        title: "Baidu Aiqicha, Aug 2023: broker model puts a planetary roller screw at 1,080 CNY",
        url: "https://yiqifu.baidu.com/cknowledge_10138864513",
        reuse: "facts",
    },
    "huaxin-roller-screw-2024": {
        title: "Huaxin Securities via Moomoo, Mar 2024: about 2,000 CNY per planetary roller screw, 14 per humanoid",
        url: "https://www.moomoo.com/news/post/35866303/huaxin-securities-planetary-roller-screws-will-become-an-important-segment",
        reuse: "facts",
    },
    // Robot market shares
    "agibot-omdia-2025": {
        title: "AgiBot, 8 Jan 2026: Omdia counts about 13,000 humanoids shipped in 2025, AgiBot 5,168 (39%)",
        url: "https://www.agibot.com/article/231/detail/33.html",
        reuse: "facts",
    },
    "sag-humanoid-1h2026": {
        title: "Smart Analytics Global, 10 Aug 2026: 19.1K humanoids in 1H 2026 (5.1K in 1H 2025); vendor units and shares",
        url: "https://smartanalyticsglobal.com/global-humanoid-robot-shipments-2026-agibot-unitree/",
        reuse: "facts",
    },
    "usitc-china-robots": {
        title: "USITC executive briefing: 137,900 industrial robots sold in China in 2017, 34,700 by Chinese firms",
        url: "https://www.usitc.gov/publications/332/executive_briefings/chinese_industrial_robots.pdf",
        reuse: "facts",
    },
    "estun-mir-share": {
        title: "Estun citing MIR Databank: domestic makers' share of China's industrial robot market under 29% in 2020, 55% in 2025",
        url: "https://en.estun.com/?list_52%2F2303.html=",
        reuse: "facts",
    },
    "ifr-wr2024-slides": {
        title: "IFR World Robotics 2024 press conference slides: Chinese suppliers 47% of China installations in 2023",
        url: "https://www.scribd.com/document/888077343/Press-Conference-2024",
        reuse: "facts",
    },
    "csis-chinapower-robots": {
        title: "CSIS ChinaPower, Feb 2026: China produced 57% of the industrial robots it installed in 2024",
        url: "https://chinapower.csis.org/china-industrial-robots/",
        reuse: "facts",
    },
    "bri-ifr-2025": {
        title: "Belt and Road Portal, Sep 2026, citing IFR: domestic suppliers installed 195,000 robots in China in 2025, a 55% share",
        url: "https://eng.yidaiyilu.gov.cn/p/0IMJ655B.html",
        reuse: "facts",
    },
    // The price of AI
    "epoch-plunging-price": {
        title: "Epoch AI (Emberson, Roodman), Sep 2026: The plunging price of thought",
        url: "https://epoch.ai/publications/the-plunging-price-of-thought",
        reuse: "facts",
    },
    "tadepalli-rd-price": {
        title: "Karthik Tadepalli, Sep 2026: rd-price-declines, Epoch's price series against cumulative R&D",
        url: "https://github.com/karthiktadepalli1/rd-price-declines",
        reuse: "facts",
    },
    // Battery runtime
    "robohub-h1-runtime": {
        title: "RoboHub: Unitree H1 runtime about 2 h per charge",
        url: "https://robohub.app/compare/unitree-h1/vs/unitree-r1",
        reuse: "facts",
    },
    "prn-fourier-gr3": {
        title: "PR Newswire, Aug 2025: Fourier unveils the GR-3 care humanoid",
        url: "https://www.prnewswire.com/news-releases/meet-gr-3-beyond-function-designed-to-care-fourier-to-unveil-its-first-care-centric-humanoid-302523202.html",
        reuse: "facts",
    },
} satisfies Record<string, Source>;

export type SourceId = keyof typeof SOURCES;

// Own-data prefixes: "catalog:<id>" (an actuator page), "robots:<id>" (a robot
// on /robots) and "path:/<page>" (another actuatorlist page). All "open".
export function sourceOf(id: string): Source {
    if (id.startsWith("catalog:")) {
        const slug = id.slice("catalog:".length);
        return {
            title: `actuatorlist catalog: ${slug}`,
            url: `/actuators/${slug}`,
            reuse: "open",
        };
    }
    if (id.startsWith("robots:")) {
        const slug = id.slice("robots:".length);
        return {
            title: `actuatorlist robots: ${slug}`,
            url: `/robots#robot-${slug}`,
            reuse: "open",
        };
    }
    if (id.startsWith("path:")) {
        const path = id.slice("path:".length);
        return { title: `actuatorlist ${path}`, url: path, reuse: "open" };
    }
    const known = Object.hasOwn(SOURCES, id)
        ? (SOURCES as Record<string, Source>)[id]
        : undefined;
    return known ?? { title: id, url: id, reuse: "facts" };
}

export function isOwnSource(id: string): boolean {
    return /^(catalog|robots|path):/.test(id);
}

// Facts sources allowed to back more than FACTS_MAX_RECORDS records.
export const TRENDS_FACTS_ALLOWLIST: ReuseAllowlist<SourceId> = {};
