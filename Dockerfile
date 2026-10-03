# Build the Vite frontend and serve it (plus the agent-facing routes in
# src/server/) with Bun. Deployed on Railway.
FROM oven/bun:1 AS build
WORKDIR /app
COPY frontend/package.json frontend/bun.lock ./frontend/
RUN cd frontend && bun install --frozen-lockfile
COPY frontend ./frontend
# The gallery ordering helper is shared by the browser and server.
COPY src/catalog/gallery.ts ./src/catalog/gallery.ts
COPY src/public-navigation.ts src/public-navigation.css ./src/
RUN cd frontend && bun run build

FROM oven/bun:1 AS runtime
WORKDIR /app
COPY package.json bun.lock tsconfig.json ./
RUN bun install --frozen-lockfile --production --ignore-scripts
COPY --from=build /app/frontend/dist ./frontend/dist
COPY frontend/src/data ./frontend/src/data
COPY src ./src
# Served as-is by src/server/routes: the agent skill and the og:image.
COPY skills ./skills
COPY media/banner.png ./media/banner.png
COPY scripts/serve_frontend.ts ./scripts/serve_frontend.ts
EXPOSE 3000
CMD ["bun", "run", "scripts/serve_frontend.ts"]
