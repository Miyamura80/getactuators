// Documents behind /manufacturing: process reviews, theses, patents and
// open papers, read on the day the magnet chain was built. Each backs one or
// two key numbers on a step; none is a table copied whole. The fetches of
// four documents were blocked, so their figures were taken from search
// results: those carry no `accessed` date (see UNOPENED).

// Structural copy of SourceRef: importing the type from ../sources would make
// an import cycle, since ../sources spreads this list into SOURCES.
type Kind = "government" | "academic" | "company-site" | "reference";

type Reuse = "open" | "facts" | "restricted";

interface ProcessSource {
    id: string;
    title: string;
    publisher: string;
    url: string;
    accessed?: string;
    kind: Kind;
    reuse: Reuse;
}

const ACCESSED = "2026-11-03";

// Never opened: the strip-cast flake thickness, hydrogen decrepitation
// figures, green density and coating thickness were confirmed from search
// results only. Open each and add its `accessed` date when checked.
const UNOPENED: ReadonlySet<string> = new Set([
    "uspto-us11270840-magnet",
    "uspto-us11569012-hd",
    "cnipa-cn1702785a-pressing",
    "radialmagnet-n35sh-block",
]);

function src(
    id: string,
    publisher: string,
    title: string,
    url: string,
    kind: Kind,
    reuse: Reuse,
): ProcessSource {
    const s: ProcessSource = { id, publisher, title, url, kind, reuse };
    return UNOPENED.has(id) ? s : { ...s, accessed: ACCESSED };
}

