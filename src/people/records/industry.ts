import type { DirectoryRecord } from "../directory";
import { src, web } from "./shared";

// /people records: Actuators and robots.
export const INDUSTRY: DirectoryRecord[] = [
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
                kind: "role",
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
    // To verify: the in-house actuator claim rests on secondary sources.
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
];
