import { type LandscapeScope, TECHNOLOGY_LIST, seriesByCountry } from "../../../../src/patents";

// Colours of /patents, one source for every chart on the page: country bands
// (the stream, the value scatter) and a fixed colour per technology (the
// stream stacked by technology, momentum tiles, the indexed chart, the picker).

// The site's data palette, reordered so neighbouring bands stay apart under
// colour-vision deficiency (validated: adjacent CVD delta E >= 15).
export const BAND_COLORS = ["#4dabf7", "#51cf66", "#9775fa", "#ff6b9a", "#ffb547", "#66d9e8", "#ff922b"];
export const OTHER_COLOR = "#5c6366";
// Bands a stack shows before the rest fold into "Other".
export const MAX_BANDS = BAND_COLORS.length;

// One fixed colour per technology, in catalogue order, so a technology keeps
// its colour in every view and whatever the sort.
const TECH_COLORS = ["#4dabf7", "#ff922b", "#51cf66", "#e599f7", "#ffe066", "#9775fa", "#66d9e8", "#ff6b9a", "#c08552", "#ced4da"];
export const techColor = (id: string): string => TECH_COLORS[TECHNOLOGY_LIST.findIndex((t) => t.id === id)] ?? OTHER_COLOR;

// The colour a country takes in the scope's stream (grey outside its bands),
// so the scatter and the stream agree.
export function countryColor(scope: LandscapeScope, country: string): string {
    const i = seriesByCountry(scope, MAX_BANDS - 1).findIndex((s) => s.key === country);
    return i < 0 ? OTHER_COLOR : (BAND_COLORS[i] ?? OTHER_COLOR);
}
