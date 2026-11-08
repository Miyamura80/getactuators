import type { ReuseAllowlist, SourceReuse } from "../supply-chain/reuse";

// Sources behind the robots catalog (frontend/src/data/robots.json), keyed by
// a short id. A robot's `sources` lists their URLs. Every source of a kind in
// REGISTERED_KINDS must be listed here with its reuse value, so the citation
// audit can apply the licence rules (src/supply-chain/licence.ts).
//
// None of the quadruped sources was opened: page fetches from the research
// session (Nov 2026) were blocked, so each figure comes from a search summary
// of the cited page. `opened: false` marks that; recheck against the live page
// before raising a figure's confidence.

export interface RobotSource {
    title: string;
    url: string;
    // What we may do with its data; see AGENTS.md "Data sourcing and licences".
    reuse: SourceReuse;
    // False when the figures were read from a search summary of the page.
    opened: boolean;
}

// Robot kinds whose sources must all be registered here.
export const REGISTERED_KINDS = ["quadruped"] as const;

export const ROBOT_SOURCES = {
    // Unitree Go1
    "unitree-go1-page": {
        title: "Unitree Go1 product page (weight, speed, $2,700 and $3,500 prices)",
        url: "https://www.unitree.com/go1",
        reuse: "facts",
        opened: false,
    },
    "unitree-go1-motor-page": {
        title: "Unitree: GO-M8010-6 bionic robot joint motor (Go1)",
        url: "https://www.unitree.com/go1/motor",
        reuse: "facts",
        opened: false,
    },
    "ieee-go1-price": {
        title: "IEEE Spectrum: Unitree's Go1 robot dog costs just US $2,700",
        url: "https://spectrum.ieee.org/unitrees-go1-robot-dog-looks-pretty-great-costs-just-usd-2700",
        reuse: "facts",
        opened: false,
    },
    "unitree-go1-datasheet": {
        title: "Unitree Go1 datasheet v3.0 (Generation Robots mirror): 3 kg load, 5 kg EDU",
        url: "https://www.generationrobots.com/media/unitree/Go1%20Datasheet_EN%20v3.0.pdf",
        reuse: "facts",
        opened: false,
    },
    // Unitree Go2
    "unitree-go2-page": {
        title: "Unitree Go2 product page",
        url: "https://www.unitree.com/go2",
        reuse: "facts",
        opened: false,
    },
    "hackster-go2-launch": {
        title: "Hackster: Unitree launches Go2, Air at $1,600 and Pro at $2,800",
        url: "https://www.hackster.io/news/unitree-launches-next-generation-go2-quadrupedal-robot-platforms-starting-at-1-600-17fa0d4304c8",
        reuse: "facts",
        opened: false,
    },
    "robotshop-go2-compare": {
        title: "RobotShop: Unitree Go2 Air, Pro and EDU compared (payload, speed, battery)",
        url: "https://community.robotshop.com/blog/show/comprehensive-unitree-go2-robot-comparison",
        reuse: "facts",
        opened: false,
    },
    // Unitree B2
    "unitree-b2-page": {
        title: "Unitree B2 product page",
        url: "https://www.unitree.com/b2",
        reuse: "facts",
        opened: false,
    },
    "ired-b2": {
        title: "iRED store: Unitree B2 (about 60 kg, 40 kg walking load, 120 kg standing, over 6 m/s)",
        url: "https://store.ired.co.uk/products/unitree-b2-quadruped-robot",
        reuse: "facts",
        opened: false,
    },
    "robotlab-b2": {
        title: "RobotLAB: Unitree B2 (over 5 h unloaded walking, about 360 N·m joint torque)",
        url: "https://www.robotlab.com/store/unitree-b2-quadruped-robot/",
        reuse: "facts",
        opened: false,
    },
    // Boston Dynamics Spot
    "spot-product-page": {
        title: "Boston Dynamics Spot product page",
        url: "https://bostondynamics.com/products/spot/",
        reuse: "facts",
        opened: false,
    },
    "spot-spec-sheet": {
        title: "Boston Dynamics Spot spec sheet (32.5 kg, 14 kg payload, 1.6 m/s, 90 min)",
        url: "https://bostondynamics.com/wp-content/uploads/2020/05/spot-spec-sheet.pdf",
        reuse: "facts",
        opened: false,
    },
    "spot-sdk-about": {
        title: "Spot SDK docs: About Spot (hip x, hip y and knee joint per leg)",
        url: "https://dev.bostondynamics.com/docs/concepts/about_spot",
        reuse: "facts",
        opened: false,
    },
    "globe-spot-price": {
        title: "Boston Globe: You can now buy Spot for $74,500 (June 2020)",
        url: "https://www.bostonglobe.com/2020/06/16/business/boston-dynamics-turns-spot-robot-loose",
        reuse: "facts",
        opened: false,
    },
    // ANYbotics ANYmal
    "anymal-page": {
        title: "ANYbotics: Meet ANYmal (10 kg extra payload, ANYdrive joints)",
        url: "https://www.anybotics.com/anymal",
        reuse: "facts",
        opened: false,
    },
    "anymal-spec-sheet": {
        title: "ANYbotics ANYmal technical specifications (50 kg, 1.3 m/s, 90 to 120 min, IP67)",
        url: "https://www.anybotics.com/anymal-technical-specifications.pdf",
        reuse: "facts",
        opened: false,
    },
    // Ghost Robotics Vision 60
    "ghost-vision60-page": {
        title: "Ghost Robotics Vision 60 product page (10 kg payload, up to 2.5 m/s)",
        url: "https://www.ghostrobotics.io/vision-60",
        reuse: "facts",
        opened: false,
    },
    "janes-vision60-jsdf": {
        title: "Janes: Ghost Robotics to supply Vision 60 UGVs to the JSDF (about 50 kg)",
        url: "https://www.janes.com/defence-news/news-detail/dsei-japan-2023-ghost-robotics-to-supply-vision-60-ugvs-to-jsdf",
        // Janes is subscription defence intelligence: cite, never redistribute.
        reuse: "restricted",
        opened: false,
    },
    "umbc-vision60": {
        title: "UMBC CYPRESS testbed: Ghost Robotics Vision 60 Q-UGV",
        url: "https://cypress.umbc.edu/testbed/trace/trace-testbed-design/ghostrobotics-vision60-qugv",
        reuse: "facts",
        opened: false,
    },
    // Deep Robotics X30 and Lite3
    "deep-x30-page": {
        title: "Deep Robotics X30 product page",
        url: "https://deeprobotics.cn/en/index/x30.html",
        reuse: "facts",
        opened: false,
    },
    "deep-x30-manual": {
        title: "Deep Robotics Jueying X30 Pro user manual (12 DOF), RobotShop mirror",
        url: "https://cdn.robotshop.com/media/D/DER/RB-Der-02/pdf/deep-robotics-x30-user-manual.pdf",
        reuse: "facts",
        opened: false,
    },
    "avl-x30": {
        title: "AVL Gear: Deep Robotics X30 Pro (20 kg load, 85 kg max, at least 4 m/s, 2.5 to 4 h, IP67)",
        url: "https://avlgear.com/products/deep-robotics-x30-pro-quadruped-robot",
        reuse: "facts",
        opened: false,
    },
    "robotshop-lite3": {
        title: "RobotShop: Deep Robotics Lite3 Basic (12 DOF, 12 kg, 5 kg load, 2.5 m/s, 1.5 to 2 h)",
        url: "https://www.robotshop.com/products/deep-robotics-lite3-basic-quadruped-robot",
        reuse: "facts",
        opened: false,
    },
    "rapid-lite3": {
        title: "Rapid Online: Deep Robotics Lite3 Pro (payload and battery figures)",
        url: "https://www.rapidonline.com/deep-robotics-lite3p-jy-quadruped-robotic-dog-pro-35-9002",
        reuse: "facts",
        opened: false,
    },
    // Xiaomi CyberDog 2
    "technode-cyberdog2": {
        title: "TechNode: Xiaomi releases CyberDog 2 (August 2023)",
        url: "https://technode.com/2023/08/15/xiaomi-releases-the-cyberdog-2-a-smart-quadruped-bio-robot/",
        reuse: "facts",
        opened: false,
    },
    "techoutlook-cyberdog2": {
        title: "The Tech Outlook: CyberDog 2 with CyberGear micro-actuators, CNY 12,999",
        url: "https://www.thetechoutlook.com/new-release/gadgets-release/xiaomis-bio-inspired-quadruped-robot-cyberdog-2-with-micro-actuator-cybergear-and-fusion-sensing-launched-in-china-for-a-price-of-cny-12999/",
        reuse: "facts",
        opened: false,
    },
    "fonearena-cyberdog2": {
        title: "FoneArena: Xiaomi CyberDog 2 announced (8.9 kg, specs)",
        url: "https://www.fonearena.com/blog/402341/xiaomi-cyberdog-2-price-features.html",
        reuse: "facts",
        opened: false,
    },
    // Rainbow Robotics RBQ-10
    "rbq10-page": {
        title: "Rainbow Robotics RBQ-10 product page",
        url: "https://rainbow-robotics.com/en/products/rbq-10/",
        reuse: "facts",
        opened: false,
    },
    "rbq-manual-spec": {
        title: "RBQ manual: general specification (RBQ-10 42 kg with battery)",
        url: "https://rainbowrobotics.github.io/RBQ/manual/product-descriptions/general-specification.html",
        reuse: "facts",
        opened: false,
    },
    "rbq-manual-intro": {
        title: "RBQ manual: introduction (15 kg payload, 9 km/h walk, 14 km/h run, 2 to 4 h)",
        url: "https://rainbowrobotics.github.io/RBQ/manual/product-descriptions/Intro.html",
        reuse: "facts",
        opened: false,
    },
} as const satisfies Record<string, RobotSource>;

export type RobotSourceId = keyof typeof ROBOT_SOURCES;

// Facts sources allowed to back more than FACTS_MAX_RECORDS robots.
export const ROBOT_FACTS_ALLOWLIST: ReuseAllowlist<RobotSourceId> = {};
