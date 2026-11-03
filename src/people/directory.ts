import type { DirectoryOrgId } from "./orgs";
import type { LinkKind } from "./types";

// The /people directory: researched leading voices in actuators and the
// rare-earth magnet chain. Professional facts only, each with a source from
// ./sources.ts (ids without the "people-" prefix are added by `src`). Roles
// were re-checked on PEOPLE_AS_OF; anyone listed can ask to be changed or
// removed through /contact.

export const PEOPLE_PATH = "/people";
export const PEOPLE_AS_OF = "2026-11-03";

export const PEOPLE_DOMAINS = ["research", "industry", "magnets", "policy"] as const;
export type PeopleDomain = (typeof PEOPLE_DOMAINS)[number];

export const DOMAIN_LABEL: Record<PeopleDomain, string> = {
    research: "Actuator research",
    industry: "Actuators and robots",
    magnets: "REE and magnets",
    policy: "Analysts and policy",
};

// Inclusion criteria, printed on the page. Each person meets at least one,
// backed by a public source.
export const CRITERIA = {
    invented:
        "Invented or co-invented an actuator or magnet technology that is in use or under serious development (a highly cited paper, patent family or product).",
    leads: "Leads (CEO, CTO, founder or head of actuators) an organisation in the supply-chain registry, the catalog or the humanoid map, or one building actuator, magnet or rare-earth capacity.",
    cited: "Is widely cited as an expert on rare earth or magnet supply by reputable press or government.",
    programme: "Leads a government programme on critical minerals or robot actuation.",
} as const;
export type Criterion = keyof typeof CRITERIA;

export const EXCLUSIONS =
    "Not listed: private individuals, people known only from social media, and anyone who asks to be removed. Only professional information is shown.";

export const KEY_WORK_KINDS = [
    "paper",
    "patent",
    "product",
    "company",
    "report",
    "award",
] as const;
export type KeyWorkKind = (typeof KEY_WORK_KINDS)[number];

export interface KeyWork {
    title: string;
    // Omitted when no source we checked dates it.
    year?: number;
    url: string;
    kind: KeyWorkKind;
}

export interface DirectoryRecord {
    id: string;
    name: string;
    // Name in the person's own script, when commonly used.
    localName?: string;
    role: string;
    orgId: DirectoryOrgId;
    // Earlier or secondary affiliations, drawn as extra edges in the network.
    alsoOrgIds?: DirectoryOrgId[];
    domain: PeopleDomain;
    criterion: Criterion;
    // At most 20 words, in our own words.
    whyTheyMatter: string;
    keyWorks: KeyWork[];
    // Source ids (in ./sources.ts) for the role, affiliation and criterion.
    sources: string[];
    links: { kind: LinkKind; url: string }[];
}

const src = (...ids: string[]) => ids.map((id) => `people-${id}`);
const web = (url: string) => [{ kind: "web" as const, url }];

