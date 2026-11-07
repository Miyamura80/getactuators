// Company and brand identity for logos: one entry per company the site names,
// keyed to its primary web domain (the logo provider's lookup key). A `null`
// domain is deliberate: the company has no verified site, so the UI draws a
// monogram instead of guessing. Shared by the browser (CompanyLogo) and tests.
//
// Verification (Oct 2026): domains were checked by web search; these were also
// confirmed as the company's own domain by Logo.dev brand search: robstride.com,
// allient.com, iflight.com, nidec.com, hiwonder.com, menlo.ai, menlovc.com,
// unitzero.ai, i2rt.com, mindrobotics.com, proception.ai, minervahumanoids.com,
// theker.ai, pollen-robotics.com. Every domain returns a Logo.dev logo except lkmotor.cn (LKMTech),
// which renders as a monogram.

import { canonicalBrand } from "../catalog/brands";
import { STARTUPS } from "../startups";
import selfHosted from "./self-hosted.json";

export interface BrandEntry {
    id: string;
    name: string;
    // Primary web domain, or null when unverified.
    domain: string | null;
    // Other spellings the datasets use, matched after normalisation.
    aliases?: string[];
    // Self-hosted logo under frontend/public; wins over the logo provider.
    logo?: string;
    // "light" for a dark mark that disappears on the black HUD: drawn on a
    // pale tile with the provider's light-theme variant.
    tile?: "light";
}

type Row = [id: string, name: string, domain: string | null, aliases?: string[]];

// Actuator, motor and gearbox makers (frontend/src/data/actuators.json).
const MAKERS: Row[] = [
    ["cubemars", "CubeMars", "cubemars.com", ["T-Motor"]],
    ["unitree", "Unitree", "unitree.com", ["Unitree Robotics"]],
    ["robotis", "Robotis", "robotis.com", ["Dynamixel"]],
    ["myactuator", "MyActuator", "myactuator.com"],
    ["robstride", "RobStride", "robstride.com"],
    ["steadywin", "Steadywin", "steadywin-motor.com", ["SteadyWin"]],
    ["waveshare", "Waveshare", "waveshare.com"],
    ["feetech", "Feetech", "feetechrc.com"],
    ["harmonic-drive", "Harmonic Drive", "harmonicdrive.net", ["Harmonic Drive LLC"]],
    ["mjbots", "mjbots", "mjbots.com"],
    ["odrive", "ODrive", "odriverobotics.com", ["ODrive Robotics"]],
    ["leaderdrive", "Leaderdrive", "leaderdrive.com"],
    ["damiao", "DAMIAO", "damiaokeji.com", ["DMBots"]],
    ["nidec", "Nidec", "nidec.com", ["Nidec Drive Technology"]],
    ["xiaomi", "Xiaomi", "mi.com"],
    ["hiwonder", "Hiwonder", "hiwonder.com", ["LewanSoul"]],
    ["innfos", "INNFOS", "innfos.com"],
    ["ipower", "iPower", "iflight.com", ["iPower Motor"]],
    ["nabtesco", "Nabtesco", "nabtesco.com"],
    ["spinea", "Spinea", "spinea.com"],
    ["maxon", "maxon", "maxongroup.com"],
    ["tq-systems", "TQ-Systems", "tq-group.com"],
    [
        "allied-motion",
        "Allied Motion",
        "allient.com",
        ["Allied Motion / Allient", "Allient"],
    ],
    ["vesc", "VESC / Trampa", "trampa.co.uk", ["Trampa / VESC Project", "Trampa"]],
    ["trinamic", "Trinamic", "analog.com", ["Analog Devices"]],
    ["lkmtech", "LKMTech", "lkmotor.cn", ["LK Motor"]],
    // Asimov 1 joint motors (#100). encos.cn is 南京因克斯智能科技 (Nov 2026).
    ["encos", "ENCOS", "encos.cn"],
    ["atar", "ATAR", "atarrobot.com", ["ATAR Robot"]],
];

