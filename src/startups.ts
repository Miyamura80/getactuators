// Funded actuator and motor startups (equity and grants both count), shared by the /startups page and
// its markdown twin. A null figure means the company has not disclosed it; the
// page draws those as unscaled placeholder tiles rather than guessing a size.

import { countryFlag, countryName } from "./country-flag";

export const STARTUPS_PATH = "/startups";

export interface Startup {
    id: string;
    name: string;
    // Omitted when we could not verify the company's own domain.
    url?: string;
    // Served from frontend/public; a self-hosted copy, no third-party requests.
    // Omitted when we have no copy yet: the UI then falls back to CompanyLogo.
    logo?: string;
    hq: string;
    // Country of origin, ISO 3166-1 alpha-2.
    country: string;
    // Total disclosed funding in USD.
    raisedUsd: number | null;
    // True when some rounds or grants are undisclosed, so the sum is a floor.
    raisedIsFloor?: boolean;
    round: string | null;
    leadInvestor: string | null;
    // Company-reported production rate, motors and actuators per month.
    unitsPerMonth: number | null;
    // What the company has said about volume when no rate is public.
    volumeNote: string;
    source: StartupSource;
    // Further sources for claims the primary one does not cover.
    moreSources?: StartupSource[];
}

interface StartupSource {
    label: string;
    url: string;
}

export function countryLabel(code: string): string {
    return `${countryFlag(code)} ${countryName(code)}`;
}

