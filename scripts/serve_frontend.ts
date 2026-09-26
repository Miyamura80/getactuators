// Railway entrypoint: serves the built frontend plus the agent-facing routes
// in src/server/routes/ (see src/server/app.ts for the request pipeline).
import { startServer } from "@/server/app";
import { DIST_DIR } from "@/server/static";

const port = Number(process.env.PORT ?? 3000);
await startServer(port);
console.log(`getactuators serving ${DIST_DIR} on :${port}`);
