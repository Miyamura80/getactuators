import { POLICY_FEED_PATH } from "@/supply-chain/policy";
import { policyFeedXml } from "../agent/supply-chain/policy";
import type { Route } from "../types";

// Atom feed of new and changed /policy measures: one entry per status change.

export const routes: Route[] = [
    {
        method: "GET",
        path: POLICY_FEED_PATH,
        handler: () =>
            new Response(policyFeedXml(), {
                headers: {
                    "content-type": "application/atom+xml; charset=utf-8",
                    "cache-control": "public, max-age=3600",
                },
            }),
    },
];
