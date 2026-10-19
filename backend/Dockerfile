# ---- base: Node + pnpm (pnpm version comes from "packageManager") ----
FROM node:24-slim AS base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /app

# ---- deps: all dependencies, cached until the lockfile changes ----
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
RUN pnpm install --frozen-lockfile

# ---- build: generate the Prisma client and compile TypeScript ----
# Also used by the "migrate" Compose service (it needs the Prisma CLI and the migrations).
FROM deps AS build
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY prisma.config.ts tsconfig.json ./
COPY prisma ./prisma
COPY src ./src
# prisma.config.ts requires DATABASE_URL even to generate. This value is never used to connect.
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build pnpm build

# ---- prod-deps: production dependencies only ----
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
RUN pnpm install --frozen-lockfile --prod

# ---- runtime: the image that actually runs ----
FROM node:24-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:' + (process.env.PORT || 3000) + '/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "dist/server.js"]