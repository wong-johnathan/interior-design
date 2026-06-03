# ─────────────────────────────────────────────────────────────────────
# Multi-stage Dockerfile — Backend (Express/Fastify API)
# HDB Interior Design Web App
# ─────────────────────────────────────────────────────────────────────

# ─── Base Stage ───────────────────────────────────────────────────
FROM node:22-alpine AS base
WORKDIR /app

# Install tini for proper signal handling
RUN apk add --no-cache tini

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# ─── Dependencies Stage ───────────────────────────────────────────
FROM base AS deps

# Copy only package files for layer caching
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# ─── Development Stage ────────────────────────────────────────────
FROM base AS development

# Copy all package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including dev)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 4000

# Environment
ENV NODE_ENV=development
ENV PORT=4000

# Development command with hot reload
CMD ["pnpm", "run", "dev"]

# ─── Build Stage ──────────────────────────────────────────────────
FROM deps AS builder

# Copy all source files
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

# Copy dev dependencies needed for build
COPY --from=development /app/node_modules ./node_modules

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN pnpm run build

# ─── Production Runner ────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache tini

# Create non-root user
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 appuser

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

# Create a health check script
RUN echo '#!/bin/sh\n\
wget --no-verbose --tries=1 --spider http://localhost:${PORT:-4000}/health || exit 1' \
    > /healthcheck.sh && chmod +x /healthcheck.sh && chown appuser:appgroup /healthcheck.sh

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 4000

# Environment
ENV NODE_ENV=production
ENV PORT=4000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD ["/healthcheck.sh"]

# Start with tini for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"]
