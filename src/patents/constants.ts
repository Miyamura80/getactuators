// Sizes and windows of /patents, shared by the pipeline
// (scripts/patents/landscape.ts), the page, the API, MCP and the markdown
// twin. No imports: the browser bundle reuses this module.

// First priority year counted.
export const FIRST_YEAR = 2010;

// Publication lag: most applications publish 18 months after priority.
export const LAG_MONTHS = 18;

// First assignees kept per scope: the leaderboard's length.
export const TOP_ASSIGNEES = 15;

// Assignees on the value-vs-volume scatter.
export const TOP_VALUE = 40;

// Families kept per technology in data/patents/families.json, which is also
// the most the API and MCP return.
export const TOP_FAMILIES = 200;

// Families the API and MCP return by default.
export const PATENT_LIMIT = 50;

// Momentum compares two runs of this many complete years: the late window
// ends at the last complete year and the early one just before it. The
// application-area shift's late window is the same MOMENTUM_SPAN years.
export const MOMENTUM_SPAN = 5;

// The application-area shift's early window. It starts at FIRST_YEAR and is
// longer than the momentum early window (which, with 2024 complete, is
// 2015-2019), so the area shares rest on more families; it may overlap the
// momentum early window but never the late one.
export const EARLY_WINDOW: [number, number] = [FIRST_YEAR, 2017];

// Years of the assignee growth window, ending at the last complete year.
export const CAGR_YEARS = 3;
