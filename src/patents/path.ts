// Kept apart from ./index so the app shell can route /patents without
// bundling the patent data; the page itself loads lazily.
export const PATENTS_PATH = "/patents";
