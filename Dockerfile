# ─────────────────────────────────────────────────────────────────────
# Root Dockerfile — Monorepo Builder / CI Entry Point
# HDB Interior Design Web App
# ─────────────────────────────────────────────────────────────────────
# This is the top-level Dockerfile for CI/CD pipelines that build
# both frontend and backend from the monorepo root.
#
# Individual services have their own Dockerfiles in subdirectories
# for targeted builds:
#   docker build -f frontend/Dockerfile -t hdb-frontend ./frontend
#   docker build -f backend/Dockerfile  -t hdb-backend  ./backend
#   docker build -f db/Dockerfile       -t hdb-db       ./db
#   docker build -f nginx/Dockerfile    -t hdb-nginx    ./nginx
#   docker build -f redis/Dockerfile    -t hdb-redis    ./redis
#
# docker-compose.yml orchestrates all services together.
# ─────────────────────────────────────────────────────────────────────

FROM scratch AS ci
COPY . /

FROM scratch AS all
COPY frontend/ frontend/
COPY backend/ backend/
COPY db/ db/
COPY nginx/ nginx/
COPY redis/ redis/
COPY docker-compose.yml docker-compose.yml
COPY .env.example .env.example
COPY .dockerignore .dockerignore