// Robot makers and the people behind the robot data (robots.json).
const ROBOT_MAKERS: Row[] = [
    ["menlo-research", "Menlo Research", "menlo.ai"],
    ["1x", "1X Technologies", "1x.tech", ["1X"]],
    ["booster", "Booster Robotics", "booster.tech", ["Booster"]],
    ["i2rt", "i2RT Robotics", "i2rt.com", ["i2RT"]],
    ["unitzero", "UnitZero", "unitzero.ai"],
    ["pollen", "Pollen Robotics", "pollen-robotics.com", ["Pollen"]],
    // Domains from the robots.json sources for #104's new robots.
    ["fourier", "Fourier", "fftai.com", ["Fourier Intelligence"]],
    ["agility", "Agility Robotics", "agilityrobotics.com", ["Agility"]],
    ["agilex", "AgileX Robotics", "agilex.ai", ["AgileX"]],
    ["therobotstudio", "TheRobotStudio", "therobotstudio.com"],
    ["hello-robot", "Hello Robot", "hello-robot.com"],
    ["franka", "Franka Robotics", "franka.de", ["Franka"]],
    // Domain from its own product page (yor.manmaruai.co.jp) in robots.json.
    ["manmaru", "ManmaruAI", "manmaruai.co.jp", ["Manmaru"]],
    // The Asimov 1 bill of materials, not a company: always a monogram.
    ["asimov-bom", "Asimov BOM", null],
];

// Humanoid makers on /humanoids (src/humanoids) not listed elsewhere. Domains
// are each robot's product_url or the maker's own page in its sources. Kepler's
// sources are press coverage only, so it stays a monogram.
const HUMANOID_MAKERS: Row[] = [
    ["figure", "Figure AI", "figure.ai", ["Figure"]],
    ["apptronik", "Apptronik", "apptronik.com"],
    ["sanctuary", "Sanctuary AI", "sanctuary.ai", ["Sanctuary"]],
    ["kscale", "K-Scale Labs", "kscale.dev", ["K-Scale"]],
    ["xpeng", "XPeng", "xpeng.com", ["XPENG Robotics"]],
    [
        "berkeley-hybrid-robotics",
        "UC Berkeley Hybrid Robotics",
        "berkeley-humanoid.org",
        ["Berkeley Humanoid"],
    ],
    ["kepler", "Kepler", null, ["Kepler Robotics"]],
];

