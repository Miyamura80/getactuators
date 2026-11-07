import type { SourceReuse } from "../reuse";

// Sources behind the /us dataset: SEC filings, company releases, state and
// federal announcements and trade press. The facts were read from search
// results on the day the dataset was built (November 2026), so no source
// carries an `accessed` date (see SourceRef). Sources already in the
// registry (the MP Materials 10-K, the DoD and OSC awards behind /policy,
// the people registry's Niron, Energy Fuels and Apptronik pages) are reused,
// not repeated.

// Structural copy of SourceRef: importing the type from ../sources would make
// an import cycle, since ../sources spreads this list into SOURCES.
type Kind =
    | "government"
    | "filing"
    | "industry-report"
    | "press"
    | "company-site"
    | "reference";

interface UsSource {
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
    kind: Kind = "press",
    reuse: SourceReuse = "facts",
): UsSource {
    return { id, publisher, title, url, kind, reuse };
}

const SEC = "https://www.sec.gov/Archives/edgar/data";
const filing = (id: string, company: string, form: string, url: string) =>
    src(id, "SEC EDGAR", `${company}: ${form}`, url, "filing");
const site = (id: string, publisher: string, title: string, url: string) =>
    src(id, publisher, title, url, "company-site");
const profile = (id: string, publisher: string, company: string, url: string) =>
    src(id, publisher, `${company}: company profile`, url, "reference");

