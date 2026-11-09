import type { SourceReuse } from "../reuse";

// Sources behind the /japan dataset: company sites for headquarters and
// plants, results releases and financial summaries for revenue and gross
// margin, and press for supply links. Read on the day the dataset was built.

// Structural copy of SourceRef: importing the type from ../sources would make
// an import cycle, since ../sources spreads this list into SOURCES.
type Kind =
    | "government"
    | "filing"
    | "industry-report"
    | "press"
    | "company-site"
    | "reference";

interface JapanSource {
    id: string;
    title: string;
    publisher: string;
    url: string;
    accessed?: string;
    kind: Kind;
    reuse: SourceReuse;
}

const ACCESSED = "2026-11-03";

// Never opened: the robot-joint actuator releases from NSK, Nidec,
// MinebeaMitsumi and Mabuchi Motor were read through search results only,
// because the session could not reach those hosts. They carry no `accessed`
// date; open each and move it out of this set when checked.
export const JAPAN_UNOPENED: ReadonlySet<string> = new Set([
    "nsk-robotics-actuators-2025",
    "nsk-actuators-review-2026",
    "response-nsk-actuators-2025",
    "nidec-physical-ai",
    "minebea-ces-2026",
    "minebea-humanoid-page",
    "mabuchi-site",
    "mabuchi-iaib-series",
    "mabuchi-iaib-release-2022",
]);

function src(
    id: string,
    publisher: string,
    title: string,
    url: string,
    kind: Kind,
    reuse: SourceReuse = "facts",
): JapanSource {
    const s: JapanSource = { id, publisher, title, url, kind, reuse };
    return JAPAN_UNOPENED.has(id) ? s : { ...s, accessed: ACCESSED };
}

const site = (id: string, publisher: string, url: string, title = publisher) =>
    src(id, publisher, `${title} corporate site`, url, "company-site");

const summary = (id: string, publisher: string, company: string, url: string) =>
    src(id, publisher, `${company}: financial summary`, url, "reference");

