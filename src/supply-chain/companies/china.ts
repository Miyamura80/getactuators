import type { SourceId, Sourced } from "../sourced";
import { BOM_MARGINS } from "./bom";
import { CHINA_EXTRA_COMPANIES } from "./china-extra";
import { CHINA_MORE_COMPANIES } from "./china-more";
import type { Company } from "./types";

// Chinese companies along the actuator chain for /china, plus the foreign
// buyers and partners their links reach that are not in the registry yet
// (Midea's KUKA is already there). Records already in the seed list
// (Northern Rare Earth, JL MAG, Leaderdrive, Unitree, UBTech, AgiBot, Tuopu)
// are reused, not repeated. Many robot makers are private: revenue and
// margin are left out unless a filing or IPO report gives them. Listed
// part makers' gross margins (for /bom) come from ./bom, some from an
// aggregator's statements page, with the confidence set to match.

// Yuan to dollars for calendar 2025.
const CNY_PER_USD = 7.2;
const CNY_RANGE: [number, number] = [7.3, 7.1];

// Revenue in USD from operating revenue in millions of yuan.
function yuanRevenue(
    cnyMillions: number,
    period: string,
    asOf: string,
    sources: SourceId[],
): Sourced<number> {
    const usd = (rate: number) => Math.round((cnyMillions * 1e6) / rate / 1e5) * 1e5;
    return {
        value: usd(CNY_PER_USD),
        unit: "USD",
        range: [usd(CNY_RANGE[0]), usd(CNY_RANGE[1])],
        sources,
        asOf,
        confidence: "estimated",
        note: `Converted from CNY ${cnyMillions.toLocaleString("en-US")} m revenue (${period}) at roughly ${CNY_RANGE[1]} to ${CNY_RANGE[0]} CNY per USD.`,
    };
}

type Seg = Company["segment"];

// A company with the fields every record here shares.
function cn(
    id: string,
    name: string,
    localName: string | null,
    segment: Seg,
    rest: Omit<Company, "id" | "name" | "localName" | "segment" | "hqCountry">,
): Company {
    return {
        id,
        name,
        ...(localName ? { localName } : {}),
        segment,
        hqCountry: "CN",
        ...rest,
    };
}

const REE: Seg = "ree-mining-refining";
const MAG: Seg = "magnets-motors";
const GEAR: Seg = "gears-screws-bearings";
const OEM: Seg = "robot-actuator-oem";