export const US_SOURCES: UsSource[] = [
    // Rare earth mining and refining
    src(
        "finviz-ef-results-2025",
        "Finviz (Energy Fuels release)",
        "Energy Fuels announces 2025 results and 2026 guidance",
        "https://finviz.com/news/324527/energy-fuels-announces-2025-results-and-2026-guidance",
    ),
    src(
        "ycharts-ef-heavy-ree-2026",
        "YCharts (PR Newswire)",
        "Energy Fuels announces first US primary production of heavy rare earth material in decades",
        "https://ycharts.com/news/story/PRN-C7622-20260325",
    ),
    filing(
        "ef-10q-q3-2026",
        "Energy Fuels",
        "Form 10-Q for the quarter to September 2026",
        `${SEC}/0001385849/000138584926000037/efr-20260930.htm`,
    ),
    src(
        "engnews-ef-vac-2026",
        "Engineering News",
        "Energy Fuels strikes deal for German magnet maker to build mine-to-magnet supply chain",
        "https://engineeringnews.co.za/print-version/energy-fuels-strikes-1bn-deal-for-german-magnet-maker-to-build-mine-to-magnet-supply-chain-2026-06-23",
    ),
    site(
        "ef-posco-2025",
        "Energy Fuels",
        "Energy Fuels and POSCO International forge collaboration to create non-China rare earth magnet supply chain",
        "https://investors.energyfuels.com/2025-03-17-US-Based-Energy-Fuels-and-South-Korea-Based-POSCO-International-Forge-Collaboration-to-Create-Non-China-Rare-Earth-Magnet-Supply-Chain",
    ),
    filing(
        "usar-10q-q1-2026",
        "USA Rare Earth",
        "Form 10-Q for the quarter to March 2026",
        `${SEC}/0001970622/000197062226000038/usar-20260331.htm`,
    ),
    src(
        "miningcom-usar-stillwater-2026",
        "Mining.com",
        "USA Rare Earth commissions new magnet production line at Oklahoma plant",
        "https://www.mining.com/usa-rare-earth-commissions-new-magnet-production-line-at-oklahoma-plant/",
    ),
    profile(
        "nsenergy-round-top",
        "NS Energy",
        "Round Top rare earth and critical minerals project",
        "https://www.nsenergybusiness.com/projects/round-top-rare-earth-critical-minerals/",
    ),
    src(
        "barchart-tmrc-round-top-2022",
        "Barchart (NewMediaWire)",
        "Texas Mineral Resources joint venture partner secures first domestic rare earth metal and magnet manufacturing facility",
        "https://www.barchart.com/story/news/8634791/texas-mineral-resources-joint-venture-partner-secures-first-domestic-rare-earth-metal-and-magnet-manufacturing-facility",
    ),
    src(
        "fastmarkets-arnold-lcm-2025",
        "Fastmarkets",
        "Arnold Magnetic enters samarium oxide supply agreement with Solvay, Less Common Metals",
        "https://www.fastmarkets.com/insights/arnold-magnetic-samarium-oxide-supply-agreement-solvay-less-common-metals/",
    ),
    src(
        "barchart-usar-arnold-2026",
        "Barchart (GlobeNewswire)",
        "USA Rare Earth and Arnold Magnetic Technologies partner to expand US-made rare earth magnet supply",
        "https://www.barchart.com/story/news/894238/usa-rare-earth-and-arnold-magnetic-technologies-partner-to-expand-u-s-made-rare-earth-magnet-supply-for-critical-industries",
    ),
    src(
        "amr-asm-usar-2025",
        "Australian Mining Review",
        "Australian Strategic Materials signs five-year sales framework agreement with USA Rare Earth",
        "https://australianminingreview.com.au/news/australian-strategic-materials-signs-five-year-sales-framework-agreement-with-usa-rare-earth/",
    ),
    site(
        "ucore-smc",
        "Ucore Rare Metals",
        "Louisiana Strategic Metals Complex",
        "https://ucore.com/smc/",
    ),
    src(
        "miningweekly-ucore-smc-2026",
        "Mining Weekly",
        "Louisiana Strategic Metals Complex, US",
        "https://www.miningweekly.com/article/louisiana-strategic-metals-complex-us-2026-08-14",
    ),
    src(
        "newsfile-ucore-meteoric-2024",
        "Newsfile",
        "Ucore Rare Metals and Meteoric Resources sign MOU for offtake of Caldeira project MREC",
        "https://www.newsfilecorp.com/release/220620/Ucore-Rare-Metals-and-Meteoric-Resources-Sign-MOU-for-Offtake-of-Caldeira-Project-MREC-in-Brazil-to-USA-Oxide-Production-Project",
    ),
    src(
        "miningcom-ucore-sumitomo-2026",
        "Mining.com",
        "Ucore, Sumitomo team up on rare earth supply chain development",
        "https://www.mining.com/?p=1208546",
    ),
    src(
        "miningcom-lynas-texas-2025",
        "Mining.com (Reuters)",
        "Lynas flags uncertainty over Texas rare earths plant, posts profit slump",
        "https://www.mining.com/web/australias-lynas-posts-over-90-fall-in-annual-profit-to-raise-487-million",
    ),
    site(
        "noveon-lynas-2025",
        "Noveon Magnetics",
        "Noveon Magnetics and Lynas Rare Earths partner to advance US rare earth magnet supply chain",
        "https://noveon.co/noveon-magnetics-lynas-rare-earths-partner",
    ),
    src(
        "bw-phoenix-exeter-2025",
        "Business Wire",
        "Phoenix Tailings opens US rare earth metallization facility",
        "https://www.businesswire.com/news/home/20251023800456/en/Phoenix-Tailings-Opens-Cutting-Edge-U.S.-Rare-Earth-Metallization-Facility-Entirely-Independent-From-China",
    ),
    src(
        "nhpr-phoenix-exeter-2025",
        "New Hampshire Public Radio",
        "One of the country's few rare earth processing plants opens in Exeter",
        "https://www.nhpr.org/nh-news/2025-10-30/one-of-the-countrys-few-rare-earth-processing-plants-opens-in-exeter",
    ),
    src(
        "miningcom-phoenix-bmw-2024",
        "Mining.com (Reuters)",
        "BMW, Yamaha Motor back US rare earths startup Phoenix Tailings",
        "https://www.mining.com/web/bmw-yamaha-motor-back-us-rare-earths-startup-phoenix-tailings/",
    ),
    src(
        "ibj-reelement-marion",
        "Indianapolis Business Journal",
        "Fishers-based company to bring new life, jobs to former RCA plant",
        "https://www.ibj.com/articles/fishers-based-company-to-bring-new-life-jobs-to-former-rca-plant",
    ),
    src(
        "hcp-reelement-noblesville-2025",
        "Hydrocarbon Processing",
        "ReElement Technologies expands Noblesville refinery by 141%",
        "https://hydrocarbonprocessing.com/news/2025/09/reelement-technologies-expands-noblesville-refinery-by-141-to-accelerate-rare-earth-and-critical-mineral-production/",
    ),
    src(
        "nasdaq-reelement-vulcan-2025",
        "Nasdaq (press release)",
        "ReElement Technologies and Vulcan Elements finalize long-term supply agreement",
        "https://www.nasdaq.com/press-release/reelement-technologies-and-vulcan-elements-finalize-long-term-supply-agreement-rare",
    ),
    src(
        "chemeng-aclara-2025",
        "Chemical Engineering",
        "Aclara Resources unveils plans for first heavy rare earths separation plant in the US",
        "https://www.chemengonline.com/aclara-resources-unveils-plans-for-first-heavy-rare-earths-separation-plant-in-the-u-s",
    ),
    src(
        "emj-ramaco-brook-2025",
        "E&MJ",
        "Ramaco hosts ribbon cutting ceremony for the Brook Mine",
        "https://www.e-mj.com/news/this-month-in-coal/ramaco-hosts-ribbon-cutting-ceremony-for-the-brook-mine/",
    ),
    src(
        "nace-ramaco-pilot-2025",
        "North American Clean Energy",
        "Ramaco breaks ground on pilot processing plant and lab",
        "https://www.nacleanenergy.com/energy-storage/ramaco-breaks-ground-on-pilot-processing-plant-and-lab-to-advance-rare-earth-and-critical-mineral-development",
    ),
    src(
        "wikipedia-brook-mine",
        "Wikipedia",
        "Brook Mine",
        "https://en.wikipedia.org/wiki/Brook_Mine",
        "reference",
    ),
    src(
        "mfgdive-cyclic-mesa-2026",
        "Manufacturing Dive",
        "Rare earth recycler Cyclic Materials opens first US facility in Mesa, Arizona",
        "https://www.manufacturingdive.com/news/rare-earth-recycler-cyclic-materials-opens-first-us-facility-mesa-arizona/830028/",
    ),
    src(
        "electrive-cyclic-2024",
        "electrive",
        "Rare earth recycler Cyclic Materials raises $53 million",
        "https://electrive.com/2024/09/30/rare-earth-recycler-cyclic-materials-raises-53-million",
    ),
    src(
        "proactive-arr-halleck-2026",
        "Proactive Investors",
        "American Rare Earths advances Halleck Creek feasibility and pilot plant plans",
        "https://www.proactiveinvestors.com.au/companies/news/1096333/american-rare-earths-advances-halleck-creek-feasibility-and-pilot-plant-plans-in-pivotal-june-quarter-1096333.html",
    ),
    filing(
        "niocorp-10q-q3-2026",
        "NioCorp Developments",
        "Form 10-Q for the quarter to September 2026",
        `${SEC}/0001512228/000119312526449936/nb-20260930.htm`,
    ),
    src(
        "nasdaq-rer-update-2025",
        "Nasdaq (press release)",
        "Rare Element Resources provides rare earth project update",
        "https://www.nasdaq.com/press-release/rare-element-resources-provides-rare-earth-project-update-2025-11-05",
    ),
    site(
        "rer-news",
        "Rare Element Resources",
        "News and updates",
        "https://www.rareelementresources.com/news-updates/",
    ),
    site(
        "mp-gm-2021",
        "MP Materials",
        "MP Materials to build US magnet factory, enters long-term supply agreement with General Motors",
        "https://mpmaterials.com/news/mp-materials-to-build-us-magnet-factory-enters-long-term-supply-agreement-with-general-motors",
    ),
    site(
        "mp-maaden-2025",
        "MP Materials",
        "MP Materials and the US Department of War partner with Maaden to develop a rare earth refinery joint venture",
        "https://mpmaterials.com/news/mp-materials-and-the-u-s-department-of-war-partner-with-the-saudi-arabian-mining-company-maaden-to-develop-rare-earth-refinery-joint-venture",
    ),
    // Magnets and motors
    src(
        "ncnewsline-vulcan-benson-2025",
        "NC Newsline",
        "Stein announces $1B rare earth magnet plant in Johnston County",
        "https://ncnewsline.com/2025/11/18/stein-announces-1b-rare-earth-magnet-plant-in-johnston-county/",
    ),
    src(
        "axios-vulcan-2025",
        "Axios Raleigh",
        "Rare-earth magnet maker plans 1,000-job factory in North Carolina",
        "https://www.axios.com/local/raleigh/2025/11/18/rare-earth-magnet-maker-plans-1000-job-factory-in-north-carolina",
    ),
    src(
        "electrive-gm-vac-2026",
        "electrive",
        "GM terminates contract with Vacuumschmelze",
        "https://electrive.com/2026/10/26/gm-terminates-contract-with-vacuumschmelze",
    ),
    src(
        "scdaily-evac-sumter-2023",
        "SC Daily Gazette",
        "German manufacturer to invest $506M, hire 300 workers in Sumter",
        "https://scdailygazette.com/2023/12/13/german-manufacturer-to-invest-506m-hire-300-workers-in-sumter/",
    ),
    site(
        "arnold-about",
        "Arnold Magnetic Technologies",
        "Who we are",
        "https://www.arnoldmagnetics.com/about/",
    ),
    site(
        "arnold-smco-usa",
        "Arnold Magnetic Technologies",
        "SmCo made in USA",
        "https://www.arnoldmagnetics.com/blog/smco-made-in-usa/",
    ),
    site(
        "arnold-evolution-2025",
        "Arnold Magnetic Technologies",
        "Evolution of Arnold",
        "https://www.arnoldmagnetics.com/wp-content/uploads/2025/01/Evolution-of-Arnold-FINAL.pdf",
    ),
    site(
        "eec-smco",
        "Electron Energy Corporation",
        "Samarium cobalt magnets",
        "https://www.electronenergy.com/samarium-cobalt-magnets/",
    ),
    src(
        "apex-eec-magnetic-holdings",
        "Apex Magnets",
        "Electron Energy Corp. joins forces with Magnetic Holdings",
        "https://www.apexmagnets.com/news-how-tos/electron-energy-corp-joins-forces-with-magnetic-holdings-to-accelerate-growth-in-rare-earth-magnet-industry-apex-magnets/",
    ),
    filing(
        "rrx-8k-q4-2025",
        "Regal Rexnord",
        "Form 8-K, fourth quarter 2025 earnings announcement",
        `${SEC}/82811/000008281126000041/a4q2025earningsannouncement.htm`,
    ),
    site(
        "rrx-hq-2023",
        "Regal Rexnord",
        "Regal Rexnord announces change in corporate address",
        "https://investors.regalrexnord.com/investors/ir-news/press-release-details/2023/REGAL-REXNORD-ANNOUNCES-CHANGE-IN-CORPORATE-ADDRESS/default.aspx",
    ),
    site(
        "kollmorgen-humanoid",
        "Kollmorgen",
        "Humanoid robots",
        "https://www.kollmorgen.com/en-us/solutions/robotics/humanoid-robots",
    ),
    src(
        "insidermonkey-rrx-q1-2025",
        "Insider Monkey",
        "Regal Rexnord Q1 2025 earnings call transcript",
        "https://www.insidermonkey.com/blog/regal-rexnord-corporation-nyserrx-q1-2025-earnings-call-transcript-1526718/",
    ),
    profile(
        "designnews-thomson",
        "Design News",
        "Thomson Industries",
        "https://directory.designnews.com/thomson-industries-inc-comp231089.html",
    ),
    site(
        "nook-about",
        "Nook Industries",
        "About us",
        "https://nookindustries.com/about-us/about-us/",
    ),
    filing(
        "allient-10k-2025",
        "Allient",
        "Form 10-K for 2025",
        `${SEC}/46129/000110465926024123/alnt-20251231x10k.htm`,
    ),
    src(
        "airframer-allied-thingap-2022",
        "Airframer",
        "Allied Motion Technologies completes acquisition of ThinGap",
        "https://www.airframer.com/news/release/allied-motion-technologies-completes-acquisition-of-thingap",
    ),
    site(
        "gm-hq-2024",
        "General Motors",
        "General Motors names Hudson's Detroit as its new global headquarters",
        "https://news.gm.com/home.detail.html/Pages/news/us/en/2024/apr/0415-headquarters.html",
    ),
    site(
        "nidec-motor-outline",
        "Nidec",
        "Nidec Motor Corporation: corporate outline",
        "https://www.nidec.com/en/nidec-motor/corporate/about/outline/",
    ),
    src(
        "talkbusiness-abb-fort-smith-2025",
        "Talk Business & Politics",
        "ABB has future proofed Fort Smith electric motor production",
        "https://talkbusiness.net/2025/04/abb-has-future-proofed-fort-smith-electric-motor-production/",
    ),
    src(
        "automate-abb-auburn-hills",
        "Association for Advancing Automation",
        "ABB: first global industrial robotics company to manufacture robots in the United States",
        "https://www.automate.org/news/abb-first-global-industrial-robotics-company-to-manufacture-robots-in-the-united-states",
    ),
    src(
        "bw-westmag-2026",
        "Business Wire",
        "Westmag emerges with $11 million seed to build America's drone motor and robot actuator industry",
        "https://www.businesswire.com/news/home/20260602552448/en/Westmag-Emerges-With-$11-Million-Seed-Led-By-Andreessen-Horowitz-to-Build-Americas-Drone-Motor-and-Robot-Actuator-Industry",
    ),
    src(
        "finsmes-atlas-motion-2026",
        "FinSMEs",
        "Atlas Motion raises $11.5M in funding",
        "https://www.finsmes.com/2026/08/atlas-motion-raises-11-5m-in-funding.html",
    ),
    // Gears, screws and bearings
    site(
        "timken-results-2025",
        "Timken",
        "Timken reports fourth-quarter and full-year 2025 results",
        "https://news.timken.com/2026-02-04-Timken-Reports-Fourth-Quarter-and-Full-Year-2025-Results",
    ),
    src(
        "oemoh-timken-cone-drive-2018",
        "OEM Off-Highway",
        "Timken to acquire Cone Drive",
        "https://www.oemoffhighway.com/drivetrains/press-release/21014683/the-timken-company-timken-to-acquire-cone-drive",
    ),
    site(
        "rbc-results-fy2026",
        "RBC Bearings",
        "RBC Bearings announces fiscal fourth quarter and full year 2026 results",
        "https://investor.rbcbearings.com/node/16426",
    ),
    filing(
        "rbc-10k-fy2026",
        "RBC Bearings",
        "Form 10-K for the year to March 2026",
        `${SEC}/0001324948/000121390026057626/ea0288814-10k_rbcbear.htm`,
    ),
    src(
        "mfgnet-kaydon-75",
        "Manufacturing.net",
        "Kaydon Bearings celebrates 75th anniversary",
        "https://www.manufacturing.net/home/news/13772170/kaydon-corporation-kaydon-bearings-celebrates-75th-anniversary",
    ),
    profile(
        "coolen-kaydon",
        "Coolen Bearings",
        "Kaydon (SKF) bearings",
        "https://www.coolenbearings.com/kaydon/tech/kaydon-skf-bearings",
    ),
    site(
        "moog-annual-2025",
        "Moog",
        "2025 annual report",
        "https://www.moog.com/content/dam/moog/literature/Corporate/Investors/financial-performance/fy25/2025-Moog-Annual-Report.pdf",
    ),
    src(
        "windsystems-moog-components",
        "Wind Systems",
        "Profile: Moog Components Group",
        "https://www.windsystemsmag.com/profile-moog-components-group/",
    ),
    src(
        "bw-cw-exlar-2023",
        "Business Wire",
        "Curtiss-Wright electric actuators for a US Army missile defense system",
        "https://www.businesswire.com/news/home/20230201005947/en",
    ),
    profile(
        "designnews-exlar",
        "Design News",
        "Curtiss-Wright, Exlar",
        "https://directory.designnews.com/curtiss-wright-exlar-comp226777.html",
    ),
    site(
        "agility-schaeffler-2024",
        "Agility Robotics",
        "Agility Robotics announces strategic investment and agreement with Schaeffler Group",
        "https://www.agilityrobotics.com/content/agility-robotics-announces-strategic-investment-and-agreement-with-motion-technology-company-schaeffler-group",
    ),
    src(
        "areadev-schaeffler-sc-2015",
        "Area Development",
        "Schaeffler Group USA invests $163.8 million to expand three South Carolina manufacturing plants",
        "https://www.areadevelopment.com/newsitems/1-12-2015/schaeffler-group-manufacturing-center-expansions-south-carolina902382.shtml",
    ),
    src(
        "onespartanburg-schaeffler-2015",
        "OneSpartanburg",
        "Schaeffler Group North America upgrading Spartanburg County facility",
        "https://www.onespartanburginc.com/news/2015/01/09/economic-news/schaeffler-group-north-america-upgrading-spartanburg-county-facility/",
    ),
    site(
        "sma-chesapeake",
        "Sumitomo Drive Technologies",
        "Sumitomo Machinery Corporation of America, Chesapeake, VA",
        "https://us.sumitomodrive.com/en/facility/sumitomo-machinery-corporation-america-chesapeake-va",
    ),
    site(
        "sma-luftex-2019",
        "Sumitomo Drive Technologies",
        "Sumitomo Machinery Corp. of America acquires LUFTEX GEARS",
        "https://us.sumitomodrive.com/en-us/news/sumitomo-machinery-corp-america-acquires-luftex-gears",
    ),
    profile(
        "designnews-nabtesco-mc",
        "Design News",
        "Nabtesco Motion Control",
        "https://showcase.designnews.com/nabtesco-motion-control-comp228049.html",
    ),
    site(
        "nsk-americas-capabilities",
        "NSK Americas",
        "NSK linear and mechatronics product capabilities",
        "https://nsk.com/content/dam/nsk/am/en_us/documents/precision-americas/NSK-Linear-and-Mechatronics-Product-Capabilities.pdf",
    ),
    profile(
        "designnews-thk-america",
        "Design News",
        "THK America",
        "https://showcase.designnews.com/thk-america-inc-comp252155.html",
    ),
    // Robot and actuator makers
    src(
        "notateslaapp-optimus-2026",
        "Not a Tesla App",
        "Tesla officially begins Optimus robot production",
        "https://notateslaapp.com/news/4866/tesla-officially-begins-optimus-robot-production",
    ),
    src(
        "robotreport-botq-2025",
        "The Robot Report",
        "Figure AI unveils BotQ high-volume humanoid manufacturing facility",
        "https://www.therobotreport.com/figure-ai-unveils-botq-high-volume-humanoid-manufacturing-facility/",
    ),
    site(
        "bmw-figure-2024",
        "BMW Group",
        "Successful test of humanoid robots at BMW Group Plant Spartanburg",
        "https://www.press.bmwgroup.com/global/article/detail/T0444265EN/successful-test-of-humanoid-robots-at-bmw-group-plant-spartanburg",
    ),
    src(
        "iiot-figure-bmw-2026",
        "IIoT World",
        "Humanoid robots built 30,000 BMWs: here's the ROI",
        "https://www.iiot-world.com/artificial-intelligence-ml/robotics/physical-ai-deployment-roi-humanoid-robots",
    ),
    src(
        "newequipment-robofab",
        "New Equipment Digest",
        "RoboFab: world's first factory for humanoid robots",
        "https://www.newequipment.com/industry-trends/article/21278028/agility-robotics-opening-robofab-worlds-first-factory-for-humanoid-robots",
    ),
    site(
        "agility-toyota-2026",
        "Agility Robotics",
        "Agility Robotics announces commercial agreement with Toyota Motor Manufacturing Canada",
        "https://agilityrobotics.com/content/agility-robotics-announces-commercial-agreement-with-toyota-motor-manufacturing-canada",
    ),
    src(
        "bw-apptronik-jabil-2025",
        "Business Wire",
        "Apptronik and Jabil collaborate to scale production of Apollo humanoid robots",
        "https://www.businesswire.com/news/home/20250225753929/en/Apptronik-and-Jabil-Collaborate-to-Scale-Production-of-Apollo-Humanoid-Robots-and-Deploy-in-Manufacturing-Operations",
    ),
    src(
        "sc247-apptronik-2025",
        "SupplyChain247",
        "Apptronik lands $403M backing from Mercedes, Google and more",
        "https://www.supplychain247.com/article/apptronik-403-million-funding-backing-mercedes-google",
    ),
    src(
        "autocar-mercedes-apptronik",
        "Autocar",
        "Mercedes-Benz begins using AI robotics to make its cars",
        "https://www.autocar.co.uk/car-news/technology/mercedes-benz-begins-using-ai-robotics-make-its-cars",
    ),
    src(
        "justauto-bd-metaplant-2026",
        "Just Auto",
        "Boston Dynamics launches robot training centre at Hyundai's US Metaplant",
        "https://www.just-auto.com/newsletters/boston-dynamics-launches-robot-training-centre-at-hyundais-us-metaplant",
    ),
    src(
        "robotreport-1x-hayward-2026",
        "The Robot Report",
        "1X begins production of NEO humanoid robots at Hayward, California facility",
        "https://www.therobotreport.com/1x-begins-production-neo-humanoid-robots-at-hayward-california-facility/",
    ),
    src(
        "kyodo-persona-2025",
        "Kyodo News PR Wire (PR Newswire)",
        "Persona AI raises $27M oversubscribed pre-seed",
        "https://kyodonewsprwire.jp/release/202505148842",
    ),
    src(
        "adnkronos-hdhyundai-persona-2025",
        "Adnkronos (PR Newswire)",
        "HD Hyundai and Persona AI sign agreement to deploy humanoid welding robots for shipbuilding",
        "https://www.adnkronos.com/immediapress/eng/hd-hyundai-and-persona-ai-sign-agreement-to-deploy-humanoid-welding-robots-for-shipbuilding-automation_1pcFbgO5KM5wmJA1eVSBCh",
    ),
    filing(
        "isrg-10k-2025",
        "Intuitive Surgical",
        "Form 10-K for 2025",
        `${SEC}/1035267/000103526726000010/isrg-20251231.htm`,
    ),
    filing(
        "rok-10k-2024",
        "Rockwell Automation",
        "Form 10-K for the year to September 2024",
        `${SEC}/1024478/000102447824000107/rok-20240930.htm`,
    ),
    site(
        "teradyne-results-2025",
        "Teradyne",
        "Teradyne reports fourth quarter and full year 2025 results",
        "https://investors.teradyne.com/news-events/press-releases/detail/433",
    ),
    site(
        "ur-wixom-2026",
        "Universal Robots",
        "New US operations hub to open in 2026",
        "https://www.universal-robots.com/news-and-media/news-center/new-us-operations-hub-to-open-in-2026/",
    ),
    profile(
        "globaldata-teradyne",
        "GlobalData",
        "Teradyne",
        "https://www.globaldata.com/company-profile/teradyne-inc/",
    ),
    src(
        "controlcom-fanuc-yaskawa-2025",
        "Control.com",
        "Yaskawa, FANUC invest in US facilities for robot production",
        "https://control.com/news/yaskawa-fanuc-invest-in-u.s-facilities-for-robot-production/",
    ),
    src(
        "mfgdive-yaskawa-franklin-2025",
        "Manufacturing Dive",
        "Yaskawa America to expand Wisconsin plant, relocate Illinois HQ operations",
        "https://www.manufacturingdive.com/news/yaskawa-america-expand-wisconsion-plant-relocate-illinois-hq-operations/750835/",
    ),
    src(
        "bw-kuka-shelby-2011",
        "Business Wire",
        "KUKA Robotics Corporation opens new North American headquarters",
        "https://businesswire.com/news/home/20111214005328/en/KUKA-Robotics-Corporation-Opens-New-North-American-Headquarters",
    ),
    site(
        "kawasaki-kri",
        "Kawasaki Heavy Industries",
        "Kawasaki Robotics (USA): company network",
        "https://global.kawasaki.com/en/corp/profile/network/kri.html",
    ),
    src(
        "techcrunch-hello-robot-2026",
        "TechCrunch",
        "Is Silicon Valley ready to put robots in people's homes? Hello Robot is",
        "https://techcrunch.com/2026/06/04/is-silicon-valley-ready-to-put-robots-in-peoples-homes-hello-robot-is/",
    ),
    site(
        "palladyne-contact",
        "Palladyne AI",
        "Contact us",
        "https://www.palladyneai.com/contact-us/",
    ),
    src(
        "ie-foundation-2025",
        "Interesting Engineering",
        "US firm Foundation plans to build 50,000 humanoid robots",
        "https://interestingengineering.com/military/us-foundation-build-50000-humanoid-robots",
    ),
    profile(
        "machinetools-epson-robots",
        "MachineTools.com",
        "Epson Robots",
        "https://www.machinetools.com/en/brands/epson",
    ),
    src(
        "automationmag-omron-pleasanton-2020",
        "Manufacturing AUTOMATION",
        "Omron opens new robotics headquarters in California",
        "https://www.automationmag.com/omron-opens-new-robotics-headquarters-in-california/",
    ),
    site(
        "tri-bd-partnership-2024",
        "Toyota Research Institute",
        "Boston Dynamics and Toyota Research Institute announce partnership to advance robotics research",
        "https://www.tri.global/news/boston-dynamics-and-toyota-research-institute-announce-partnership-advance-robotics-research",
    ),
];

