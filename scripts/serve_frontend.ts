// Railway entrypoint: serves the built frontend plus the agent-facing routes
// in src/server/routes/ (see src/server/app.ts for the request pipeline).
import { startServer } from "@/server/app";
import { DEV_ENV } from "@/server/site";
import { DIST_DIR } from "@/server/static";

const port = Number(process.env.PORT ?? 3000);
await startServer(port);
console.log(`actuatorlist (${DEV_ENV}) serving ${DIST_DIR} on :${port}`);
