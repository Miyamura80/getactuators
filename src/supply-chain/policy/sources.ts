// Primary documents behind /policy: gazettes, ministry notices, agency
// releases and standards catalogue pages, read on the day the dataset was
// built. Press only where it locates a government decision, never alone.

// Structural copy of SourceRef: importing the type from ../sources would make
// an import cycle, since ../sources spreads this list into SOURCES.
type Kind = "government" | "standards-body" | "filing" | "press";

interface PolicySource {
    id: string;
    title: string;
    publisher: string;
    url: string;
    accessed: string;
    kind: Kind;
}

function doc(
    id: string,
    publisher: string,
    title: string,
    url: string,
    kind: Kind = "government",
): PolicySource {
    return { id, publisher, title, url, kind, accessed: "2026-10-27" };
}

const iso = (id: string, title: string, url: string) =>
    doc(id, "ISO", title, url, "standards-body");

export const POLICY_SOURCES: PolicySource[] = [
    // China: MOFCOM, GAC, State Council, MIIT, MOF
    doc(
        "mofcom-2025-18",
        "MOFCOM, GAC",
        "Announcement 2025 No. 18: export controls on some medium and heavy rare earth items",
        "https://aqygzj.mofcom.gov.cn/flzc/gzjgfxwj/art/2025/art_f3a1432ba20248eca12ff7b91bc73fda.html",
    ),
    doc(
        "mofcom-2025-56",
        "MOFCOM, GAC",
        "Announcement 2025 No. 56: export controls on some rare earth equipment and raw materials",
        "https://www.mofcom.gov.cn/zwgk/zcfb/art/2025/art_1315078cebe04210bc35c72a4e7f7967.html",
    ),
    doc(
        "mofcom-2025-57",
        "MOFCOM, GAC",
        "Announcement 2025 No. 57: export controls on some medium and heavy rare earth items",
        "https://www.mofcom.gov.cn/zwgk/zcfb/art/2025/art_59ec4f6bec0b459aa4a30c4bbd0a41c1.html",
    ),
    doc(
        "mofcom-2025-61",
        "MOFCOM",
        "Announcement 2025 No. 61: export controls on rare earth items held abroad",
        "https://www.mofcom.gov.cn/zwgk/zcfb/art/2025/art_7fc9bff0fb4546ecb02f66ee77d0e5f6.html",
    ),
    doc(
        "mofcom-2025-62",
        "MOFCOM",
        "Announcement 2025 No. 62: export controls on rare earth technologies",
        "https://www.mofcom.gov.cn/zwgk/zcfb/art/2025/art_6cb42957741440c6984de696b70df9ae.html",
    ),
    doc(
        "mofcom-2025-70",
        "MOFCOM, GAC",
        "Announcement 2025 No. 70: suspending Announcements 55 to 58, 61 and 62",
        "https://www.mofcom.gov.cn/zwgk/zcfb/art/2025/art_b1ec77dd3f0d4762952904df7cdaadec.html",
    ),
    doc(
        "xinhua-mofcom-2026-04",
        "Xinhua (MOFCOM press conference)",
        "MOFCOM on rare earth export controls: measures suspended to 10 November 2026",
        "https://www.news.cn/fortune/20260409/4dd5e2914dd34dd6ad48867d56b49f8c/c.html",
        "press",
    ),
    doc(
        "mofcom-most-2023-57",
        "MOFCOM, MOST",
        "Announcement 2023 No. 57: Catalogue of Technologies Prohibited or Restricted from Export",
        "https://www.mofcom.gov.cn/zcfb/blgg/art/2023/art_be52899825444789987964cfe450ad1b.html",
    ),
    doc(
        "gov-cn-decree-785",
        "State Council",
        "Rare Earth Management Regulations (Decree No. 785)",
        "https://www.gov.cn/zhengce/zhengceku/202406/content_6960153.htm",
    ),
    doc(
        "gov-cn-decree-792",
        "State Council",
        "Regulations on Export Control of Dual-Use Items (Decree No. 792)",
        "https://www.gov.cn/zhengce/content/202410/content_6981399.htm",
    ),
    doc(
        "miit-ree-quota-2025",
        "MIIT, NDRC, MNR",
        "Interim Measures on Total Quantity Control of Rare Earth Mining and Separation",
        "https://www.miit.gov.cn/zcfg/qtl/art/2025/art_ff508817506f4d928dd38ec4ea483b71.html",
    ),
    doc(
        "gov-cn-quota-end-2015",
        "Central Government Portal",
        "MOFCOM: ending export quotas on rare earths and other products",
        "https://www.gov.cn/xinwen/2015-01/14/content_2803886.htm",
    ),
    doc(
        "mof-export-duty-2015",
        "Customs Tariff Commission of the State Council",
        "Notice on adjusting export duties on some products (rare earths, tungsten, molybdenum)",
        "https://www.mof.gov.cn/gp/xxgkml/gss/201504/t20150423_2510662.htm",
    ),
    doc(
        "mof-tariff-us-2025-4",
        "Customs Tariff Commission of the State Council",
        "Announcement 2025 No. 4: additional tariffs on goods originating in the US",
        "https://m.mof.gov.cn/zcfb/202504/t20250404_3961451.htm",
    ),
    doc(
        "mof-tariff-us-2025-5",
        "Customs Tariff Commission of the State Council",
        "Announcement on adjusting additional tariffs on US goods (34% to 84%)",
        "https://gss.mof.gov.cn/gzdt/zhengcefabu/202504/t20250409_3961684.htm",
    ),
    doc(
        "mof-tariff-us-2025-6",
        "Customs Tariff Commission of the State Council",
        "Announcement 2025 No. 6: additional tariff on US goods raised to 125%",
        "https://www.mofcom.gov.cn/zcfb/zgdwjjmywg/art/2025/art_3e9296cef51f448bad9bbce4b48fadab.html",
    ),
    doc(
        "mof-tariff-us-2025-7",
        "Customs Tariff Commission of the State Council",
        "Announcement on adjusting additional tariffs on US goods (to 10%, 24% suspended)",
        "https://gss.mof.gov.cn/gzdt/zhengcefabu/202505/t20250513_3963684.htm",
    ),
    doc(
        "mof-tariff-us-2025-10",
        "Customs Tariff Commission of the State Council",
        "Announcement on adjusting additional tariffs on US goods (24% suspended one more year)",
        "http://m.mof.gov.cn/zcfb/202511/t20251105_3975756.htm",
    ),
    doc(
        "gov-cn-mic2025",
        "State Council",
        "Made in China 2025 (Guofa [2015] No. 28)",
        "https://www.gov.cn/zhengce/content/2015-05/19/content_9784.htm",
    ),
    doc(
        "gov-cn-robot-fyp-2021",
        "MIIT and 14 departments",
        "14th Five-Year Plan for the Robot Industry",
        "https://www.gov.cn/zhengce/zhengceku/2021-12/28/content_5664988.htm",
    ),
    doc(
        "gov-cn-robot-plus-2023",
        "MIIT and 16 departments",
        "Robot+ Application Action Implementation Plan",
        "https://www.gov.cn/zhengce/zhengceku/2023-01/19/content_5738112.htm",
    ),
    doc(
        "miit-humanoid-2023",
        "MIIT",
        "Guiding Opinions on the Innovative Development of Humanoid Robots",
        "https://www.miit.gov.cn/jgsj/kjs/wjfb/art/2023/art_50316f76a9b1454b898c7bb2a5846b79.html",
    ),
    doc(
        "ncsti-humanoid-tc-2024",
        "MIIT (via NCSTI)",
        "Public notice of the plan to set up the MIIT Humanoid Robot Standardization Technical Committee",
        "https://www.ncsti.gov.cn/kjdt/tzgg/202409/t20240930_180766.html",
    ),
    doc(
        "miit-humanoid-tc-2025",
        "MIIT",
        "MIIT Humanoid Robot and Embodied AI Standardization Technical Committee established",
        "https://www.miit.gov.cn/xwfb/bldhd/art/2025/art_25c6077c819d4a77aa7a900a82bbde45.html",
    ),
    doc(
        "beijing-robot-2023",
        "Beijing Municipal Government",
        "Beijing Robot Industry Innovation and Development Action Plan (2023-2025)",
        "https://www.beijing.gov.cn/zhengce/zhengcefagui/202306/t20230628_3148572.html",
    ),
    doc(
        "shanghai-robot-2023",
        "Shanghai Municipal Commission of Economy and Informatization",
        "Shanghai Action Plan for High-Quality Innovative Development of Intelligent Robots (2023-2025)",
        "https://www.shanghai.gov.cn/gwk/search/content/6f6aab8a8745441b96220b0180f628d4",
    ),
    doc(
        "shenzhen-embodied-2026",
        "Shenzhen Science, Technology and Innovation Bureau",
        "Shenzhen Embodied Intelligent Robot Action Plan (2025-2027), revised edition",
        "https://stic.sz.gov.cn/xxgk/tzgg/content/post_12851036.html",
    ),
    // United States
    doc(
        "ustr-301-list-1",
        "USTR",
        "Section 301 List 1: products subject to 25% additional duty from 6 July 2018",
        "https://ustr.gov/sites/default/files/enforcement/301Investigations/List%201.pdf",
    ),
    doc(
        "ustr-301-review-2024-05",
        "USTR",
        "USTR to take further action on China tariffs after releasing statutory four-year review",
        "https://ustr.gov/about-us/policy-offices/press-office/press-releases/2024/may/us-trade-representative-katherine-tai-take-further-action-china-tariffs-after-releasing-statutory",
    ),
    doc(
        "fr-301-modification-2024",
        "Federal Register (USTR)",
        "89 FR 76581: Notice of modification, Section 301 China tariff actions",
        "https://ustr.gov/sites/default/files/89%20FR%2076581%20(September%2018,%202024)_2.pdf",
    ),
    doc(
        "fr-301-2026-10",
        "Federal Register (USTR)",
        "Section 301 China actions remain in effect (91 FR, 7 October 2026)",
        "https://www.govinfo.gov/content/pkg/FR-2026-10-07/pdf/2026-20510.pdf",
    ),
    doc(
        "wh-232-minerals-2025",
        "The White House",
        "Ensuring National Security and Economic Resilience Through Section 232 Actions on Processed Critical Minerals",
        "https://www.whitehouse.gov/presidential-actions/2025/04/ensuring-national-security-and-economic-resilience-through-section-232-actions-on-processed-critical-minerals-and-derivative-products/",
    ),
    doc(
        "wh-232-minerals-2026",
        "The White House",
        "Adjusting Imports of Processed Critical Minerals and Their Derivative Products into the United States",
        "https://www.whitehouse.gov/presidential-actions/2026/01/adjusting-imports-of-processed-critical-minerals-and-their-derivative-products-into-the-united-states/",
    ),
    doc(
        "fr-232-robotics-2025",
        "Federal Register (BIS)",
        "Section 232 National Security Investigation of Imports of Robotics and Industrial Machinery",
        "https://www.federalregister.gov/documents/2025/09/26/2025-18749/notice-of-request-for-public-comments-on-section-232-national-security-investigation-of-imports-of",
    ),
    doc(
        "wh-eo-14257",
        "The White House",
        "Executive Order 14257: Regulating Imports with a Reciprocal Tariff",
        "https://www.whitehouse.gov/presidential-actions/2025/04/regulating-imports-with-a-reciprocal-tariff-to-rectify-trade-practices-that-contribute-to-large-and-persistent-annual-united-states-goods-trade-deficits/",
    ),
    doc(
        "scotus-ieepa-2026",
        "Supreme Court of the United States",
        "Learning Resources, Inc. v. Trump, No. 24-1287 (20 February 2026)",
        "https://www.supremecourt.gov/opinions/25pdf/24-1287_new_3135.pdf",
    ),
    doc(
        "wh-sec122-2026",
        "The White House",
        "Imposing a Temporary Import Surcharge to Address Fundamental International Payments Problems",
        "https://www.whitehouse.gov/presidential-actions/2026/02/imposing-a-temporary-import-surcharge-to-address-fundamental-international-payments-problems/",
    ),
    doc(
        "fr-dfars-magnets-2024",
        "Federal Register (DoD)",
        "DFARS: Restriction on Certain Metal Products (DFARS Case 2021-D015), final rule",
        "https://www.federalregister.gov/documents/2024/05/30/2024-11513/defense-federal-acquisition-regulation-supplement-restriction-on-certain-metal-products-dfars-case",
    ),
    doc(
        "dod-ree-awards-2020",
        "US Department of Defense",
        "DOD Announces Rare Earth Element Awards to Strengthen Domestic Industrial Base",
        "https://www.war.gov/News/Releases/release/article/2418542/dod-announces-rare-earth-element-awards-to-strengthen-domestic-industrial-base/",
    ),
    doc(
        "dod-lynas-lree-2021",
        "US Department of Defense",
        "DOD Announces Rare Earth Element Award to Strengthen Domestic Industrial Base (Lynas, Texas)",
        "https://www.war.gov/News/Releases/Release/Article/2488672/dod-announces-rare-earth-element-award-to-strengthen-domestic-industrial-base/",
    ),
    doc(
        "dod-mp-hree-2022",
        "US Department of Defense",
        "DoD Awards $35 Million to MP Materials to Build U.S. Heavy Rare Earth Separation Capacity",
        "https://www.businessdefense.gov/news/2022/dod-awards-35-million-to-mp-materials-to-build-us-heavy-rare-earth-separation-c.html",
    ),
    doc(
        "dod-lynas-hree-2022",
        "US Department of Defense",
        "DoD Awards Key Contract for Domestic Heavy Rare Earth Separation Capability",
        "https://www.businessdefense.gov/news/2022/DoD-Awards-Key-Contract-for-Domestic-Heavy-Rare-Earth-Separation-Capability.html",
    ),
    doc(
        "dod-evac-2023",
        "US Department of Defense",
        "Department of Defense Enters an Agreement to Expand Domestic Manufacturing of Rare Earth Magnets",
        "https://www.war.gov/News/Releases/Release/Article/3529874/department-of-defense-enters-an-agreement-to-expand-domestic-manufacturing-to-s/",
    ),
    doc(
        "mp-8k-dod-2025",
        "MP Materials 8-K",
        "Exhibit 99.1: public-private partnership with the Department of Defense",
        "https://www.sec.gov/Archives/edgar/data/1801368/000119312525157310/d43796dex991.htm",
        "filing",
    ),
    doc(
        "wh-erp-2026-ch7",
        "Council of Economic Advisers",
        "Economic Report of the President 2026, chapter 7: Strengthening America's Industrial Supply Chains",
        "https://www.whitehouse.gov/wp-content/uploads/2026/04/ERP-2026-7.-Strengthening-Americas-Industrial-Supply-Chains.pdf",
    ),
    doc(
        "dow-osc-vulcan-2025",
        "US Department of War",
        "Office of Strategic Capital Agrees to Joint $700M Conditional Loan Commitment with Vulcan Elements and ReElement",
        "https://www.war.gov/News/Releases/Release/Article/4339788/office-of-strategic-capital-agrees-to-joint-700m-conditional-loan-commitment-wi/",
    ),
    doc(
        "nist-chips-vulcan-2025",
        "NIST (CHIPS Program)",
        "Department of Commerce Announces CHIPS Incentives Letter of Intent with Vulcan Elements",
        "https://www.nist.gov/news-events/news/2025/11/department-commerce-announces-chips-incentives-letter-intent-vulcan",
    ),
    doc(
        "dow-osc-niron-2026",
        "US Department of War",
        "Office of Strategic Capital Signs $150 Million Conditional Loan Commitment With Niron Magnetics",
        "https://www.war.gov/News/Releases/Release/Article/4566567/office-of-strategic-capital-signs-150-million-conditional-loan-commitment-with/",
    ),
    doc(
        "wh-eo-14241",
        "The White House",
        "Executive Order 14241: Immediate Measures to Increase American Mineral Production",
        "https://www.whitehouse.gov/presidential-actions/2025/03/immediate-measures-to-increase-american-mineral-production/",
    ),
    doc(
        "fr-45x-proposed-2023",
        "Federal Register (IRS)",
        "Section 45X Advanced Manufacturing Production Credit, proposed rule",
        "https://www.federalregister.gov/documents/2023/12/15/2023-27498/section-45x-advanced-manufacturing-production-credit",
    ),
    doc(
        "fr-45x-final-2024",
        "Federal Register (IRS)",
        "Advanced Manufacturing Production Credit, final rule",
        "https://www.federalregister.gov/documents/2024/10/28/2024-24840/advanced-manufacturing-production-credit",
    ),
    doc(
        "a3-r1506-2025",
        "A3 (Association for Advancing Automation)",
        "New ANSI/A3 R15.06-2025 American National Standard for Industrial Robot Safety",
        "https://www.automate.org/robotics/news/new-ansi-a3-r15-06-2025-american-national-standard-for-industrial-robot-safety-now-available-for-purchase",
        "standards-body",
    ),
    doc(
        "wh-us-au-framework-2025",
        "The White House",
        "United States-Australia Framework for Securing of Supply in the Mining and Processing of Critical Minerals and Rare Earths",
        "https://www.whitehouse.gov/briefings-statements/2025/10/united-states-australia-framework-for-securing-of-supply-in-the-mining-and-processing-of-critical-minerals-and-rare-earths/",
    ),
    doc(
        "wh-us-jp-framework-2025",
        "The White House",
        "United States-Japan Framework for Securing the Supply of Critical Minerals and Rare Earths",
        "https://www.whitehouse.gov/briefings-statements/2025/10/united-states-japan-framework-for-securing-the-supply-of-critical-minerals-and-rare-earths-through-mining-and-processing/",
    ),
    // European Union
    doc(
        "eurlex-crma-2024",
        "EUR-Lex",
        "Regulation (EU) 2024/1252 (Critical Raw Materials Act)",
        "https://eur-lex.europa.eu/eli/reg/2024/1252/oj/eng",
    ),
    doc(
        "ec-crma-projects-2025",
        "European Commission",
        "Commission selects 47 Strategic Projects to secure and diversify access to raw materials in the EU",
        "https://ec.europa.eu/commission/presscorner/detail/en/ip_25_864",
    ),
    doc(
        "ec-crma-third-2025",
        "European Commission",
        "Commission selects 13 Strategic Projects in third countries",
        "https://ec.europa.eu/commission/presscorner/detail/en/ip_25_1419",
    ),
    doc(
        "ec-crma-projects-2026",
        "European Commission",
        "Commission selects 46 new Strategic Projects to bolster the EU's supply of critical raw materials",
        "https://ec.europa.eu/commission/presscorner/api/files/document/print/en/ip_26_2113/IP_26_2113_EN.pdf",
    ),
    doc(
        "fastmarkets-crma-ree-2026",
        "Fastmarkets",
        "EU adds four rare earth projects to strategic list to support recycling, processing goals",
        "https://www.fastmarkets.com/insights/eu-adds-four-rare-earth-projects-to-strategic-list-to-support-recycling-processing-goals/",
        "press",
    ),
    doc(
        "ec-resourceeu-2025",
        "European Commission",
        "Commission adopts RESourceEU to secure raw materials (IP/25/2891)",
        "https://ec.europa.eu/commission/presscorner/api/files/document/print/en/ip_25_2891/IP_25_2891_EN.pdf",
    ),
    doc(
        "ec-resourceeu-com-2025",
        "European Commission",
        "RESourceEU communication, COM(2025) 945 final",
        "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A52025DC0945",
    ),
    doc(
        "eurlex-machinery-2023",
        "EUR-Lex",
        "Regulation (EU) 2023/1230 on machinery",
        "https://eur-lex.europa.eu/eli/reg/2023/1230/2023-06-29",
    ),
    doc(
        "eurlex-motors-2019",
        "EUR-Lex",
        "Commission Regulation (EU) 2019/1781: ecodesign requirements for electric motors and variable speed drives",
        "https://eur-lex.europa.eu/eli/reg/2019/1781/oj/eng",
    ),
    // Japan
    doc(
        "jogmec-jare-2011",
        "JOGMEC",
        "Sojitz and JOGMEC support for Lynas through Japan Australia Rare Earths (2011)",
        "https://www.jogmec.go.jp/content/300055368.pdf",
    ),
    doc(
        "jogmec-jare-2022",
        "JOGMEC",
        "JARE Supports Lynas' Development with Additional Equity Investment",
        "https://www.jogmec.go.jp/english/news/release/release_00210.html",
    ),
    doc(
        "jogmec-jare-2023",
        "JOGMEC",
        "Securing Supply of Heavy Rare Earths to Japan with Additional Investment to Lynas",
        "https://www.jogmec.go.jp/english/news/release/release_00228.html",
    ),
    doc(
        "cao-espa-2022",
        "Cabinet Office of Japan",
        "Minister Takaichi press conference, 20 December 2022: Cabinet Order designating specified critical products",
        "https://www.cao.go.jp/minister/2208_s_takaichi/kaiken/20221220kaiken.html",
    ),
    doc(
        "cao-espa-supply-chain",
        "Cabinet Office of Japan",
        "Supply chain resilience under the Economic Security Promotion Act",
        "https://www.cao.go.jp/keizai_anzen_hosho/suishinhou/supply_chain/supply_chain.html",
    ),
    doc(
        "meti-espa-approvals",
        "METI",
        "List of approved supply-securing plans under the Economic Security Promotion Act",
        "https://www.meti.go.jp/policy/economy/economic_security/260220_nintei.pdf",
    ),
    doc(
        "meti-robot-programme",
        "METI",
        "Machine tools and industrial robots: supply-securing plans",
        "https://www.meti.go.jp/policy/economy/economic_security/robot/index.html",
    ),
    doc(
        "meti-magnet-programme",
        "METI",
        "Permanent magnets: supply-securing plans",
        "https://www.meti.go.jp/policy/economy/economic_security/magnet/index.html",
    ),
    doc(
        "meti-magnet-shinetsu-2025",
        "METI",
        "Approved supply-securing plan 2025 Permanent Magnets No. 1-1 (Shin-Etsu Chemical)",
        "https://www.meti.go.jp/policy/economy/economic_security/magnet/magnet_nintei_05.pdf",
    ),
    doc(
        "meti-minerals-programme",
        "METI",
        "Critical minerals: supply-securing plans",
        "https://www.meti.go.jp/policy/economy/economic_security/metal/index.html",
    ),
    // Korea
    doc(
        "korea-robot-plan-2024",
        "MOTIE (via Korea.kr)",
        "4th Intelligent Robot Basic Plan, 2024 to 2028",
        "https://www.korea.kr/briefing/pressReleaseView.do?newsId=156610879",
    ),
    doc(
        "korea-humanoid-2025",
        "MOTIE (via Korea.kr)",
        "K-Humanoid Alliance launched",
        "https://www.korea.kr/briefing/pressReleaseView.do?newsId=156683522",
    ),
    doc(
        "law-go-kr-supply-chain",
        "Korea Ministry of Government Legislation",
        "Framework Act on Supply Chain Stabilization for Economic Security",
        "https://www.law.go.kr/LSW/lsRvsDocListP.do?lsId=014551&chrClsCd=010202&lsRvsGubun=all",
    ),
    doc(
        "korea-ree-plan-2026",
        "MOTIR (via Korea.kr)",
        "Stabilising rare earth and critical mineral supply chains",
        "https://www.korea.kr/briefing/pressReleaseView.do?newsId=156724375",
    ),
    doc(
        "korea-ree-designation-2026",
        "Korea.kr policy news",
        "All 17 rare earths designated critical minerals",
        "https://www.korea.kr/news/policyNewsView.do?newsId=148959131",
    ),
    // Australia
    doc(
        "au-cm-strategy-2023",
        "Australian Department of Industry, Science and Resources",
        "Critical Minerals Strategy 2023-2030",
        "https://www.industry.gov.au/publications/critical-minerals-strategy-2023-2030",
    ),
    doc(
        "au-cmpti-act-2025",
        "Federal Register of Legislation (Australia)",
        "Act C2025A00009 (Schedule 2: Critical Minerals Production Tax Incentive)",
        "https://www.legislation.gov.au/C2025A00009/asmade/2025-02-14/text/original/pdf",
    ),
    doc(
        "ato-cmpti",
        "Australian Taxation Office",
        "Critical Minerals and Hydrogen Production Tax Incentives",
        "https://www.ato.gov.au/about-ato/new-legislation/in-detail/businesses/hydrogen-production-and-critical-minerals-tax-incentives",
    ),
    doc(
        "au-us-framework-2025",
        "Australian Department of Industry, Science and Resources",
        "Australia and the United States sign landmark bilateral framework on critical minerals",
        "https://www.industry.gov.au/news/australia-and-united-states-sign-landmark-bilateral-framework-critical-minerals",
    ),
    doc(
        "au-cmsr",
        "Australian Department of Industry, Science and Resources",
        "Critical Minerals Strategic Reserve",
        "https://www.industry.gov.au/mining-oil-and-gas/minerals/critical-minerals/critical-minerals-strategic-reserve",
    ),
    doc(
        "au-cmsr-arafura-2026",
        "Minister for Resources (Australia)",
        "Strategic reserve supporting Arafura final investment decision",
        "https://minister.industry.gov.au/ministers/king/media-releases/strategic-reserve-supporting-arafura-final-investment-decision",
    ),
    // International standards
    iso(
        "iso-10218-1-2011",
        "ISO 10218-1:2011 Robots and robotic devices: Safety requirements for industrial robots, Part 1",
        "https://www.iso.org/standard/51330.html",
    ),
    iso(
        "iso-10218-1-2025",
        "ISO 10218-1:2025 Robotics: Safety requirements, Part 1: Industrial robots",
        "https://www.iso.org/standard/73933.html",
    ),
    iso(
        "iso-10218-2-2025",
        "ISO 10218-2:2025 Robotics: Safety requirements, Part 2: Industrial robot applications and robot cells",
        "https://www.iso.org/standard/73934.html",
    ),
    iso(
        "iso-ts-15066",
        "ISO/TS 15066:2016 Robots and robotic devices: Collaborative robots",
        "https://www.iso.org/standard/62996.html",
    ),
    iso(
        "iso-13482-2014",
        "ISO 13482:2014 Safety requirements for personal care robots",
        "https://www.iso.org/standard/53820.html",
    ),
    iso(
        "iso-fdis-13482",
        "ISO/FDIS 13482 Robotics: Safety requirements for service robots",
        "https://www.iso.org/standard/83498.html",
    ),
    iso(
        "iso-cd-25785-1",
        "ISO/CD 25785-1 Safety requirements for dynamically stable industrial mobile robots, Part 1",
        "https://www.iso.org/standard/91469.html",
    ),
    doc(
        "iec-61800-5-2-2016",
        "IEC",
        "IEC 61800-5-2:2016 Adjustable speed electrical power drive systems, Part 5-2: Safety requirements, functional",
        "https://webstore.iec.ch/en/publication/24556",
        "standards-body",
    ),
    doc(
        "iec-61800-5-2-2007",
        "IEC",
        "IEC 61800-5-2:2007 (withdrawn)",
        "https://webstore.iec.ch/en/publication/5937",
        "standards-body",
    ),
    doc(
        "iec-60034-30-1-2014",
        "IEC",
        "IEC 60034-30-1:2014 Efficiency classes of line operated AC motors (IE code)",
        "https://webstore.iec.ch/en/publication/136",
        "standards-body",
    ),
    doc(
        "iec-60034-30-1-2025",
        "IEC",
        "IEC 60034-30-1:2025 Efficiency classes of single-speed motors (IE code)",
        "https://webstore.iec.ch/en/publication/91195",
        "standards-body",
    ),
];
