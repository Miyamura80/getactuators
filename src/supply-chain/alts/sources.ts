// Documents behind /alts. The site could not open these pages when the
// dataset was built (the fetches were blocked), so every figure was taken
// from the publisher's own summary as shown in search results, and none of
// these sources carries an `accessed` date. Open each and add the date when
// it is checked.
//
// Reuse: market sizes are paid analyst reports, so they are `restricted`
// and back at most three records each (here two: size and growth). Papers,
// vendor pages, filings and news are `facts`; UK government stories are
// `open` (Open Government Licence).

// Structural copy of SourceRef: importing the type from ../sources would make
// an import cycle, since ../sources spreads this list into SOURCES.
type Kind =
    | "filing"
    | "industry-report"
    | "press"
    | "academic"
    | "company-site"
    | "reference"
    | "government";

type Reuse = "open" | "facts" | "restricted";

interface AltSource {
    id: string;
    title: string;
    publisher: string;
    url: string;
    kind: Kind;
    reuse: Reuse;
    paywalled?: boolean;
}

function src(
    id: string,
    publisher: string,
    title: string,
    url: string,
    kind: Kind,
    reuse: Reuse,
): AltSource {
    return { id, publisher, title, url, kind, reuse };
}

// A paid market report cited through its public summary.
function report(id: string, publisher: string, title: string, url: string): AltSource {
    return {
        ...src(id, publisher, title, url, "industry-report", "restricted"),
        paywalled: true,
    };
}

