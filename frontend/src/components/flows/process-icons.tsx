import type { ProcessIcon } from "../../../../src/supply-chain/processes/types";

// Line pictograms for process steps on a 24-unit grid, drawn with the
// current stroke colour. Shared by the /manufacturing map, its step cards
// and /bom process chips.
export const PROCESS_ICON_PATHS: Record<ProcessIcon, string[]> = {
    pit: ["M2 7h20", "M5 7l2 4h10l2-4", "M8 11l2 4h4l2-4", "M15 4h4v3h-4z"],
    clay: ["M3 9c3-3 6 3 9 0s6 3 9 0", "M3 14c3-3 6 3 9 0s6 3 9 0", "M8 18v3M12 17v4M16 18v3"],
    flotation: ["M5 8h14v12H5z", "M5 12h14", "M9 6a1.5 1.5 0 1 0 0-.1M14 4a2 2 0 1 0 0-.1M12 9.5a1 1 0 1 0 0-.1"],
    acid: ["M9 3h6M10 3v6l-5 10a1.5 1.5 0 0 0 1.3 2h11.4a1.5 1.5 0 0 0 1.3-2L14 9V3", "M7.5 15h9"],
    settler: ["M2 9h6v10H2zM9 9h13v10H9z", "M9 14h13", "M5 4v8M3.5 12h3"],
    precipitate: ["M6 4h12l-1 15H7z", "M7 14h10", "M10 17h.1M13 16h.1M12 18h.1"],
    cell: ["M4 6h16v14H4z", "M9 3v12M15 3v12", "M7 18h10"],
    crucible: ["M6 6h12l-2 13H8z", "M4 6h16", "M10 10l4 4M14 10l-4 4"],
    wheel: ["M15 14a5 5 0 1 0 0-.1", "M15 14h.1", "M3 4h6l2 5", "M19 19l2 2M17 21l1 1"],
    hydrogen: ["M4 7h6v10H4z", "M14 8l3 3-3 3M18 8l3 3-3 3", "M7 7v-3"],
    mill: ["M12 12a8 8 0 1 0 0-.1", "M12 12a4 4 0 1 0 0-.1", "M4 12h4M16 12h4M12 4v4M12 16v4"],
    press: ["M7 2h10v5H7zM7 17h10v5H7z", "M5 10h14v4H5z", "M3 12h1M20 12h1"],
    furnace: ["M3 6h18v14H3z", "M7 10h10v6H7z", "M9 3c0 1.5 1 1.5 1 3M14 3c0 1.5 1 1.5 1 3"],
    diffusion: ["M3 8h18v12H3z", "M3 5h18", "M9 8v12M15 8v12M3 14h18", "M6 5v3M12 5v3M18 5v3"],
    saw: ["M3 12h18v7H3z", "M8 12v7M13 12v7M18 12v7", "M6 4v6M11 4v6M16 4v6"],
    coat: ["M4 10h16v10H4z", "M4 14h16", "M9 3v7M15 3v7"],
    coil: ["M7 6a5 6 0 1 0 0 12", "M17 6a5 6 0 1 1 0 12", "M7 6h10M7 18h10", "M12 9v6"],
    gauge: ["M4 16a8 8 0 1 1 16 0", "M12 16l4-5", "M4 20h16"],
    recycle: ["M7 7l3-4 3 4", "M10 3v8a4 4 0 0 0 4 4h4", "M18 12l3 3-3 3", "M17 21H8a4 4 0 0 1-4-4v-3"],
};

// Product state at the end of a chain: a rotor with magnet segments.
export const PRODUCT_ICON_PATHS = ["M12 12a9 9 0 1 0 0-.1", "M12 12a5 5 0 1 0 0-.1", "M12 3v4M12 17v4M3 12h4M17 12h4"];

export function ProcessIconSvg({ icon, className }: { icon: ProcessIcon | "product"; className?: string }) {
    const paths = icon === "product" ? PRODUCT_ICON_PATHS : PROCESS_ICON_PATHS[icon];
    return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        {paths.map((d) => <path key={d} d={d} />)}
    </svg>;
}
