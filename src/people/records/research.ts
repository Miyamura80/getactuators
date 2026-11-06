import type { DirectoryRecord } from "../directory";
import { src, web } from "./shared";

// /people records: Actuator research.
export const RESEARCH: DirectoryRecord[] = [
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
    // To verify: the role comes from a 2021 article.
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
];
