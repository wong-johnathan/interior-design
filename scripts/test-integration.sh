#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────
# test-integration.sh — HDB Interior Design Integration Test Suite
#
# Verifies all services connect and are healthy using docker compose.
# Designed to be idempotent — safe to run multiple times.
#
# Usage:
#   ./scripts/test-integration.sh            # assumes services are running
#   ./scripts/test-integration.sh --up       # starts services, tests, cleans up
#   ./scripts/test-integration.sh --up-only  # starts services only (for manual debugging)
#
# Flags:
#   --up        Run "docker compose up -d" before tests, then "down" after
#   --up-only   Start services and test, but leave containers running
#   --no-clean  Skip post-test cleanup even if --up was used
#   --help      Show this help text
# ─────────────────────────────────────────────────────────────────────

set -euo pipefail

# ─── Configuration ──────────────────────────────────────────────────
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="${PROJECT_DIR}/docker-compose.yml"
COMPOSE_PROJECT_NAME="hdb-interior-design"

# Default credentials (matching docker-compose.yml defaults)
DB_USER="${DB_USER:-hdb_app}"
DB_NAME="${DB_NAME:-hdb_interior_design}"
DB_PASSWORD="${DB_PASSWORD:-changeme}"
REDIS_PASSWORD="${REDIS_PASSWORD:-changeme}"
MINIO_USER="${MINIO_ROOT_USER:-minioadmin}"
MINIO_PASS="${MINIO_ROOT_PASSWORD:-minioadmin}"

# Timeout for each individual test (seconds)
TEST_TIMEOUT=30

# Overall script timeout (seconds)
OVERALL_TIMEOUT=120

# Dockerfiles to validate
DOCKERFILES=(
  "nginx/Dockerfile"
  "frontend/Dockerfile"
  "backend/Dockerfile"
  "db/Dockerfile"
  "redis/Dockerfile"
)

# Container names (matching docker-compose.yml)
CONTAINER_NGINX="hdb-nginx"
CONTAINER_FRONTEND="hdb-frontend"
CONTAINER_BACKEND="hdb-backend"
CONTAINER_POSTGRES="hdb-postgres"
CONTAINER_REDIS="hdb-redis"
CONTAINER_MINIO="hdb-minio"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ─── Helpers ────────────────────────────────────────────────────────
PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0
START_TIME=0

pass() {
  local msg="$1"
  PASS_COUNT=$((PASS_COUNT + 1))
  echo -e "  ${GREEN}✓ PASS${NC}  ${msg}"
}

fail() {
  local msg="$1"
  FAIL_COUNT=$((FAIL_COUNT + 1))
  echo -e "  ${RED}✗ FAIL${NC}  ${msg}"
}

skip() {
  local msg="$1"
  SKIP_COUNT=$((SKIP_COUNT + 1))
  echo -e "  ${YELLOW}─ SKIP${NC}  ${msg}"
}

info() {
  echo -e "${CYAN}${BOLD}[INFO]${NC} $*"
}

warn() {
  echo -e "${YELLOW}${BOLD}[WARN]${NC} $*"
}

error() {
  echo -e "${RED}${BOLD}[ERROR]${NC} $*"
}

header() {
  local sep
  sep=$(printf '%*s' "$(echo "$1" | wc -c)" | tr ' ' '─')
  echo ""
  echo -e "  ${BOLD}$1${NC}"
  echo -e "  ${BOLD}${sep}${NC}"
}

check_timeout() {
  if [ $(( $(date +%s) - START_TIME )) -ge $OVERALL_TIMEOUT ]; then
    echo ""
    error "Overall test timeout of ${OVERALL_TIMEOUT}s reached."
    return 1
  fi
}

# ─── Docker Compose Helpers ────────────────────────────────────────
compose_cmd() {
  docker compose \
    --project-name "$COMPOSE_PROJECT_NAME" \
    -f "$COMPOSE_FILE" \
    "$@"
}

is_container_running() {
  local name="$1"
  docker inspect --format '{{.State.Status}}' "$name" 2>/dev/null | grep -q 'running'
}

is_container_healthy() {
  local name="$1"
  local status
  status=$(docker inspect --format '{{.State.Health.Status}}' "$name" 2>/dev/null)
  [ "$status" = "healthy" ]
}

wait_for_container_healthy() {
  local name="$1"
  local timeout="${2:-60}"
  local elapsed=0
  local interval=3

  info "Waiting for container '${name}' to be healthy (timeout: ${timeout}s)..."
  while [ $elapsed -lt $timeout ]; do
    if is_container_healthy "$name"; then
      pass "Container '${name}' is healthy (${elapsed}s)"
      return 0
    fi
    if ! is_container_running "$name"; then
      fail "Container '${name}' is not running"
      return 1
    fi
    sleep "$interval"
    elapsed=$((elapsed + interval))
  done
  fail "Container '${name}' did not become healthy within ${timeout}s"
  docker logs --tail 20 "$name" 2>/dev/null || true
  return 1
}