// Supply-chain registry companies (src/supply-chain/companies) and the
// familiar-market leaders on /lab/supply-chain (DOMINANCE_MARKETS). Domains are
// each company's own site from the registry `url`; the two the registry only
// cites through Wikipedia stay null (monogram). Nidec, Nabtesco, Leaderdrive,
// Unitree and Xiaomi are already listed above.
const SUPPLY_CHAIN: Row[] = [
    ["mp-materials", "MP Materials", "mpmaterials.com"],
    ["china-northern-rare-earth", "China Northern Rare Earth", "reht.com"],
    ["china-rare-earth-group", "China Rare Earth Group", null],
    ["shenghe-resources", "Shenghe Resources", null],
    ["shin-etsu-chemical", "Shin-Etsu Chemical", "shinetsu.co.jp"],
    ["jl-mag", "JL MAG Rare-Earth", "jlmag.com.cn", ["JL MAG"]],
    ["harmonic-drive-systems", "Harmonic Drive Systems", "hds.co.jp"],
    ["timken", "Timken", "timken.com"],
    ["tesla", "Tesla", "tesla.com"],
    ["boston-dynamics", "Boston Dynamics", "bostondynamics.com"],
    ["hyundai-mobis", "Hyundai Mobis", "mobis.com"],
    ["rainbow-robotics", "Rainbow Robotics", "rainbow-robotics.com"],
    ["fanuc", "FANUC", "fanuc.co.jp"],
    ["yaskawa", "Yaskawa Electric", "yaskawa-global.com", ["Yaskawa"]],
    ["ubtech", "UBTech Robotics", "ubtrobot.com", ["UBTech"]],
    ["agibot", "AgiBot", "agibot.com"],
    ["tuopu-group", "Ningbo Tuopu Group", "tuopu.com", ["Tuopu"]],
    ["google", "Google", "google.com"],
    ["bing", "Bing", "bing.com"],
    ["apple", "Apple", "apple.com"],
    ["samsung", "Samsung", "samsung.com", ["Samsung Electronics"]],
    ["vivo", "vivo", "vivo.com"],
    ["oppo", "OPPO", "oppo.com"],
    // /japan (#79): Japanese companies and the foreign partners their links
    // reach. JARE, Santoku and Caremag have no verified site of their own.
    ["jogmec", "JOGMEC", "jogmec.go.jp"],
    ["sojitz", "Sojitz", "sojitz.com"],
    ["jare", "Japan Australia Rare Earths (JARE)", null, ["JARE"]],
    ["toyota-tsusho", "Toyota Tsusho", "toyota-tsusho.com"],
    ["santoku", "Santoku", null],
    ["iwatani", "Iwatani", "iwatani.co.jp"],
    ["resonac", "Resonac", "resonac.com", ["Showa Denko"]],
    ["lynas", "Lynas Rare Earths", "lynasrareearths.com", ["Lynas"]],
    ["caremag", "Caremag", null],
    ["irel", "IREL (India)", "irel.co.in", ["IREL"]],
    ["proterial", "Proterial", "proterial.com"],
    ["tdk", "TDK", "tdk.com"],
    ["daido-steel", "Daido Steel", "daido.co.jp"],
    ["mitsubishi-electric", "Mitsubishi Electric", "mitsubishielectric.com"],
    ["tamagawa-seiki", "Tamagawa Seiki", "tamagawa-seiki.com"],
    ["oriental-motor", "Oriental Motor", "orientalmotor.com"],
    ["sanyo-denki", "Sanyo Denki", "sanyodenki.com"],
    ["shinano-kenshi", "Shinano Kenshi", "shinano.com"],
    ["aichi-steel", "Aichi Steel", "aichi-steel.co.jp"],
    ["neo-performance", "Neo Performance Materials", "neomaterials.com"],
    ["noveon-magnetics", "Noveon Magnetics", "noveon.co"],
    ["sumitomo-heavy", "Sumitomo Heavy Industries", "shi.co.jp"],
    ["thk", "THK", "thk.com"],
    ["nsk", "NSK", "nsk.com"],
    ["ntn", "NTN", "ntnglobal.com"],
    ["jtekt", "JTEKT", "jtekt.co.jp"],
    ["nippon-thompson", "Nippon Thompson (IKO)", "ikont.co.jp", ["IKO"]],
    ["minebea-mitsumi", "MinebeaMitsumi", "minebeamitsumi.com"],
    ["tsubakimoto-chain", "Tsubakimoto Chain", "tsubakimoto.com"],
    ["kawasaki-heavy", "Kawasaki Heavy Industries", "kawasaki.com"],
    ["denso-wave", "Denso Wave", "denso-wave.com"],
    ["seiko-epson", "Seiko Epson", "epson.com", ["Epson"]],
    ["nachi-fujikoshi", "Nachi-Fujikoshi", "nachi-fujikoshi.co.jp"],
    ["mujin", "Mujin", "mujin.co.jp"],
    ["kawada-robotics", "Kawada Robotics", "kawadarobot.co.jp"],
    ["honda", "Honda", "honda.com"],
    ["toyota-motor", "Toyota Motor", "toyota.com", ["Toyota"]],
    ["yamaha-motor", "Yamaha Motor", "yamaha-motor.com"],
    ["omron", "OMRON", "omron.com"],
    ["smc", "SMC", "smcworld.com"],
    ["iai", "IAI", "intelligentactuator.com"],
    ["shibaura-machine", "Shibaura Machine", "shibaura-machine.co.jp"],
    ["techman-robot", "Techman Robot", "tm-robot.com"],
    ["kuka", "KUKA", "kuka.com"],
    ["abb", "ABB Robotics", "abb.com", ["ABB"]],
    // /korea (#81): Korean companies, foreign makers with Korean plants and
    // the partners their links reach. Domains not confirmed during research
    // stay null (monogram).
    ["korea-zinc", "Korea Zinc", "koreazinc.co.kr"],
    ["posco-international", "POSCO International", "poscointl.com"],
    ["ls-eco-energy", "LS Eco Energy", "lsecoenergy.com"],
    ["komir", "KOMIR", "komir.or.kr"],
    ["asm", "Australian Strategic Materials (ASM)", "asm-au.com", ["ASM"]],
    ["reelement", "ReElement Technologies", null, ["ReElement"]],
    ["arafura", "Arafura Rare Earths", "arultd.com", ["Arafura"]],
    ["star-group", "Star Group Industrial", null, ["Star Group"]],
    ["lg-innotek", "LG Innotek", "lginnotek.com"],
    ["samsung-electro-mechanics", "Samsung Electro-Mechanics", "samsungsem.com"],
    ["higen-rnm", "HIGEN RNM", "higenrnm.com", ["Higen Motor"]],
    ["snt-motiv", "SNT Motiv", "sntmotiv.com"],
    ["samhyun", "Samhyun", null],
    ["spg", "SPG", "spg.co.kr"],
    ["sbb-tech", "SBB Tech", null],
    ["woorim-pts", "Woorim PTS", null],
    ["samick-thk", "Samick THK", "samickthk.co.kr"],
    ["schaeffler", "Schaeffler", "schaeffler.com"],
    ["hyundai-motor", "Hyundai Motor", "hyundai.com"],
    ["doosan-robotics", "Doosan Robotics", "doosanrobotics.com"],
    ["hd-hyundai-robotics", "HD Hyundai Robotics", "hyundai-robotics.com"],
    ["lg-electronics", "LG Electronics", "lg.com"],
    ["naver-labs", "Naver Labs", "naverlabs.com"],
    ["hanwha-robotics", "Hanwha Robotics", "hanwha.com"],
    ["neuromeka", "Neuromeka", "neuromeka.com"],
    ["wonik-robotics", "Wonik Robotics", null],
    ["angel-robotics", "Angel Robotics", "angel-robotics.com"],
    ["bear-robotics", "Bear Robotics", "bearrobotics.ai"],
    ["onexia", "ONExia", null],
    ["kimm", "Korea Institute of Machinery & Materials (KIMM)", "kimm.re.kr", ["KIMM"]],
    // /alts (#78): makers of the alternative actuator technologies.
    ["renault-group", "Renault Group", "renaultgroup.com", ["Renault"]],
    ["bmw-group", "BMW Group", "bmwgroup.com", ["BMW"]],
    ["turntide", "Turntide Technologies", "turntide.com", ["Turntide"]],
    ["conifer", "Conifer", "conifer.io"],
    ["niron-magnetics", "Niron Magnetics", "nironmagnetics.com", ["Niron"]],
    [
        "cambridge-mechatronics",
        "Cambridge Mechatronics",
        "cambridgemechatronics.com",
        ["CML"],
    ],
    ["festo", "Festo", "festo.com"],
    ["barrett-technology", "Barrett Technology", "barrett.com", ["Barrett"]],
    ["magnomatics", "Magnomatics", "magnomatics.com"],
    // /china (#80): Chinese companies and partners. Domains only where a
    // source in the dataset is the company's own site; the rest stay null.
    ["baotou-steel", "Baotou Steel", null],
    ["xiamen-tungsten", "Xiamen Tungsten", null],
    [
        "china-rare-earth-nonferrous",
        "China Rare Earth Nonferrous Metals (ex-Guangsheng)",
        null,
        ["Guangsheng Nonferrous"],
    ],
    ["jiangxi-copper", "Jiangxi Copper", null],
    ["grirem", "Grirem Advanced Materials", null, ["Grirem"]],
    ["ningbo-yunsheng", "Ningbo Yunsheng", null],
    ["zhong-ke-san-huan", "Zhong Ke San Huan", null, ["Zhongke Sanhuan"]],
    ["zhenghai-magnetic", "Zhenghai Magnetic Material", null, ["ZHmag"]],
    ["earth-panda", "Earth-Panda Advance Magnetic Material", null, ["Earth-Panda"]],
    ["yantai-dongxing", "Yantai Dongxing Magnetic Materials (YSM)", null, ["YSM"]],
    ["tianhe-magnetics", "Tianhe Magnetics", null],
    ["galaxy-magnets", "Galaxy Magnets", null],
    ["inovance", "Inovance", "inovance.com"],
    ["wolong-electric", "Wolong Electric Drive", null, ["Wolong"]],
    ["hechuan", "Hechuan Technology (HCFA)", null, ["HCFA"]],
    ["moons", "MOONS' Electric", null, ["MOONS'"]],
    ["leadshine", "Leadshine", "leadshine.com"],
    ["zhaowei", "Zhaowei Machinery & Electronics", null, ["Zhaowei"]],
    ["shuanghuan-driveline", "Shuanghuan Driveline", null],
    ["zd-leader", "ZD Leader", null, ["Zhongda Leader"]],
    ["laifual", "Laifual Drive", null, ["Laifual"]],
    ["beite", "Beite Technology", null],
    ["best-precision", "Best Precision Machinery", null],
    ["zwz-bearing", "ZWZ Bearing", null, ["Wafangdian Bearing"]],
    ["lyc-bearing", "LYC Bearing", null],
    ["harbin-bearing", "Harbin Bearing (HRB)", null],
    ["zhenhua-bearing", "Zhenhua Bearing", null],
    ["galbot", "Galbot", null],
    ["estun", "Estun", null],
    ["efort", "Efort", null],
    ["siasun", "Siasun", null],
    ["sanhua", "Sanhua Intelligent Controls", null, ["Sanhua"]],
    ["midea", "Midea", null],
    ["shanghai-electric", "Shanghai Electric", "shanghai-electric.com"],
    ["dobot", "Dobot", null],
    ["leju", "Leju Robotics", null, ["Leju"]],
    ["joyson", "Ningbo Joyson Electronic", null, ["Joyson"]],
    // /china second batch (#80). jaka.com is cited directly; aubo-robotics.cn,
    // engineai.com.cn and guohuaintel.com are the sites named by the company's
    // EtherCAT listing or press release in the dataset. The rest stay null.
    ["jaka", "JAKA Robotics", "jaka.com", ["JAKA"]],
    ["aubo", "AUBO Robotics", "aubo-robotics.cn", ["AUBO"]],
    ["rokae", "ROKAE", null],
    ["engineai", "EngineAI", "engineai.com.cn", ["ENGINEAI"]],
    ["deep-robotics", "Deep Robotics", null, ["DEEP Robotics"]],
    ["wuzhou-xinchun", "Wuzhou Xinchun", null],
    ["guohua", "Guohua Intelligent", "guohuaintel.com", ["Guohua Intelligence"]],
    ["byd", "BYD", null],
    ["geely", "Geely Holding", null, ["Geely"]],
    ["dongfeng-liuzhou", "Dongfeng Liuzhou Motor", null],
];

