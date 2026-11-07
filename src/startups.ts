// Funded actuator and motor startups (equity and grants both count), shared by the /startups page and
// its markdown twin. A null figure means the company has not disclosed it; the
// page draws those as unscaled placeholder tiles rather than guessing a size.

import { countryFlag, countryName } from "./country-flag";

export const STARTUPS_PATH = "/startups";

// Which part of the drive train the company sells, from bare motor up to a
// ready-to-mount joint. Stable per company, unlike stage or market.
export type StartupSegment = "joint" | "linear" | "reducer" | "motor" | "soft";

export const STARTUP_SEGMENTS: Record<
    StartupSegment,
    { label: string; blurb: string }
> = {
    joint: {
        label: "Joint modules",
        blurb: "Motor, gearbox, encoder and driver in one rotary joint",
    },
    linear: {
        label: "Linear and screw",
        blurb: "Roller screws and linear actuators for hands and limbs",
    },
    reducer: {
        label: "Reducers",
        blurb: "Gearboxes other companies build into their joints",
    },
    motor: { label: "Motors", blurb: "Motor cores for drones and robots" },
    soft: {
        label: "Soft actuators",
        blurb: "Artificial muscles with no motor or gearbox",
    },
};

// How the actuators transmit torque or force. A company may sell several.
export type StartupDrive =
    | "qdd"
    | "planetary"
    | "harmonic"
    | "cycloidal"
    | "roller-screw"
    | "linear-servo"
    | "direct-drive";

export const STARTUP_DRIVES: Record<StartupDrive, string> = {
    qdd: "QDD",
    planetary: "Planetary",
    harmonic: "Harmonic",
    cycloidal: "Cycloidal",
    "roller-screw": "Roller screw",
    "linear-servo": "Linear servo",
    "direct-drive": "Direct drive",
};