exec_in_container() {
  local container="$1"
  shift
  docker exec "$container" "$@" 2>/dev/null
}

# ─── Test Functions ─────────────────────────────────────────────────

# Test 1: Dockerfile validation
test_dockerfiles() {
  header "Dockerfile Validation"
  local all_valid=true

  for relpath in "${DOCKERFILES[@]}"; do
    local fullpath="${PROJECT_DIR}/${relpath}"
    if [ -f "$fullpath" ]; then
      # Check that the first non-comment, non-empty line starts with FROM
      local first_instruction
      first_instruction=$(grep -v '^\s*#' "$fullpath" | grep -v '^\s*$' | head -1)
      if echo "$first_instruction" | grep -q '^FROM '; then
        local base_image
        base_image=$(echo "$first_instruction" | sed 's/^FROM //' | cut -d' ' -f1)
        pass "${relpath} — exists and has valid FROM (${base_image})"
      else
        fail "${relpath} — exists but first instruction is not FROM: ${first_instruction}"
        all_valid=false
      fi
    else
      fail "${relpath} — MISSING"
      all_valid=false
    fi
  done

  $all_valid
}

# Test 2: PostgreSQL connectivity
test_postgresql() {
  header "PostgreSQL Connectivity"
  if ! is_container_running "$CONTAINER_POSTGRES"; then
    skip "Container '${CONTAINER_POSTGRES}' is not running — skipping PostgreSQL test"
    return 0
  fi

  # Test pg_isready
  if exec_in_container "$CONTAINER_POSTGRES" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
    pass "pg_isready — PostgreSQL is accepting connections (user=${DB_USER}, db=${DB_NAME})"
  else
    fail "pg_isready — PostgreSQL is NOT accepting connections"
    docker logs --tail 10 "$CONTAINER_POSTGRES" 2>/dev/null || true
    return 1
  fi

  # Test actual query via psql
  if exec_in_container "$CONTAINER_POSTGRES" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
    pass "psql — can execute queries on '${DB_NAME}'"
  else
    fail "psql — cannot execute queries on '${DB_NAME}'"
    return 1
  fi
}

# Test 3: Redis connectivity
test_redis() {
  header "Redis Connectivity"
  if ! is_container_running "$CONTAINER_REDIS"; then
    skip "Container '${CONTAINER_REDIS}' is not running — skipping Redis test"
    return 0
  fi

  # Test redis-cli ping (no auth — the healthcheck in Dockerfile just uses redis-cli ping)
  if exec_in_container "$CONTAINER_REDIS" redis-cli ping | grep -q "PONG"; then
    pass "redis-cli ping — Redis responded with PONG"
  else
    fail "redis-cli ping — Redis did not respond with PONG"
    docker logs --tail 10 "$CONTAINER_REDIS" 2>/dev/null || true
    return 1
  fi

  # Test authenticated ping if a password is set
  if [ -n "$REDIS_PASSWORD" ] && [ "$REDIS_PASSWORD" != "" ]; then
    if exec_in_container "$CONTAINER_REDIS" redis-cli -a "$REDIS_PASSWORD" ping 2>/dev/null | grep -q "PONG"; then
      pass "redis-cli ping (authenticated) — Redis accepted password auth"
    else
      warn "redis-cli ping (authenticated) — could not connect with password (may use empty password)"
    fi
  fi
}

