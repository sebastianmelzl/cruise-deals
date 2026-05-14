FROM node:22-slim AS base
WORKDIR /app

# Install native build tools needed for better-sqlite3
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

# Install all dependencies (workspace-aware)
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/scrapers/package*.json ./packages/scrapers/
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/
RUN npm ci --legacy-peer-deps

# Copy source
COPY . .

# Build: shared → scrapers → api + web
RUN npm run build:production

# ─── Runtime ────────────────────────────────────────────────────────────────
FROM node:22-slim AS runner
WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

# Copy only what's needed at runtime
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages/shared/dist ./packages/shared/dist
COPY --from=base /app/packages/scrapers/dist ./packages/scrapers/dist
COPY --from=base /app/packages/shared/package.json ./packages/shared/
COPY --from=base /app/packages/scrapers/package.json ./packages/scrapers/
COPY --from=base /app/apps/api/dist ./apps/api/dist
COPY --from=base /app/apps/api/package.json ./apps/api/
COPY --from=base /app/apps/web/dist ./apps/web/dist
COPY --from=base /app/data ./data
COPY --from=base /app/package.json ./

EXPOSE 3001
CMD ["node", "apps/api/dist/index.js"]
