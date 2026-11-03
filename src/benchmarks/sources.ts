import type { ReuseAllowlist, SourceReuse } from "../supply-chain/reuse";

// Every source a published benchmark run may cite. A run's source.url must be
// one of these urls; scripts/validate-benchmarks.ts checks it and applies the
// licence rules (AGENTS.md "Data sourcing and licences"). Relative imports
// only: the browser bundle reuses this module.

export interface BenchmarkSource {
    title: string;
    url: string;
    reuse: SourceReuse;
}

const RS =
    "https://github.com/RobStride/Product_Information/blob/main/Product%20Literature/CAN2.0";

export const BENCHMARK_SOURCES = {
    "xiaomi-cybergear-manual": {
        title: "Xiaomi CyberGear micromotor instruction manual (English translation)",
        url: "https://github.com/belovictor/cybergear-docs/blob/main/instructionmanual/instructionmanual.md",
        reuse: "facts",
    },
    "robstride-rs00-manual": {
        title: "RobStride RS00 user manual (260713)",
        url: `${RS}/RS00/RS00User%20Manual260713.pdf`,
        reuse: "facts",
    },
    "robstride-rs01-manual": {
        title: "RobStride RS01 user manual (260713)",
        url: `${RS}/RS01/RS01User%20Manual260713.pdf`,
        reuse: "facts",
    },
    "robstride-rs02-manual": {
        title: "RobStride RS02 user manual (260713)",
        url: `${RS}/RS02/RS02User%20Manual260713.pdf`,
        reuse: "facts",
    },
    "robstride-rs03-manual": {
        title: "RobStride RS03 user manual (261013)",
        url: `${RS}/RS03/RS03User%20Manual261013.pdf`,
        reuse: "facts",
    },
    "robstride-rs04-manual": {
        title: "RobStride RS04 user manual (260713)",
        url: `${RS}/RS04/RS04User%20Manual260713.pdf`,
        reuse: "facts",
    },
    "mjbots-qdd100-beta3": {
        title: "mjbots: qdd100 beta 3 servo product page",
        url: "https://mjbots.com/products/qdd100-beta-3",
        reuse: "facts",
    },
    "mjbots-blog-thermal": {
        title: "mjbots blog: Up-rating the qdd100 beta thermal bounds",
        url: "https://blog.mjbots.com/2020/08/07/up-rating-the-qdd100-beta-thermal-bounds/",
        reuse: "facts",
    },
    "mjbots-blog-torque": {
        title: "mjbots blog: Ground truth torque testing for qdd100",
        url: "https://blog.mjbots.com/2020/03/25/ground-truth-torque-testing-for-qdd100/",
        reuse: "facts",
    },
    "robotis-xm430-w350": {
        title: "ROBOTIS e-Manual: XM430-W350 performance graph",
        url: "https://emanual.robotis.com/docs/en/dxl/x/xm430-w350/",
        reuse: "facts",
    },
    "robotis-xl430-w250": {
        title: "ROBOTIS e-Manual: XL430-W250 performance graph",
        url: "https://emanual.robotis.com/docs/en/dxl/x/xl430-w250/",
        reuse: "facts",
    },
    "robotis-xm540-w270": {
        title: "ROBOTIS e-Manual: XM540-W270 performance graph",
        url: "https://emanual.robotis.com/docs/en/dxl/x/xm540-w270/",
        reuse: "facts",
    },
    "robotis-xh540-w270": {
        title: "ROBOTIS e-Manual: XH540-W270 performance graph",
        url: "https://emanual.robotis.com/docs/en/dxl/x/xh540-w270/",
        reuse: "facts",
    },
    "robotis-xc430-w150": {
        title: "ROBOTIS e-Manual: XC430-W150 performance graph",
        url: "https://emanual.robotis.com/docs/en/dxl/x/xc430-w150/",
        reuse: "facts",
    },
    "robonine-sts3215": {
        title: "Robonine: Testing of Feetech STS3215 servomotor: backlash, repeatability and torque",
        url: "https://robonine.com/testing-of-feetech-sts3215-servomotor-backlash-repeatability-and-torque/",
        reuse: "facts",
    },
    "robonine-servo-comparison": {
        title: "Robonine: Practical comparison of smart serial servo motors for robotics",
        url: "https://robonine.com/smart-serial-servo-motor-comparison-robotics/",
        reuse: "facts",
    },
    "robonine-sts3250": {
        title: "Robonine: Feetech STS3250 smart actuator, evaluation of accuracy, torque and backlash",
        url: "https://robonine.com/feetech-sts3250-smart-actuator-evaluation-of-accuracy-torque-and-backlash/",
        reuse: "facts",
    },
    // HardwareX is open access under CC BY 4.0; the stand's data and docs are
    // CC BY 4.0 in github.com/roboninecom/Measuring-Backlash-in-Popular-UART-Servos.
    "hardwarex-backlash-stand": {
        title: "Kotov, HardwareX 26 (2026) e00767: An open-source test stand for backlash measurement in low-cost UART servo motors",
        url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC13087586/",
        reuse: "open",
    },
    "arxiv-2110-01562": {
        title: "arXiv 2110.01562: Enhancing voluntary motion with modular, backdrivable, powered hip and knee orthoses",
        url: "https://arxiv.org/abs/2110.01562",
        reuse: "facts",
    },
    "arxiv-2404-05039": {
        title: "arXiv 2404.05039: StaccaToe, a single-leg robot that mimics the human leg and toe",
        url: "https://arxiv.org/abs/2404.05039",
        reuse: "facts",
    },
    "hackaday-spider-bot": {
        title: "Hackaday.io: Steadywin GIM6010-8 vs Xiaomi CyberGear micromotor",
        url: "https://hackaday.io/project/202366-the-unnamed-spider-bot/log/239239-steadywin-gim6010-8-vs-xiaomi-cybergear-micromotor",
        reuse: "facts",
    },
} satisfies Record<string, BenchmarkSource>;

export type BenchmarkSourceId = keyof typeof BENCHMARK_SOURCES;

// Facts sources allowed to back more than FACTS_MAX_RECORDS runs.
export const BENCHMARK_FACTS_ALLOWLIST: ReuseAllowlist<BenchmarkSourceId> = {};

export function sourceIdForUrl(url: string): BenchmarkSourceId | undefined {
    return (Object.keys(BENCHMARK_SOURCES) as BenchmarkSourceId[]).find(
        (id) => BENCHMARK_SOURCES[id].url === url,
    );
}
