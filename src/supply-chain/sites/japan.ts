import { type Site, hq } from "./types";

// Headquarters of the /japan companies (pinned to their city) and of the
// foreign partners their supply links reach. Plants are in ./japan-plants.

const jp = (
    id: string,
    companyId: string,
    name: string,
    admin1: string,
    lat: number,
    lon: number,
    sources: string[],
): Site =>
    hq(id, {
        companyId,
        name: `${name} headquarters`,
        country: "JP",
        admin1,
        lat,
        lon,
        sources,
    });

export const JAPAN_SITES: Site[] = [
    // Rare earths and trading
    jp("jogmec-tokyo", "jogmec", "JOGMEC", "Tokyo", 35.668, 139.749, ["jogmec-site"]),
    jp("sojitz-tokyo", "sojitz", "Sojitz", "Tokyo", 35.672, 139.757, ["sojitz-site"]),
    jp("jare-tokyo", "jare", "JARE", "Tokyo", 35.671, 139.756, [
        "argus-lynas-japan-2023",
    ]),
    jp("toyotsu-nagoya", "toyota-tsusho", "Toyota Tsusho", "Aichi", 35.171, 136.882, [
        "toyota-tsusho-site",
    ]),
    {
        ...jp("santoku-kobe", "santoku", "Santoku", "Hyogo", 34.715, 135.26, [
            "hyogo-santoku",
        ]),
        name: "Santoku headquarters and alloy works",
        makes: ["Rare earth metals", "Strip-cast NdFeB alloys"],
        stages: ["metal-alloy"],
    },
    jp("iwatani-osaka", "iwatani", "Iwatani", "Osaka", 34.684, 135.503, [
        "iwatani-site",
    ]),
    jp("resonac-tokyo", "resonac", "Resonac", "Tokyo", 35.664, 139.757, [
        "resonac-site",
    ]),
    jp("aichi-steel-tokai", "aichi-steel", "Aichi Steel", "Aichi", 35.02, 136.9, [
        "aichi-steel-site",
    ]),
    // Magnets and motors
    jp("proterial-tokyo", "proterial", "Proterial", "Tokyo", 35.655, 139.796, [
        "proterial-site",
    ]),
    jp("tdk-tokyo", "tdk", "TDK", "Tokyo", 35.684, 139.774, ["tdk-site"]),
    jp("daido-nagoya", "daido-steel", "Daido Steel", "Aichi", 35.178, 136.92, [
        "daido-site",
    ]),
    jp(
        "melco-tokyo",
        "mitsubishi-electric",
        "Mitsubishi Electric",
        "Tokyo",
        35.681,
        139.765,
        ["melco-site"],
    ),
    jp("tamagawa-iida", "tamagawa-seiki", "Tamagawa Seiki", "Nagano", 35.515, 137.82, [
        "tamagawa-site",
    ]),
    jp("oriental-tokyo", "oriental-motor", "Oriental Motor", "Tokyo", 35.708, 139.777, [
        "oriental-site",
    ]),
    jp("sanyo-denki-tokyo", "sanyo-denki", "Sanyo Denki", "Tokyo", 35.728, 139.73, [
        "sanyo-denki-site",
    ]),
    {
        ...jp(
            "shinano-ueda",
            "shinano-kenshi",
            "Shinano Kenshi",
            "Nagano",
            36.33,
            138.25,
            ["shinano-site"],
        ),
        name: "Shinano Kenshi headquarters and motor works",
        makes: ["Stepper motors", "Brushless DC motors"],
        stages: ["motor"],
    },
    // Gears, screws and bearings
    jp("nabtesco-tokyo", "nabtesco", "Nabtesco", "Tokyo", 35.684, 139.744, [
        "nabtesco-site",
    ]),
    jp(
        "shi-tokyo",
        "sumitomo-heavy",
        "Sumitomo Heavy Industries",
        "Tokyo",
        35.62,
        139.728,
        ["shi-site"],
    ),
    jp("thk-tokyo", "thk", "THK", "Tokyo", 35.642, 139.748, ["thk-history"]),
    jp("nsk-tokyo", "nsk", "NSK", "Tokyo", 35.622, 139.733, ["nsk-site"]),
    jp("ntn-osaka", "ntn", "NTN", "Osaka", 34.686, 135.49, ["ntn-site"]),
    jp("jtekt-kariya", "jtekt", "JTEKT", "Aichi", 34.989, 137.002, ["jtekt-site"]),
    jp("iko-tokyo", "nippon-thompson", "Nippon Thompson", "Tokyo", 35.637, 139.738, [
        "iko-site",
    ]),
    {
        ...jp(
            "minebea-miyota",
            "minebea-mitsumi",
            "MinebeaMitsumi",
            "Nagano",
            36.326,
            138.51,
            ["minebea-site"],
        ),
        name: "MinebeaMitsumi headquarters and Karuizawa plant",
        makes: ["Miniature ball bearings"],
        stages: ["bearing"],
    },
    jp(
        "tsubaki-osaka",
        "tsubakimoto-chain",
        "Tsubakimoto Chain",
        "Osaka",
        34.693,
        135.494,
        ["tsubaki-site"],
    ),
    // Robot and actuator makers
    jp(
        "khi-kobe",
        "kawasaki-heavy",
        "Kawasaki Heavy Industries",
        "Hyogo",
        34.678,
        135.188,
        ["khi-site"],
    ),
    {
        ...jp("denso-wave-agui", "denso-wave", "Denso Wave", "Aichi", 34.93, 136.92, [
            "denso-wave-site",
        ]),
        name: "Denso Wave headquarters and robot works",
        makes: ["Industrial robots"],
        stages: ["robot"],
    },
    jp("epson-suwa", "seiko-epson", "Seiko Epson", "Nagano", 36.04, 138.115, [
        "epson-site",
    ]),
    jp(
        "nachi-toyama",
        "nachi-fujikoshi",
        "Nachi-Fujikoshi",
        "Toyama",
        36.703,
        137.229,
        ["nachi-site"],
    ),
    jp("mujin-tokyo", "mujin", "Mujin", "Tokyo", 35.645, 139.81, ["mujin-site"]),
    jp("kawada-tokyo", "kawada-robotics", "Kawada Robotics", "Tokyo", 35.75, 139.737, [
        "kawada-site",
    ]),
    jp("honda-tokyo", "honda", "Honda", "Tokyo", 35.672, 139.723, ["honda-site"]),
    jp("toyota-toyota", "toyota-motor", "Toyota Motor", "Aichi", 35.084, 137.156, [
        "toyota-site",
    ]),
    jp("yamaha-iwata", "yamaha-motor", "Yamaha Motor", "Shizuoka", 34.718, 137.851, [
        "yamaha-site",
    ]),
    jp("omron-kyoto", "omron", "OMRON", "Kyoto", 34.99, 135.75, ["omron-site"]),
    jp("smc-tokyo", "smc", "SMC", "Tokyo", 35.699, 139.772, ["smc-site"]),
    {
        ...jp("iai-shizuoka", "iai", "IAI", "Shizuoka", 35.015, 138.49, ["iai-site"]),
        name: "IAI headquarters and actuator works",
        makes: ["Electric actuators", "SCARA robots"],
        stages: ["actuator"],
    },
    jp(
        "shibaura-numazu",
        "shibaura-machine",
        "Shibaura Machine",
        "Shizuoka",
        35.095,
        138.86,
        ["shibaura-site"],
    ),
    // Foreign partners reached by supply links
    hq("lynas-perth", {
        companyId: "lynas",
        name: "Lynas Rare Earths headquarters",
        country: "AU",
        admin1: "Western Australia",
        lat: -31.95,
        lon: 115.86,
        sources: ["lynas-site"],
    }),
    ...(
        [
            [
                "neo-toronto",
                "neo-performance",
                "Neo Performance Materials",
                "CA",
                "Ontario",
                43.65,
                -79.38,
                "neo-site",
            ],
            [
                "techman-taoyuan",
                "techman-robot",
                "Techman Robot",
                "TW",
                "Taoyuan",
                25.03,
                121.36,
                "omron-techman-2021",
            ],
            [
                "kuka-augsburg",
                "kuka",
                "KUKA",
                "DE",
                "Bavaria",
                48.37,
                10.9,
                "kuka-site",
            ],
            ["abb-zurich", "abb", "ABB", "CH", "Zurich", 47.41, 8.54, "abb-site"],
        ] as const
    ).map(([id, companyId, name, country, admin1, lat, lon, source]) =>
        hq(id, {
            companyId,
            name: `${name} headquarters`,
            country,
            admin1,
            lat,
            lon,
            sources: [source],
        }),
    ),
    hq("irel-mumbai", {
        companyId: "irel",
        name: "IREL headquarters",
        country: "IN",
        admin1: "Maharashtra",
        lat: 19.076,
        lon: 72.878,
        sources: ["irel-site"],
    }),
];
