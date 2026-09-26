import { PATHS } from "../agent/links";
import { jsonResponse } from "../agent/negotiate";
import {
    agentCard,
    apiCatalog,
    ardManifest,
    skillMarkdown,
    skillsIndex,
} from "../agent/well-known";
import type { Route } from "../types";

// /.well-known discovery documents. Unknown /.well-known paths fall through to
// the pipeline's 404 (JSON problem details), never the HTML shell.

const LINKSET =
    'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"';

function json(path: string, build: () => unknown, type?: string): Route {
    return { method: "GET", path, handler: () => jsonResponse(build(), type) };
}

export const routes: Route[] = [
    json(PATHS.ard, ardManifest),
    // Predecessor path of the same catalog (AI Catalog standard).
    json("/.well-known/ai-catalog.json", ardManifest),
    json(PATHS.agentCard, agentCard),
    json(PATHS.apiCatalog, apiCatalog, LINKSET),
    {
        method: "GET",
        path: PATHS.skillsIndex,
        handler: async () => jsonResponse(await skillsIndex()),
    },
    {
        method: "GET",
        path: PATHS.skill,
        handler: async () => {
            const bytes = await skillMarkdown();
            if (!bytes) return null;
            return new Response(bytes, {
                headers: {
                    "content-type": "text/markdown; charset=utf-8",
                    "cache-control": "public, max-age=300",
                    "access-control-allow-origin": "*",
                },
            });
        },
    },
];
