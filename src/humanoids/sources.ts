// Every source cited on /humanoids, keyed by a short id. A joint's `sources`
// lists these ids; pages render them as links.

export interface Source {
    title: string;
    url: string;
}

const GH = "https://github.com";

export const SOURCES = {
    // Method: magnets and rare earths
    "fai-magnets": {
        title: "FAI: The robot boom has a magnet problem",
        url: "https://www.thefai.org/posts/the-robot-boom-has-a-magnet-problem",
    },
    "jda-ndfeb": {
        title: "JDA Magnet: how sintered NdFeB magnets are made (grade composition)",
        url: "https://jdamagnet.com/how-sintered-neodymium-magnets-made/",
    },
    "crystals-gbd": {
        title: "Crystals 2023: Dy/Tb grain-boundary diffusion at 0.35 to 0.42 wt%",
        url: "https://doaj.org/article/a708e544d3f34e75acf1a2fd65e78368",
    },
    "frameless-ilm85": {
        title: "TQ RoboDrive ILM85x26 frameless motor (catalog)",
        url: "/actuators/tq-robodrive-ilm85x26",
    },
    "frameless-ri60": {
        title: "CubeMars RI60 frameless motor (catalog)",
        url: "/actuators/cubemars-ri60-kv120",
    },
    "frameless-ri80": {
        title: "CubeMars RI80 frameless motor (catalog)",
        url: "/actuators/cubemars-ri80-v2-kv75",
    },
    // Actuator cost
    "catalog-fit": {
        title: "actuatorlist catalog: price and mass against peak torque, QDD, integrated and cycloidal actuators",
        url: "/all",
    },
    "huibo-optimus-bom": {
        title: "Huibo research via Zhihu: Optimus hardware BOM (rotary 57k, linear 44k, hands 20k CNY)",
        url: "https://zhuanlan.zhihu.com/p/687045590",
    },
    "ms-optimus-bom": {
        title: "XenoSpectrum on Morgan Stanley: Optimus Gen 2 BOM about $55k, actuators 56%, hands $9.5k",
        url: "https://xenospectrum.com/en/humanoid-robot-bom-actuator-cost/",
    },
    // Rare-earth metal prices
    "price-nd": {
        title: "Rare Earth Mining: neodymium metal price (SMM, China domestic and FOB, Sep 2026)",
        url: "https://rare-earth-mining.com/neodymium-price/",
    },
    "price-pr": {
        title: "Business Analytiq: praseodymium price index, September 2026",
        url: "https://businessanalytiq.com/procurementanalytics/index/praseodymium-price-index/",
    },
    "price-dy": {
        title: "Rare Earth Mining: dysprosium metal price (SMM, 99% min, Sep 2026)",
        url: "https://rare-earth-mining.com/dysprosium-price/",
    },
    "price-tb": {
        title: "Rare Earth Mining: terbium metal price (SMM, China domestic and FOB, Sep 2026)",
        url: "https://rare-earth-mining.com/terbium-price/",
    },
    "price-feb-2026": {
        title: "Rare Earth Exchanges: China rare earth prices, February 2026 (Dy metal 1.45M CNY/t)",
        url: "https://rareearthexchanges.com/news/china-rare-earth-prices-rose-in-february-2026-led-by-magnet-metals/",
    },
    // Tesla Optimus
    "optimus-humanoid-guide": {
        title: "Humanoid.guide: linear vs rotary actuators, why Tesla bet on the roller screw",
        url: "https://humanoid.guide/linear-vs-rotary-actuators-humanoid-joints/",
    },
    "optimus-firgelli": {
        title: "Firgelli: how Tesla Bot actuators work",
        url: "https://www.firgelliauto.com/en-nl/blogs/actuators/how-do-tesla-bot-actuators-actually-work",
    },
    "optimus-optimusk": {
        title: "Optimusk: Optimus actuators and degrees of freedom",
        url: "https://optimusk.blog/blog/tesla-optimus-degrees-of-freedom-actuators/",
    },
    "optimus-gen2": {
        title: "Humanoid.guide: Optimus Gen 2 spec page",
        url: "https://humanoid.guide/product/optimus-gen2",
    },
    "optimus-hand": {
        title: "Basenor: Optimus hands, 11 DoF with 6 active (Gen 2)",
        url: "https://www.basenor.com/blogs/news/tesla-optimus-gen-3-hands-22-dof-50-actuators-explained",
    },
    "humanoid-atlas": {
        title: "Humanoid Atlas: OEM actuator data (Optimus hand: motor + tendon drive)",
        url: `${GH}/kingjulio8238/humanoid-atlas`,
    },
    // Figure
    "figure02-ie": {
        title: "Interesting Engineering: Figure 02 (150 N·m teaser, 16-DOF hands)",
        url: "https://interestingengineering.com/innovation/figure-02-worlds-most-advanced-humanoid-robot",
    },
    "figure02-qviro": {
        title: "QVIRO: Figure 02 specifications",
        url: "https://qviro.com/product/figure/figure-02/specifications",
    },
    // Boston Dynamics
    "atlas-tc": {
        title: "TechCrunch: Boston Dynamics' Atlas goes electric",
        url: "https://techcrunch.com/2024/04/17/boston-dynamics-atlas-humanoid-robot-goes-electric/",
    },
    "atlas-posco": {
        title: "POSCO Newsroom: production Atlas (56 DoF, 50 kg payload)",
        url: "https://newsroom.posco.com/en/?p=27941",
    },
    // Agility
    "digit-blog": {
        title: "Agility Robotics: how Digit moves (20 actuators, 4 large)",
        url: "https://agilityrobotics.com/content/how-digit-moves-the-case-for-highly-effective-actuators",
    },
    "digit-sysid": {
        title: "arXiv 2408.08830: system identification for Digit (actuated joint list)",
        url: "https://arxiv.org/pdf/2408.08830",
    },
    "digit-metavert": {
        title: "Metavert: Agility Robotics vs Apptronik (Digit size and payload)",
        url: "https://metavert.io/compare/agility-robotics-vs-apptronik",
    },
    // Apptronik
    "apollo-trr": {
        title: "The Robot Report: Apptronik's Apollo with bespoke linear actuators",
        url: "https://www.therobotreport.com/rbr50-company-2024/apptronik-releases-humanoid-robot-with-bespoke-linear-actuators/",
    },
    "apollo-ieee": {
        title: "IEEE Spectrum: Apollo, linear and rotary actuators",
        url: "https://spectrum.ieee.org/humanoid-robot",
    },
    "apollo-patent": {
        title: "US 12553500: linear ball screw actuator for a humanoid robot",
        url: "https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/12553500",
    },
    "apollo-engadget": {
        title: "Engadget: 5-foot-8, 160 lb Apollo",
        url: "https://www.engadget.com/apptroniks-apollo-is-the-latest-humanoid-robot-to-beat-tesla-to-market-164246161.html",
    },
    // 1X
    "neo-site": { title: "1X: NEO", url: "https://www.1x.tech/neo" },
    "neo-hands": {
        title: "Robotics & Automation News: NEO hands, tendons at 5:1 to 15:1",
        url: "https://roboticsandautomationnews.com/2026/07/17/1x-unveils-25-degree-of-freedom-humanoid-robot-hands-for-neo/103405/",
    },
    // Unitree
    "g1-urdf": {
        title: "Unitree G1 23-DOF URDF (joint effort limits)",
        url: `${GH}/unitreerobotics/unitree_ros/blob/master/robots/g1_description/g1_23dof_rev_1_0.urdf`,
    },
    "g1-actuators": {
        title: "Unitree RL Lab: G1 actuator configs (N7520, N5020)",
        url: `${GH}/unitreerobotics/unitree_rl_lab/blob/main/source/unitree_rl_lab/unitree_rl_lab/assets/robots/unitree_actuators.py`,
    },
    "g1-site": { title: "Unitree G1", url: "https://www.unitree.com/g1/" },
    "h1-urdf": {
        title: "Unitree H1 URDF (joint effort limits)",
        url: `${GH}/unitreerobotics/unitree_ros/blob/master/robots/h1_description/urdf/h1.urdf`,
    },
    "h1-site": {
        title: "Unitree H1 (peak joint torques)",
        url: "https://unitree.com/mobile/h1",
    },
    "h1-price": {
        title: "Futura Sciences: Unitree H1 at about $90,000",
        url: "https://www.futura-sciences.com/en/born-to-serve-china-unveils-a-strange-emotionless-humanoid-with-fascinating-physical-control_21231/",
    },
    "h2-site": { title: "Unitree H2", url: "https://www.unitree.com/H2/" },
    "h2-krasia": {
        title: "KrASIA: Unitree H2 (31 DOF, 360 N·m legs, 120 N·m arms)",
        url: "https://kr-asia.com/unitrees-new-h2-brings-streamlined-elegance-to-humanoid-robotics",
    },
    // UBTech
    "walker-sdk": {
        title: "UBTECH Walker S2 SDK document (42 joint motors, head 4.5 N·m peak)",
        url: "https://a.storyblok.com/f/298593/x/1329253096/ubtech-walker-s2-sdk-secondary-development-document-external.pdf",
    },
    "walker-press": {
        title: "Humanoid Press: Walker S2 (torque curves not released)",
        url: "https://humanoid.press/database/humanoid-press-walker-s2/",
    },
    // AgiBot
    "x1-urdf": {
        title: "AgiBot X1 training URDF (leg joint effort limits)",
        url: `${GH}/AgibotTech/agibot_x1_train/blob/main/resources/robots/x1/urdf/x1.urdf`,
    },
    "x1-guide": {
        title: "AgiBot X1 development guide (R86-2 x9, R86-3 x6, R52 x10, L28 x4)",
        url: "https://www.agibot.com/DOCS/OS",
    },
    "x1-product": {
        title: "AgiBot X1 product page (R52, L28 specs, 130 cm, 33 kg)",
        url: "https://agibot.com/products/X1",
    },
    "x1-leobotics": {
        title: "Leobotics: X1 PowerFlow QDD modules, planetary under 10:1",
        url: "https://en.leobotics.com/comparateur-robot/robot-humanoide-open-source-full-stack-x1-agibot",
    },
    // Fourier
    "gr1-urdf": {
        title: "Fourier GR1T1 URDF (joint effort limits)",
        url: `${GH}/FFTAI/Wiki-GRx-Models/blob/master/GRX/GR1/gr1t1/basic_urdf/gr1t1.urdf`,
    },
    "gr2-urdf": {
        title: "Fourier GR-2 URDF v3.8.7 (joint effort limits)",
        url: `${GH}/FFTAI/Wiki-GRx-Models/blob/master/GRX/GR2/gr2v3_8_7/basic_urdf/gr2v3_8_7.urdf`,
    },
    "grx-readme": {
        title: "Fourier GRx models README (6-DOF Fourier hand variant)",
        url: `${GH}/FFTAI/Wiki-GRx-Models`,
    },
    "gr1-db": {
        title: "Humanoid Press database: GR-1",
        url: "https://humanoid.press/database/database-gr-1/",
    },
    "gr1-sacra": {
        title: "Sacra: Fourier GR-1 (165 cm, 55 kg, up to 44 DOF)",
        url: "https://sacra.com/c/fourier",
    },
    "gr2-support": {
        title: "Fourier support: about GR-2 (1.75 m, 63 kg, up to 53 DOF)",
        url: "https://support.fftai.com/en/docs/GR-X-Humanoid-Robot/GR2/GR-2_Introduction/",
    },
    "gr2-technode": {
        title: "TechNode Global: Fourier GR-2 and FSA 2.0",
        url: "https://technode.global/?p=86651",
    },
    // Booster
    "t1-urdf": {
        title: "Booster T1 23-DOF URDF",
        url: `${GH}/BoosterRobotics/booster_assets/blob/main/robots/T1/T1_23dof.urdf`,
    },
    "t1-robocup": {
        title: "RoboCup HSL spec sheet: Booster T1 brushless DC joints",
        url: "https://hsl.robocup.org/wp-content/uploads/2026/03/large_Robotedge-specs-698021eff19c7.pdf",
    },
    "k1-urdf": {
        title: "Booster K1 22-DOF URDF",
        url: `${GH}/BoosterRobotics/booster_assets/blob/main/robots/K1/K1_22dof.urdf`,
    },
    // K-Scale
    "kbot-docs": {
        title: "K-Scale docs: K-Bot mechanical system (RS00 x2, RS02 x6, RS03 x8, RS04 x4)",
        url: "https://docs.kscale.dev/robots/k-bot/mechanical/",
    },
    "kbot-deepwiki": {
        title: "DeepWiki: kbot-v2 motor to joint mapping",
        url: "https://deepwiki.com/kscalelabs/kscale-assets/2.1-kbot-v2-humanoid-robot",
    },
    // Sanctuary
    "phoenix-hands": {
        title: "Sanctuary AI: in-hand manipulation with hydraulic hands",
        url: "https://sanctuary.ai/news/sanctuary-ai-demonstrates-in-hand-manipulation-capabilities-for-improved-general-purpose-robot-dexterity",
    },
    "phoenix-gen7": {
        title: "Robotics 24/7: Phoenix generation 7",
        url: "https://www.robotics247.com/article/sanctuary_ai_releases_next_generation_of_phoenix_general_purpose_robot/sanctuary_ai",
    },
    "phoenix-21dof": {
        title: "Analytics India: Phoenix hand with 21 DOF",
        url: "https://analyticsindiamag.com/ai-news-updates/sanctuary-ais-phoenix-now-has-a-robotic-hand-with-21-dof",
    },
    "phoenix-moov": {
        title: "moov: Phoenix at 170 cm and 70 kg",
        url: "https://moov.ooo/article/6642d6f1b045263a83ad7457",
    },
    // Kepler
    "k2-trr": {
        title: "The Robot Report: Kepler K2 Bumblebee at ICRA 2025",
        url: "https://www.therobotreport.com/kepler-robotics-showcases-k2-bumblebee-icra-2025/",
    },
    "k2-ie": {
        title: "Interesting Engineering: Kepler debuts K2 (roller-screw limbs)",
        url: "https://interestingengineering.com/innovation/kepler-debuts-k2-humanoid-robot",
    },
    // XPeng
    "iron-ie": {
        title: "Interesting Engineering: XPeng IRON production",
        url: "https://interestingengineering.com/ai-robotics/xpeng-iron-humanoid-robot-production",
    },
    "iron-cleantechnica": {
        title: "CleanTechnica: XPeng IRON",
        url: "https://cleantechnica.com/2025/11/09/is-musk-conceding-ground-and-does-xpengs-iron-signal-chinas-lead-in-the-humanoid-robot-race/",
    },
    // Berkeley
    "bhl-urdf": {
        title: "Berkeley Humanoid Lite URDF (22 joints)",
        url: `${GH}/HybridRobotics/Berkeley-Humanoid-Lite-Assets`,
    },
    "bhl-paper": {
        title: "arXiv 2504.17249: Demonstrating Berkeley Humanoid Lite",
        url: "https://arxiv.org/abs/2504.17249",
    },
    "bhl-commonality": {
        title: "Humanoid.guide: actuator commonality, Optimus to Berkeley Humanoid Lite",
        url: "https://humanoid.guide/humanoid-actuator-commonality/",
    },
    "bhl-rdworld": {
        title: "R&D World: Berkeley Humanoid Lite parts ($188 6512, $136 5010 actuators; $4,312 total)",
        url: "https://www.rdworldonline.com/berkeley-debuts-5000-open-source-humanoid-built-with-desktop-3d-printers/",
    },
    "bhl-irz": {
        title: "IRZ: Berkeley Humanoid Lite's $4,312 BOM, actuators 81% (compute, battery, printed parts itemized)",
        url: "https://irz.fr/en/articles/berkeley-humanoid-actuators-81-percent-en/",
    },
    "bhl-orobot": {
        title: "Orobot: Berkeley Humanoid Lite BOM (6512 and 5010 actuators)",
        url: "https://orobot.io/o/program/BROKER-2/berkeley-humanoid-lite",
    },
    // Menlo
    "asimov-joints": {
        title: "Menlo docs: Asimov 1 joint design and actuation",
        url: "https://docs.menlo.ai/asimov/1/hardware/joint-design-and-actuation",
    },
    "asimov-mech": {
        title: "Menlo docs: Asimov 1 mechanical overview",
        url: "https://docs.menlo.ai/asimov/1/overview/system-tour/mechanical",
    },
} satisfies Record<string, Source>;

export type SourceId = keyof typeof SOURCES;

// "catalog:<id>" cites an actuatorlist catalog entry (its price or mass).
export function sourceOf(id: string): Source {
    if (id.startsWith("catalog:")) {
        const slug = id.slice("catalog:".length);
        return { title: `actuatorlist catalog: ${slug}`, url: `/actuators/${slug}` };
    }
    return (SOURCES as Record<string, Source>)[id] ?? { title: id, url: id };
}