export const ALT_SOURCES: AltSource[] = [
    // Market sizes (public summaries of paid reports)
    report(
        "imarc-induction-motor-2025",
        "IMARC Group",
        "Global induction motor market size anticipated to reach USD 42.9 billion by 2033",
        "https://www.imarcgroup.com/induction-motor-market-statistics",
    ),
    report(
        "marketglass-srm-2025",
        "Market Glass (Global Industry Analysts)",
        "Switched Reluctance Motors: global market (report listing)",
        "https://www.gii.co.jp/report/go1798270-switched-reluctance-motors.html",
    ),
    report(
        "reportprime-synrm-2025",
        "Report Prime",
        "Synchronous Reluctance Motor (SynRM) market",
        "https://www.reportprime.com/synchronous-reluctance-motor-synrm-r7600",
    ),
    report(
        "techsci-axial-flux-2025",
        "TechSci Research",
        "Axial Flux Motors Market: global industry size, share and forecast (report listing)",
        "https://giikorea.co.kr/report/tsci1732892-axial-flux-motors-market-global-industry-size.html",
    ),
    report(
        "techsci-artificial-muscle-2025",
        "TechSci Research",
        "Artificial Muscle Market: global industry size, share and forecast (report listing)",
        "https://www.giikorea.co.kr/report/tsci1879300-artificial-muscle-market-global-industry-size.html",
    ),
    report(
        "ksi-hydraulic-actuator-2024",
        "Knowledge Sourcing Intelligence",
        "Hydraulic Actuator Market: forecasts from 2024 to 2029 (report listing)",
        "https://www.giikorea.co.kr/report/ksi1521058-hydraulic-actuator-market-forecasts-from.html",
    ),
    report(
        "datahorizzon-eha-2025",
        "DataHorizzon Research",
        "Electro-hydrostatic actuator market",
        "https://datahorizzonresearch.com/electro-hydrostatic-actuator-market-29564",
    ),
    report(
        "intel-cycloidal-2025",
        "Intel Market Research",
        "Cycloidal gear reducers market",
        "https://www.intelmarketresearch.com/cycloidal-gear-reducers-market-16796",
    ),
    report(
        "tmr-roller-screw-2025",
        "Transparency Market Research",
        "Planetary roller screw market",
        "https://www.transparencymarketresearch.com/planetary-roller-screw-market.html",
    ),
    // Rare-earth-free motors
    src(
        "tesla-s1-2010",
        "Tesla Motors (SEC)",
        "Form S-1 registration statement, 2010",
        "https://www.sec.gov/Archives/edgar/data/0001318605/000119312510017054/ds1.htm",
        "filing",
        "facts",
    ),
    src(
        "eep-induction-history",
        "Electrical Engineering Portal",
        "Induction machines: a historical touch",
        "https://electrical-engineering-portal.com/induction-machines-historical-touch",
        "press",
        "facts",
    ),
    src(
        "popsci-dyson-dc31-2009",
        "Popular Science",
        "Dyson's new vacuum driven by the fastest motor ever",
        "https://www.popsci.com/gear-amp-gadgets/article/2009-06/dysons-new-vacuum-driven-fastest-motor-ever/",
        "press",
        "facts",
    ),
    src(
        "dnc-dyson-sr-motor",
        "Drives & Controls",
        "Dyson's turbocharged SR motor can phone home",
        "https://cdn765.pressflex.net/news/archivestory.php/aid/1109/.html",
        "press",
        "facts",
    ),
    src(
        "turntide-buildings-2021",
        "Turntide Technologies (GlobeNewswire)",
        "Turntide Technologies launches new intelligent building solution for sustainable operations",
        "https://www.globenewswire.com/news-release/2021/09/09/2294627/0/en/Turntide-Technologies-Launches-New-Intelligent-Building-Solution-For-Sustainable-Operations.html",
        "press",
        "facts",
    ),
    src(
        "dnc-abb-synrm-2011",
        "Drives & Controls",
        "Synchronous reluctance motors offer a choice of high outputs or IE4 efficiency",
        "https://cdn765.pressflex.net/news/archivestory.php/aid/3180/.html",
        "press",
        "facts",
    ),
    src(
        "abb-ie6-synrm-2024",
        "ABB",
        "IE6 SynRM motors are engineered to outrun the demands of today",
        "https://new.abb.com/news/detail/133960/ie6-synrm-motors-are-engineered-to-outrun-the-demands-of-today",
        "company-site",
        "facts",
    ),
    src(
        "magneticsmag-proterial-ferrite-2023",
        "Magnetics Magazine",
        "Proterial builds ferrite-magnet motor prototype, adds AI to its toolkit for developing new materials",
        "https://magneticsmag.com/proterial-builds-ferrite-magnet-motor-prototype-adds-ai-to-its-toolkit-for-developing-new-materials/",
        "press",
        "facts",
    ),
    src(
        "electrek-tesla-ree-free-2023",
        "Electrek",
        "Tesla is going back to EV motors with no rare earth elements",
        "https://electrek.co/2023/03/01/tesla-is-going-back-to-ev-motors-with-no-rare-earth-elements/",
        "press",
        "facts",
    ),
    src(
        "renault-ree-free-motors",
        "Renault Group",
        "All about electric motors with no rare earths",
        "https://renaultgroup.com/en/magazine/energy-and-powertrains/all-about-electric-motors-with-no-rare-earths/",
        "company-site",
        "facts",
    ),
    src(
        "eenews-continental-zoe",
        "eeNews Europe",
        "Continental supplies powertrain for Renault's e-car Zoe",
        "https://www.eenewseurope.com/en/continental-supplies-powertrain-for-renaults-e-car-zoe/",
        "press",
        "facts",
    ),
    src(
        "bmw-ix3-2020",
        "BMW Group",
        "The first-ever BMW iX3",
        "https://www.press.bmwgroup.com/united-kingdom/article/detail/T0311014EN_GB/the-first-ever-bmw-ix3",
        "company-site",
        "facts",
    ),
    src(
        "vcaonline-conifer-seed-2025",
        "Venture Capital Access Online",
        "Conifer secures $20M in seed funding to transform electric powertrains with rare-earth-free design",
        "https://www.vcaonline.com/news/2025041407/conifer-secures-20m-in-seed-funding-to-transform-electric-powertrains-with-rare-earth-free-design-and-software-driven-manufacturing/",
        "press",
        "facts",
    ),
    src(
        "evreporter-conifer-pune-2025",
        "EVreporter",
        "Conifer to begin production of rare-earth free motors in Pune",
        "https://evreporter.com/conifer-to-begin-production-of-rare-earth-free-motors-in-pune/",
        "press",
        "facts",
    ),
    src(
        "umn-niron-founded",
        "University of Minnesota College of Science and Engineering",
        "Niron Magnetics, company that rose from Professor Jian-Ping Wang's research, awarded $17.5M DOE grant",
        "https://cse.umn.edu/node/128911",
        "press",
        "facts",
    ),
    src(
        "niron-about",
        "Niron Magnetics",
        "About Niron Magnetics",
        "https://www.nironmagnetics.com/about",
        "company-site",
        "facts",
    ),
    src(
        "chemeng-niron-sartell-2025",
        "Chemical Engineering",
        "Niron Magnetics breaks ground on rare-earth-free magnet manufacturing plant in Minnesota",
        "https://www.chemengonline.com/niron-magnetics-breaks-ground-on-rare-earth-free-magnet-manufacturing-plant-in-minnesota/",
        "press",
        "facts",
    ),
    src(
        "ie-niron-1500t-2027",
        "Interesting Engineering",
        "1,500 tons of rare-earth-free magnets set for annual US production starting 2027",
        "https://interestingengineering.com/innovation/1500-tons-of-rare-earth-free-magnets-set-for-annual-us-production-starting-2027",
        "press",
        "facts",
    ),
    // Artificial muscles
    src(
        "imechanica-hasel-2018",
        "iMechanica",
        "Acome, Kellaris, Morrissey, Mitchell, Keplinger: Hydraulically amplified self-healing electrostatic actuators (Science, 2018)",
        "https://www.imechanica.org/node/22096",
        "academic",
        "facts",
    ),
    src(
        "csail-hasel-keplinger",
        "MIT CSAIL",
        "HASEL artificial muscles: versatile high-performance actuators for a new generation of life-like robots",
        "https://www.csail.mit.edu/node/5829",
        "academic",
        "facts",
    ),
    src(
        "mpi-hasel-toolkit-2019",
        "Max Planck Institute for Intelligent Systems",
        "An easy-to-implement toolkit to create versatile and high-performance HASEL actuators for untethered soft robots",
        "https://rm.is.mpg.de/publications/keplinger19-as-softrobots",
        "academic",
        "facts",
    ),
    src(
        "srt-pelrine-dea-2000",
        "Soft Robotics Toolkit",
        "Pelrine et al.: High-speed electrically actuated elastomers with strain greater than 100% (Science, 2000)",
        "https://softroboticstoolkit.com/publications/high-speed-electrically-actuated-elastomers-strain-greater-100",
        "academic",
        "facts",
    ),
    src(
        "utd-fishing-line-muscles-2014",
        "UT Dallas News Center",
        "Researchers create powerful muscles from fishing line, thread",
        "https://news.utdallas.edu/science-technology/researchers-create-powerful-muscles-from-fishing-l",
        "press",
        "facts",
    ),
    src(
        "uow-haines-tcp-2014",
        "University of Wollongong Research Online",
        "Haines et al.: Artificial muscles from fishing line and sewing thread (Science, 2014)",
        "https://ro.uow.edu.au/aiimpapers/1012",
        "academic",
        "facts",
    ),
    src(
        "srep-coiled-polymer-efficiency-2016",
        "Scientific Reports",
        "Work efficiency of coiled polymer fibre actuators (2016)",
        "https://www.nature.com/articles/srep36358",
        "academic",
        "open",
    ),
    src(
        "nnci-story-of-nitinol",
        "National Nanotechnology Coordinated Infrastructure",
        "The story of Nitinol",
        "https://nnci.net/sites/default/files/2020-02/Story%20of%20Nitinol.pdf",
        "reference",
        "facts",
    ),
    src(
        "uktech-cml-2024",
        "UKTN",
        "Cambridge Mechatronics raises funding for its smartphone camera technology",
        "https://www.uktech.news/deep-tech/cambridge-mechatronics-smartphone-camera-20240214",
        "press",
        "facts",
    ),
    src(
        "counterpoint-sma-ois",
        "Counterpoint Research",
        "SMA OIS cameras ready for bigger smartphone focus",
        "https://www.counterpointresearch.com/insight/sma-ois-cameras-ready-for-bigger-smartphone-focus",
        "industry-report",
        "facts",
    ),
    src(
        "machinedesign-fluidic-muscle",
        "Machine Design",
        "Pumping iron (Festo fluidic muscle)",
        "https://www.machinedesign.com/archive/pumping-iron",
        "press",
        "facts",
    ),
    src(
        "tokyotech-hydraulic-muscle-2017",
        "Tokyo Institute of Technology",
        "Tokyo Tech and Bridgestone develop a high-power, hydraulically driven artificial muscle",
        "https://www.titech.ac.jp/english/news/2017/037286",
        "academic",
        "facts",
    ),
    src(
        "rdworld-protoclone-2025",
        "R&D World",
        "Protoclone V1: 1,000 artificial muscles power this sweating robot's human-like moves",
        "https://www.rdworldonline.com/protoclone-v1-1000-artificial-muscles-power-this-sweating-robots-human-like-moves/",
        "press",
        "facts",
    ),
    src(
        "fox-clone-alpha-2025",
        "Fox News",
        "Creepy humanoid robot moves using 1,000 eerie artificial muscles",
        "https://www.foxnews.com/tech/creepy-humanoid-robot-moves-using-1000-eerie-artificial-muscles",
        "press",
        "facts",
    ),
    // Hydraulic and electrohydraulic
    src(
        "ap-atlas-retired-2024",
        "WCAX (Associated Press)",
        "Boston Dynamics retires original Atlas humanoid robot after more than 10 years",
        "https://www.wcax.com/2024/04/18/boston-dynamics-retires-original-atlas-humanoid-robot-after-more-than-10-years/",
        "press",
        "facts",
    ),
    src(
        "icas-a380-flight-controls-2006",
        "ICAS 2006 (Airbus, D. van den Bossche)",
        "The A380 flight control electrohydrostatic actuators, achievements and lessons learnt",
        "https://icas.org/ICAS_ARCHIVE/ICAS2006/PAPERS/048.PDF",
        "academic",
        "facts",
    ),
    src(
        "haw-a380-flight-controls-2007",
        "HAW Hamburg (DGLR lecture)",
        "A380 flight controls (lecture slides, 2007)",
        "https://www.fzt.haw-hamburg.de/pers/Scholz/dglr/hh/text_2007_09_27_A380_Flight_Controls.pdf",
        "academic",
        "facts",
    ),
    src(
        "airbus-2h2e-2025",
        "Airbus",
        "Flight control system: more redundancy to enhance resilience",
        "https://www.airbus.com/en/newsroom/stories/2025-07-flight-control-system-more-redundancy-to-enhance-resilience",
        "company-site",
        "facts",
    ),
    // Transmissions
    src(
        "sumitomo-drive-profile",
        "Sumitomo Drive Technologies",
        "Company profile",
        "https://us.sumitomodrive.com/en-us/company-profile",
        "company-site",
        "facts",
    ),
    src(
        "sumitomo-drive-history",
        "Sumitomo Drive Technologies",
        "Our history",
        "https://japan.sumitomodrive.com/en-jp/our-history",
        "company-site",
        "facts",
    ),
    src(
        "pat-nabtesco-share",
        "Plant Automation Technology",
        "Nabtesco Motion Control: precision reduction gears for wide-ranging support of global frontier industries",
        "https://www.plantautomation-technology.com/suppliers/nabtesco-motion-control-inc",
        "press",
        "facts",
    ),
    src(
        "barrett-history",
        "Barrett Technology",
        "Our history",
        "https://barrett.com/history",
        "company-site",
        "facts",
    ),
    src(
        "humanoidguide-optimus-roller-screw",
        "humanoid.guide",
        "Linear vs rotary actuators: why Tesla bet on the roller screw",
        "https://humanoid.guide/linear-vs-rotary-actuators-humanoid-joints/",
        "press",
        "facts",
    ),
    src(
        "machinedesign-roller-screw",
        "Machine Design",
        "Actuators tackle the tough jobs (roller screws)",
        "https://www.machinedesign.com/archive/actuators-tackle-tough-jobs",
        "press",
        "facts",
    ),
    src(
        "ref-magnomatics-2014",
        "REF 2014 impact case study (University of Sheffield)",
        "Magnetic gears and pseudo direct drives",
        "https://impact.ref.ac.uk/CaseStudies/CaseStudy.aspx?Id=9035",
        "academic",
        "facts",
    ),
    src(
        "airframer-magnomatics-86kw",
        "Airframer",
        "Magnetic gear innovators reveal 86 kW motor",
        "https://www.airframer.com/news/story/magnetic-gear-innovators-reveal-86kw-motor",
        "press",
        "facts",
    ),
    src(
        "gov-uk-magnomatics",
        "GOV.UK",
        "Success story: Magnomatics friction-free gearbox nears production",
        "https://www.gov.uk/government/news/success-story-magnomatics-friction-free-gearbox-nears-production",
        "government",
        "open",
    ),
    src(
        "houston-fluxworks-2024",
        "Greater Houston Partnership",
        "Houston-area startup evolving NASA's technology (FluxWorks)",
        "https://houston.org/news/houston-area-startup-evolving-nasas-technology",
        "press",
        "facts",
    ),
    // Company sites for the registry records added with /alts
    src(
        "renault-site",
        "Renault Group",
        "Renault Group",
        "https://www.renaultgroup.com/en/",
        "company-site",
        "facts",
    ),
    src(
        "bmw-site",
        "BMW Group",
        "BMW Group",
        "https://www.bmwgroup.com/en.html",
        "company-site",
        "facts",
    ),
    src(
        "conifer-site",
        "Conifer",
        "Onshored electric powertrains",
        "https://conifer.io/",
        "company-site",
        "facts",
    ),
    src(
        "dnc-conifer-seed-2025",
        "Drives and Controls",
        "US developer raises $20m for magnet-agnostic axial-flux motors",
        "https://drivesncontrols.com/us-developer-raises-20m-for-magnet-agnostic-axial-flux-motors/",
        "press",
        "facts",
    ),
    src(
        "techsteel-conifer-2025",
        "Tech Steel and Materials",
        "Conifer's axial flux motors power ahead with rare-earth-free, China-free design",
        "https://www.techsteel.net/conifers-axial-flux-motors-power-ahead-with-rare-earth-free-china-free-design/",
        "press",
        "facts",
    ),
    src(
        "turntide-site",
        "Turntide Technologies",
        "Turntide Technologies",
        "https://turntide.com/",
        "company-site",
        "facts",
    ),
    src(
        "niron-site",
        "Niron Magnetics",
        "Niron Magnetics",
        "https://www.nironmagnetics.com/",
        "company-site",
        "facts",
    ),
    src(
        "artimus-site",
        "Artimus Robotics",
        "Artimus Robotics",
        "https://www.artimusrobotics.com/",
        "company-site",
        "facts",
    ),
    src(
        "cml-site",
        "Cambridge Mechatronics",
        "Cambridge Mechatronics",
        "https://www.cambridgemechatronics.com/",
        "company-site",
        "facts",
    ),
    src(
        "festo-site",
        "Festo",
        "Festo",
        "https://www.festo.com/",
        "company-site",
        "facts",
    ),
    src(
        "magnomatics-site",
        "Magnomatics",
        "Magnomatics",
        "https://www.magnomatics.com/",
        "company-site",
        "facts",
    ),
];
