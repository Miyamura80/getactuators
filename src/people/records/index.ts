import type { DirectoryRecord } from "../directory";
import { INDUSTRY } from "./industry";
import { MAGNETS } from "./magnets";
import { POLICY } from "./policy";
import { RESEARCH } from "./research";

// Every /people record, in page order: one file per domain.
export const DIRECTORY_RECORDS: DirectoryRecord[] = [
    ...RESEARCH,
    ...INDUSTRY,
    ...MAGNETS,
    ...POLICY,
];
