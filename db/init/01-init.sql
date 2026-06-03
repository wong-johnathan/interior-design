-- ─────────────────────────────────────────────────────────────────────
-- Database Initialization — HDB Interior Design
-- Runs on first container start (postgres init scripts)
-- ─────────────────────────────────────────────────────────────────────

-- Create database if not exists (note: this runs inside the already-created
-- DB specified by POSTGRES_DB, so we mainly set up extensions)
-- The database itself is created by the POSTGRES_DB env var in docker-compose

-- ─── Extensions ──────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "postgis";     -- Spatial queries for room geometry

-- ─── Application User ────────────────────────────────────────────
-- Note: The DB_USER is created via POSTGRES_USER env var in docker-compose.
-- This script runs in the context of the POSTGRES_DB database.

-- ─── Performance Tuning ──────────────────────────────────────────
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '768MB';
ALTER SYSTEM SET work_mem = '16MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- ─── Verify Extensions ───────────────────────────────────────────
DO $$
BEGIN
    RAISE NOTICE 'PostGIS version: %', (SELECT PostGIS_Version());
    RAISE NOTICE 'uuid-ossp loaded: %', (SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp'));
    RAISE NOTICE 'pg_trgm loaded: %', (SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm'));
END
$$;