export const DIRECTORY_RECORDS: DirectoryRecord[] = [
    // Actuator research
    {
        id: "sangbae-kim",
        name: "Sangbae Kim",
        role: "Robotics architect at Meta, on leave from MIT",
        orgId: "meta",
        alsoOrgIds: ["mit"],
        domain: "research",
        criterion: "invented",
        whyTheyMatter:
            "Led the MIT Cheetah work showing low-ratio proprioceptive actuators can absorb impacts and control force in legged robots.",
        keyWorks: [
            {
                title: "Proprioceptive actuator design in the MIT Cheetah",
                year: 2017,
                url: "https://dspace.mit.edu/handle/1721.1/119863",
                kind: "paper",
            },
            {
                title: "Mini Cheetah, the first four-legged robot to backflip",
                year: 2019,
                url: "https://news.mit.edu/2019/mit-mini-cheetah-first-four-legged-robot-to-backflip-0304",
                kind: "product",
            },
        ],
        sources: src(
            "wiki-sangbae-kim",
            "mit-cheetah-proprioceptive-2017",
            "mit-news-mini-cheetah-backflip-2019",
        ),
        links: web("https://en.wikipedia.org/wiki/Sangbae_Kim"),
    },
    {
        id: "benjamin-katz",
        name: "Benjamin Katz",
        role: "Robot designer at Boston Dynamics (as reported in 2021)",
        orgId: "boston-dynamics",
        alsoOrgIds: ["mit"],
        domain: "research",
        criterion: "invented",
        whyTheyMatter:
            "Lead developer of the Mini Cheetah and its cheap modular drone-motor actuator, since widely cloned.",
        keyWorks: [
            {
                title: "Mini Cheetah and its modular actuator (lead developer)",
                year: 2019,
                url: "https://news.mit.edu/2019/mit-mini-cheetah-first-four-legged-robot-to-backflip-0304",
                kind: "product",
            },
            {
                title: "From cheetah robots to humanoids (MIT News profile)",
                year: 2021,
                url: "https://news.mit.edu/2021/cheetah-noids-humanoids-benjamin-katz-1214",
                kind: "report",
            },
        ],
        sources: src("mit-news-katz-2021", "mit-news-mini-cheetah-backflip-2019"),
        links: web(
            "https://news.mit.edu/2021/cheetah-noids-humanoids-benjamin-katz-1214",
        ),
    },
    {
        id: "patrick-wensing",
        name: "Patrick Wensing",
        role: "Professor of aerospace and mechanical engineering, University of Notre Dame",
        orgId: "notre-dame",
        alsoOrgIds: ["mit"],
        domain: "research",
        criterion: "invented",
        whyTheyMatter:
            "Lead author of the impact-mitigation analysis behind proprioceptive actuators; now runs Notre Dame's legged robotics lab.",
        keyWorks: [
            {
                title: "Proprioceptive actuator design in the MIT Cheetah",
                year: 2017,
                url: "https://dspace.mit.edu/handle/1721.1/119863",
                kind: "paper",
            },
        ],
        sources: src("nd-wensing", "mit-cheetah-proprioceptive-2017"),
        links: web("https://sites.nd.edu/pwensing/"),
    },
    {
        id: "gill-pratt",
        name: "Gill Pratt",
        role: "CEO, Toyota Research Institute; Chief Scientist, Toyota",
        orgId: "toyota-research-institute",
        alsoOrgIds: ["mit"],
        domain: "research",
        criterion: "invented",
        whyTheyMatter:
            "Co-introduced the series elastic actuator at MIT in 1995, now widely used in force-controlled robot joints.",
        keyWorks: [
            {
                title: "Series elastic actuators (with Matthew Williamson)",
                year: 1995,
                url: "https://apps.dtic.mil/sti/tr/pdf/ADA299658.pdf",
                kind: "paper",
            },
        ],
        sources: src(
            "toyota-gill-pratt",
            "olin-gill-pratt",
            "dtic-series-elastic-1995",
        ),
        links: web(
            "https://global.toyota/en/company/profile/executives/fellow/gill_a_pratt.html",
        ),
    },
    {
        id: "jerry-pratt",
        name: "Jerry Pratt",
        role: "Co-founder, Persona AI",
        orgId: "persona-ai",
        alsoOrgIds: ["ihmc", "figure"],
        domain: "research",
        criterion: "leads",
        whyTheyMatter:
            "Spent two decades on legged robots at IHMC, was Figure's first CTO and now builds shipyard humanoids.",
        keyWorks: [
            {
                title: "Persona AI, humanoids for shipyards",
                year: 2024,
                url: "https://techcrunch.com/2024/06/26/personas-founders-are-certain-the-world-can-use-another-humanoid-robot",
                kind: "company",
            },
        ],
        sources: src("techcrunch-persona-2024"),
        links: web(
            "https://techcrunch.com/2024/06/26/personas-founders-are-certain-the-world-can-use-another-humanoid-robot",
        ),
    },
    {
        id: "hugh-herr",
        name: "Hugh Herr",
        role: "Professor and head of the Biomechatronics group, MIT Media Lab",
        orgId: "mit",
        domain: "research",
        criterion: "invented",
        whyTheyMatter:
            "Leads MIT's biomechatronics group, whose neural interface lets amputees control powered prosthetic limbs.",
        keyWorks: [
            {
                title: "Agonist-antagonist myoneural interface trial (NCT03913273)",
                url: "https://cdn.clinicaltrials.gov/large-docs/73/NCT03913273/ICF_002.pdf",
                kind: "report",
            },
            {
                title: "Upper-extremity amputation with AMI construction",
                year: 2025,
                url: "https://www.media.mit.edu/people/hherr/publications/",
                kind: "paper",
            },
        ],
        sources: src("mit-media-herr-publications", "clinicaltrials-ami"),
        links: web("https://www.media.mit.edu/people/hherr/publications/"),
    },
    {
        id: "christoph-keplinger",
        name: "Christoph Keplinger",
        role: "Director, Robotic Materials Department, Max Planck Institute for Intelligent Systems",
        orgId: "mpi-is",
        alsoOrgIds: ["artimus-robotics"],
        domain: "research",
        criterion: "invented",
        whyTheyMatter:
            "Principal inventor of HASEL electrohydraulic artificial muscles and co-founder of Artimus Robotics, which sells them.",
        keyWorks: [
            {
                title: "Artimus Robotics, co-founded to commercialise HASEL",
                year: 2018,
                url: "https://cyber-valley.de/en/news/christoph-keplinger-joins-the-max-planck-institute-for-intelligent-systems-as-new-director-cyvy",
                kind: "company",
            },
        ],
        sources: src("mpi-keplinger", "cyber-valley-keplinger"),
        links: web("https://is.mpg.de/en/person/ck"),
    },
    {
        id: "ray-baughman",
        name: "Ray Baughman",
        role: "Led the NanoTech Institute at UT Dallas",
        orgId: "ut-dallas",
        domain: "research",
        criterion: "invented",
        whyTheyMatter:
            "His group showed twisted, coiled fishing line works as a strong thermal muscle, opening cheap polymer actuators.",
        keyWorks: [
            {
                title: "Artificial muscles from fishing line and sewing thread (Science)",
                year: 2014,
                url: "https://news.utdallas.edu/science-technology/researchers-create-powerful-muscles-from-fishing-l",
                kind: "paper",
            },
        ],
        sources: src("utd-fishing-line-muscles-2014"),
        links: web(
            "https://news.utdallas.edu/science-technology/researchers-create-powerful-muscles-from-fishing-l",
        ),
    },
    {
        id: "jonathan-hurst",
        name: "Jonathan Hurst",
        role: "Co-founder and Chief Robot Officer, Agility Robotics; professor, Oregon State",
        orgId: "agility",
        alsoOrgIds: ["oregon-state"],
        domain: "research",
        criterion: "leads",
        whyTheyMatter:
            "Turned Oregon State's ATRIAS and Cassie leg research into Agility Robotics and its Digit humanoid.",
        keyWorks: [
            {
                title: "Agility Robotics, spun out of Oregon State",
                year: 2015,
                url: "https://news.oregonstate.edu/news/osu-spinout-agility-robotics-maker-legged-workplace-robots-secures-20-million-new-investment",
                kind: "company",
            },
        ],
        sources: src("wweek-hurst-2026", "osu-agility-2020"),
        links: web("https://engineering.oregonstate.edu/people/jonathan-hurst"),
    },
    {
        id: "alin-albu-schaeffer",
        name: "Alin Albu-Schäffer",
        role: "Director, DLR Institute of Robotics and Mechatronics; professor, TUM",
        orgId: "dlr",
        domain: "research",
        criterion: "invented",
        whyTheyMatter:
            "Leads DLR's robotics institute, known for variable impedance joints in compliant arms and hands.",
        keyWorks: [
            {
                title: "Variable impedance actuation for new humanoid bodies (DLR)",
                year: 2011,
                url: "https://archive.iar.kit.edu/workshops/humanoids2011/talks/Albu-Schaeffer-Humanoids2011-WS-New-Bodies-for-Humanoids.pdf",
                kind: "paper",
            },
        ],
        sources: src("tum-albu-schaeffer", "kit-albu-schaeffer-2011"),
        links: web("https://www.professoren.tum.de/en/albu-schaeffer-alin"),
    },
    {
        id: "sami-haddadin",
        name: "Sami Haddadin",
        role: "Vice President for Research, MBZUAI; co-founder, Franka Emika",
        orgId: "mbzuai",
        alsoOrgIds: ["franka"],
        domain: "research",
        criterion: "leads",
        whyTheyMatter:
            "Co-founded Franka Emika, maker of the Franka research arm; now leads research at MBZUAI.",
        keyWorks: [
            {
                title: "Franka Emika (co-founder)",
                url: "https://franka.de/",
                kind: "company",
            },
        ],
        sources: src("wiki-sami-haddadin", "mbzuai-research"),
        links: web("https://en.wikipedia.org/wiki/Sami_Haddadin"),
    },
    {
        id: "koichi-suzumori",
        name: "Koichi Suzumori",
        role: "Professor, Institute of Science Tokyo",
        orgId: "science-tokyo",
        domain: "research",
        criterion: "invented",
        whyTheyMatter:
            "Pioneered thin McKibben muscles and, with Bridgestone, a hydraulic artificial muscle running at ten times usual pressure.",
        keyWorks: [
            {
                title: "Hydraulic high-power artificial muscle (with Bridgestone)",
                year: 2017,
                url: "https://www.titech.ac.jp/english/news/2017/037286.html",
                kind: "product",
            },
            {
                title: "Commercialised small-diameter artificial muscles (JSME award)",
                year: 2020,
                url: "https://jsme.or.jp/english/about/awards/2020-2/award2020-nt4",
                kind: "award",
            },
        ],
        sources: src("titech-hydraulic-muscle-2017", "jsme-thin-muscle-2020"),
        links: web("https://www.titech.ac.jp/english/news/2017/037286.html"),
    },
    // Actuators and robots
    {
        id: "wang-xingxing",
        name: "Wang Xingxing",
        localName: "王兴兴",
        role: "Founder, chairman and CEO, Unitree Robotics",
        orgId: "unitree",
        domain: "industry",
        criterion: "leads",
        whyTheyMatter:
            "Founded Unitree, whose low-priced quadrupeds and humanoids run on joint motors the company makes itself.",
        keyWorks: [
            {
                title: "Unitree lists on Shanghai's STAR Market",
                year: 2026,
                url: "https://www.scmp.com/tech/article/3347611/inside-unitrees-landmark-ipo-what-know-about-chinas-humanoid-giant",
                kind: "company",
            },
        ],
        sources: src("wirechina-wang-xingxing", "scmp-unitree-ipo-2026"),
        links: web(
            "https://www.thewirechina.com/whos_who/wang-xingxing-%e7%8e%8b%e5%85%b4%e5%85%b4/",
        ),
    },
    {
        id: "jeff-cardenas",
        name: "Jeff Cardenas",
        role: "Co-founder and CEO, Apptronik",
        orgId: "apptronik",
        domain: "industry",
        criterion: "leads",
        whyTheyMatter:
            "Runs Apptronik, maker of the Apollo humanoid, with close to US$1B raised for industrial deployment.",
        keyWorks: [
            {
                title: "Apollo humanoid",
                year: 2023,
                url: "https://www.therobotreport.com/apptronik-ceo-jeff-cardenas-details-the-apollo-humanoid/",
                kind: "product",
            },
        ],
        sources: src("robot-report-cardenas", "dallas-innovates-apptronik-2026"),
        links: web(
            "https://www.therobotreport.com/apptronik-ceo-jeff-cardenas-details-the-apollo-humanoid/",
        ),
    },
    {
        id: "dhanush-radhakrishnan",
        name: "Dhanush Radhakrishnan",
        role: "Co-founder and CEO, Clone Robotics",
        orgId: "clone-robotics",
        domain: "industry",
        criterion: "invented",
        whyTheyMatter:
            "Co-founded Clone, which drives a humanoid with water-powered Myofiber artificial muscles instead of motors.",
        keyWorks: [
            {
                title: "Clone Alpha, a humanoid on artificial muscles",
                year: 2025,
                url: "https://www.maginative.com/article/meet-clone-alpha-a-humanoid-robot-built-with-synthetic-organs-and-artificial-muscles/",
                kind: "product",
            },
        ],
        sources: src("maginative-clone-alpha", "humanoid-guide-protoclone"),
        links: web(
            "https://www.maginative.com/article/meet-clone-alpha-a-humanoid-robot-built-with-synthetic-organs-and-artificial-muscles/",
        ),
    },
    {
        id: "lukasz-kozlik",
        name: "Łukasz Koźlik",
        role: "Co-founder and CTO, Clone Robotics",
        orgId: "clone-robotics",
        domain: "industry",
        criterion: "invented",
        whyTheyMatter:
            "Began the McKibben-muscle experiments behind Clone's Myofiber, a single-piece muscle and tendon unit.",
        keyWorks: [
            {
                title: "Protoclone V1 design",
                url: "https://humanoid.guide/?p=12355",
                kind: "product",
            },
        ],
        sources: src("humanoid-guide-protoclone", "maginative-clone-alpha"),
        links: web("https://humanoid.guide/?p=12355"),
    },
    {
        id: "bernt-bornich",
        name: "Bernt Børnich",
        role: "Founder and CEO, 1X Technologies",
        orgId: "1x",
        domain: "industry",
        criterion: "leads",
        whyTheyMatter:
            "His company drives the NEO home humanoid with high torque-density motors on tendon transmissions.",
        keyWorks: [
            {
                title: "NEO home robot launch",
                year: 2025,
                url: "https://www.businesswire.com/news/home/20251027434628/en/1X-Launches-NEO-The-Robot-Redefining-Life-at-Home",
                kind: "product",
            },
        ],
        sources: src("wiki-1x", "businesswire-1x-neo-2025"),
        links: web("https://en.wikipedia.org/wiki/1X_Technologies"),
    },
    {
        id: "zuo-yuyu",
        name: "Zuo Yuyu",
        role: "Founder and chairman, Leaderdrive",
        orgId: "leaderdrive",
        domain: "industry",
        criterion: "leads",
        whyTheyMatter:
            "Built China's largest harmonic reducer maker, the main domestic alternative to Harmonic Drive in robot joints.",
        keyWorks: [
            {
                title: "Leader Harmonious Drive Systems founded",
                year: 2011,
                url: "https://e.vnexpress.net/news/tech/personalities/chinese-brothers-behind-robot-joint-maker-leaderdrive-become-billionaires-as-humanoid-demand-surges-5066573.html",
                kind: "company",
            },
        ],
        sources: src("vnexpress-leaderdrive"),
        links: web(
            "https://e.vnexpress.net/news/tech/personalities/chinese-brothers-behind-robot-joint-maker-leaderdrive-become-billionaires-as-humanoid-demand-surges-5066573.html",
        ),
    },
    {
        id: "oh-jun-ho",
        name: "Oh Jun-ho",
        role: "Head of the Future Robotics Office, Samsung Electronics; KAIST professor emeritus",
        orgId: "samsung",
        alsoOrgIds: ["kaist", "rainbow-robotics"],
        domain: "industry",
        criterion: "leads",
        whyTheyMatter:
            "Built the HUBO humanoids, co-founded Rainbow Robotics and now leads Samsung's robot programme.",
        keyWorks: [
            {
                title: "Samsung becomes Rainbow Robotics' largest shareholder",
                year: 2025,
                url: "https://news.samsung.com/global/samsung-electronics-to-become-largest-shareholder-in-rainbow-robotics",
                kind: "company",
            },
            {
                title: "Elected President of the Korea AI and Robot Industry Association",
                year: 2026,
                url: "https://ifr.org/ifr-press-releases/news/dr-junho-oh-elected-as-new-president-of-kar",
                kind: "award",
            },
        ],
        sources: src("samsung-rainbow-2025", "ifr-kar-oh-2026"),
        links: web(
            "https://ifr.org/ifr-press-releases/news/dr-junho-oh-elected-as-new-president-of-kar",
        ),
    },
    {
        id: "marc-raibert",
        name: "Marc Raibert",
        role: "Executive director, RAI Institute; founder, Boston Dynamics",
        orgId: "rai-institute",
        alsoOrgIds: ["boston-dynamics", "mit"],
        domain: "industry",
        criterion: "leads",
        whyTheyMatter:
            "Founded Boston Dynamics, whose BigDog, Spot and Atlas defined what dynamic legged robots can do.",
        keyWorks: [
            {
                title: "Boston Dynamics (founder)",
                year: 1992,
                url: "https://en.wikipedia.org/wiki/Marc_Raibert",
                kind: "company",
            },
        ],
        sources: src("wiki-marc-raibert"),
        links: web("https://en.wikipedia.org/wiki/Marc_Raibert"),
    },
    {
        id: "josh-pieper",
        name: "Josh Pieper",
        role: "Founder, mjbots Robotic Systems",
        orgId: "mjbots",
        domain: "industry",
        criterion: "leads",
        whyTheyMatter:
            "Publishes the open-source moteus controller and quasi-direct-drive actuators used in hobby and research legged robots.",
        keyWorks: [
            {
                title: "moteus brushless controller",
                url: "https://hackaday.io/project/179234-moteus-brushless-controller",
                kind: "product",
            },
            {
                title: "mjbots quad, an open dynamic quadruped",
                url: "https://hackaday.io/project/167845-mjbots-quad",
                kind: "product",
            },
        ],
        sources: src("hackaday-mjbots-quad", "hackaday-moteus"),
        links: web("https://hackaday.io/project/167845-mjbots-quad"),
    },
    {
        id: "zhou-jian",
        name: "Zhou Jian",
        localName: "周剑",
        role: "Founder, chairman and CEO, UBTech Robotics",
        orgId: "ubtech",
        domain: "industry",
        criterion: "leads",
        whyTheyMatter:
            "Started UBTech on servo actuators for small humanoids; it now builds the Walker S industrial humanoid.",
        keyWorks: [
            {
                title: "UBTech Robotics founded in Shenzhen",
                year: 2012,
                url: "https://www.sz.gov.cn/en_szgov/news/latest/content/post_11247031.html",
                kind: "company",
            },
        ],
        sources: src("sz-gov-ubtech"),
        links: web(
            "https://www.sz.gov.cn/en_szgov/news/latest/content/post_11247031.html",
        ),
    },
    {
        id: "gu-jie",
        name: "Gu Jie (Alex Gu)",
        localName: "顾捷",
        role: "Founder and CEO, Fourier",
        orgId: "fourier",
        domain: "industry",
        criterion: "leads",
        whyTheyMatter:
            "Took Fourier from rehabilitation robots and exoskeletons to the GR-1 and GR-2 humanoids.",
        keyWorks: [
            {
                title: "GR-1 humanoid unveiled",
                year: 2023,
                url: "https://yicaiglobal.com/news/20230706-04-chinas-fourier-intelligence-debuts-general-purpose-humanoid-robot-at-world-ai-conference",
                kind: "product",
            },
        ],
        sources: src("kr-asia-gu-jie", "yicai-fourier-gr1-2023"),
        links: web(
            "https://kr-asia.com/fourier-intelligences-founder-breaks-down-whats-next-for-humanoid-robots",
        ),
    },
    {
        id: "brett-adcock",
        name: "Brett Adcock",
        role: "Founder and CEO, Figure AI",
        orgId: "figure",
        domain: "industry",
        criterion: "leads",
        whyTheyMatter:
            "Runs Figure, which designs and builds its humanoid actuators in house rather than buying them.",
        keyWorks: [
            {
                title: "Figure AI (founder)",
                year: 2022,
                url: "https://en.wikipedia.org/wiki/Figure_AI",
                kind: "company",
            },
        ],
        sources: src("wiki-figure-ai", "watkins-figure-ai"),
        links: web("https://en.wikipedia.org/wiki/Figure_AI"),
    },
    // REE and magnets
    {
        id: "james-litinsky",
        name: "James Litinsky",
        role: "Founder, chairman and CEO, MP Materials",
        orgId: "mp-materials",
        domain: "magnets",
        criterion: "leads",
        whyTheyMatter:
            "Runs the main US rare earth miner and restarted US NdFeB magnet production in 2025.",
        keyWorks: [
            {
                title: "US rare earth magnet production restored at Independence",
                year: 2025,
                url: "https://www.businesswire.com/news/home/20250122740803/en/MP-Materials-Restores-U.S.-Rare-Earth-Magnet-Production",
                kind: "product",
            },
            {
                title: "10X magnet campus in Northlake, Texas",
                year: 2026,
                url: "https://mpmaterials.com/news/mp-materials-selects-northlake-texas-as-the-site-of-10x-a-new-us-rare-earth-magnet-manufacturing-campus/",
                kind: "company",
            },
        ],
        sources: src("mp-northlake-2026", "businesswire-mp-magnets-2025"),
        links: web(
            "https://mpmaterials.com/news/mp-materials-selects-northlake-texas-as-the-site-of-10x-a-new-us-rare-earth-magnet-manufacturing-campus/",
        ),
    },
    {
        id: "amanda-lacaze",
        name: "Amanda Lacaze",
        role: "Former CEO and managing director, Lynas Rare Earths (2014 to June 2026)",
        orgId: "lynas",
        domain: "magnets",
        criterion: "leads",
        whyTheyMatter:
            "Ran the largest rare earth producer outside China for twelve years, including heavy rare earth supply deals with Japan.",
        keyWorks: [
            {
                title: "A$200m Japanese investment for Dy and Tb supply",
                year: 2023,
                url: "https://www.miningweekly.com/print-version/lynas-gets-a-a200m-investment-from-japanese-partners-2023-03-07",
                kind: "company",
            },
        ],
        sources: src("miningweekly-lacaze-2026", "miningweekly-lynas-japan-2023"),
        links: web(
            "https://www.miningweekly.com/article/lynas-rare-earths-ceo-to-retire-after-over-a-decade-in-role-2026-01-13",
        ),
    },
    {
        id: "rahim-suleman",
        name: "Rahim Suleman",
        role: "President and CEO, Neo Performance Materials",
        orgId: "neo-performance",
        domain: "magnets",
        criterion: "leads",
        whyTheyMatter:
            "Opened Neo's sintered magnet plant in Narva, Estonia, a first step towards a European magnet supply.",
        keyWorks: [
            {
                title: "Narva permanent magnet plant opens",
                year: 2025,
                url: "https://www.marketscreener.com/news/neo-performance-materials-opens-state-of-the-art-permanent-magnet-facility-in-europe-ce7d58dfdc80f220",
                kind: "product",
            },
        ],
        sources: src("northernminer-neo-ceo", "marketscreener-neo-narva-2025"),
        links: web(
            "https://northernminer.com/news/neo-performance-materials-begins-estonia-rare-earth-magnet-plant-build-under-new-ceo-reins/1003856575",
        ),
    },
    {
        id: "scott-dunn",
        name: "Scott Dunn",
        role: "Co-founder and CEO, Noveon Magnetics",
        orgId: "noveon",
        domain: "magnets",
        criterion: "leads",
        whyTheyMatter:
            "Runs Noveon, described as the only operating US sintered NdFeB maker, which can use recycled magnet scrap as feed.",
        keyWorks: [
            {
                title: "Five-year magnet supply agreement with Nidec",
                url: "https://www.metal-powder.tech/?p=281219",
                kind: "company",
            },
        ],
        sources: src("noveon-about", "metal-powder-noveon-nidec"),
        links: web("https://noveon.co/about-0"),
    },
    {
        id: "jonathan-rowntree",
        name: "Jonathan Rowntree",
        role: "CEO, Niron Magnetics",
        orgId: "niron",
        domain: "magnets",
        criterion: "leads",
        whyTheyMatter:
            "Scaling iron nitride, a magnet with no rare earths, from pilot line to a 1,500 t a year plant.",
        keyWorks: [
            {
                title: "Ground broken on the Sartell, Minnesota magnet plant",
                year: 2025,
                url: "https://www.businesswire.com/news/home/20250929097968/en/Niron-Magnetics-Changes-Game-by-Breaking-Ground-on-Rare-Earth-Free-Magnet-Facility",
                kind: "company",
            },
        ],
        sources: src("caa-rowntree", "businesswire-niron-sartell-2025"),
        links: web(
            "https://capitalanalyticsassociates.com/jonathan-rowntree-ceo-niron-magnetics/",
        ),
    },
    {
        id: "cai-baogui",
        name: "Cai Baogui",
        role: "Co-founder, chairman and CEO, JL MAG Rare-Earth",
        orgId: "jl-mag",
        domain: "magnets",
        criterion: "leads",
        whyTheyMatter:
            "Chairs and runs JL MAG, a Ganzhou NdFeB magnet maker listed in Shenzhen and Hong Kong.",
        keyWorks: [
            {
                title: "Re-elected chairman and appointed CEO (HKEX filing)",
                year: 2024,
                url: "https://www1.hkexnews.hk/listedco/listconews/sehk/2024/0612/2024061201561.pdf",
                kind: "report",
            },
        ],
        sources: src("hkex-jl-mag-2024"),
        links: web(
            "https://www1.hkexnews.hk/listedco/listconews/sehk/2024/0612/2024061201561.pdf",
        ),
    },
    {
        id: "masato-sagawa",
        name: "Masato Sagawa",
        role: "Inventor of the sintered NdFeB magnet; adviser to Daido Steel",
        orgId: "daido-steel",
        domain: "magnets",
        criterion: "invented",
        whyTheyMatter:
            "Invented the sintered NdFeB magnet in 1982, the strongest type of permanent magnet in use.",
        keyWorks: [
            {
                title: "Queen Elizabeth Prize for Engineering",
                year: 2022,
                url: "https://qeprize.org/news/nd-fe-b-permanent-magnet-developer-wins-2022-queen-elizabeth-prize-for-engineering",
                kind: "award",
            },
            {
                title: "Sintered Nd-Fe-B permanent magnet",
                year: 1982,
                url: "https://www.japan.go.jp/kizuna/2022/04/magnet_innovation.html",
                kind: "product",
            },
        ],
        sources: src(
            "qeprize-sagawa-2022",
            "japan-gov-sagawa",
            "spectrum-ndfeb-magnet",
        ),
        links: web(
            "https://qeprize.org/news/nd-fe-b-permanent-magnet-developer-wins-2022-queen-elizabeth-prize-for-engineering",
        ),
    },
    {
        id: "john-croat",
        name: "John Croat",
        role: "Co-inventor of the NdFeB magnet at General Motors Research; former Magnequench managing director",
        orgId: "general-motors",
        domain: "magnets",
        criterion: "invented",
        whyTheyMatter:
            "Found NdFeB independently at GM by melt spinning, the process GM's Magnequench later commercialised.",
        keyWorks: [
            {
                title: "Honda Prize, shared for the neodymium magnet",
                year: 2023,
                url: "https://www.hondafoundation.jp/winner/view_en/1661",
                kind: "award",
            },
        ],
        sources: src("spectrum-ndfeb-magnet", "honda-prize-croat-2023"),
        links: web(
            "https://spectrum.ieee.org/the-men-who-made-the-magnet-that-made-the-modern-world",
        ),
    },
    {
        id: "erik-eschen",
        name: "Erik Eschen",
        role: "CEO, VAC Group (VACUUMSCHMELZE and eVAC Magnetics)",
        orgId: "vac",
        alsoOrgIds: ["energy-fuels"],
        domain: "magnets",
        criterion: "leads",
        whyTheyMatter:
            "Leads the German magnet maker that opened a US sintered magnet plant in South Carolina in 2026.",
        keyWorks: [
            {
                title: "eVAC magnet plant opens in Sumter, South Carolina",
                year: 2026,
                url: "https://vacuumschmelze.com/02_Pressreleases/2026/2026-07-16_Opening%20Ceremony%20Sumter.pdf",
                kind: "company",
            },
        ],
        sources: src("fastmarkets-evac-sc", "vac-sumter-opening-2026"),
        links: web(
            "https://fastmarkets.com/insights/e-vac-to-build-rare-earth-magnet-plant-in-south-carolina",
        ),
    },
    {
        id: "mark-chalmers",
        name: "Mark Chalmers",
        role: "President and CEO, Energy Fuels",
        orgId: "energy-fuels",
        domain: "magnets",
        criterion: "leads",
        whyTheyMatter:
            "Added NdPr oxide separation to the White Mesa uranium mill in Utah, in commercial production since 2024.",
        keyWorks: [
            {
                title: "Commercial separated NdPr at the White Mesa mill",
                year: 2024,
                url: "https://northernminer.com/news/energy-fuels-begins-commercial-production-of-separated-rare-earths-at-white-mesa/1003868391",
                kind: "product",
            },
            {
                title: "Phase 2 rare earth expansion feasibility study",
                year: 2026,
                url: "https://finviz.com/news/277059/energy-fuels-us-rare-earth-processing-expansion-boasts-lower-than-expected-capex-significant-annual-ebitda-and-among-the-lowest-cost-ndpr-production-in-the-world",
                kind: "report",
            },
        ],
        sources: src("northernminer-energy-fuels-ree", "finviz-energy-fuels-phase2"),
        links: web(
            "https://northernminer.com/news/energy-fuels-begins-commercial-production-of-separated-rare-earths-at-white-mesa/1003868391",
        ),
    },
    // Analysts and policy
    {
        id: "ryan-castilloux",
        name: "Ryan Castilloux",
        role: "Founder and managing director, Adamas Intelligence",
        orgId: "adamas",
        domain: "policy",
        criterion: "cited",
        whyTheyMatter:
            "His firm's magnet and rare earth demand forecasts are quoted by producers, investors and the press.",
        keyWorks: [
            {
                title: "Rare Earth Magnet Market Outlook to 2040",
                url: "https://www.adamasintel.com/report/rare-earth-magnet-market-outlook-to-2040/",
                kind: "report",
            },
        ],
        sources: src("mining-castilloux-hype", "adamas-magnet-outlook-2040"),
        links: web(
            "https://www.mining.com/web/ryan-castilloux-sorting-reality-from-hype-in-the-crowded-rare-earth-industry/",
        ),
    },
    {
        id: "gracelin-baskaran",
        name: "Gracelin Baskaran",
        role: "Director, Critical Minerals Security Program, CSIS",
        orgId: "csis",
        domain: "policy",
        criterion: "cited",
        whyTheyMatter:
            "Mining economist whose CSIS work on rare earth processing and export controls is cited by Congress and press.",
        keyWorks: [
            {
                title: "Senate HELP Committee testimony",
                url: "https://www.help.senate.gov/download/baskaran-testimonypdf",
                kind: "report",
            },
        ],
        sources: src("csis-baskaran-2024", "senate-baskaran-testimony"),
        links: web(
            "https://www.csis.org/news/csis-names-gracelin-baskaran-director-critical-minerals-security-program",
        ),
    },
    {
        id: "tom-lograsso",
        name: "Tom Lograsso",
        role: "Director, Critical Materials Innovation Hub (US DOE), Ames National Laboratory",
        orgId: "ames-lab",
        domain: "policy",
        criterion: "programme",
        whyTheyMatter:
            "Directs the DOE hub for research on rare earth supply, magnet substitutes and recycling.",
        keyWorks: [
            {
                title: "R&D 100 Leader of the Year",
                year: 2025,
                url: "https://www.ameslab.gov/cmi/research-highlights/cmi-director-tom-lograsso-named-2025-r-d-leader-of-the-year",
                kind: "award",
            },
            {
                title: "House Science Committee testimony",
                url: "https://republicans-science.house.gov/_cache/files/8/0/808fcf3a-be92-4cad-b21c-e86378f5a89d/D9209E1E1FC8252C5AE9D9DD2530AE4DCFB115F5117804B4BF5EA036DFF52BBE.dr.-thomas-lograsso-testimony.pdf",
                kind: "report",
            },
        ],
        sources: src("ameslab-lograsso-2025", "house-lograsso-testimony"),
        links: web(
            "https://www.ameslab.gov/cmi/research-highlights/cmi-director-tom-lograsso-named-2025-r-d-leader-of-the-year",
        ),
    },
    {
        id: "tae-yoon-kim",
        name: "Tae-Yoon Kim",
        role: "Head of the Critical Minerals Division, International Energy Agency",
        orgId: "iea",
        domain: "policy",
        criterion: "programme",
        whyTheyMatter:
            "Lead author of the IEA's critical minerals outlooks and head of its Critical Minerals Security Programme.",
        keyWorks: [
            {
                title: "Global Critical Minerals Outlook 2026",
                year: 2026,
                url: "https://iea.org/reports/global-critical-minerals-outlook-2026",
                kind: "report",
            },
        ],
        sources: src("benchmark-events-tae-yoon-kim", "iea-gcmo-2026"),
        links: web(
            "https://benchmarkevents.benchmarkminerals.com/summit-toronto/speaker/2162420/tae-yoon-kim",
        ),
    },
    {
        id: "chen-zhanheng",
        name: "Chen Zhanheng",
        role: "Deputy Secretary-General, Association of China Rare Earth Industry",
        orgId: "china-rare-earth-assoc",
        domain: "policy",
        criterion: "cited",
        whyTheyMatter:
            "A long-standing industry voice on Chinese rare earth policy, quoted on consolidation and export rules.",
        keyWorks: [
            {
                title: "Interview on China's rare earth industry (Chinese Society of Rare Earths)",
                url: "https://www.theanchorhouse.com/?cat=3",
                kind: "report",
            },
        ],
        sources: src("cae-chen-zhanheng", "anchorhouse-chen-zhanheng"),
        links: web("https://www.theanchorhouse.com/?cat=3"),
    },
    {
        id: "neha-mukherjee",
        name: "Neha Mukherjee",
        role: "Senior analyst, rare earths, Benchmark Mineral Intelligence",
        orgId: "benchmark",
        domain: "policy",
        criterion: "cited",
        whyTheyMatter:
            "Covers rare earth supply, demand and prices at Benchmark; widely quoted on China's 2025 export controls.",
        keyWorks: [
            {
                title: "Interview on diversifying rare earth supply",
                year: 2025,
                url: "https://www.tribuneindia.com/news/business/secure-rare-earths-supply-chain-by-diversifying-sources-expert-neha-mukherjee-as-china-tightens-grip/amp",
                kind: "report",
            },
        ],
        sources: src("benchmark-mukherjee", "tribune-mukherjee-2025"),
        links: web("https://source.benchmarkminerals.com/authors/neha-mukherjee"),
    },
    {
        id: "kristin-vekasi",
        name: "Kristin Vekasi",
        role: "Mansfield Chair of Japanese and Indo-Pacific Affairs, University of Montana",
        orgId: "u-montana",
        domain: "policy",
        criterion: "cited",
        whyTheyMatter:
            "Political scientist on Japan's rare earth strategy after the 2010 embargo; has testified to the US-China Commission.",
        keyWorks: [
            {
                title: "Testimony to the U.S.-China Economic and Security Review Commission",
                year: 2022,
                url: "https://www.uscc.gov/sites/default/files/2022-06/Kristin_Vekasi_Testimony.pdf",
                kind: "report",
            },
        ],
        sources: src("umt-vekasi", "uscc-vekasi-2022"),
        links: web(
            "https://www.umt.edu/mansfield/dialogues/mansfield-dialogues/speaker-pages/kristin_vekasi.php",
        ),
    },
    {
        id: "morgan-bazilian",
        name: "Morgan Bazilian",
        role: "Director, Payne Institute for Public Policy, Colorado School of Mines",
        orgId: "colorado-mines",
        domain: "policy",
        criterion: "cited",
        whyTheyMatter:
            "Testifies to Congress on critical minerals and China's hold on rare earth processing.",
        keyWorks: [
            {
                title: "State of Critical Minerals Report (first edition)",
                year: 2023,
                url: "https://www.mines.edu/news/all-news/2023/payne-institute-for-public-policy-releases-first-annual-state-of-critical-minerals-report.html",
                kind: "report",
            },
        ],
        sources: src("cfr-bazilian", "mines-critical-minerals-report-2023"),
        links: web(
            "https://www.cfr.org/podcasts/critical-minerals-and-china-morgan-bazilian",
        ),
    },
];
