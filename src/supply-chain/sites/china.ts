import { CHINA_MORE_SITES } from "./china-more";
import { type Site, hq } from "./types";

// Headquarters of the /china companies, pinned to their city. "region"
// means the source supports only the province (the company name, say), and
// the pin sits at a point inside it. Plants are in ./china-plants.

const head = (
    companyId: string,
    name: string,
    admin1: string,
    lat: number,
    lon: number,
    sources: string[],
    extra: Partial<Site> = {},
): Site => ({
    ...hq(`${companyId}-hq`, {
        companyId,
        name: `${name} headquarters`,
        country: "CN",
        admin1,
        lat,
        lon,
        sources,
    }),
    ...extra,
});

// A headquarters that is also the main works.
const works = (makes: string[], stages: Site["stages"]): Partial<Site> => ({
    makes,
    stages,
});

const BAOTOU: [number, number] = [40.65, 109.84];
const BEIJING: [number, number] = [39.9, 116.41];
const SHENZHEN: [number, number] = [22.54, 114.06];
const SHANGHAI: [number, number] = [31.23, 121.47];
const WUXI: [number, number] = [31.49, 120.31];
const NINGBO: [number, number] = [29.87, 121.54];

export const CHINA_SITES: Site[] = [
    // Rare earth mining and refining
    head("baotou-steel", "Baotou Steel", "Inner Mongolia", ...BAOTOU, [
        "asianmetal-baotou-steel-concentrate",
    ]),
    head("xiamen-tungsten", "Xiamen Tungsten", "Fujian", 24.48, 118.09, [
        "asianmetal-golden-dragon-baotou-2025",
    ]),
    head(
        "china-rare-earth-nonferrous",
        "China Rare Earth Nonferrous Metals",
        "Guangdong",
        23.13,
        113.26,
        ["asianmetal-crg-rising-nonferrous"],
        { precision: "region" },
    ),
    head("grirem", "Grirem", "Beijing", ...BEIJING, ["asianmetal-grirem-visit-2021"], {
        ...works(
            ["High-purity rare earth metals", "Rare earth alloys"],
            ["metal-alloy"],
        ),
        name: "Grirem headquarters and works",
    }),
    // Magnets and motors
    head(
        "ningbo-yunsheng",
        "Ningbo Yunsheng",
        "Zhejiang",
        ...NINGBO,
        ["asianmetal-yunsheng-baotou"],
        {
            ...works(["Sintered NdFeB magnets"], ["magnet"]),
            name: "Ningbo headquarters and magnet plant",
        },
    ),
    head("zhong-ke-san-huan", "Zhong Ke San Huan", "Beijing", 39.98, 116.31, [
        "smm-zksh-hitachi-jv",
    ]),
    head(
        "zhenghai-magnetic",
        "Zhenghai Magnetic Material",
        "Shandong",
        37.46,
        121.45,
        ["asianmetal-zhmag-2023"],
        {
            ...works(["Sintered NdFeB magnets"], ["magnet"]),
            name: "Yantai headquarters and magnet plant",
        },
    ),
    head("earth-panda", "Earth-Panda", "Anhui", 31.26, 117.29, [
        "morningstar-earth-panda",
    ]),
    head("yantai-dongxing", "YSM", "Shandong", 37.46, 121.45, [
        "asianmetal-ysm-fushan",
    ]),
    head(
        "tianhe-magnetics",
        "Tianhe Magnetics",
        "Inner Mongolia",
        40.62,
        109.95,
        ["asianmetal-tianhe-output"],
        {
            ...works(["Sintered NdFeB magnet blanks"], ["magnet"]),
            name: "Baotou headquarters and magnet plant",
        },
    ),
    head(
        "galaxy-magnets",
        "Galaxy Magnets",
        "Sichuan",
        30.73,
        103.97,
        ["morningstar-galaxy-magnets", "asianmetal-galaxy-output"],
        {
            ...works(["Bonded NdFeB magnets", "SmCo magnets"], ["magnet"]),
            name: "Chengdu headquarters and magnet plant",
        },
    ),
    head("inovance", "Inovance", "Guangdong", ...SHENZHEN, ["inovance-profile-2024"]),
    head("wolong-electric", "Wolong Electric Drive", "Zhejiang", 30.03, 120.87, [
        "chinadaily-wolong-2019",
    ]),
    head("hechuan", "Hechuan", "Zhejiang", 29.03, 119.17, ["chinadaily-hechuan-2022"], {
        ...works(["Servo systems"], ["motor", "electronics"]),
        name: "Longyou headquarters and factory",
    }),
    head("moons", "MOONS'", "Shanghai", 31.11, 121.38, ["morningstar-moons"]),
    head("leadshine", "Leadshine", "Guangdong", 22.53, 113.93, ["leadshine-about"]),
    head("zhaowei", "Zhaowei", "Guangdong", ...SHENZHEN, ["technode-zhaowei-ces-2025"]),
    // Gears, screws and bearings
    head(
        "shuanghuan-driveline",
        "Shuanghuan Driveline",
        "Zhejiang",
        30.27,
        120.15,
        ["ethercat-shuanghuan"],
        { precision: "region" },
    ),
    head("zd-leader", "ZD Leader", "Zhejiang", 30.17, 121.27, [
        "morningstar-zd-leader",
    ]),
    head("laifual", "Laifual", "Zhejiang", 29.59, 120.82, ["36kr-laifual"], {
        ...works(["Harmonic reducers", "Joint modules"], ["gearing", "actuator"]),
        name: "Shengzhou headquarters and plant",
    }),
    head("beite", "Beite Technology", "Shanghai", ...SHANGHAI, [
        "itiger-beite-prs-2024",
    ]),
    head("best-precision", "Best Precision", "Jiangsu", ...WUXI, [
        "morningstar-best-precision",
    ]),
    head("zwz-bearing", "ZWZ", "Liaoning", 39.63, 122.01, ["justia-zwz"]),
    head("lyc-bearing", "LYC", "Henan", 34.62, 112.45, ["dealroom-lyc"]),
    head("harbin-bearing", "Harbin Bearing", "Heilongjiang", 45.8, 126.53, [
        "chinadaily-hrb-2017",
    ]),
    head(
        "zhenhua-bearing",
        "Zhenhua Bearing",
        "Shanghai",
        31.38,
        121.27,
        ["gasgoo-zhenhua-bearings-2026"],
        {
            ...works(["Robot reducer bearings"], ["bearing"]),
            name: "Jiading headquarters and works",
        },
    ),
    head("nousbot", "Nousbot", "Guangdong", ...SHENZHEN, [
        "dealroom-nousbot",
        "pedaily-nousbot-2026",
    ]),
    head("juxie", "Juxie", "Jiangsu", ...WUXI, ["10jqka-juxie-2026"]),
    // Robot and actuator makers
    head("encos", "Encos", "Jiangsu", 32.06, 118.8, ["pedaily-encos-2026"]),
    head("quanzhibo", "Quanzhibo", "Jiangsu", ...WUXI, ["bjnews-quanzhibo-2026"]),
    head("zeroerr", "ZeroErr", "Guangdong", ...SHENZHEN, ["ithome-zeroerr-2026"]),
    head("inspire-robots", "Inspire Robots", "Beijing", ...BEIJING, [
        "pedaily-inspire-2026",
    ]),
    head("robstride", "RobStride", "Beijing", ...BEIJING, ["36kr-robstride-2025"]),
    head("myactuator", "MyActuator", "Jiangsu", 31.38, 120.98, ["myactuator-site"]),
    head("fourier", "Fourier", "Shanghai", 31.2, 121.59, [
        "pudong-fourier-2025",
        "technode-fourier-2023",
    ]),
    head("galbot", "Galbot", "Beijing", 39.96, 116.3, ["cbinsights-galbot"]),
    head("xiaomi", "Xiaomi", "Beijing", ...BEIJING, ["technode-cyberdog2-2023"]),
    head("xpeng", "XPeng", "Guangdong", 23.13, 113.26, ["gasgoo-xpeng-base-2026"]),
    head("estun", "Estun", "Jiangsu", 32.06, 118.8, [
        "evsint-china-robot-makers",
        "techzephyr-china-robotics",
    ]),
    head("efort", "Efort", "Anhui", 31.35, 118.43, ["yicai-efort-super-plant"]),
    head("siasun", "Siasun", "Liaoning", 41.71, 123.45, ["yahoo-siasun"], {
        ...works(["Industrial and mobile robots"], ["robot"]),
        name: "Shenyang headquarters and industrial park",
    }),
    head("sanhua", "Sanhua", "Zhejiang", 29.5, 120.9, ["yahoo-sanhua"]),
    head("midea", "Midea", "Guangdong", 22.84, 113.25, ["robohub-midea-kuka"]),
    head("shanghai-electric", "Shanghai Electric", "Shanghai", ...SHANGHAI, [
        "shanghai-electric-site",
    ]),
    head("dobot", "Dobot", "Guangdong", ...SHENZHEN, ["yicai-dobot-ipo"]),
    head("leju", "Leju Robotics", "Guangdong", ...SHENZHEN, ["globalventuring-leju"]),
    head("joyson", "Joyson Electronic", "Zhejiang", ...NINGBO, [
        "cnevpost-optimus-audits-2026",
    ]),
    ...CHINA_MORE_SITES,
];
