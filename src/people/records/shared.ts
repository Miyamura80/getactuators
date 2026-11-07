// Helpers shared by the /people record files.

// Source ids in ../sources.ts carry a "people-" prefix.
export const src = (...ids: string[]) => ids.map((id) => `people-${id}`);
export const web = (url: string) => [{ kind: "web" as const, url }];