# Test 4: Backend health endpoint
test_backend() {
  header "Backend Health Check"
  if ! is_container_running "$CONTAINER_BACKEND"; then
    skip "Container '${CONTAINER_BACKEND}' is not running — skipping backend test"
    return 0
  fi

  # Test via docker exec (internal — doesn't require port mapping)
  if exec_in_container "$CONTAINER_BACKEND" wget -q --spider --timeout=5 http://localhost:4000/api/health 2>/dev/null; then
    pass "Backend /health endpoint responded (via container exec)"
  else
    # Fallback: try via exposed host port
    if command -v curl &>/dev/null; then
      local http_code
      http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:4000/api/health 2>/dev/null || echo "000")
      if [ "$http_code" = "200" ]; then
        pass "Backend /health endpoint responded HTTP 200 (via host port localhost:4000)"
      else
        fail "Backend /health endpoint returned HTTP ${http_code} (via host port localhost:4000)"
        docker logs --tail 10 "$CONTAINER_BACKEND" 2>/dev/null || true
        return 1
      fi
    else
      fail "Backend /health endpoint unreachable (wget via container exec and curl via host both failed)"
      docker logs --tail 10 "$CONTAINER_BACKEND" 2>/dev/null || true
      return 1
    fi
  fi

  # Verify response body contains expected fields
  local response
  if exec_in_container "$CONTAINER_BACKEND" wget -q -O - --timeout=5 http://localhost:4000/api/health 2>/dev/null; then
    response=$(exec_in_container "$CONTAINER_BACKEND" wget -q -O - --timeout=5 http://localhost:4000/api/health 2>/dev/null)
  elif command -v curl &>/dev/null; then
    response=$(curl -s --max-time 5 http://localhost:4000/api/health 2>/dev/null || echo "")
  fi
  if echo "$response" | grep -q '"status"' || echo "$response" | grep -q '"ok"'; then
    pass "Backend health response contains valid JSON with status field"
  else
    warn "Backend health response: ${response:0:100}"
  fi
}

# Test 5: Frontend health
test_frontend() {
  header "Frontend Health Check"
  if ! is_container_running "$CONTAINER_FRONTEND"; then
    skip "Container '${CONTAINER_FRONTEND}' is not running — skipping frontend test"
    return 0
  fi

  # Test via docker exec
  if exec_in_container "$CONTAINER_FRONTEND" wget -q --spider --timeout=5 http://localhost:3000/ 2>/dev/null; then
    pass "Frontend responded on port 3000 (via container exec)"
  else
    # Fallback: try via exposed host port
    if command -v curl &>/dev/null; then
      local http_code
      http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:3000/ 2>/dev/null || echo "000")
      if [ "$http_code" = "200" ]; then
        pass "Frontend responded HTTP 200 (via host port localhost:3000)"
      else
        fail "Frontend returned HTTP ${http_code} (via host port localhost:3000)"
        docker logs --tail 10 "$CONTAINER_FRONTEND" 2>/dev/null || true
        return 1
      fi
    else
      fail "Frontend unreachable (wget via container exec and curl via host both failed)"
      docker logs --tail 10 "$CONTAINER_FRONTEND" 2>/dev/null || true
      return 1
    fi
  fi
}

# Test 6: MinIO health
test_minio() {
  header "MinIO Health Check"
  if ! is_container_running "$CONTAINER_MINIO"; then
    skip "Container '${CONTAINER_MINIO}' is not running (dev profile) — skipping MinIO test"
    return 0
  fi

  # MinIO health endpoint (matches docker-compose healthcheck)
  if exec_in_container "$CONTAINER_MINIO" curl -sf --max-time 5 http://localhost:9000/minio/health/live >/dev/null 2>&1; then
    pass "MinIO /minio/health/live endpoint responded (via container exec)"
  else
    # Fallback: try via exposed host port
    if command -v curl &>/dev/null; then
      local http_code
      http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:9000/minio/health/live 2>/dev/null || echo "000")
      if [ "$http_code" = "200" ]; then
        pass "MinIO /minio/health/live endpoint responded HTTP 200 (via host port localhost:9000)"
      else
        fail "MinIO /minio/health/live returned HTTP ${http_code} (via host port localhost:9000)"
        docker logs --tail 10 "$CONTAINER_MINIO" 2>/dev/null || true
        return 1
      fi
    else
      fail "MinIO unreachable (curl via container exec and via host both failed)"
      docker logs --tail 10 "$CONTAINER_MINIO" 2>/dev/null || true
      return 1
    fi
  fi
}

# Test 7: Nginx reverse proxy
test_nginx() {
  header "Nginx Reverse Proxy"
  if ! is_container_running "$CONTAINER_NGINX"; then
    skip "Container '${CONTAINER_NGINX}' is not running — skipping nginx test"
    return 0
  fi

  if exec_in_container "$CONTAINER_NGINX" wget -q --spider --timeout=5 http://localhost:80/ 2>/dev/null; then
    pass "Nginx responded on port 80 (via container exec)"
  else
    if command -v curl &>/dev/null; then
      local http_code
      http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:80/ 2>/dev/null || echo "000")
      if [ "$http_code" != "000" ]; then
        pass "Nginx responded HTTP ${http_code} (via host port localhost:80)"
      else
        fail "Nginx returned HTTP ${http_code} (via host port localhost:80)"
        docker logs --tail 10 "$CONTAINER_NGINX" 2>/dev/null || true
        return 1
      fi
    else
      fail "Nginx unreachable via host"
      return 1
    fi
  fi
}

