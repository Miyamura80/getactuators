# Build the Vite frontend and serve it with Bun. Deployed on Railway.
FROM oven/bun:1 AS build
WORKDIR /app
COPY frontend/package.json frontend/bun.lock ./frontend/
RUN cd frontend && bun install --frozen-lockfile
COPY frontend ./frontend
RUN cd frontend && bun run build

FROM oven/bun:1 AS runtime
WORKDIR /app
COPY --from=build /app/frontend/dist ./frontend/dist
COPY scripts/serve_frontend.ts ./scripts/serve_frontend.ts
EXPOSE 3000
CMD ["bun", "run", "scripts/serve_frontend.ts"]
