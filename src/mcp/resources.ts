import {
    ACTUATORS,
    CATEGORIES,
    ROBOTS,
    ROBOT_CREDIT,
    ROBOT_MOTORS,
    getActuator,
    getRobot,
} from "@/catalog";
import {
    type McpServer,
    ResourceNotFoundError,
    ResourceTemplate,
} from "@modelcontextprotocol/server";
import {
    COMPARE_VIEW_HTML,
    COMPARE_VIEW_META,
    COMPARE_VIEW_URI,
    MCP_APP_MIME,
} from "./app/compare-view";
import { actuatorFull, robotSummary } from "./views";

// Read-only catalog snapshots as MCP resources, for hosts that attach context
// instead of calling tools. Tools remain the better fit for filtered queries.

const JSON_MIME = "application/json";

const json = (uri: URL, data: unknown) => ({
    contents: [{ uri: uri.href, mimeType: JSON_MIME, text: JSON.stringify(data) }],
});

const STATIC = [
    {
        name: "actuators",
        uri: "catalog://actuators",
        title: "All actuators",
        description: `Full actuator catalog (${ACTUATORS.length} entries) with every spec field. Units: N.m, g, rpm, USD; null means undocumented.`,
        data: () => ACTUATORS.map(actuatorFull),
    },
    {
        name: "robots",
        uri: "catalog://robots",
        title: "All robots and motors",
        description: `${ROBOTS.length} robots with joint-to-motor mappings, the motor table, and dataset credit.`,
        data: () => ({ credit: ROBOT_CREDIT, motors: ROBOT_MOTORS, robots: ROBOTS }),
    },
    {
        name: "categories",
        uri: "catalog://categories",
        title: "Actuator categories",
        description: "The six actuator category slugs with labels and descriptions.",
        data: () => CATEGORIES,
    },
];

export function registerResources(server: McpServer): void {
    for (const r of STATIC) {
        server.registerResource(
            r.name,
            r.uri,
            { title: r.title, description: r.description, mimeType: JSON_MIME },
            async (uri) => json(uri, r.data()),
        );
    }

    server.registerResource(
        "actuator",
        new ResourceTemplate("actuator://{id}", {
            list: async () => ({
                resources: ACTUATORS.map((a) => ({
                    uri: `actuator://${a.id}`,
                    name: a.id,
                    title: `${a.brand} ${a.name}`,
                    mimeType: JSON_MIME,
                })),
            }),
        }),
        {
            title: "Actuator spec sheet",
            description: "One actuator's full spec record by id.",
            mimeType: JSON_MIME,
        },
        async (uri, { id }) => {
            const a = getActuator(String(id));
            if (!a) throw new ResourceNotFoundError(uri.href);
            return json(uri, actuatorFull(a));
        },
    );

    server.registerResource(
        "robot",
        new ResourceTemplate("robot://{id}", {
            list: async () => ({
                resources: ROBOTS.map((r) => ({
                    uri: `robot://${r.id}`,
                    name: r.id,
                    title: `${r.brand} ${r.name}`,
                    mimeType: JSON_MIME,
                })),
            }),
        }),
        {
            title: "Robot record",
            description: "One robot with its joints and linked actuator ids.",
            mimeType: JSON_MIME,
        },
        async (uri, { id }) => {
            const r = getRobot(String(id));
            if (!r) throw new ResourceNotFoundError(uri.href);
            return json(uri, {
                ...robotSummary(r),
                joints: r.joints,
                sources: r.sources,
            });
        },
    );

    server.registerResource(
        "actuator-compare-view",
        COMPARE_VIEW_URI,
        {
            title: "Actuator comparison card",
            description: "MCP App view that renders compare_actuators results.",
            mimeType: MCP_APP_MIME,
            _meta: COMPARE_VIEW_META,
        },
        async (uri) => ({
            contents: [
                {
                    uri: uri.href,
                    mimeType: MCP_APP_MIME,
                    text: COMPARE_VIEW_HTML,
                    _meta: COMPARE_VIEW_META,
                },
            ],
        }),
    );
}