export const JAPAN_SOURCES: JapanSource[] = [
    // Results and financial summaries
    src(
        "fanuc-results-fy2025",
        "FANUC",
        "Reference materials: results for the year ended March 31, 2026",
        "https://www.fanuc.co.jp/en/ir/announce/pdf/2026/reference202603_e.pdf",
        "filing",
    ),
    summary(
        "stockanalysis-fanuc",
        "Stock Analysis",
        "FANUC (TYO:6954) income statement",
        "https://stockanalysis.com/quote/tyo/6954/financials/income-statement/",
    ),
    src(
        "yaskawa-results-fy2025",
        "Yaskawa Electric",
        "Consolidated results for the fiscal year ended February 28, 2026 (IFRS)",
        "https://www.yaskawa-global.com/wp-content/uploads/2026/04/20260410_en.pdf",
        "filing",
    ),
    summary(
        "envalith-yaskawa",
        "Envalith",
        "Yaskawa Electric (6506)",
        "https://envalith.com/en/companies/6506",
    ),
    summary(
        "envalith-hds",
        "Envalith",
        "Harmonic Drive Systems (6324)",
        "https://envalith.com/en/companies/6324",
    ),
    summary(
        "envalith-nabtesco",
        "Envalith",
        "Nabtesco (6268)",
        "https://envalith.com/en/companies/6268",
    ),
    src(
        "thk-results-fy2025",
        "THK",
        "FY2025 fourth-quarter financial summary",
        "https://www.thk.com/jp/wordpress/wp-content/uploads/2026/02/FY2025_4Q_en.pdf",
        "filing",
    ),
    summary(
        "stockanalysis-thk",
        "Stock Analysis",
        "THK (TYO:6481) income statement",
        "https://stockanalysis.com/quote/tyo/6481/financials/income-statement/",
    ),
    src(
        "nidec-results-fy2025",
        "Nidec via Business Wire",
        "Nidec announces financial results for fiscal year ended March 31, 2026",
        "https://www.webull.com/news/15672822030222336",
        "press",
    ),
    summary(
        "envalith-shinetsu",
        "Envalith",
        "Shin-Etsu Chemical (4063)",
        "https://envalith.com/en/companies/4063",
    ),
    src(
        "tdk-results-fy2025",
        "TDK",
        "Results for the fiscal year ended March 31, 2026",
        "https://www.tdk.com/system/files/20264q_0mqf56xw_en.pdf",
        "filing",
    ),
    summary(
        "envalith-nsk",
        "Envalith",
        "NSK (6471)",
        "https://envalith.com/en/companies/6471",
    ),
    summary(
        "simplywall-nsk",
        "Simply Wall St",
        "NSK (TSE:6471)",
        "https://www.simplywall.st/stock/TSE/6471",
    ),
    summary(
        "stockanalysis-ntn",
        "Stock Analysis",
        "NTN (TYO:6472) income statement",
        "https://stockanalysis.com/quote/tyo/6472/financials/income-statement/",
    ),
    summary(
        "stockanalysis-iko",
        "Stock Analysis",
        "Nippon Thompson (TYO:6480) income statement",
        "https://stockanalysis.com/quote/tyo/6480/financials/income-statement/",
    ),
    summary(
        "stockopedia-sanyo-denki",
        "Stockopedia",
        "Sanyo Denki (TYO:6516) income statement",
        "https://www.stockopedia.com/share-prices/sanyo-denki-co-TYO:6516/income-statement/",
    ),
    // Stage shares
    src(
        "rem-shin-etsu-2026",
        "Rare Earth Mining",
        "Shin-Etsu rare earth: magnets, refining and Japan's share",
        "https://rare-earth-mining.com/shin-etsu-rare-earth/",
        "press",
    ),
    src(
        "ifr-japan-2024",
        "International Federation of Robotics",
        "World Robotics 2024: Japan press release",
        "https://ifr.org/downloads/press2018/2024-SEP-24_IFR_press_release_World_Robotics_2024_-_Japan.pdf",
        "industry-report",
    ),
    // Company sites: headquarters, plants and products
    src(
        "fanuc-production",
        "FANUC",
        "Production: factories in Japan",
        "https://fanuc.co.jp/en/profile/production",
        "company-site",
    ),
    src(
        "thk-history",
        "THK",
        "Company history",
        "https://www.thk.com/jp/en/company/history/detail",
        "company-site",
    ),
    src(
        "thk-yamagata",
        "THK",
        "Production base: Yamagata",
        "https://www.thk.com/in/en/company/overseas_production_base/yamagata/",
        "company-site",
    ),
    src(
        "hd-llc-about",
        "Harmonic Drive LLC",
        "About us",
        "https://global.harmonicdrive.net/about-us",
        "company-site",
    ),
    src(
        "hyogo-santoku",
        "Hyogo Prefecture",
        "Only-one companies of Hyogo: Santoku Corporation",
        "https://web.pref.hyogo.lg.jp/sr07/onlyone/documents/santokucorporation.pdf",
        "government",
    ),
    site("jogmec-site", "JOGMEC", "https://www.jogmec.go.jp/english/"),
    site("sojitz-site", "Sojitz", "https://www.sojitz.com/en/"),
    site(
        "toyota-tsusho-site",
        "Toyota Tsusho",
        "https://www.toyota-tsusho.com/english/",
    ),
    site("iwatani-site", "Iwatani", "https://www.iwatani.co.jp/eng/"),
    site("proterial-site", "Proterial", "https://www.proterial.com/e/"),
    site("tdk-site", "TDK", "https://www.tdk.com/en/"),
    site("daido-site", "Daido Steel", "https://www.daido.co.jp/en/"),
    site("melco-site", "Mitsubishi Electric", "https://www.mitsubishielectric.com/fa/"),
    site("tamagawa-site", "Tamagawa Seiki", "https://www.tamagawa-seiki.com/"),
    site("oriental-site", "Oriental Motor", "https://www.orientalmotor.com/"),
    site("sanyo-denki-site", "Sanyo Denki", "https://www.sanyodenki.com/"),
    site("shinano-site", "Shinano Kenshi", "https://www.shinano.com/"),
    site("shi-site", "Sumitomo Heavy Industries", "https://www.shi.co.jp/english/"),
    site("nsk-site", "NSK", "https://www.nsk.com/"),
    site("ntn-site", "NTN", "https://www.ntnglobal.com/en/"),
    site("jtekt-site", "JTEKT", "https://www.jtekt.co.jp/e/"),
    site("iko-site", "Nippon Thompson", "https://www.ikont.co.jp/eg/", "IKO"),
    site("minebea-site", "MinebeaMitsumi", "https://www.minebeamitsumi.com/english/"),
    site("mabuchi-site", "Mabuchi Motor", "https://www.mabuchi-motor.com/"),
    // Robot-joint actuator releases (Nov 2026), read through search results
    src(
        "nsk-robotics-actuators-2025",
        "NSK",
        "Development of actuators for the robotics field (Japanese release, November 6, 2025)",
        "https://www.nsk.com/jp-ja/company/news/2025/robotics-actuators/",
        "press",
    ),
    src(
        "nsk-actuators-review-2026",
        "NSK",
        "NSK Technical Review 2026: actuators for robots",
        "https://www.nsk.com/tools-resources/research-and-development/technical-review/2026/actuators-for-robots/",
        "company-site",
    ),
    src(
        "response-nsk-actuators-2025",
        "Response",
        "NSK develops actuators for humanoid robots, targets 2028 market entry",
        "https://response.jp/article/2025/11/10/403251.html",
        "press",
    ),
    src(
        "nidec-physical-ai",
        "Nidec",
        "Nidec's comprehensive capabilities powering humanoids",
        "https://www.nidec.com/en/technology/physical-ai/",
        "company-site",
    ),
    src(
        "minebea-ces-2026",
        "MinebeaMitsumi",
        "MinebeaMitsumi to exhibit at CES 2026 for the first time",
        "https://www.minebeamitsumi.com/english/news/press/2025/1210639_20344.html",
        "press",
    ),
    src(
        "minebea-humanoid-page",
        "MinebeaMitsumi",
        "Precision technology powering the evolution of humanoid robots",
        "https://product.minebeamitsumi.com/en/pickup/humanoidrobot/index.html",
        "company-site",
    ),
    src(
        "mabuchi-iaib-series",
        "Mabuchi Motor",
        "Hollow frameless motors IA/IB series",
        "https://solution.mabuchi-motor.com/en/products/iaib_series",
        "company-site",
    ),
    src(
        "mabuchi-iaib-release-2022",
        "Mabuchi Motor via Nikkan Kogyo Shimbun",
        "Sales start for the hollow IA/IB motor module series",
        "https://www.nikkan.co.jp/releases/view/137521",
        "press",
    ),
    site("tsubaki-site", "Tsubakimoto Chain", "https://www.tsubakimoto.com/"),
    site("khi-site", "Kawasaki Heavy Industries", "https://global.kawasaki.com/"),
    site("denso-wave-site", "Denso Wave", "https://www.denso-wave.com/en/"),
    site("epson-site", "Seiko Epson", "https://corporate.epson/en/"),
    site("nachi-site", "Nachi-Fujikoshi", "https://www.nachi-fujikoshi.co.jp/eng/"),
    site("mujin-site", "Mujin", "https://mujin.co.jp/en/"),
    site("kawada-site", "Kawada Robotics", "https://www.kawadarobot.co.jp/"),
    site("honda-site", "Honda", "https://global.honda/en/"),
    site("toyota-site", "Toyota Motor", "https://global.toyota/en/"),
    site("yamaha-site", "Yamaha Motor", "https://global.yamaha-motor.com/"),
    site("omron-site", "OMRON", "https://www.omron.com/global/en/"),
    site("smc-site", "SMC", "https://www.smcworld.com/"),
    site("iai-site", "IAI", "https://www.intelligentactuator.com/"),
    site("shibaura-site", "Shibaura Machine", "https://www.shibaura-machine.co.jp/en/"),
    site("lynas-site", "Lynas Rare Earths", "https://lynasrareearths.com/"),
    site("irel-site", "IREL (India)", "https://www.irel.co.in/"),
    site("resonac-site", "Resonac", "https://www.resonac.com/"),
    site("aichi-steel-site", "Aichi Steel", "https://www.aichi-steel.co.jp/ENGLISH/"),
    site("kuka-site", "KUKA", "https://www.kuka.com/"),
    site("abb-site", "ABB", "https://new.abb.com/"),
    site("neo-site", "Neo Performance Materials", "https://www.neomaterials.com/"),
    src(
        "omron-techman-2021",
        "OMRON",
        "OMRON invests in collaborative robot company Techman Robot",
        "https://www.omron.com/global/en/media/2021/10/c1025.html",
        "company-site",
    ),
    src(
        "toyota-tri-atlas-2025",
        "Toyota Motor North America",
        "AI-powered robot by Boston Dynamics and Toyota Research Institute takes a key step towards general-purpose humanoids",
        "https://pressroom.toyota.com/ai-powered-robot-by-boston-dynamics-and-toyota-research-institute-takes-a-key-step-towards-general-purpose-humanoids/",
        "company-site",
    ),
    src(
        "techxplore-honda-magnet-2016",
        "Tech Xplore",
        "Hybrid car motor uses no heavy rare earth, uses light rare earth element",
        "https://techxplore.com/news/2016-07-hybrid-car-motor-heavy-rare.html",
        "press",
    ),
    src(
        "mobilityeng-honda-magnet-2016",
        "Mobility Engineering Technology (SAE)",
        "Honda's new e-motor magnet aims to mitigate China rare-earth monopoly",
        "https://www.mobilityengineeringtech.com/component/content/article/42704-sae-ma-01959",
        "press",
    ),
    // Supply links and company news
    src(
        "argus-lynas-japan-2023",
        "Argus Media",
        "Japan's Sojitz, JOGMEC secure Lynas rare earth supplies",
        "https://www.argusmedia.com/en/news-and-insights/latest-market-news/2427079-japan-s-sojitz-jogmec-secure-lynas-rare-earth-supplies",
        "press",
    ),
    src(
        "miningweekly-lynas-japan-2026",
        "Mining Weekly",
        "Lynas revamps deal to supply rare earths to Japan",
        "https://www.miningweekly.com/article/lynas-revamps-deal-to-supply-rare-earths-to-japan-2026-03-10",
        "press",
    ),
    src(
        "kitco-sojitz-hree-2025",
        "Kitco (Reuters)",
        "Japan's Sojitz begins importing heavy rare earths from Australia",
        "https://www.kitco.com/news/off-the-wire/2025-10-30/japans-sojitz-begins-importing-heavy-rare-earths-australia",
        "press",
    ),
    src(
        "smm-lynas-jare-2026",
        "SMM",
        "Lynas and JARE sign long-term rare earth supply deal with floor price and profit sharing",
        "https://news.metal.com/newscontent/103808279",
        "press",
    ),
    src(
        "argus-caremag-2025",
        "Argus Media",
        "Japanese firms invest in French rare earths producer",
        "https://www.argusmedia.com/en/news-and-insights/latest-market-news/2668346-japanese-firms-invest-in-french-rare-earths-producer",
        "press",
    ),
    src(
        "meti-caremag-2025",
        "METI",
        "Support for a heavy rare earth project in France (Caremag)",
        "https://www.meti.go.jp/english/press/2025/0317_002.html",
        "government",
        // METI publishes under Japan's CC BY compatible government terms.
        "open",
    ),
    src(
        "noveon-nidec-2025",
        "Noveon Magnetics",
        "Nidec and Noveon Magnetics enter off-take agreement for rare earth magnets",
        "https://noveon.co/nidec-and-noveon-magnetics-enter-agreement",
        "company-site",
    ),
    src(
        "justauto-honda-daido-2016",
        "Just Auto",
        "Honda and Daido develop high-performance magnet for electric drive applications",
        "https://www.just-auto.com/news/honda-and-daido-develop-high-performance-magnet-for-electric-drive-applications",
        "press",
    ),
    src(
        "toyota-thr3-2017",
        "Toyota Motor",
        "Toyota unveils third generation humanoid robot T-HR3",
        "https://global.toyota/en/detail/19666346",
        "company-site",
    ),
    src(
        "technews-nabtesco-2018",
        "TechNews",
        "Nabtesco: how a Japanese gear maker leads the world market (in Chinese)",
        "https://finance.technews.tw/2018/03/24/nabtesco-robot-tech/",
        "press",
    ),
    src(
        "mujin-prize-2020",
        "Mujin",
        "The Prime Minister's Award of the Japan Open Innovation Prize",
        "https://mujinspire.mujin.co.jp/en/2020/02/the-prime-ministers-award-of-japan-open-innovation-prize",
        "company-site",
    ),
    src(
        "techcrunch-mujin-2023",
        "TechCrunch",
        "Robot software firm Mujin raises $85M",
        "https://techcrunch.com/2023/09/05/robot-software-firm-mujin-raises-85m/",
        "press",
    ),
    src(
        "kitco-irel-japan-2025",
        "Kitco (Reuters)",
        "India's IREL seeks Japan, South Korea partnerships for rare earth magnet production",
        "https://www.kitco.com/news/off-the-wire/2025-08-18/indias-irel-seeks-japan-south-korea-partnerships-rare-earth-magnet",
        "press",
    ),
    src(
        "metalpowder-proterial-2026",
        "Metal Powder Tech",
        "Proterial unveils heavy-rare-earth-free neodymium magnets for EV drive motors",
        "https://www.metal-powder.tech/?p=283292",
        "press",
    ),
    src(
        "gendai-neomax",
        "Gendai Business",
        "NEOMAX and the Japanese magnet industry (in Japanese)",
        "https://gendai.media/articles/-/154340",
        "press",
    ),
    src(
        "magneticsmag-tdk-showa",
        "Magnetics Magazine",
        "TDK acquires neodymium magnet alloy R&D business of Showa Denko",
        "https://magneticsmag.com/?p=11560",
        "press",
    ),
];

// An UNOPENED id that names no source (a typo, or a renamed source) would
// leave a search-result-only document dated as opened.
export function japanUnopenedSourceErrors(
    sources: readonly JapanSource[] = JAPAN_SOURCES,
): string[] {
    const ids = new Set(sources.map((s) => s.id));
    return [...JAPAN_UNOPENED]
        .filter((id) => !ids.has(id))
        .map((id) => `japan sources: unopened id "${id}" names no source`);
}