// Reuse: CC BY papers (MDPI, Nature Communications) and US national
// laboratory material are open; theses, journals with unclear terms, vendor
// pages, patents and encyclopedia entries are facts.
export const PROCESS_SOURCES: ProcessSource[] = [
    // Mining and beneficiation
    src(
        "wikipedia-mountain-pass",
        "Wikipedia",
        "Mountain Pass Rare Earth Mine",
        "https://en.wikipedia.org/wiki/Mountain_Pass_Rare_Earth_Mine",
        "reference",
        "facts",
    ),
    src(
        "metallurgist-bastnasite-flotation",
        "911 Metallurgist",
        "Flotation of rare earths from bastnasite ore",
        "https://www.911metallurgist.com/blog/flotation-rare-earths-bastnasite-ore/",
        "reference",
        "facts",
    ),
    src(
        "uct-ion-adsorption-clay",
        "University of Cape Town",
        "Mineralogical and ion-exchange leaching study of a rare earth element (REE) bearing ion-adsorption clay deposit",
        "https://open.uct.ac.za/handle/11427/30161",
        "academic",
        "facts",
    ),
    src(
        "borst-ion-adsorption-2020",
        "Nature Communications",
        "Adsorption of rare earth elements in regolith-hosted clay deposits (Borst et al., 2020)",
        "https://nora.nerc.ac.uk/id/eprint/529134/1/s41467-020-17801-5.pdf",
        "academic",
        "open",
    ),
    // Cracking and separation
    src(
        "mdpi-minerals-sulfuric-acid-2024",
        "MDPI Minerals",
        "An environmentally friendly sulfuric acid decomposition strategy for mixed rare earth concentrate",
        "https://www.mdpi.com/2075-163X/14/2/185",
        "academic",
        "open",
    ),
    src(
        "iium-prnd-flowsheet-2026",
        "International Islamic University Malaysia",
        "Flowsheet design and modelling for high purity praseodymium and neodymium by solvent extraction",
        "https://irep.iium.edu.my/129144/",
        "academic",
        "facts",
    ),
    src(
        "onemine-tb-dy-separation-2014",
        "OneMine",
        "Study of separation of terbium and dysprosium from other REE by solvent extraction",
        "https://onemine.org/documents/study-of-separation-of-terbium-and-dysprosium-from-other-ree-by-solvent-extraction",
        "academic",
        "facts",
    ),
    src(
        "uspto-us10865463-oxalate",
        "USPTO",
        "US 10,865,463: Useful method for separating light rare earth elements and heavy rare earth elements",
        "https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/10865463",
        "reference",
        "facts",
    ),
    // Metal making
    src(
        "holcombe-ree-electrolysis-2025",
        "Case Western Reserve University",
        "Molten salt electrolysis for rare earth metals (Holcombe et al., 2025)",
        "https://engineering.case.edu/sites/default/files/2025-10_Holcombe_MSE%20for%20REE.pdf",
        "academic",
        "facts",
    ),
    src(
        "rwth-nd-electrolysis-2015",
        "RWTH Aachen IME",
        "Development and research trends of the neodymium electrolysis: a literature review (Vogel and Friedrich, EMC 2015)",
        "https://test.greenmetallurgy.rwth-aachen.de/wp-content/uploads/2025/08/emc_2015_vogel_id_2892.pdf",
        "academic",
        "facts",
    ),
    src(
        "vjste-dy-calciothermic-2024",
        "Vietnam Journal of Science, Technology and Engineering",
        "Optimisation of calcinothermic reduction for metallic dysprosium preparation",
        "https://vietnamscience.vjst.vn/index.php/vjste/article/view/1220",
        "academic",
        "facts",
    ),
    // Magnet making
    src(
        "bham-strip-casting-thesis",
        "University of Birmingham",
        "Development of a pilot scale strip casting system to produce optimised alloys for neodymium-iron-boron magnets",
        "https://etheses.bham.ac.uk/6791",
        "academic",
        "facts",
    ),
    src(
        "uspto-us11270840-magnet",
        "USPTO",
        "US 11,270,840: Magnet production",
        "https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/11270840",
        "reference",
        "facts",
    ),
    src(
        "advancedmagnets-sintered-flow",
        "Advanced Magnets",
        "Sintered NdFeB magnets manufacturing process flow",
        "https://www.advancedmagnets.com/?p=47",
        "company-site",
        "facts",
    ),
    src(
        "tuda-loewe-gbd-2016",
        "TU Darmstadt",
        "Grain boundary engineering in sintered Nd-Fe-B permanent magnets for efficient utilization of heavy rare earth elements (Löwe, 2016)",
        "https://tuprints.ulb.tu-darmstadt.de/5872",
        "academic",
        "facts",
    ),
    src(
        "uspto-us11373802-machining",
        "USPTO",
        "US 11,373,802: Magnet manufacturing by additive manufacturing using slurry",
        "https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/11373802",
        "reference",
        "facts",
    ),
    src(
        "radialmagnet-machining",
        "Radial Magnets",
        "Magnet machining and finishing",
        "https://radialmagnet.com/magnet-machining-and-finishing/",
        "company-site",
        "facts",
    ),
    src(
        "uspto-us11569012-hd",
        "USPTO",
        "US 11,569,012: Method for improving performance of sintered NdFeB magnets",
        "https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/11569012",
        "reference",
        "facts",
    ),
    src(
        "cnipa-cn1702785a-pressing",
        "PatSnap (CNIPA patent CN1702785A)",
        "CN1702785A: sintered NdFeB magnet pressing and sintering method",
        "https://eureka.patsnap.com/patent-CN1702785A",
        "reference",
        "facts",
    ),
    src(
        "radialmagnet-n35sh-block",
        "Radial Magnets",
        "Neodymium magnet block N35SH, 1 x 1 x 1 inch (Ni-Cu-Ni plating)",
        "https://radialmagnet.com/our-magnets/neodymium-magnet-block-n35sh-1-x-1-x-1",
        "company-site",
        "facts",
    ),
    src(
        "uspto-us7324320-magnetizing",
        "USPTO",
        "US 7,324,320: Device and a method for magnetizing a magnet system",
        "https://patents.google.com/patent/US7324320",
        "reference",
        "facts",
    ),
    src(
        "sensors-impulse-magnetization-2016",
        "MDPI Sensors",
        "Impulse magnetization of Nd-Fe-B sintered magnets for sensors",
        "https://www.mdpi.com/1424-8220/16/4/569",
        "academic",
        "open",
    ),
    // Recycling
    src(
        "cmi-ndfeb-recycling",
        "Critical Materials Institute (Idaho National Laboratory)",
        "Recycling of NdFeB magnets (research poster)",
        "https://am.inl.gov/SiteAssets/Research%20Posters/CMI%20Recycling%20of%20NdFeB%20Magnets%20final%20(1).pdf",
        "government",
        "open",
    ),
];
