# Build the Vite frontend and serve it (plus the agent-facing routes in
# src/server/) with Bun. Deployed on Railway.
FROM oven/bun:1 AS build
WORKDIR /app
COPY frontend/package.json frontend/bun.lock ./frontend/
RUN cd frontend && bun install --frozen-lockfile
COPY frontend ./frontend
# Catalog helpers shared by the browser and server (gallery order, evidence,
# requirement shortlists, humanoid joint estimates, arm holding torque).
COPY src/catalog/gallery.ts src/catalog/evidence.ts src/catalog/compare.ts src/catalog/engineering-evidence.ts src/catalog/shortlist.ts src/catalog/brands.ts src/catalog/index.ts src/catalog/types.ts ./src/catalog/
COPY src/server/agent/humanoid-joints.ts ./src/server/agent/
COPY src/engineering/arm-torque.ts ./src/engineering/
COPY src/public-navigation.ts src/public-navigation.css ./src/
# Page data the browser imports directly.
COPY src/startups.ts src/investors.ts src/country-flag.ts ./src/
COPY src/humanoids ./src/humanoids
RUN cd frontend && bun run build

FROM oven/bun:1 AS runtime
WORKDIR /app
COPY package.json bun.lock tsconfig.json ./
RUN bun install --frozen-lockfile --production --ignore-scripts
COPY --from=build /app/frontend/dist ./frontend/dist
COPY frontend/src/data ./frontend/src/data
COPY src ./src
# Served as-is by src/server/routes: the agent skill and the og:images.
COPY skills ./skills
COPY media/og-image.png media/og-startups.png media/og-investors.png ./media/
COPY scripts/serve_frontend.ts ./scripts/serve_frontend.ts
EXPOSE 3000
CMD ["bun", "run", "scripts/serve_frontend.ts"]