export interface Startup {
    id: string;
    name: string;
    segment: StartupSegment;
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
    // Each amount is converted at roughly its own date's exchange rate.
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
    // Drive types of its products, with the page that shows them. Omitted when
    // no source names the mechanism.
    drives?: { types: StartupDrive[]; source: StartupSource };
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
        id: "encos",
        name: "Encos",
        segment: "joint",
        url: "https://www.encos.cn/",
        hq: "Nanjing, Jiangsu",
        country: "CN",
        // ≥¥100M cumulative by Jun 2025 (~¥7.18/$) plus a >¥300M Series B (Sep 2026, ¥6.72/$).
        raisedUsd: 58_600_000,
        raisedIsFloor: true,
        round: "Series B, >¥300M (Sep 2026)",
        leadInvestor: null,
        unitsPerMonth: null,
        volumeNote:
            "No volume disclosed. Makes integrated joint modules for humanoid robots.",
        source: {
            label: "Pedaily, Sep 2026",
            url: "https://news.pedaily.cn/202609/569015.shtml",
        },
        moreSources: [
            {
                label: "Rongcai, Jun 2025",
                url: "https://www.rccaijing.com/news-7340293827615978793.html",
            },
        ],
        drives: {
            types: ["planetary", "harmonic", "cycloidal"],
            source: {
                label: "Gasgoo, Jan 2026",
                url: "https://autonews.gasgoo.com/articles/news/ces-2026-encos-showcases-three-core-products-enabling-mass-production-of-humanoid-robots-2008894532819447809",
            },
        },
    },
    {
        id: "quanzhibo",
        name: "Quanzhibo",
        segment: "joint",
        // HTTP only: https://www.motorevo.cn/ returns 502 (Nov 2026).
        url: "http://www.motorevo.cn/",
        hq: "Wuxi, Jiangsu",
        country: "CN",
        // Four rounds of at least ¥100M each (A Sep 2025, A+ Nov 2025, A++ Apr 2026, B Sep 2026)
        // at their round-date rates (¥7.12 to ¥6.71/$). The A+++ and early rounds are undisclosed.
        raisedUsd: 57_400_000,
        raisedIsFloor: true,
        round: "Series B, several hundred million ¥ (Sep 2026)",
        leadInvestor: "Addor Capital",
        unitsPerMonth: null,
        volumeNote:
            "No monthly rate from the company. An investor put 2025 shipments above 100,000 joint modules and June 2026 alone above 60,000; reported annual capacity is 1 million units.",
        source: {
            label: "Beijing News, Sep 2026",
            url: "https://www.bjnews.com.cn/detail/1788600417129849.html",
        },
        moreSources: [
            {
                label: "Beijing Daily, Apr 2026",
                url: "https://xinwen.bjd.com.cn/content/s69e752b6e4b0687a289461f5.html",
            },
            {
                label: "Pedaily, Nov 2025",
                url: "https://news.pedaily.cn/202511/556972.shtml",
            },
            {
                label: "NBD, Jul 2026",
                url: "https://www.mrjjxw.com/articles/2026-07-03/4451861.html",
            },
        ],
        drives: {
            types: ["planetary", "harmonic", "cycloidal"],
            source: { label: "36Kr", url: "https://www.36kr.com/p/3879589408977155" },
        },
    },
    {
        id: "zeroerr",
        name: "ZeroErr",
        segment: "joint",
        url: "https://www.zeroerr.cn/",
        hq: "Shenzhen, Guangdong",
        country: "CN",
        // C ≥¥100M (Apr 2024, ¥7.24/$), C+ ≥¥10M (Mar 2026, ¥6.87/$), C++ ≥¥100M (Jul 2026,
        // ~¥6.75/$). Five earlier rounds are undisclosed.
        raisedUsd: 30_100_000,
        raisedIsFloor: true,
        round: "Series C++, several hundred million ¥ (Jul 2026)",
        leadInvestor: "Cowin Capital",
        unitsPerMonth: null,
        volumeNote: "No volume disclosed. Makes eRob integrated joint modules.",
        source: {
            label: "IT Home, Jul 2026",
            url: "https://www.ithome.com/0/975/925.htm",
        },
        moreSources: [
            {
                label: "Pedaily, Mar 2026",
                url: "https://news.pedaily.cn/202603/561304.shtml",
            },
        ],
        drives: {
            types: ["harmonic"],
            source: {
                label: "A3, eRob T-type",
                url: "https://www.automate.org/products/zeroerr-global-limited/erob-rotary-actuator-t-type",
            },
        },
    },
    {
        id: "inspire-robots",
        name: "Inspire Robots",
        segment: "linear",
        url: "https://www.inspire-robots.com/",
        hq: "Beijing",
        country: "CN",
        // B2 >¥100M (Sep 2024, ~¥7.02/$) plus C1 and C2 ≥¥100M combined (Feb 2026, ¥6.87/$).
        // Series A, B and B3 are not counted.
        raisedUsd: 28_800_000,
        raisedIsFloor: true,
        round: "Series C1 and C2, several hundred million ¥ (Feb 2026)",
        leadInvestor: "Beijing AI Industry Investment Fund",
        unitsPerMonth: null,
        volumeNote:
            "No volume disclosed. Makes micro linear servo actuators and dexterous hands.",
        source: {
            label: "Pedaily, Feb 2026",
            url: "https://news.pedaily.cn/202602/561144.shtml",
        },
        moreSources: [
            {
                label: "Pedaily, Sep 2024",
                url: "https://news.pedaily.cn/202409/540834.shtml",
            },
        ],
        drives: {
            types: ["linear-servo"],
            source: {
                label: "Inspire selection guide",
                url: "https://cdn.robotshop.com/rbm/62a1587c-c4cd-47cc-b64f-c077e2ad3775/7/7660deb4-9a9f-4227-a29b-38f4f2100034/ad0450f8_inspire-robots-products-selection-guide-v14-.pdf",
            },
        },
    },
    {
        id: "nousbot",
        name: "Nousbot",
        segment: "linear",
        hq: "Shenzhen, Guangdong",
        country: "CN",
        // Series A >¥100M (Mar 2026, ~¥6.9/$) plus an A+ of just under ¥100M, counted as ¥90M
        // (Aug 2026, ~¥6.8/$). Angel rounds are undisclosed.
        raisedUsd: 27_700_000,
        raisedIsFloor: true,
        round: "Series A+, just under ¥100M (Aug 2026)",
        leadInvestor: "Shunwei Capital",
        unitsPerMonth: null,
        volumeNote:
            "No volume disclosed. Makes micro planetary roller screws for humanoid joints and hands; expanding toward 10 million screws a year by end of 2026.",
        source: {
            label: "Pedaily, Mar 2026",
            url: "https://news.pedaily.cn/202603/561493.shtml",
        },
        moreSources: [
            {
                label: "Pedaily, Aug 2026",
                url: "https://news.pedaily.cn/202608/567646.shtml",
            },
        ],
        drives: {
            types: ["roller-screw"],
            source: { label: "36Kr", url: "https://eu.36kr.com/zh/p/3713617026199688" },
        },
    },
    {
        id: "juxie",
        name: "Juxie",
        segment: "joint",
        url: "https://www.juxiedrive.com/",
        hq: "Wuxi, Jiangsu",
        country: "CN",
        // Series A+ >¥100M (Oct 2026, ~¥6.72/$). Earlier rounds are not counted.
        raisedUsd: 14_900_000,
        raisedIsFloor: true,
        round: "Series A+, >¥100M (Oct 2026)",
        leadInvestor: "Huatai Zijin",
        unitsPerMonth: null,
        volumeNote:
            "No volume disclosed. Plans annual capacity of 200,000 joint module sets in 2026, 1 million in 2027 and 2 million in 2028. Johnson Electric holds a minority stake.",
        source: {
            label: "10jqka, Oct 2026",
            url: "https://news.10jqka.com.cn/20261010/c680548800.shtml",
        },
        moreSources: [
            {
                label: "STAR Market Daily, Oct 2026",
                url: "https://www.chinastarmarket.cn/detail/2501356",
            },
        ],
        drives: {
            types: ["harmonic"],
            source: {
                label: "Juxie brochure, Jul 2025",
                url: "https://www.worldrobotconference.com/profile/robot/download/2025/07/11/%E5%B7%A8%E8%9F%B9%E6%99%BA%E8%83%BD%E9%A9%B1%E5%8A%A8%E7%A7%91%E6%8A%80%E6%9C%89%E9%99%90%E5%85%AC%E5%8F%B8%E4%BA%BA%E5%BD%A2%E6%9C%BA%E5%99%A8%E4%BA%BA%E7%BB%84%E4%BB%B6%E4%BA%A7%E5%93%81%E6%89%8B%E5%86%8C_20250711105728A058.pdf",
            },
        },
    },
    {
        id: "aster",
        name: "Aster",
        segment: "motor",
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
        segment: "motor",
        url: "https://atlasmotion.com/",
        logo: "/logos/startups/atlas-motion.jpg",
        hq: "Long Beach, CA",
        country: "US",
        raisedUsd: 11_500_000,
        round: "Series A (Aug 2026)",
        leadInvestor: "Greycroft",
        unitsPerMonth: 10_000,
        volumeNote: "About 10,000 motors a month, aiming past 40,000 by December 2026.",
        source: {
            label: "FinSMEs, Aug 2026",
            url: "https://www.finsmes.com/2026/08/atlas-motion-raises-11-5m-in-funding.html",
        },
        moreSources: [
            {
                label: "Forbes, Aug 2026",
                url: "https://www.forbes.com/sites/johnkoetsier/2026/08/06/defense-startup-ai-turns-2-months-of-engineering-into-20-minutes/",
            },
        ],
    },
    {
        id: "westmag",
        name: "Westmag",
        segment: "motor",
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
        id: "bonsystems",
        name: "Bonsystems",
        segment: "reducer",
        url: "https://www.bonsystems.com/",
        hq: "Changwon",
        country: "KR",
        // KRW 14.5B RCPS (Jun 2026, ~KRW 1,400/$). Earlier 2025 rounds are reported but unverified.
        raisedUsd: 10_400_000,
        raisedIsFloor: true,
        round: "KRW 14.5B RCPS (Jun 2026)",
        leadInvestor: null,
        unitsPerMonth: null,
        volumeNote:
            "No volume disclosed. Makes compact cycloidal reducers and joint actuators; the Jun 2026 round funds mass-production equipment.",
        source: {
            label: "Newsis, Jun 2026",
            url: "https://www.newsis.com/view/NISX20260611_0003665144",
        },
        moreSources: [
            {
                label: "Bonsystems",
                url: "https://www.bonsystems.com/media-center/press-release/secured-investment/",
            },
        ],
        drives: {
            types: ["cycloidal"],
            source: {
                label: "Venture Square, 2025",
                url: "https://www.venturesquare.net/970748/",
            },
        },
    },
    {
        id: "metismotion",
        name: "MetisMotion",
        segment: "linear",
        url: "https://www.metismotion.com/",
        hq: "Munich",
        country: "DE",
        // Equity >€1M (2018), €1.5M (2021), €3M (2022) plus a €2,467,297 EIC grant (May 2025),
        // each at its own year's rate (~$1.13 to $1.21/€).
        raisedUsd: 9_100_000,
        raisedIsFloor: true,
        round: "EIC grant, €2.47M (May 2025)",
        leadInvestor: "HTGF",
        unitsPerMonth: null,
        volumeNote:
            "No volume disclosed. Makes naXture compact high-force linear actuators for automation and robotics.",
        source: {
            label: "CORDIS",
            url: "https://cordis.europa.eu/project/id/101218714",
        },
        moreSources: [
            {
                label: "HTGF, Jan 2022",
                url: "https://www.htgf.de/en/htgf-financing-metismotion-2/",
            },
            {
                label: "HTGF, May 2021",
                url: "https://www.htgf.de/en/htgf-financing-metismotion/",
            },
        ],
    },
    {
        id: "robstride",
        name: "RobStride",
        segment: "joint",
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
        drives: {
            types: ["qdd"],
            source: {
                label: "RobStride 02 listing",
                url: "https://pakronics.com.au/products/robstride-02-qdd-17n-m-integrated-actuator-module-dual-encoders-ss100064875",
            },
        },
    },
    {
        id: "artimus-robotics",
        name: "Artimus Robotics",
        segment: "soft",
        url: "https://www.artimusrobotics.com/",
        hq: "Boulder, CO",
        country: "US",
        // Army STTR Phase II $1.15M (2022) plus £115,961 paid by ARIA (Jul 2025, ~$1.33/£). The 2020
        // seed and other SBIR awards are undisclosed or unconfirmed.
        raisedUsd: 1_300_000,
        raisedIsFloor: true,
        round: "Army STTR Phase II, $1.15M (Jun 2022)",
        leadInvestor: "ARIA",
        unitsPerMonth: null,
        volumeNote: "No volume disclosed. Makes HASEL electrohydraulic soft actuators.",
        source: { label: "SBIR.gov", url: "https://www.sbir.gov/awards/198231" },
        moreSources: [
            {
                label: "ARIA, FY25/26 Q2",
                url: "https://aria.org.uk/media/0usfmzui/aria-end-of-q2-fy25-26.pdf",
            },
        ],
    },
    {
        id: "index-robotics",
        name: "Index Robotics",
        segment: "joint",
        url: "https://index-robotics.com/",
        hq: "Gyeonggi",
        country: "KR",
        // KRW 1.5B seed at ~KRW 1,400/$.
        raisedUsd: 1_100_000,
        round: "Seed, KRW 1.5B (Feb 2026)",
        leadInvestor: "Futureplay",
        unitsPerMonth: null,
        volumeNote:
            "No volume disclosed. Makes IA Series humanoid joint actuators and an upper-body humanoid built on them.",
        source: {
            label: "Wowtale, Feb 2026",
            url: "https://en.wowtale.net/2026/02/20/233542/",
        },
        moreSources: [
            { label: "Futureplay", url: "https://futureplay.co/our-companies/2079" },
        ],
    },
    {
        id: "mab-robotics",
        name: "MAB Robotics",
        segment: "joint",
        url: "https://www.mabrobotics.pl/",
        hq: "Poznań",
        country: "PL",
        // PLN 1M from YouNick Mint under NCBR BRIdge Alfa (2020, ~$0.26/PLN).
        raisedUsd: 260_000,
        raisedIsFloor: true,
        round: "PLN 1M (2020)",
        leadInvestor: "YouNick Mint",
        unitsPerMonth: null,
        volumeNote:
            "No volume disclosed. Makes high-torque actuators and motor controllers for legged robots.",
        source: {
            label: "MamStartup, 2022",
            url: "https://mamstartup.pl/roboty-kroczace-moga-zapobiegac-awariom-w-infrastrukturze-podziemnej-miast-oraz-poprawic-bezpieczenstwo-w-kopalniach-jakub-bartoszek-mab-robotics/",
        },
        moreSources: [
            {
                label: "NCBR",
                url: "https://www.gov.pl/web/ncbr/bridge-alfa-by-younick-mint-sp-z-oo-sp-k",
            },
        ],
        drives: {
            types: ["qdd", "harmonic", "direct-drive"],
            source: {
                label: "MAB actuators",
                url: "https://www.mabrobotics.pl/ma-actuators",
            },
        },
    },
    {
        id: "myactuator",
        name: "MyActuator",
        segment: "joint",
        url: "https://www.myactuator.com/",
        hq: "Kunshan, Jiangsu",
        country: "CN",
        // A Pre-A and A of over ¥50M was reported in Jun 2026, but the article is gone and no
        // second source confirms it.
        raisedUsd: null,
        round: "Pre-A and A reported (Jun 2026), amount unconfirmed",
        leadInvestor: null,
        unitsPerMonth: null,
        volumeNote:
            "No volume disclosed. Makes integrated joint motors used widely in humanoid and legged robots.",
        source: { label: "myactuator.com", url: "https://www.myactuator.com/" },
        drives: {
            types: ["qdd", "planetary"],
            source: {
                label: "RMD-X8 listing",
                url: "https://www.robotshop.com/products/myactuator-myactuator-rmd-x8-v3-can-bus-reduction-ratio-16-helical-gear-w-new-driver-mc-x-500-o",
            },
        },
    },
    {
        id: "caldera",
        name: "Caldera",
        segment: "motor",
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
