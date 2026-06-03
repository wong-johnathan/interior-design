# ─────────────────────────────────────────────────────────────────────
# Multi-stage Dockerfile — Frontend (Next.js SSR)
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

# Install all dependencies (required for build)
RUN pnpm install --frozen-lockfile

# ─── Development Stage ────────────────────────────────────────────
FROM deps AS development

# Copy source code
COPY tsconfig.json next.config.ts tailwind.config.ts postcss.config.mjs ./
COPY public ./public
COPY src ./src

# Expose port
EXPOSE 3000

# Environment
ENV NODE_ENV=development
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Development command with hot reload
CMD ["pnpm", "run", "dev"]

# ─── Build Stage ──────────────────────────────────────────────────
FROM deps AS builder

# Copy config files
COPY tsconfig.json next.config.ts tailwind.config.ts postcss.config.mjs ./

# Copy source
COPY public ./public
COPY src ./src

# Build Next.js (output: standalone for minimal production image)
RUN pnpm run build

# ─── Production Runner ────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache tini

# Create non-root user (Next.js specific naming)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone build output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create a health check script
RUN echo '#!/bin/sh\n\
wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3000}/api/health || exit 1' \
    > /healthcheck.sh && chmod +x /healthcheck.sh && chown nextjs:nodejs /healthcheck.sh

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD ["/healthcheck.sh"]

# Start with tini for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
