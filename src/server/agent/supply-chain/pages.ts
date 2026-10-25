import { LAB_PATH } from "@/supply-chain/lab-fixtures";
import type { Page } from "../page-types";
import { supplyChainLabBody } from "./lab";

// Supply-chain pages that are served but never indexed. Live supply-chain
// pages go in STATIC_PAGES in ../pages.ts (see docs/supply-chain.md).
export const HIDDEN_PAGES: Page[] = [
    {
        path: LAB_PATH,
        kind: "spa",
        title: "Supply-chain kit",
        description: "Visual QA for the shared supply-chain components. Not indexed.",
        body: supplyChainLabBody,
        noindex: true,
        jsonLd: () => [],
    },
];