export const CHINA_COMPANIES: Company[] = [
    // Rare earth mining and refining
    cn("baotou-steel", "Baotou Steel", "包钢股份", REE, {
        stages: ["mining"],
        ownership: {
            kind: "listed",
            ticker: "SHA: 600010",
            parent: "Baotou Iron and Steel Group",
        },
        products: ["Bayan Obo rare earth concentrate", "Steel"],
        url: "https://www2.yicaiglobal.com/news/baotou-steel-northern-rare-earth-gain-after-reaching-deal-on-rare-earth-concentrate-prices",
        sources: ["asianmetal-baotou-steel-concentrate", "yicai-baotou-northern-price"],
    }),
    cn("xiamen-tungsten", "Xiamen Tungsten", "厦门钨业", REE, {
        stages: ["separation", "metal-alloy", "magnet"],
        ownership: { kind: "listed", ticker: "SHA: 600549" },
        products: [
            "Rare earth oxides and metals (Fujian Golden Dragon Rare Earth)",
            "Sintered NdFeB magnets",
        ],
        url: "https://www.asianmetal.com/news/2205198/Baotou-Golden-Dragon-commissions-high-performance-NdFeB-magnet-project",
        sources: [
            "asianmetal-golden-dragon-baotou-2025",
            "asianmetal-golden-dragon-phase2-2026",
        ],
    }),
    cn(
        "china-rare-earth-nonferrous",
        "China Rare Earth Nonferrous Metals (ex-Guangsheng)",
        "中稀有色",
        REE,
        {
            stages: ["mining", "separation", "metal-alloy"],
            ownership: {
                kind: "listed",
                ticker: "SHA: 600259",
                parent: "China Rare Earth Group",
            },
            products: [
                "Southern ionic-clay rare earths",
                "Rare earth oxides and metals",
            ],
            url: "https://www.asianmetal.com/news/2021946/China-Rare-Earth-Group-becomes-actual-controller-of-Rising-Nonferrous-Metal",
            sources: ["asianmetal-crg-rising-nonferrous"],
        },
    ),
    cn("jiangxi-copper", "Jiangxi Copper", "江西铜业", REE, {
        stages: ["mining", "separation"],
        ownership: { kind: "listed", ticker: "SHA: 600362; HKEX: 0358" },
        products: ["Maoniuping rare earth mine (Sichuan Jiangxi Copper Rare Earth)"],
        url: "https://www.asianmetal.com/news/553535/Mianning-Rare-Earth-Resources-Comprehensive-Development-Project-started",
        sources: ["asianmetal-mianning-2010", "cgtn-maoniuping-2026"],
    }),
    cn("grirem", "Grirem Advanced Materials", "有研稀土", REE, {
        stages: ["separation", "metal-alloy"],
        ownership: { kind: "subsidiary", parent: "GRINM Group" },
        products: [
            "High-purity rare earth metals",
            "Rare earth alloys",
            "Magnetic materials",
        ],
        url: "https://cdn.asianmetal.com/cag/2021/visit2021041301en.shtml",
        sources: ["asianmetal-grirem-visit-2021"],
    }),
    // Magnets and motors
    cn("ningbo-yunsheng", "Ningbo Yunsheng", "宁波韵升", MAG, {
        stages: ["magnet"],
        ownership: { kind: "listed", ticker: "SHA: 600366" },
        products: ["Sintered and bonded NdFeB magnets", "Magnet assemblies"],
        url: "https://www.asianmetal.com/news/1878643/Ningbo-Yunsheng-raises-RMB1-billion-for-high-performance-rare-earth-permanent-magnetic-material-project-",
        sources: ["asianmetal-yunsheng-baotou"],
    }),
    cn("zhong-ke-san-huan", "Zhong Ke San Huan", "中科三环", MAG, {
        stages: ["magnet"],
        ownership: { kind: "listed", ticker: "SZSE: 000970" },
        products: ["Sintered and bonded NdFeB magnets"],
        url: "https://news.metal.com/newscontent/100074360/%5BRare-Earth%5D-Zhongke-Sanhuan-Hitachi-Metals-to-Build-JV-for-NdFeB-Production",
        sources: ["smm-zksh-hitachi-jv", "jdamagnet-china-top10-2023"],
    }),
    cn("zhenghai-magnetic", "Zhenghai Magnetic Material", "正海磁材", MAG, {
        stages: ["magnet"],
        ownership: { kind: "listed", ticker: "SZSE: 300224" },
        products: ["Sintered NdFeB magnets", "Magnet assemblies"],
        url: "https://www.asianmetal.com/news/2053029/ZHmag-reports-increased-annual-NdFeB-production-and-sales",
        sources: ["asianmetal-zhmag-2023"],
    }),
    cn("earth-panda", "Earth-Panda Advance Magnetic Material", "大地熊", MAG, {
        stages: ["magnet"],
        ownership: { kind: "listed", ticker: "SHA: 688077" },
        products: ["Sintered NdFeB magnets"],
        url: "https://www.morningstar.com.au/investments/security/SHSE/688077",
        sources: ["morningstar-earth-panda", "asianmetal-earth-panda-baotou"],
    }),
    cn("yantai-dongxing", "Yantai Dongxing Magnetic Materials (YSM)", "东星磁材", MAG, {
        stages: ["magnet"],
        products: ["High-performance magnetic materials for electric vehicles"],
        url: "https://www.asianmetal.com/news/2168007/YSM-kicks-off-construction-of-magnets-project-in-Fushan",
        sources: ["asianmetal-ysm-fushan"],
    }),
    cn("tianhe-magnetics", "Tianhe Magnetics", "天和磁材", MAG, {
        stages: ["magnet"],
        ownership: { kind: "listed", ticker: "SHA: 603072" },
        products: ["Sintered NdFeB magnet blanks"],
        url: "https://www.asianmetal.com/news/2183391/Tianhe-Magnetics-reports-record-high-annual-magnet-blank-output",
        sources: ["asianmetal-tianhe-output"],
    }),
    cn("galaxy-magnets", "Galaxy Magnets", "银河磁体", MAG, {
        stages: ["magnet"],
        ownership: { kind: "listed", ticker: "SZSE: 300127" },
        products: ["Bonded NdFeB magnets", "Hot-pressed NdFeB magnets", "SmCo magnets"],
        url: "https://www.morningstar.com.au/investments/security/SZSE/300127",
        sources: ["morningstar-galaxy-magnets", "asianmetal-galaxy-output"],
    }),
    cn("inovance", "Inovance", "汇川技术", MAG, {
        stages: ["motor", "electronics", "robot"],
        ownership: { kind: "listed", ticker: "SZSE: 300124" },
        products: [
            "Servo motors and drives",
            "SCARA and six-axis robots",
            "EV powertrains",
        ],
        url: "https://www.inovance.com/global/about/index.html",
        sources: ["inovance-profile-2024", "hkex-inovance-2026"],
    }),
    cn("wolong-electric", "Wolong Electric Drive", "卧龙电驱", MAG, {
        stages: ["motor", "actuator"],
        ownership: { kind: "listed", ticker: "SHA: 600580" },
        products: [
            "Industrial motors",
            "Frameless torque motors",
            "Robot joint modules",
        ],
        url: "https://zhejiang.chinadaily.com.cn/2019-04/19/c_420334.htm",
        sources: ["chinadaily-wolong-2019", "smm-wolong-robots-2026"],
    }),
    cn("hechuan", "Hechuan Technology (HCFA)", "禾川科技", MAG, {
        stages: ["motor", "electronics"],
        ownership: { kind: "listed", ticker: "SHA: 688320" },
        products: ["Servo systems", "PLCs"],
        url: "https://govt.chinadaily.com.cn/s/202210/13/WS6347acad498ea274927a5904/company-breaks-foreign-brands-dominance.html",
        sources: ["chinadaily-hechuan-2022"],
    }),
    cn("moons", "MOONS' Electric", "鸣志电器", MAG, {
        stages: ["motor"],
        ownership: { kind: "listed", ticker: "SHA: 603728" },
        products: ["Stepper motors", "Servo motors", "Coreless motors"],
        url: "https://morningstar.com.au/investments/security/SHSE/603728",
        sources: ["morningstar-moons"],
    }),
    cn("leadshine", "Leadshine", "雷赛智能", MAG, {
        stages: ["motor", "actuator"],
        ownership: { kind: "listed", ticker: "SZSE: 002979" },
        products: ["Servo and stepper systems", "Frameless motors", "Joint modules"],
        grossMargin: BOM_MARGINS.leadshine,
        url: "https://en.leadshine.com/abouts/about_corporate_overview.html",
        sources: ["leadshine-about", "prnasia-leadshine-ces-2026"],
    }),
    cn("zhaowei", "Zhaowei Machinery & Electronics", "兆威机电", MAG, {
        stages: ["motor", "gearing", "actuator"],
        ownership: { kind: "listed", ticker: "SZSE: 003021; HKEX: 2692" },
        products: ["Micro drive systems", "Coreless motors", "Dexterous hands"],
        url: "https://technode.global/?p=91891",
        sources: ["technode-zhaowei-ces-2025"],
    }),
    // Gears, screws and bearings
    cn("shuanghuan-driveline", "Shuanghuan Driveline", "双环传动", GEAR, {
        stages: ["gearing"],
        ownership: { kind: "listed", ticker: "SZSE: 002472" },
        products: ["RV reducers", "Automotive gears"],
        url: "https://www.ethercat.org/cn/members/members_FC320B48279A451F86170BE41E13EBB0.htm",
        sources: ["researchandmarkets-reducers-2020", "ethercat-shuanghuan"],
    }),
    cn("zd-leader", "ZD Leader", "中大力德", GEAR, {
        stages: ["gearing", "motor"],
        ownership: { kind: "listed", ticker: "SZSE: 002896" },
        products: ["Planetary, RV and harmonic reducers", "Gear motors"],
        url: "https://www.morningstar.com.au/investments/security/SZSE/002896",
        sources: ["morningstar-zd-leader"],
    }),
    cn("laifual", "Laifual Drive", "来福谐波", GEAR, {
        stages: ["gearing", "actuator"],
        ownership: { kind: "listed", ticker: "HKEX: 3952" },
        revenue: yuanRevenue(261, "2025", "2025", ["gasgoo-laifual-ipo-2026"]),
        products: ["Harmonic reducers", "Joint modules"],
        url: "https://www.ipox.com/ipo-calendar/laifual-drive",
        sources: ["36kr-laifual", "ipox-laifual-2026"],
    }),
    cn("beite", "Beite Technology", "北特科技", GEAR, {
        stages: ["screw"],
        ownership: { kind: "listed", ticker: "SHA: 603009" },
        products: ["Planetary roller screws", "Automotive chassis parts"],
        grossMargin: BOM_MARGINS.beite,
        url: "https://itiger.com/news/2475595965",
        sources: ["itiger-beite-prs-2024"],
    }),
    cn("best-precision", "Best Precision Machinery", "贝斯特", GEAR, {
        stages: ["screw"],
        ownership: { kind: "listed", ticker: "SZSE: 300580" },
        products: ["Precision parts", "Planetary roller screw samples"],
        url: "https://www.morningstar.com.au/investments/security/SZSE/300580",
        sources: ["morningstar-best-precision", "filingreader-best-2026"],
    }),
    cn("zwz-bearing", "ZWZ Bearing", "瓦轴", GEAR, {
        stages: ["bearing"],
        ownership: { kind: "state" },
        products: ["Rolling bearings"],
        url: "https://trademarks.justia.com/owners/wafangdian-bearing-group-corp-ltd-5960925",
        sources: ["justia-zwz"],
    }),
    cn("lyc-bearing", "LYC Bearing", "洛轴", GEAR, {
        stages: ["bearing"],
        products: ["Ball, roller and slewing bearings"],
        url: "https://app.dealroom.co/companies/luoyang_lyc_bearing",
        sources: ["dealroom-lyc"],
    }),
    cn("harbin-bearing", "Harbin Bearing (HRB)", "哈轴", GEAR, {
        stages: ["bearing"],
        products: ["Rolling bearings"],
        url: "https://govt.chinadaily.com.cn/s/201711/24/WS5b783ffc498e855160e8cb4a/harbin-bearing-group-co.html",
        sources: ["chinadaily-hrb-2017"],
    }),
    cn("zhenhua-bearing", "Zhenhua Bearing", null, GEAR, {
        stages: ["bearing"],
        products: [
            "Reducer bearings for harmonic and RV reducers",
            "Cross-roller bearings",
        ],
        url: "https://autonews.gasgoo.com/articles/news/2112803843330428929",
        sources: ["gasgoo-zhenhua-bearings-2026"],
    }),
    cn("nousbot", "Nousbot", null, GEAR, {
        stages: ["screw"],
        ownership: { kind: "private" },
        products: ["Micro planetary roller screws"],
        url: "https://app.dealroom.co/companies/nousbot",
        sources: ["dealroom-nousbot", "pedaily-nousbot-2026"],
    }),
    cn("juxie", "Juxie", "巨蟹智能驱动", GEAR, {
        stages: ["gearing", "actuator"],
        ownership: { kind: "private" },
        products: ["Harmonic reducers", "Joint modules"],
        url: "https://www.juxiedrive.com/",
        sources: ["10jqka-juxie-2026"],
    }),
    // Robot and actuator makers
    cn("encos", "Encos", "因克斯", OEM, {
        stages: ["actuator"],
        ownership: { kind: "private" },
        products: ["Integrated joint modules for humanoids"],
        url: "https://www.encos.cn/",
        sources: ["pedaily-encos-2026"],
    }),
    cn("quanzhibo", "Quanzhibo", "泉智博", OEM, {
        stages: ["actuator"],
        ownership: { kind: "private" },
        products: ["Robot joint modules"],
        url: "http://www.motorevo.cn/",
        sources: ["bjnews-quanzhibo-2026"],
    }),
    cn("zeroerr", "ZeroErr", "零差云控", OEM, {
        stages: ["actuator"],
        ownership: { kind: "private" },
        products: ["eRob integrated joint modules"],
        url: "https://www.zeroerr.cn/",
        sources: ["ithome-zeroerr-2026"],
    }),
    cn("inspire-robots", "Inspire Robots", "因时机器人", OEM, {
        stages: ["actuator"],
        ownership: { kind: "private" },
        products: ["Micro linear servo actuators", "Dexterous hands"],
        url: "https://www.inspire-robots.com/",
        sources: ["pedaily-inspire-2026"],
    }),
    cn("robstride", "RobStride", "灵足时代", OEM, {
        stages: ["actuator"],
        ownership: { kind: "private" },
        products: ["Quasi-direct-drive joint motors"],
        url: "https://www.robstride.com/",
        sources: ["36kr-robstride-2025"],
    }),
    cn("myactuator", "MyActuator", "脉塔智能", OEM, {
        stages: ["actuator"],
        ownership: { kind: "private" },
        products: ["Integrated joint motors"],
        url: "https://www.myactuator.com/",
        sources: ["myactuator-site"],
    }),
    cn("fourier", "Fourier", "傅利叶", OEM, {
        stages: ["actuator", "robot"],
        ownership: { kind: "private" },
        products: ["GR-series humanoids", "Rehabilitation robots"],
        url: "https://english.pudong.gov.cn/2025-05/12/c_1097470.htm",
        sources: ["pudong-fourier-2025", "technode-fourier-2023"],
    }),
    cn("galbot", "Galbot", "银河通用", OEM, {
        stages: ["robot"],
        ownership: { kind: "private" },
        products: ["Wheeled humanoids for factory logistics"],
        url: "https://technode.com/2026/03/02/humanoid-robot-maker-galbot-raises-rmb-2-5-billion/",
        sources: ["cbinsights-galbot", "technode-galbot-2026"],
    }),
    cn("xiaomi", "Xiaomi", "小米", OEM, {
        stages: ["actuator", "robot"],
        ownership: { kind: "listed", ticker: "HKEX: 1810" },
        products: [
            "CyberGear micro-actuator",
            "CyberDog quadrupeds",
            "CyberOne humanoid prototype",
        ],
        url: "https://technode.com/2023/08/15/xiaomi-releases-the-cyberdog-2-a-smart-quadruped-bio-robot/",
        sources: ["technode-cyberdog2-2023", "engadget-cyberone-2022"],
    }),
    cn("xpeng", "XPeng", "小鹏", OEM, {
        stages: ["robot"],
        ownership: { kind: "listed", ticker: "NYSE: XPEV; HKEX: 9868" },
        products: ["IRON humanoid", "Electric vehicles"],
        url: "https://www.xpeng.com/",
        sources: ["gasgoo-xpeng-base-2026", "gasgoo-xpeng-lines-2026"],
    }),
    cn("estun", "Estun", "埃斯顿", OEM, {
        stages: ["motor", "robot"],
        ownership: { kind: "listed", ticker: "SZSE: 002747" },
        products: ["Industrial robots", "Servo systems"],
        url: "https://techzephyr.substack.com/p/the-rise-of-chinas-robotics-and-automation",
        sources: ["evsint-china-robot-makers", "techzephyr-china-robotics"],
    }),
    cn("efort", "Efort", "埃夫特", OEM, {
        stages: ["robot"],
        ownership: { kind: "listed", ticker: "SHA: 688165" },
        products: ["Industrial robots"],
        url: "https://yicaiglobal.com/news/eforts-stock-surges-on-plan-to-invest-usd263-million-to-build-robot-super-plant-global-hq",
        sources: ["yicai-efort-super-plant"],
    }),
    cn("siasun", "Siasun", "新松", OEM, {
        stages: ["robot"],
        ownership: { kind: "listed", ticker: "SZSE: 300024" },
        products: ["Industrial and mobile robots"],
        url: "https://chinaservicesinfo.com/s/201711/28/WS5b77fb7f498e855160e8a451/siasun-robot-automation-co.html",
        sources: ["yahoo-siasun", "chinaservices-siasun-2017"],
    }),
    cn("sanhua", "Sanhua Intelligent Controls", "三花智控", OEM, {
        stages: ["actuator"],
        ownership: { kind: "listed", ticker: "SZSE: 002050; HKEX: 2050" },
        products: [
            "Robot joint actuators (in development)",
            "Thermal management parts",
        ],
        grossMargin: BOM_MARGINS.sanhua,
        url: "https://uk.finance.yahoo.com/quote/002050.SZ/profile",
        sources: ["yahoo-sanhua", "yicai-sanhua-base"],
    }),
    cn("midea", "Midea", "美的集团", OEM, {
        stages: ["gearing", "robot"],
        ownership: { kind: "listed", ticker: "SZSE: 000333; HKEX: 0300" },
        products: ["KUKA robots", "Welling robot reducers", "Home appliances"],
        url: "https://robohub.org/mideas-masterplan-to-become-chinas-robot-powerhouse",
        sources: ["robohub-midea-kuka", "gasgoo-midea-welling-2026"],
    }),
    cn("shanghai-electric", "Shanghai Electric", "上海电气", OEM, {
        stages: ["robot"],
        ownership: { kind: "state", ticker: "SHA: 601727; HKEX: 2727" },
        products: ["Industrial robots (Shanghai Fanuc)", "Power equipment"],
        url: "https://www.shanghai-electric.com/group_en/fnkjqrjtjj",
        sources: ["shanghai-electric-site", "yicai-shanghai-electric-fanuc"],
    }),
    cn("dobot", "Dobot", "越疆", OEM, {
        stages: ["robot"],
        ownership: { kind: "listed", ticker: "HKEX: 2432" },
        products: ["Collaborative robots", "Atom humanoid"],
        url: "https://yicaiglobal.com/news/chinese-cobot-maker-dobot-bags-usd876-million-in-hong-kong-debut",
        sources: ["yicai-dobot-ipo", "yicai-dobot-atom"],
    }),
    cn("leju", "Leju Robotics", "乐聚机器人", OEM, {
        stages: ["robot"],
        ownership: { kind: "private" },
        products: ["KUAVO humanoid"],
        url: "https://globalventuring.com/leju-robotics-fetches-series-b-funding",
        sources: ["globalventuring-leju", "mikekalil-leju-factory"],
    }),
    cn("joyson", "Ningbo Joyson Electronic", "均胜电子", OEM, {
        stages: ["actuator"],
        ownership: { kind: "listed", ticker: "SHA: 600699" },
        products: ["Automotive electronics", "Optimus parts (reported)"],
        url: "https://cnevpost.com/2026/09/21/tesla-audits-china-suppliers-optimus-mass-production/",
        sources: ["cnevpost-optimus-audits-2026"],
    }),
    ...CHINA_MORE_COMPANIES,
    ...CHINA_EXTRA_COMPANIES,
];

// Unitree's IPO figures, attached to the seed record in ./index.ts.
export const UNITREE_REVENUE = yuanRevenue(1700, "2025", "2025", [
    "sse-unitree-ipo-2026",
    "krasia-unitree-ipo",
]);
