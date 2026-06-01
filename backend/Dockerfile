# ---- Build Stage ----
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.11.0 --activate

WORKDIR /app

# Copy dependency manifests first for better layer caching
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy TypeScript source and config
COPY tsconfig.json ./
COPY src/ ./src/

# Build to dist/
RUN pnpm run build

# ---- Production Stage ----
FROM node:22-alpine AS runner

# Install pnpm in runner as well (needed only if we keep devDeps, but we copy only built files)
RUN corepack enable && corepack prepare pnpm@10.11.0 --activate

WORKDIR /app

# Copy built output and production dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/server.js"]