// Headquarters of the partners abroad (see sites/us.ts).
export const US_PARTNER_SOURCES: UsSource[] = [
    src(
        "wikipedia-jabil",
        "Wikipedia",
        "Jabil",
        "https://en.wikipedia.org/wiki/Jabil",
        "reference",
    ),
    profile(
        "purdue-allison",
        "Purdue University (Formula SAE)",
        "Allison Transmission",
        "https://engineering.purdue.edu/fsae/wordpress/allison-transmission",
    ),
    profile(
        "cbinsights-allison-magna",
        "CB Insights",
        "Allison Transmission and Magna International",
        "https://www.cbinsights.com/compare/allison-transmission-vs-magna-international",
    ),
    src(
        "companies-house-lcm",
        "Companies House",
        "Less Common Metals Limited (02690088): company overview",
        "https://pay.company-information.service.gov.uk/company/02690088",
        "government",
        "open",
    ),
    site(
        "solvay-hq-brussels",
        "Solvay",
        "Solvay to relocate to new headquarters in Brussels",
        "https://www.solvay.com/en/press-release/solvay-relocate-new-headquarters-brussels",
    ),
    src(
        "wikipedia-maaden",
        "Wikipedia",
        "Maaden (company)",
        "https://en.wikipedia.org/wiki/Maaden_(company)",
        "reference",
    ),
    src(
        "marketscreener-meteoric-office",
        "MarketScreener",
        "Meteoric Resources NL announces change of registered office and principal place of business",
        "https://in.marketscreener.com/quote/stock/METEORIC-RESOURCES-NL-10353942/news/Meteoric-Resources-NL-Announces-Change-of-Registered-Office-and-Principal-Place-of-Business-38119675",
    ),
    site(
        "sumitomocorp-profile",
        "Sumitomo Corporation",
        "Corporate profile",
        "https://www.sumitomocorp.com/en/jp/about/company/profile",
    ),
    profile(
        "cbinsights-posco-international",
        "CB Insights",
        "Hyundai Group and POSCO International",
        "https://www.cbinsights.com/compare/hyundai-group-vs-posco-international",
    ),
    src(
        "koreatimes-hd-hyundai-hq-2023",
        "The Korea Times",
        "HD Hyundai's new headquarters provides glimpse into office of future",
        "https://www.koreatimes.co.kr/business/companies/20230707/hd-hyundais-new-headquarters-provides-glimpse-into-office-of-future",
    ),
    profile(
        "komo-mercedes-benz",
        "Komo",
        "Mercedes-Benz Group offices",
        "https://komo.ai/directory/mercedes-benz-group-offices",
    ),
    src(
        "wikiwand-stellantis",
        "Wikiwand (Wikipedia)",
        "Stellantis",
        "https://www.wikiwand.com/en/articles/Stellantis",
        "reference",
    ),
];
