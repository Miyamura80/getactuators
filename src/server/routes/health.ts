import { ACTUATORS, ROBOTS } from "@/catalog";
import type { Route } from "../types";

export const routes: Route[] = [
    {
        method: "GET",
        path: "/healthz",
        handler: () =>
            Response.json({
                status: "ok",
                actuators: ACTUATORS.length,
                robots: ROBOTS.length,
            }),
    },
];
