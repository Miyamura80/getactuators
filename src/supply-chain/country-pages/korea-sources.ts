import type { SourceReuse } from "../reuse";

// Sources behind the /korea dataset: company sites and filings for
// headquarters and plants, trade press for products, and deal announcements
// for supply links. Every figure was read from search results, so no source
// carries an `accessed` date (see SourceRef in ../sources).

// Structural copy of SourceRef: importing the type from ../sources would make
// an import cycle, since ../sources spreads this list into SOURCES.
type Kind =
    | "government"
    | "filing"
    | "industry-report"
    | "press"
    | "company-site"
    | "reference";

interface KoreaSource {
    id: string;
    title: string;
    publisher: string;
    url: string;
    kind: Kind;
    reuse: SourceReuse;
}

function src(
    id: string,
    publisher: string,
    title: string,
    url: string,
    kind: Kind,
    reuse: SourceReuse = "facts",
): KoreaSource {
    return { id, publisher, title, url, kind, reuse };
}

const press = (id: string, publisher: string, title: string, url: string) =>
    src(id, publisher, title, url, "press");

const ref = (id: string, publisher: string, title: string, url: string) =>
    src(id, publisher, title, url, "reference");

export const KOREA_SOURCES: KoreaSource[] = [
    // Statistics
    src(
        "ifr-world-robotics-2025",
        "International Federation of Robotics",
        "World Robotics 2025: global robot demand in factories doubles over 10 years",
        "https://ifr.org/ifr-press-releases/news/global-robot-demand-in-factories-doubles-over-10-years",
        "industry-report",
    ),
    // Rare earths, stockpiles and materials
    ref(
        "wiki-korea-zinc",
        "Wikipedia",
        "Korea Zinc",
        "https://en.wikipedia.org/wiki/Korea_Zinc",
    ),
    press(
        "joongang-korea-zinc-tn-2025",
        "Korea JoongAng Daily",
        "Korea Zinc to build $7.4B smelter in Tennessee in rare partnership with Washington",
        "https://www.koreajoongangdaily.com/business/korea-zinc-to-build-74b-smelter-in-tennessee-in-rare-partnership-with-washington/11936990",
    ),
    press(
        "spglobal-crucible-zinc-2026",
        "S&P Global Commodity Insights",
        "Korea Zinc launches Crucible Zinc to build US critical metals smelter",
        "https://spglobal.com/energy/en/news-research/latest-news/metals/040226-korea-zinc-launches-crucible-zinc-to-build-us-critical-metals-smelter",
    ),
    press(
        "mtn-komir-2026",
        "MTN",
        "KOMIR moves to lift limits on overseas resource development",
        "https://news.mtn.co.kr/news-detail/2026091113380673131",
    ),
    press(
        "kedglobal-komir-gunsan-2023",
        "The Korea Economic Daily",
        "POSCO conducts pilot release of rare metal ferrochrome",
        "https://www.kedglobal.com/newsView/ked202304140012",
    ),
    press(
        "jjan-saemangeum-stockpile-2023",
        "Jeonbuk Ilbo",
        "Saemangeum critical mineral stockpile base gathers pace with KOMIR investment",
        "https://www.jjan.kr/articleAmp/20231221580276",
    ),
    press(
        "ajunews-stockpile-base-2024",
        "Aju News",
        "Industry ministry and KOMIR start building a dedicated critical mineral stockpile base",
        "https://www.ajunews.com/view/20240326103144949",
    ),
    press(
        "gmr-arafura-komir-2022",
        "Global Mining Review",
        "Joint statement of cooperation between Arafura and KOMIR",
        "https://www.globalminingreview.com/finance-business/02032022/joint-statement-of-cooperation-between-arafura-and-komir/",
    ),
    press(
        "metalpowder-asm-komir",
        "Metal Powder Tech",
        "ASM and KOMIR cooperate to expand the use of rare earths and critical metals in Korea",
        "https://www.metal-powder.tech/?p=273453",
    ),
    press(
        "kitco-arafura-hyundai-2022",
        "Kitco News",
        "Arafura signs binding offtake with Hyundai and Kia",
        "https://www.kitco.com/news/article/2022-11-07/arafura-signs-binding-offtake-hyundai-and-kia",
    ),
    src(
        "nt-arafura-nolans",
        "Northern Territory Government",
        "Major milestone for Arafura Resources",
        "https://invest.nt.gov.au/news-and-insights/major-milestone-for-arafura-resources",
        "government",
    ),
    press(
        "magneticsmag-asm-kmp",
        "Magnetics Magazine",
        "ASM produces neo metal and alloy at new plant in South Korea",
        "https://magneticsmag.com/asm-produces-neo-metal-alloy-at-new-plant-in-south-korea-while-progressing-on-rare-earths-mine-site-in-australia/",
    ),
    press(
        "placera-energy-fuels-asm-2026",
        "Placera (Energy Fuels release)",
        "Energy Fuels completes acquisition of Australian Strategic Materials",
        "https://www.placera.se/pressmeddelanden/energy-fuels-completes-acquisition-of-australian-strategic-materials-20260828",
    ),
    press(
        "miningweekly-asm-noveon-2023",
        "Mining Weekly",
        "ASM signs offtake deal with US' Noveon",
        "https://www.miningweekly.com/article/asm-signs-offtake-deal-with-us-noveon-2023-05-16",
    ),
    press(
        "investornews-asm-sales-2025",
        "InvestorNews (ASM release)",
        "Growing momentum in metal and alloy sales",
        "https://investornews.com/member_news/growing-momentum-in-metal-and-alloy-sales/",
    ),
    press(
        "smallcaps-asm-sales-2025",
        "Small Caps",
        "Australian Strategic Materials builds momentum with rare earth sales from Korean facility to US and EU magnet-makers",
        "https://smallcaps.com.au/article/australian-strategic-materials-rare-earth-sales-korea-us-eu-magnet-makers",
    ),
    src(
        "vac-sustainability-statement",
        "VACUUMSCHMELZE",
        "A statement for sustainability",
        "https://vacuumschmelze.com/01_Pictures/Sustainability/VAC%20Sustainability%20Statement.pdf",
        "company-site",
    ),
    src(
        "vac-press-cyclic-2025",
        "VACUUMSCHMELZE",
        "Cyclic Materials and VACUUMSCHMELZE expand partnership",
        "https://vacuumschmelze.de/Unternehmen/Pressemeldungen/cyclic-materials-and-vacuumschmelze-expand-partnership-n2849",
        "company-site",
    ),
    press(
        "australianmining-asm-2025",
        "Australian Mining",
        "ASM builds rare earths momentum",
        "https://www.australianmining.com.au/asm-builds-rare-earths-momentum/",
    ),
    press(
        "miningcomau-asm-neo-2025",
        "Mining.com.au",
        "Australian Strategic marks maiden rare earths sale",
        "https://mining.com.au/australian-strategic-marks-maiden-rare-earths-sale/",
    ),
    press(
        "koreaherald-posco-intl-hq",
        "The Korea Herald",
        "Posco International's headquarters in Songdo, Incheon",
        "https://www.koreaherald.com/article/10566805",
    ),
    src(
        "posco-newsroom-motor-cores",
        "POSCO Newsroom",
        "POSCO International completes its global drive motor core production network",
        "https://newsroom.posco.com/en/?p=27547",
        "company-site",
    ),
    press(
        "kedglobal-posco-cores-hyundai-2024",
        "The Korea Economic Daily",
        "POSCO Int'l to supply motor cores to Hyundai, Kia in Europe",
        "https://www.kedglobal.com/newsView/ked202401180002",
    ),
    press(
        "kedglobal-posco-star-2023",
        "The Korea Economic Daily",
        "POSCO Int'l to build permanent magnet factory in US with Star Group",
        "https://www.kedglobal.com/newsView/ked202310030002",
    ),
    press(
        "kedglobal-posco-magnets-2024",
        "The Korea Economic Daily",
        "POSCO International secures permanent magnet supply deals for the US and Europe",
        "https://amp.kedglobal.com/newsView/ked202403120010",
    ),
    press(
        "metaltechnews-reelement-posco-2025",
        "Metal Tech News",
        "ReElement, POSCO sign rare earth offtake",
        "https://www.metaltechnews.com/story/2025/10/01/tech-bytes/reelement-posco-sign-rare-earth-offtake/2496.html",
    ),
    press(
        "nasdaq-reelement-posco-jv-2026",
        "Nasdaq (ReElement release)",
        "ReElement Technologies and POSCO International form joint venture to develop integrated rare earth and magnet complex",
        "https://www.nasdaq.com/press-release/reelement-technologies-and-posco-international-form-joint-venture-develop-integrated",
    ),
    press(
        "barchart-reelement-noblesville",
        "Barchart (ReElement release)",
        "ReElement Technologies expands rare earth production at its Noblesville facility",
        "https://www.barchart.com/story/news/30980934/reelement-technologies-expands-rare-earth-production-at-its-noblesville-in-facility-while-advancing-large-scale-marion-expansion",
    ),
    press(
        "miningweekly-lynas-ls-2026",
        "Mining Weekly",
        "Lynas agrees potential rare earths deal with South Korea's LS Eco Energy",
        "https://www.miningweekly.com/article/lynas-agrees-potential-rare-earths-deal-with-south-koreas-ls-eco-energy-2026-03-26",
    ),
    press(
        "technode-ls-samarium-2026",
        "TechNode Global",
        "South Korea's LS Eco Energy to invest $8m in Vietnam rare earth samarium plant",
        "https://technode.global/2026/09/30/south-koreas-ls-eco-energy-to-invest-8m-in-vietnam-rare-earth-samarium-plant/",
    ),
    ref(
        "yahoo-ls-eco-energy",
        "Yahoo Finance",
        "LS Eco Energy (229640.KS) company profile",
        "https://sg.finance.yahoo.com/quote/229640.KS/profile",
    ),
    // Magnets and motors
    press(
        "magneticsmag-star-group",
        "Magnetics Magazine",
        "Korean magnet manufacturer Star Group rises in prominence",
        "https://magneticsmag.com/korean-magnet-manufacturer-star-group-rises-in-prominence/",
    ),
    press(
        "bd-lg-innotek-2025",
        "Boston Dynamics",
        "Boston Dynamics and LG Innotek enter into new collaboration",
        "https://bostondynamics.com/news/boston-dynamics-lg-innotek-enter-into-new-collaboration/",
    ),
    press(
        "koreaherald-lg-innotek-figure-2025",
        "The Korea Herald",
        "Samsung, LG eye first-mover edge in robotics camera modules",
        "https://www.koreaherald.com/article/10516324",
    ),
    press(
        "donga-lg-innotek-ces-2026",
        "Dong-A Ilbo",
        "LG Innotek chief sees KRW hundreds billion in robot sales",
        "https://dbr.donga.com/kfocus/view/en/article_no/1595",
    ),
    press(
        "investing-semco-optimus-2025",
        "Investing.com",
        "Samsung to supply camera modules for Tesla's Optimus bots (report)",
        "https://au.investing.com/news/stock-market-news/samsung-to-supply-camera-modules-for-teslas-optimus-bots--report-93CH-3956295",
    ),
    ref(
        "wiki-figure-ai",
        "Wikipedia",
        "Figure AI",
        "https://en.wikipedia.org/wiki/Figure_AI",
    ),
    press(
        "daum-lg-innotek-robots-2026",
        "Daum (news)",
        "From iPhones to humanoids: LG Innotek bets big on robotics and AI",
        "https://v.daum.net/v/20260331090822627",
    ),
    press(
        "koreaherald-lg-innotek-gumi",
        "The Korea Herald",
        "LG Innotek's plant in Gumi, North Gyeongsang Province",
        "https://www.koreaherald.com/article/10449620",
    ),
    press(
        "digitaltoday-lg-innotek-gwangju",
        "Digital Today",
        "LG Innotek to invest 100 billion won in Gwangju plant",
        "https://www.digitaltoday.co.kr/jp/view/40053/lg-innotek-to-invest-100-billion-won-in-gwangju-plant",
    ),
    src(
        "semco-locations",
        "Samsung Electro-Mechanics",
        "Samsung Electro-Mechanics global network",
        "https://samsungsem.com/global/about-us/company/location.do",
        "company-site",
    ),
    press(
        "ie-samsung-humanoid",
        "Interesting Engineering",
        "Samsung eyes humanoid robot market",
        "https://interestingengineering.com/innovation/samsung-eyes-humanoid-robot-market",
    ),
    ref(
        "craft-higen-rnm",
        "Craft",
        "HIGEN RNM company profile",
        "https://craft.co/higen-rnm",
    ),
    ref(
        "automate-higen-rnm",
        "Automate",
        "HIGEN RNM Co., Ltd exhibitor profile",
        "https://www.automateshow.com/exhibitors/higen-rnm-co-ltd",
    ),
    ref(
        "marklines-snt-motiv",
        "MarkLines",
        "SNT Motiv supplier profile",
        "https://www.marklines.com/ja/top500/snt_motiv",
    ),
    ref(
        "komachine-samhyun",
        "Komachine",
        "Samhyun company profile",
        "https://www.komachine.com/en/companies/samhyun",
    ),
    press(
        "asiae-samhyun-2025",
        "The Asia Business Daily",
        "Samhyeon hits record high after listing on robotics technology",
        "https://view.asiae.co.kr/en/article/2025101015410459030",
    ),
    // Gears, screws and bearings
    press(
        "asiae-spg-rainbow-2026",
        "The Asia Business Daily",
        "Money moves from AI to humanoids",
        "https://view.asiae.co.kr/en/article/2026072114241405771",
    ),
    press(
        "asiae-spg-automate-2026",
        "The Asia Business Daily",
        "SPG to take part in Automate 2026 for the fourth year running",
        "https://view.asiae.co.kr/en/article/2026061810462258437",
    ),
    ref(
        "morningstar-spg",
        "Morningstar",
        "SPG Co Ltd (XKRX: 058610) profile",
        "https://www.morningstar.com.au/investments/security/XKRX/058610",
    ),
    press(
        "etnews-spg-2019",
        "Electronic Times",
        "SPG and Haesung TPC push robot reducer mass production",
        "https://www.etnews.com/20190905000321",
    ),
    press(
        "asiae-sbb-ipo-2022",
        "The Asia Business Daily",
        "SBB Tech prepares for mass production of precision reducers for robots",
        "https://view.asiae.co.kr/en/article/2022090111103652831",
    ),
    ref(
        "simplywall-sbb-tech",
        "Simply Wall St",
        "SBB Tech (KOSDAQ: A389500) company profile",
        "https://simplywall.st/stock/kosdaq/a389500",
    ),
    press(
        "asiae-woorim-pts-2025",
        "The Asia Business Daily",
        "Woorim PTS rises on robot reducer prospects, in Hyundai Motor and Samsung value chains",
        "https://view.asiae.co.kr/en/article/2025120110170187405",
    ),
    ref(
        "komachine-woorim",
        "Komachine",
        "Woorim company profile",
        "https://www.komachine.com/ko/companies/woorim-machinery",
    ),
    src(
        "samick-thk-brief",
        "Samick THK",
        "Samick THK company brief",
        "https://samickthk.co.kr/resources/en/file/EN_SAMICK_THK_BRIEF.pdf",
        "company-site",
    ),
    src(
        "thk-overseas-bases",
        "THK",
        "Overseas production bases",
        "https://www.thk.com/jp/ja/company/overseas_production_base",
        "company-site",
    ),
    press(
        "dempa-samick-technopolis",
        "Dempa Publications",
        "Samick THK starts LM guide output at its Technopolis plant",
        "https://aei.dempa.net/archives/9037",
    ),
    src(
        "thk-annual-report-2007",
        "THK",
        "Annual Report 2007",
        "https://om-www.thk.com/sites/default/files/documents/us_pdf/ir./Annual_Report/Annual_Report2007_en16.pdf",
        "filing",
    ),
    src(
        "nsk-linear-sites-2021",
        "NSK",
        "Sourcing linear motion solutions from NSK's global manufacturing sites",
        "https://www.nsk.com/eu-en/company/news/2021/sourcing-linear-motion-solutions-from-NSKs-global-manufacturing-sites/",
        "company-site",
    ),
    press(
        "spglobal-nsk-needle-korea",
        "S&P Global Mobility",
        "NSK opens new plant in South Korea for needle bearings",
        "https://autotechinsight.spglobal.com/news/5242638/nsk-opens-new-plant-in-south-korea-for-needle-bearings",
    ),
    press(
        "kedglobal-schaeffler-korea-2023",
        "The Korea Economic Daily",
        "Schaeffler Korea to expand its Changwon plant",
        "https://www.kedglobal.com/automobiles/newsView/ked202305300008",
    ),
    src(
        "schaeffler-humanoid-2026",
        "Schaeffler",
        "Powering humanoid motion (investor presentation, January 2026)",
        "https://www.schaeffler.com/remotemedien/media/_shared_media_rwd/08_investor_relations/presentations/20260112_schaeffler_powering_humanoid_motion.pdf",
        "filing",
    ),
    // Robot and actuator makers
    ref(
        "wiki-doosan-robotics",
        "Wikipedia",
        "Doosan Robotics",
        "https://en.wikipedia.org/wiki/Doosan_Robotics",
    ),
    press(
        "kedglobal-doosan-suwon-2023",
        "The Korea Economic Daily",
        "Doosan Robotics eyes top spot in cobot market after October IPO",
        "https://m.kedglobal.com/newsView/ked202312080003",
    ),
    press(
        "koreaherald-doosan-onexia-2025",
        "The Korea Herald",
        "Doosan Robotics acquires 89.59% stake in US automation firm ONExia",
        "https://www.koreaherald.com/article/10541533",
    ),
    press(
        "pennbiz-onexia-2025",
        "Penn Business Report",
        "Korean robotics company purchases majority stake in Exton-based ONExia",
        "https://pennbizreport.com/news/31097-korean-robotics-company-purchases-majority-stake-in-exton-based-onexia/",
    ),
    ref(
        "wiki-hd-hyundai-robotics",
        "Wikipedia",
        "HD Hyundai Robotics",
        "https://en.wikipedia.org/wiki/HD_Hyundai_Robotics",
    ),
    src(
        "hd-hyundai-robotics-site",
        "HD Hyundai Robotics",
        "HD Hyundai Robotics company introduction",
        "https://hyundai-robotics.com/english/intro/intro4.html",
        "company-site",
    ),
    ref(
        "wiki-hyundai-motor",
        "Wikipedia",
        "Hyundai Motor Company",
        "https://en.wikipedia.org/wiki/Hyundai_Motor_Company",
    ),
    ref(
        "wiki-hyundai-plants",
        "Wikipedia",
        "List of Hyundai Motor Company manufacturing facilities",
        "https://en.wikipedia.org/wiki/List_of_Hyundai_Motor_Company_manufacturing_facilities",
    ),
    press(
        "koreatimes-hyundai-uiwang-2026",
        "The Korea Times",
        "Hyundai Motor steps up physical AI push",
        "https://www.koreatimes.co.kr/business/companies/20261018/hyundai-motor-steps-up-physical-ai-push-amid-chinese-competition-stock-slump",
    ),
    src(
        "softbank-bd-2021",
        "SoftBank Group",
        "Hyundai Motor Group completes acquisition of Boston Dynamics from SoftBank",
        "https://group.softbank/en/news/press/20210621",
        "company-site",
    ),
    press(
        "ajc-metaplant-atlas-2026",
        "The Atlanta Journal-Constitution",
        "Hyundai's Georgia plant won't just build cars, it'll assemble robot workers",
        "https://www.ajc.com/business/2026/01/hyundais-georgia-plant-wont-just-build-cars-itll-assemble-robot-workers/",
    ),
    press(
        "cbtnews-bd-training-center-2026",
        "CBT News",
        "Boston Dynamics opens robot training center",
        "https://www.cbtnews.com/boston-dynamics-opens-robot-training-center/",
    ),
    press(
        "koreaherald-mobis-atlas-2026",
        "The Korea Herald",
        "Hyundai Mobis to build Atlas actuator prototypes",
        "https://www.koreaherald.com/article/10741955",
    ),
    press(
        "theinvestor-mobis-atlas-2026",
        "The Investor",
        "Hyundai Mobis readies actuator supply for Atlas",
        "https://m.theinvestor.co.kr/article/10742134",
    ),
    src(
        "lg-bear-robotics-2025",
        "LG Electronics",
        "LG acquires majority stake in Bear Robotics to bolster robotics capabilities",
        "https://www.lg.com/global/newsroom/news/corporate/lg-acquires-majority-stake-in-bear-robotics-to-bolster-robotics-capabilities/",
        "company-site",
    ),
    ref(
        "cbinsights-bear-robotics",
        "CB Insights",
        "Bear Robotics company profile",
        "https://www.cbinsights.com/company/bear-robotics",
    ),
    ref(
        "wiki-lg-electronics",
        "Wikipedia",
        "LG Electronics",
        "https://en.wikipedia.org/wiki/LG_Electronics",
    ),
    press(
        "edaily-lg-axium-2026",
        "Edaily",
        "LG Electronics starts pilot production of AXIUM robot actuators in Changwon",
        "https://en.edaily.co.kr/news/eda202608035576/",
    ),
    ref(
        "wiki-samsung-electronics",
        "Wikipedia",
        "Samsung Electronics",
        "https://en.wikipedia.org/wiki/Samsung_Electronics",
    ),
    src(
        "rainbow-sejong-plant",
        "Rainbow Robotics",
        "Rainbow Robotics breaks ground on its Sejong plant and new headquarters",
        "https://rainbow-robotics.com/?p=6975",
        "company-site",
    ),
    press(
        "asiae-naver-1784-2022",
        "The Asia Business Daily",
        "Naver unveils second office 1784 as an advanced technology testbed",
        "https://view.asiae.co.kr/en/article/2022041410255478205",
    ),
    press(
        "joongang-naver-1784",
        "Korea JoongAng Daily",
        "At Naver 1784, robots scurry about and scrub other robots",
        "https://www.koreajoongangdaily.com/business/at-naver-1784-robots-scurry-about-and-scrub-other-robots/10408374",
    ),
    src(
        "robotis-contact",
        "ROBOTIS",
        "ROBOTIS e-Manual: contact us",
        "https://emanual.robotis.com/docs/en/platform/turtlebot3/contact_us/",
        "company-site",
    ),
    src(
        "hanwha-robotics-site",
        "Hanwha",
        "Hanwha Robotics",
        "https://www.hanwha.com/companies/hanwha-robotics.do",
        "company-site",
    ),
    src(
        "hanwha-hcr5a-datasheet",
        "Hanwha Robotics (via DigiKey)",
        "HCR-5A collaborative robot datasheet",
        "https://mm.digikey.com/Volume0/opasdata/d220001/medias/docus/4832/HCR-5A.pdf",
        "company-site",
    ),
    ref(
        "dealroom-neuromeka",
        "Dealroom",
        "Neuromeka company profile",
        "https://dealroom.co/companies/neuromeka/",
    ),
    press(
        "kedglobal-neuromeka-posco-2024",
        "The Korea Economic Daily",
        "Neuromeka to issue convertible bonds to POSCO Holdings",
        "https://amp.kedglobal.com/newsAmp/ked202412010002",
    ),
    ref(
        "automate-wonik-robotics",
        "Association for Advancing Automation",
        "Wonik Robotics member profile",
        "https://www.automate.org/companies/wonik-robotics-co-ltd",
    ),
    ref(
        "dealroom-wonik-robotics",
        "Dealroom",
        "Wonik Robotics company profile",
        "https://dealroom.co/companies/wonik-robotics/",
    ),
    src(
        "kimm-site",
        "Korea Institute of Machinery & Materials",
        "KIMM English site (address: Yuseong-gu, Daejeon)",
        "https://www.kimm.re.kr/eng/",
        "company-site",
    ),
    ref(
        "linkedin-kimm",
        "LinkedIn",
        "Korea Institute of Machinery & Materials company page",
        "https://www.linkedin.com/company/korea-institute-of-machinery-&-materials",
    ),
    press(
        "biggo-spg-kimm-2026",
        "BigGo Finance",
        "SPG supplies South Korean-made reducers for KIMM's KAIROS humanoid joints",
        "https://finance.biggo.com/news/c6d5b79a-a337-4833-8ec7-49ee4d7cb814",
    ),
    press(
        "kalpha-spg-kairos-2026",
        "Korea Alpha",
        "SPG's humanoid push: can robot actuators deliver earnings?",
        "https://kalpha.news/article/spg-humanoid-robot-actuators-precision-reducers-earnings/",
    ),
    src(
        "angel-robotics-site",
        "Angel Robotics",
        "Company overview",
        "https://www.angel-robotics.com/en/company/overview",
        "company-site",
    ),
    ref(
        "simplywall-angel-robotics",
        "Simply Wall St",
        "Angel Robotics (KOSDAQ: A455900) company information",
        "https://simplywall.st/stocks/kr/healthcare/kosdaq-a455900/angel-robotics-shares/information",
    ),
];
