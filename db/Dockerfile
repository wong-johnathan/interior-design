# ─────────────────────────────────────────────────────────────────────
# PostgreSQL 16 — Database Service
# ⚠ Now using image: postgres:16 directly in docker-compose.
#    This Dockerfile is kept for standalone use.
# ─────────────────────────────────────────────────────────────────────
FROM postgres:16

# Copy initialization scripts
COPY init/01-init.sql /docker-entrypoint-initdb.d/01-init.sql

# Expose PostgreSQL port
EXPOSE 5432

# Health check — verify PostgreSQL is accepting connections
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=5 \
    CMD pg_isready -U "${POSTGRES_USER:-hdb_app}" -d "${POSTGRES_DB:-hdb_interior_design}" || exit 1

# Default command (postgres image entrypoint handles init)
CMD ["postgres"]