export const STARTUPS: Startup[] = [
    {
        id: "quanzhibo",
        name: "Quanzhibo",
        hq: "Wuxi, Jiangsu",
        country: "CN",
        // At least ¥410M across the rounds with an amount, at ~¥7.1/$. Several rounds
        // (angel, Pre-A+, A+++) are undisclosed, so this is a floor.
        raisedUsd: 57_700_000,
        raisedIsFloor: true,
        round: "Series B, several hundred million ¥ (Sep 2026); eight rounds since 2023",
        leadInvestor: "Addor Capital",
        unitsPerMonth: null,
        volumeNote:
            "No monthly rate disclosed. Press reported over 100,000 joint modules shipped in 2025 and plans for million-unit annual capacity.",
        source: {
            label: "Beijing News, Sep 2026",
            url: "https://www.bjnews.com.cn/detail/1788600417129849.html",
        },
        moreSources: [
            {
                label: "Pedaily, Nov 2025",
                url: "https://news.pedaily.cn/202511/556972.shtml",
            },
            {
                label: "NBD, Jul 2026",
                url: "https://www.mrjjxw.com/articles/2026-07-03/4451861.html",
            },
        ],
    },
    {
        id: "encos",
        name: "Encos",
        hq: "Nanjing, Jiangsu",
        country: "CN",
        // At least ¥400M (>¥100M over three rounds to Jun 2025, >¥300M Series B) at ~¥7.1/$.
        raisedUsd: 56_300_000,
        raisedIsFloor: true,
        round: "Series B, >¥300M (Sep 2026)",
        leadInvestor: null,
        unitsPerMonth: null,
        volumeNote:
            "No monthly rate disclosed. Reported over 100,000 joint modules shipped in 2025.",
        source: {
            label: "Pedaily, Sep 2026",
            url: "https://news.pedaily.cn/202609/569015.shtml",
        },
        moreSources: [
            {
                label: "Rongcai, Jun 2025",
                url: "https://www.rccaijing.com/news-7340293827615978793.html",
            },
            {
                label: "36Kr",
                url: "https://pitchhub.36kr.com/project/3418032699880969",
            },
        ],
    },
    {
        id: "inspire-robots",
        name: "Inspire Robots",
        hq: "Beijing",
        country: "CN",
        // At least ¥300M (B2 >¥100M, B3 ~¥100M, C1+C2 >¥100M) at ~¥7.1/$; Series A and B undisclosed.
        raisedUsd: 42_300_000,
        raisedIsFloor: true,
        round: "Series C1 and C2, several hundred million ¥ (Feb 2026)",
        leadInvestor: "Beijing AI Industry Investment Fund",
        unitsPerMonth: null,
        volumeNote:
            "No monthly rate disclosed. Makes micro linear servo actuators and dexterous hands; over 10,000 hands shipped in 2025, targeting 30,000 to 50,000 in 2026.",
        source: {
            label: "Pedaily, Feb 2026",
            url: "https://news.pedaily.cn/202602/561144.shtml",
        },
        moreSources: [
            {
                label: "Pedaily, Sep 2024",
                url: "https://news.pedaily.cn/202409/540834.shtml",
            },
            { label: "36Kr Japan", url: "https://36kr.jp/487971/" },
        ],
    },
    {
        id: "juxie",
        name: "Juxie",
        hq: "Wuxi, Jiangsu",
        country: "CN",
        // About ¥210M (≥¥10M in 2024, ~¥100M Series A, >¥100M Series A+) at ~¥7.1/$.
        raisedUsd: 29_600_000,
        raisedIsFloor: true,
        round: "Series A+, >¥100M (Oct 2026)",
        leadInvestor: "Huatai Zijin",
        unitsPerMonth: null,
        volumeNote:
            "No monthly rate disclosed. Targets annual capacity of 200,000 joint module sets in 2026 and 1 million in 2027. Johnson Electric holds a minority stake.",
        source: {
            label: "10jqka, Oct 2026",
            url: "https://news.10jqka.com.cn/20261010/c680548800.shtml",
        },
        moreSources: [
            {
                label: "36Kr, Oct 2026",
                url: "https://eu.36kr.com/zh/p/4022280284786818",
            },
        ],
    },
    {
        id: "zeroerr",
        name: "ZeroErr",
        url: "https://www.zeroerr.cn/",
        hq: "Shenzhen, Guangdong",
        country: "CN",
        // At least ¥210M (C ≥¥100M, C+ ≥¥10M, C++ ≥¥100M) at ~¥7.1/$; five earlier rounds
        // and the Sep 2026 C+++ are undisclosed.
        raisedUsd: 29_600_000,
        raisedIsFloor: true,
        round: "Series C+++ (Sep 2026), amount undisclosed",
        leadInvestor: "Xichen Capital",
        unitsPerMonth: null,
        volumeNote:
            "No monthly rate disclosed. Makes eRob integrated joint modules and reports over 2,000 customers.",
        source: {
            label: "IT Home, Jul 2026",
            url: "https://www.ithome.com/0/975/925.htm",
        },
        moreSources: [
            {
                label: "Rongcai, Sep 2026",
                url: "https://m.rccaijing.com/news-7505525707033474646.html",
            },
            {
                label: "Pedaily, Mar 2026",
                url: "https://news.pedaily.cn/202603/561304.shtml",
            },
        ],
    },
    {
        id: "nousbot",
        name: "Nousbot",
        hq: "Shenzhen, Guangdong",
        country: "CN",
        // About ¥200M (Series A >¥100M, A+ ~¥100M) at ~¥7.1/$; angel rounds undisclosed.
        raisedUsd: 28_200_000,
        raisedIsFloor: true,
        round: "Series A+, ~¥100M (Aug 2026)",
        leadInvestor: "Shunwei Capital",
        unitsPerMonth: null,
        volumeNote:
            "No monthly rate disclosed. Makes micro planetary roller screws for humanoid joints and hands; its Suzhou plant runs at about 3 million screws a year, targeting 10 million by end of 2026.",
        source: {
            label: "Pedaily, Mar 2026",
            url: "https://news.pedaily.cn/202603/561493.shtml",
        },
        moreSources: [
            { label: "36Kr Japan, Aug 2026", url: "https://36kr.jp/?p=501261" },
        ],
    },
    {
        id: "bonsystems",
        name: "Bonsystems",
        url: "https://www.bonsystems.com/",
        hq: "Changwon",
        country: "KR",
        // KRW 20.0B (5.0B May 2025, 0.5B Dec 2025, 14.5B Jun 2026) at ~KRW 1,400/$. KONEX-listed
        // since Sep 2025; earlier rounds are unverified.
        raisedUsd: 14_300_000,
        raisedIsFloor: true,
        round: "KRW 14.5B RCPS (Jun 2026)",
        leadInvestor: "NH Investment & Securities",
        unitsPerMonth: null,
        volumeNote:
            "No volume disclosed. Makes compact cycloidal reducers and joint actuators; the Jun 2026 round funds mass-production equipment.",
        source: {
            label: "Bonsystems, Jun 2026",
            url: "https://www.bonsystems.com/media-center/press-release/secured-investment/",
        },
        moreSources: [
            {
                label: "Wowtale, Jun 2025",
                url: "https://en.wowtale.net/2025/06/01/231226/",
            },
        ],
    },
    {
        id: "aster",
        name: "Aster",
        url: "https://www.ast-aster.biz/",
        hq: "Yokote, Akita",
        country: "JP",
        // ¥500M equity at ~¥110/$ (Sep 2021) plus a ¥1,011M NEDO DTSU grant at
        // ~¥140/$ (FY2023). Later rounds (Exedy, DBJ, Akari) are undisclosed.
        raisedUsd: 11_700_000,
        raisedIsFloor: true,
        round: "¥500M (Sep 2021); ¥1,011M NEDO grant (FY2023); Akari stake (Sep 2026), amount undisclosed",
        leadInvestor: "Akari",
        unitsPerMonth: null,
        volumeNote:
            "No monthly rate disclosed. Makes ASTERMOTOR drone and robot motors from its own laminated-coil process; plans a new plant in 2027 to raise output about 20x by FY2028. Press put the Akari investment at several billion yen, which Aster has not confirmed.",
        source: {
            label: "Aster, Sep 2021",
            url: "https://www.ast-aster.biz/en/news-1/%E7%AC%AC%E4%B8%89%E8%80%85%E5%89%B2%E5%BD%93%E5%A2%97%E8%B3%87%E3%81%AB%E3%82%88%E3%82%8B5%E5%84%84%E5%86%86%E3%81%AE%E8%B3%87%E9%87%91%E8%AA%BF%E9%81%94%E3%82%92%E5%AE%9F%E6%96%BD",
        },
        moreSources: [
            {
                label: "NEDO DTSU",
                url: "https://www.nedo.go.jp/activities/startups/company03.html",
            },
            {
                label: "Nikkei, Sep 2026",
                url: "https://www.nikkei.com/article/DGXZQOUC26B5L0W6A820C2000000/",
            },
            {
                label: "Nikkei xTECH, Sep 2026",
                url: "https://xtech.nikkei.com/atcl/nxt/column/18/03727/090400005/",
            },
        ],
    },
    {
        id: "atlas-motion",
        name: "Atlas Motion",
        url: "https://atlasmotion.com/",
        logo: "/logos/startups/atlas-motion.jpg",
        hq: "Long Beach, CA",
        country: "US",
        raisedUsd: 11_500_000,
        round: "Seed / Series A (Aug 2026)",
        leadInvestor: "Greycroft",
        unitsPerMonth: 10_000,
        volumeNote: "About 10,000 motors a month, aiming past 40,000 by December 2026.",
        source: {
            label: "FinSMEs, Aug 2026",
            url: "https://www.finsmes.com/2026/08/atlas-motion-raises-11-5m-in-funding.html",
        },
    },
    {
        id: "westmag",
        name: "Westmag",
        url: "https://www.westmag.com/",
        logo: "/logos/startups/westmag.png",
        hq: "South San Francisco, CA",
        country: "US",
        raisedUsd: 11_000_000,
        round: "Seed (closed 2025, announced Jun 2026)",
        leadInvestor: "Andreessen Horowitz",
        unitsPerMonth: null,
        volumeNote:
            "No shipped volume disclosed. Order book of hundreds of thousands of units, targeting tens of thousands a month by end of 2026.",
        source: {
            label: "Business Wire, Jun 2026",
            url: "https://www.businesswire.com/news/home/20260602552448/en/Westmag-Emerges-With-$11-Million-Seed-Led-By-Andreessen-Horowitz-to-Build-Americas-Drone-Motor-and-Robot-Actuator-Industry",
        },
    },
    {
        id: "myactuator",
        name: "MyActuator",
        url: "https://www.myactuator.com/",
        hq: "Suzhou, Jiangsu",
        country: "CN",
        // At least ¥50M (Pre-A and A, Jun 2026) at ~¥7.1/$; the angel round is undisclosed.
        raisedUsd: 7_000_000,
        raisedIsFloor: true,
        round: "Pre-A and A, >¥50M (Jun 2026)",
        leadInvestor: null,
        unitsPerMonth: null,
        volumeNote:
            "No monthly rate disclosed. A planned Dongguan base is sized for 100,000 joint modules a year.",
        source: {
            label: "China.com, Jun 2026",
            url: "https://m.tech.china.com/articles/20260608/202606081888489.html",
        },
    },
    {
        id: "metismotion",
        name: "MetisMotion",
        url: "https://www.metismotion.com/",
        hq: "Munich",
        country: "DE",
        // €5.5M equity (€1M 2018, €1.5M 2021, €3M 2022) at ~$1.15/€. An EIC Accelerator
        // grant (Feb 2025) is undisclosed, so this is a floor.
        raisedUsd: 6_300_000,
        raisedIsFloor: true,
        round: "€3M (Jan 2022); EIC Accelerator grant (Feb 2025)",
        leadInvestor: "HTGF",
        unitsPerMonth: null,
        volumeNote:
            "No volume disclosed. Makes naXture compact high-force linear actuators for automation and robotics.",
        source: {
            label: "munich startup, Jan 2022",
            url: "https://www.munich-startup.de/en/79351",
        },
        moreSources: [
            {
                label: "HTGF, Dec 2018",
                url: "https://www.htgf.de/en/tech-start-up-metismotion-receives-more-than-one-million-euro-in-first-investment-round/",
            },
        ],
    },
    {
        id: "artimus-robotics",
        name: "Artimus Robotics",
        url: "https://www.artimusrobotics.com/",
        hq: "Boulder, CO",
        country: "US",
        // Army STTR Phase II (up to $1.1M, 2022) plus ARIA £1.5M (~$2.0M, Feb 2025). The 2020
        // seed and earlier SBIR awards are not itemised, so this is a floor.
        raisedUsd: 3_100_000,
        raisedIsFloor: true,
        round: "ARIA £1.5M grant (Feb 2025)",
        leadInvestor: "ARIA",
        unitsPerMonth: null,
        volumeNote:
            "No volume disclosed. Makes HASEL electrohydraulic soft actuators; BizWest put grants and contracts above $3.5M by 2022.",
        source: {
            label: "Techleap, Feb 2025",
            url: "https://finder.techleap.nl/news/feed/artimus-robotics-wins-1-5m-aria-funding",
        },
        moreSources: [
            {
                label: "HigherGov",
                url: "https://www.highergov.com/contract/W911NF22C0024/",
            },
        ],
    },
    {
        id: "robstride",
        name: "RobStride",
        url: "https://www.robstride.com/",
        hq: "Beijing",
        country: "CN",
        // At least ¥20M (angel and Pre-A/Pre-A+ each tens of millions of ¥) at ~¥7.1/$.
        raisedUsd: 2_800_000,
        raisedIsFloor: true,
        round: "Pre-A and Pre-A+, tens of millions of ¥ (Sep 2025)",
        leadInvestor: "HongShan",
        unitsPerMonth: null,
        volumeNote:
            "No monthly rate disclosed. Reported over 50,000 quasi-direct-drive joint motors shipped to 26 countries by Sep 2025.",
        source: {
            label: "36Kr, Sep 2025",
            url: "https://www.36kr.com/p/3459194287216261",
        },
        moreSources: [
            { label: "IT Home, Sep 2024", url: "https://www.ithome.com/0/795/915.htm" },
        ],
    },
    {
        id: "index-robotics",
        name: "Index Robotics",
        hq: "Gyeonggi",
        country: "KR",
        // KRW 1.5B seed at ~KRW 1,400/$.
        raisedUsd: 1_100_000,
        round: "Seed, KRW 1.5B (Feb 2026)",
        leadInvestor: "Futureplay",
        unitsPerMonth: null,
        volumeNote: "No volume disclosed. Makes IA Series humanoid joint actuators.",
        source: {
            label: "Wowtale, Feb 2026",
            url: "https://en.wowtale.net/2026/02/20/233542/",
        },
    },
    {
        id: "mab-robotics",
        name: "MAB Robotics",
        url: "https://www.mabrobotics.pl/",
        hq: "Poznań",
        country: "PL",
        // PLN 1.0M NCBR BRIdge Alfa via YouNick Mint (Sep 2020) at ~$0.27/PLN; other grants undisclosed.
        raisedUsd: 270_000,
        raisedIsFloor: true,
        round: "PLN 1.0M (Sep 2020)",
        leadInvestor: "YouNick Mint",
        unitsPerMonth: null,
        volumeNote:
            "No volume disclosed. Makes high-torque actuators and motor controllers for legged robots.",
        source: {
            label: "NCBR",
            url: "https://www.gov.pl/web/ncbr/bridge-alfa-by-younick-mint-sp-z-oo-sp-k",
        },
    },
    {
        id: "caldera",
        name: "Caldera",
        url: "https://calderaindustries.ai/",
        logo: "/logos/startups/caldera.svg",
        hq: "United States",
        country: "US",
        raisedUsd: null,
        round: null,
        leadInvestor: null,
        unitsPerMonth: null,
        volumeNote: "No volume disclosed.",
        source: { label: "calderaindustries.ai", url: "https://calderaindustries.ai/" },
    },
];

export type StartupMetric = "raisedUsd" | "unitsPerMonth";

export const STARTUP_METRICS: Record<StartupMetric, { label: string }> = {
    raisedUsd: { label: "Money raised" },
    unitsPerMonth: { label: "Reported actuators made per month" },
};

export function formatMetric(
    metric: StartupMetric,
    value: number | null,
    floor = false,
): string {
    if (value === null) return "Undisclosed";
    if (metric === "raisedUsd") {
        const m = value / 1_000_000;
        const digits = m < 1 ? 2 : 1;
        return `$${m.toFixed(digits).replace(/\.0+$/, "")}M${floor ? "+" : ""}`;
    }
    return `${value.toLocaleString("en-US")} / mo`;
}
