# ─────────────────────────────────────────────────────────────────────
# Redis 7 — Cache, Rate Limiting, Job Queue
# ─────────────────────────────────────────────────────────────────────
FROM redis:7-alpine

# Expose Redis port
EXPOSE 6379

# Health check — verify Redis is responding
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=5 \
    CMD redis-cli ping || exit 1

# Default command with AOF persistence enabled
CMD ["redis-server", "--appendonly", "yes"]