// Companies behind the /investors deals (src/investors.ts COMPANIES).
const PORTFOLIO: Row[] = [
    ["salient", "Salient Motion", "salientmotion.com"],
    ["clearmotion", "ClearMotion", "clearmotion.com"],
    ["mind", "Mind Robotics", "mindrobotics.com"],
    ["robco", "RobCo", "robco.de"],
    ["anybotics", "ANYbotics", "anybotics.com"],
    ["proception", "Proception", "proception.ai"],
    ["robotiq", "Robotiq", "robotiq.com"],
    ["minerva", "Minerva Humanoids", "minervahumanoids.com"],
    ["standardbots", "Standard Bots", "standardbots.com"],
    ["cobot", "Collaborative Robotics", "co.bot"],
    ["sunday", "Sunday Robotics", "sunday.ai"],
    ["botco", "The Bot Company", "bot.co"],
    ["theker", "THEKER", "theker.ai"],
    ["dyna", "Dyna Robotics", "dyna.co"],
    ["genesis", "Genesis AI", "genesis.ai"],
    ["rhoda", "Rhoda AI", "rhoda.ai"],
    ["thirdwave", "Third Wave Automation", "thirdwave.ai"],
    ["icon", "ICON", "iconbuild.com"],
];

// Venture funds (src/investors.ts FUNDS) and startup lead investors.
const INVESTORS: Row[] = [
    ["a16z", "a16z", "a16z.com", ["Andreessen Horowitz"]],
    ["founders-fund", "Founders Fund", "foundersfund.com"],
    ["lux", "Lux", "luxcapital.com", ["Lux Capital"]],
    ["menlo-ventures", "Menlo", "menlovc.com", ["Menlo Ventures"]],
    ["nea", "NEA", "nea.com"],
    ["lightspeed", "Lightspeed", "lsvp.com"],
    ["sequoia", "Sequoia", "sequoiacap.com", ["Sequoia Capital"]],
    ["bessemer", "Bessemer", "bvp.com", ["Bessemer Venture Partners"]],
    ["first-round", "First Round", "firstround.com", ["First Round Capital"]],
    ["battery", "Battery", "battery.com", ["Battery Ventures"]],
    ["kleiner-perkins", "Kleiner Perkins", "kleinerperkins.com"],
    ["accel", "Accel", "accel.com"],
    ["redpoint", "Redpoint", "redpoint.com"],
    ["bain-capital-ventures", "Bain Capital Ventures", "baincapitalventures.com"],
    ["general-catalyst", "General Catalyst", "generalcatalyst.com"],
    ["benchmark", "Benchmark", "benchmark.com"],
    ["coatue", "Coatue", "coatue.com"],
    ["greenoaks", "Greenoaks", "greenoaks.com"],
    ["spark", "Spark", "sparkcapital.com", ["Spark Capital"]],
    ["crv", "CRV", "crv.com"],
    ["khosla", "Khosla", "khoslaventures.com", ["Khosla Ventures"]],
    ["norwest", "Norwest", "norwest.com", ["Norwest Venture Partners"]],
    ["thrive", "Thrive", "thrivecap.com", ["Thrive Capital"]],
    ["usv", "USV", "usv.com", ["Union Square Ventures"]],
    ["ribbit", "Ribbit", "ribbitcap.com", ["Ribbit Capital"]],
    ["index", "Index", "indexventures.com", ["Index Ventures"]],
    ["greylock", "Greylock", "greylock.com"],
    ["8vc", "8VC", "8vc.com"],
    ["ivp", "IVP", "ivp.com"],
    ["greycroft", "Greycroft", "greycroft.com"],
    // 燈 (Akari Inc.), Aster's largest shareholder since Sep 2026; domain unverified.
    ["akari", "Akari", null],
    // Lead investors of the robot-actuator startups added Nov 2026; domains unverified.
    ["addor-capital", "Addor Capital", null],
    ["beijing-ai-fund", "Beijing AI Industry Investment Fund", null],
    ["huatai-zijin", "Huatai Zijin", null],
    ["cowin-capital", "Cowin Capital", null],
    ["shunwei", "Shunwei Capital", null],
    ["htgf", "HTGF", null, ["High-Tech Gründerfonds"]],
    ["aria", "ARIA", null, ["Advanced Research and Invention Agency"]],
    ["hongshan", "HongShan", null, ["HongShan Seed"]],
    ["futureplay", "Futureplay", null],
    ["younick-mint", "YouNick Mint", null],
];