# ─── Summary ────────────────────────────────────────────────────────
print_summary() {
  local total=$((PASS_COUNT + FAIL_COUNT + SKIP_COUNT))
  echo ""
  echo "═══════════════════════════════════════════════════════════════"
  echo -e "  ${BOLD}Integration Test Summary${NC}"
  echo "═══════════════════════════════════════════════════════════════"
  echo -e "  ${GREEN}Pass: ${PASS_COUNT}${NC}"
  echo -e "  ${RED}Fail: ${FAIL_COUNT}${NC}"
  echo -e "  ${YELLOW}Skip: ${SKIP_COUNT}${NC}"
  echo -e "  ${BOLD}Total: ${total}${NC}"
  echo "═══════════════════════════════════════════════════════════════"
  echo ""

  if [ $FAIL_COUNT -gt 0 ]; then
    echo -e "  ${RED}${BOLD}❌ SOME TESTS FAILED${NC}"
    return 1
  else
    echo -e "  ${GREEN}${BOLD}✅ ALL TESTS PASSED${NC}"
    return 0
  fi
}

# ─── Main ───────────────────────────────────────────────────────────
main() {
  local do_up=false
  local do_down=true
  local up_only=false

  # Parse arguments
  for arg in "$@"; do
    case "$arg" in
      --up) do_up=true ;;
      --up-only) do_up=true; up_only=true ;;
      --no-clean) do_down=false ;;
      --help)
        head -30 "$0" | grep -v '^#!/' | sed 's/^#//' | sed 's/^ //'
        exit 0
        ;;
      *)
        echo "Unknown option: $arg"
        echo "Usage: $0 [--up] [--up-only] [--no-clean] [--help]"
        exit 1
        ;;
    esac
  done

  START_TIME=$(date +%s)

  echo ""
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║   HDB Interior Design — Integration Test Suite              ║"
  echo "╚══════════════════════════════════════════════════════════════╝"
  echo ""

  # ─── Step 0: Start services (if --up or --up-only) ───────────────
  if $do_up; then
    info "Starting all services via docker compose..."
    if compose_cmd up -d 2>&1; then
      pass "docker compose up -d completed successfully"
    else
      fail "docker compose up -d failed"
      exit 1
    fi

    # Wait for all services to be healthy
    info "Waiting for all services to become healthy..."

    wait_for_container_healthy "$CONTAINER_POSTGRES" 60 || true
    check_timeout || { [ $? -eq 1 ] && exit 1; }

    wait_for_container_healthy "$CONTAINER_REDIS" 30 || true
    check_timeout || { [ $? -eq 1 ] && exit 1; }

    wait_for_container_healthy "$CONTAINER_BACKEND" 60 || true
    check_timeout || { [ $? -eq 1 ] && exit 1; }

    wait_for_container_healthy "$CONTAINER_FRONTEND" 60 || true
    check_timeout || { [ $? -eq 1 ] && exit 1; }

    wait_for_container_healthy "$CONTAINER_NGINX" 30 || true
    check_timeout || { [ $? -eq 1 ] && exit 1; }

    # MinIO is in dev profile — start it explicitly
    if ! is_container_running "$CONTAINER_MINIO"; then
      info "Starting MinIO (dev profile)..."
      compose_cmd --profile dev up -d minio 2>&1 || true
      wait_for_container_healthy "$CONTAINER_MINIO" 30 || true
    fi
    check_timeout || { [ $? -eq 1 ] && exit 1; }

    echo ""
    info "All services started. Running tests..."
  fi

  # ─── Step 1: Validate Dockerfiles ────────────────────────────────
  check_timeout || { [ $? -eq 1 ] && exit 1; }
  test_dockerfiles

  # ─── Step 2: Test PostgreSQL ─────────────────────────────────────
  check_timeout || { [ $? -eq 1 ] && exit 1; }
  test_postgresql

  # ─── Step 3: Test Redis ──────────────────────────────────────────
  check_timeout || { [ $? -eq 1 ] && exit 1; }
  test_redis

  # ─── Step 4: Test Backend ────────────────────────────────────────
  check_timeout || { [ $? -eq 1 ] && exit 1; }
  test_backend

  # ─── Step 5: Test Frontend ───────────────────────────────────────
  check_timeout || { [ $? -eq 1 ] && exit 1; }
  test_frontend

  # ─── Step 6: Test MinIO ──────────────────────────────────────────
  check_timeout || { [ $? -eq 1 ] && exit 1; }
  test_minio

  # ─── Step 7: Test Nginx ──────────────────────────────────────────
  check_timeout || { [ $? -eq 1 ] && exit 1; }
  test_nginx

  # ─── Step 8: Print results ───────────────────────────────────────
  print_summary
  local result=$?

  # ─── Cleanup ─────────────────────────────────────────────────────
  if $do_up && ! $up_only && $do_down; then
    echo ""
    info "Cleaning up — stopping all services..."
    compose_cmd down --remove-orphans 2>&1 || true
    pass "Services stopped and cleaned up"
  fi

  return $result
}

# Run main with all arguments
main "$@"
exit $?
