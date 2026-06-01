# ---- Build Stage ----
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.11.0 --activate

# Accept build-time arg for the API base URL
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

WORKDIR /app

# Copy dependency manifests first
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source code and config files
COPY tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts eslint.config.js index.html ./
COPY public/ ./public/
COPY src/ ./src/

# Build the frontend
RUN pnpm run build

# ---- Production Stage ----
FROM nginx:alpine AS runner

# Copy the build output from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