// Affiliations of the people on /people (src/people/orgs.ts) not listed
// above, keyed by the org id. Domains are each org's own site as cited in
// that registry; the Association of China Rare Earth Industry has no verified
// site of its own, so it stays a monogram.
const PEOPLE_ORGS: Row[] = [
    ["mit", "MIT", "mit.edu", ["Massachusetts Institute of Technology"]],
    ["notre-dame", "University of Notre Dame", "nd.edu"],
    ["mpi-is", "Max Planck Institute for Intelligent Systems", "is.mpg.de"],
    ["ut-dallas", "UT Dallas", "utdallas.edu"],
    ["oregon-state", "Oregon State University", "oregonstate.edu"],
    ["dlr", "DLR", "dlr.de"],
    ["mbzuai", "MBZUAI", "mbzuai.ac.ae"],
    ["science-tokyo", "Institute of Science Tokyo", "isct.ac.jp"],
    ["kaist", "KAIST", "kaist.ac.kr"],
    ["ihmc", "IHMC", "ihmc.us"],
    ["rai-institute", "RAI Institute", "rai-inst.com"],
    ["toyota-research-institute", "Toyota Research Institute", "tri.global"],
    ["meta", "Meta", "meta.com"],
    ["persona-ai", "Persona AI", "personainc.ai"],
    ["clone-robotics", "Clone Robotics", "clonerobotics.com"],
    ["general-motors", "General Motors", "gm.com", ["GM"]],
    ["vac", "VACUUMSCHMELZE (VAC)", "vacuumschmelze.com", ["eVAC Magnetics"]],
    ["energy-fuels", "Energy Fuels", "energyfuels.com"],
    ["adamas", "Adamas Intelligence", "adamasintel.com"],
    ["csis", "CSIS", "csis.org"],
    ["ames-lab", "Ames National Laboratory (CMI)", "ameslab.gov"],
    ["iea", "IEA", "iea.org", ["International Energy Agency"]],
    ["china-rare-earth-assoc", "Association of China Rare Earth Industry", null],
    ["benchmark-minerals", "Benchmark Mineral Intelligence", "benchmarkminerals.com"],
    ["u-montana", "University of Montana", "umt.edu"],
    ["colorado-mines", "Colorado School of Mines", "mines.edu"],
];

const host = (url: string): string => new URL(url).hostname.replace(/^www\./, "");

// /startups rows carry their own site and, usually, a self-hosted logo. A
// startup the catalog already lists as a maker (RobStride, MyActuator) keeps
// that entry, so ids stay unique.
const MAKER_IDS = new Set(MAKERS.map(([id]) => id));
const STARTUP_ENTRIES: BrandEntry[] = STARTUPS.filter((s) => !MAKER_IDS.has(s.id)).map(
    (s) => ({
        id: s.id,
        name: s.name,
        domain: s.url ? host(s.url) : null,
        ...(s.logo ? { logo: s.logo } : {}),
    }),
);

// Official marks served from frontend/public/logos/brands, each with the page
// it came from (company site, its GitHub org, Wikimedia or simple-icons). They
// win over the logo provider, so these render without a provider token.
const SELF_HOSTED = new Map(
    (selfHosted as { id: string; logo: string; tile?: "light" }[]).map((r) => [
        r.id,
        r,
    ]),
);

// Dark logos that need a pale tile to read on black (checked by eye).
const LIGHT_TILE = new Set(["ivp", "benchmark"]);

const fromRow = ([id, name, domain, aliases]: Row): BrandEntry => {
    const own = SELF_HOSTED.get(id);
    return {
        id,
        name,
        domain,
        ...(aliases ? { aliases } : {}),
        ...(own ? { logo: own.logo } : {}),
        ...(LIGHT_TILE.has(id) || own?.tile === "light"
            ? { tile: "light" as const }
            : {}),
    };
};

export const BRANDS: BrandEntry[] = [
    ...STARTUP_ENTRIES,
    ...[
        ...MAKERS,
        ...ROBOT_MAKERS,
        ...HUMANOID_MAKERS,
        ...SUPPLY_CHAIN,
        ...PORTFOLIO,
        ...INVESTORS,
        ...PEOPLE_ORGS,
    ].map(fromRow),
];

// Lowercase, drop a parenthetical ("Robotis (Dynamixel)"), collapse punctuation.
export function normalizeBrand(name: string): string {
    return name
        .toLowerCase()
        .replace(/\s*\(.*?\)\s*/g, " ")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

const INDEX = new Map<string, BrandEntry>();
for (const b of BRANDS) {
    for (const key of [b.id, b.name, ...(b.aliases ?? [])]) {
        const k = normalizeBrand(key);
        // Non-Latin spellings normalise to "", which would match any blank name.
        if (k && !INDEX.has(k)) INDEX.set(k, b);
    }
}

// Resolve an id or any dataset spelling to its entry: exact id or name first,
// then the catalog's canonical maker name ("CubeMars (T-Motor)" -> CubeMars).
export function resolveBrand(nameOrId: string): BrandEntry | undefined {
    return (
        INDEX.get(normalizeBrand(nameOrId)) ??
        INDEX.get(normalizeBrand(canonicalBrand(nameOrId)))
    );
}

// Up to two initials for the monogram fallback ("Harmonic Drive" -> "HD").
export function brandInitials(name: string): string {
    const words = name
        .replace(/\s*\(.*?\)\s*/g, " ")
        .split(/[\s/-]+/)
        .filter(Boolean);
    const first = words[0] ?? "";
    const letters =
        words.length > 1 ? words.map((w) => w[0]).join("") : first.slice(0, 2);
    return letters.slice(0, 2).toUpperCase();
}

const TOKEN = /^pk_[A-Za-z0-9_-]{4,128}$/;
const DOMAIN = /^[a-z0-9.-]+\.[a-z]{2,}$/;

export type LogoTheme = "dark" | "light";

// The one place that knows the logo provider: Logo.dev's image CDN, hotlinked
// (never downloaded or committed). `retina` serves 2x pixels for HiDPI, and
// `fallback=404` makes a missing logo an error so the caller draws a monogram.
// The token is Logo.dev's publishable key (pk_...), public by design.
export function logoUrl(
    domain: string,
    size: number,
    token: string,
    theme: LogoTheme = "dark",
): string | null {
    if (!TOKEN.test(token) || !DOMAIN.test(domain)) return null;
    const q = new URLSearchParams({
        token,
        size: String(Math.round(size)),
        format: "png",
        theme,
        retina: "true",
        fallback: "404",
    });
    return `https://img.logo.dev/${domain}?${q}`;
}
