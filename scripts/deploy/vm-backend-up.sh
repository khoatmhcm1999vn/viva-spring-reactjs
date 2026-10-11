#!/usr/bin/env bash
# Redeploy CHI service backend tren VM, topology Supabase (docker-compose.supabase.yml).
# Chay tren VM, tu bat ky dau trong repo:
#
#   scripts/deploy/vm-backend-up.sh --check-only
#       Kiem tra .env (khong in secret), khong thay doi gi.
#   scripts/deploy/vm-backend-up.sh --image vivacon-backend:git-<sha> [--tar /tmp/x.tar] [--yes]
#       docker load (neu co --tar), doi BACKEND_IMAGE, recreate backend, cho healthy.
#   scripts/deploy/vm-backend-up.sh --rollback [--yes]
#       Quay ve PREVIOUS_BACKEND_IMAGE (image do phai con tren VM).
#
# Khong bao gio dung toi frontend, cloudflared hay db: dung --no-deps. Recreate
# cloudflared se doi hostname tunnel va buoc phai redeploy Vercel.
#
# Bien moi truong: ENV_FILE (mac dinh .env), HEALTH_TIMEOUT (giay, mac dinh 240).

set -euo pipefail

cd "$(dirname "$0")/../.."
ENV_FILE="${ENV_FILE:-.env}"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-240}"
CONTAINER=vivacon-backend

MODE=deploy
IMAGE=""
TAR=""
ASSUME_YES=0
while [ $# -gt 0 ]; do
  case "$1" in
    --check-only) MODE=check ;;
    --rollback)   MODE=rollback ;;
    --image)      IMAGE="${2:?--image can gia tri}"; shift ;;
    --tar)        TAR="${2:?--tar can duong dan}"; shift ;;
    --yes)        ASSUME_YES=1 ;;
    -h|--help)    sed -n '2,16p' "$0"; exit 0 ;;
    *) echo "Tham so khong hop le: $1" >&2; exit 2 ;;
  esac
  shift
done

ok()   { printf '  [OK]   %s\n' "$*"; }
warn() { printf '  [WARN] %s\n' "$*"; WARNINGS=$((WARNINGS + 1)); }
fail() { printf '  [FAIL] %s\n' "$*"; FAILURES=$((FAILURES + 1)); }
WARNINGS=0
FAILURES=0

# Doc mot khoa tu .env ma KHONG source file (source se thuc thi noi dung va xuat ca secret).
get() {
  local line
  line="$(grep -E "^$1=" "$ENV_FILE" 2>/dev/null | tail -n 1 || true)"
  line="${line#*=}"
  line="${line%\"}"; line="${line#\"}"
  line="${line%\'}"; line="${line#\'}"
  printf '%s' "$line"
}

# Ghi/cap nhat mot khoa khong phai secret (chi dung cho ten image).
set_kv() {
  local key="$1" val="$2"
  if grep -qE "^$key=" "$ENV_FILE"; then
    sed -i "s|^$key=.*|$key=$val|" "$ENV_FILE"
  else
    printf '%s=%s\n' "$key" "$val" >> "$ENV_FILE"
  fi
}

COMPOSE=(docker compose --env-file "$ENV_FILE"
  -f docker-compose.yml -f docker-compose.supabase.yml -f docker-compose.tunnel.yml)

preflight() {
  echo "== Kiem tra $ENV_FILE (khong in gia tri secret)"
  if [ ! -f "$ENV_FILE" ]; then
    fail "khong co $ENV_FILE. Tao tu .env.vm.example (docs/deployment/BACKEND_REDEPLOY.md, buoc 1)"
    return
  fi
  local perm; perm="$(stat -c '%a' "$ENV_FILE")"
  [ "$perm" = "600" ] && ok "quyen $ENV_FILE = 600" || warn "quyen $ENV_FILE = $perm, nen la 600 (chmod 600 $ENV_FILE)"

  local k v
  for k in DB_PASSWORD JWT_SECRET_SALT; do
    v="$(get "$k")"
    if [ -z "$v" ]; then fail "$k rong"; else ok "$k co gia tri (do dai ${#v})"; fi
  done
  v="$(get JWT_SECRET_SALT)"
  if [ -n "$v" ] && [ "${#v}" -lt 32 ]; then warn "JWT_SECRET_SALT ngan hon 32 ky tu"; fi

  local url; url="$(get SPRING_DATASOURCE_URL)"
  if [ -z "$url" ]; then
    fail "SPRING_DATASOURCE_URL rong: backend se khong biet Supabase o dau"
  else
    case "$url" in jdbc:postgresql://*) ;; *) fail "SPRING_DATASOURCE_URL phai bat dau bang jdbc:postgresql://" ;; esac
    case "$url" in *//db:*|*//localhost*|*//127.0.0.1*) fail "SPRING_DATASOURCE_URL tro vao Postgres cuc bo, khong phai Supabase" ;; esac
    case "$url" in *sslmode=require*|*sslmode=verify-*) ok "sslmode duoc dat" ;; *) fail "thieu sslmode=require: pooler chap nhan ca ket noi khong ma hoa" ;; esac
    case "$url" in *:6543/*) case "$url" in *prepareThreshold=0*) warn "transaction pooler 6543: nen dung session pooler 5432" ;; *) fail "cong 6543 (transaction mode) lam vo prepared statement cua Hibernate; dung 5432 hoac them prepareThreshold=0" ;; esac ;; esac
    case "$url" in *pooler.supabase.com*) ;; *) warn "host khong phai *.pooler.supabase.com (VM khong co IPv6, direct host cua Supabase chi co AAAA)" ;; esac
    local hostport; hostport="${url#jdbc:postgresql://}"; hostport="${hostport%%\?*}"
    ok "datasource = $hostport"
  fi

  v="$(get DB_USERNAME)"
  case "$v" in
    "") fail "DB_USERNAME rong" ;;
    postgres.*) ok "DB_USERNAME dang postgres.<project-ref> (do dai ${#v})" ;;
    *) warn "DB_USERNAME khong co dang postgres.<project-ref>: pooler Supabase se tu choi" ;;
  esac

  v="$(get FRONTEND_ALLOWED_ORIGINS)"
  if [ -z "$v" ]; then
    fail "FRONTEND_ALLOWED_ORIGINS rong: moi request cross-origin va WebSocket deu bi tu choi"
  else
    ok "FRONTEND_ALLOWED_ORIGINS = $v"
    case "$v" in *vercel.app*) ;; *) warn "khong co origin Vercel: site Vercel se bi CORS/SockJS tu choi" ;; esac
    case "$v" in *localhost*) warn "co localhost trong origin production" ;; esac
  fi

  v="$(get SPRING_PROFILES_ACTIVE)"
  [ -z "$v" ] || [ "$v" = "prod" ] && ok "profile = ${v:-prod (mac dinh cua image)}" || fail "SPRING_PROFILES_ACTIVE=$v; production phai la prod"
  v="$(get VIVACON_VERIFICATION_BYPASS)"
  [ "$v" = "true" ] && fail "VIVACON_VERIFICATION_BYPASS=true: khong duoc bat tren production" || true

  [ -n "$(get CLOUDINARY_CLOUD_NAME)" ] || warn "CLOUDINARY_CLOUD_NAME rong: upload anh (va dang bai kem anh) se loi"
  [ -n "$(get MS_OAUTH_CLIENT_ID)" ] || warn "MS_OAUTH_CLIENT_ID rong: email xac thuc se khong duoc gui"

  if docker compose version >/dev/null 2>&1; then
    ok "$(docker compose version | head -n 1)"
  else
    fail "khong chay duoc docker compose"
  fi
  if [ "$FAILURES" -eq 0 ]; then
    if "${COMPOSE[@]}" config --quiet 2>/tmp/vivacon-compose-err.$$; then
      ok "compose config hop le (base + supabase + tunnel)"
    else
      fail "compose config loi: $(head -n 3 /tmp/vivacon-compose-err.$$)"
    fi
    rm -f /tmp/vivacon-compose-err.$$
  fi
  echo "== Ket qua: $FAILURES loi, $WARNINGS canh bao"
}

confirm() {
  [ "$ASSUME_YES" -eq 1 ] && return 0
  echo
  echo "Backend se khoi dong lai va noi vao Supabase voi ddl-auto: update +"
  echo "unique_constraint_strategy: RECREATE_QUIETLY. Entity moi/cot moi se duoc TAO tren"
  echo "database production; unique constraint duoc tao lai. Da backup Supabase chua?"
  read -r -p "Go 'yes' de tiep tuc: " ans
  [ "$ans" = "yes" ] || { echo "Huy."; exit 1; }
}

wait_healthy() {
  echo "== Cho $CONTAINER healthy (toi da ${HEALTH_TIMEOUT}s)"
  local waited=0 status=""
  while [ "$waited" -lt "$HEALTH_TIMEOUT" ]; do
    status="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$CONTAINER" 2>/dev/null || echo missing)"
    [ "$status" = "healthy" ] && break
    [ "$status" = "exited" ] && break
    sleep 5; waited=$((waited + 5))
  done
  echo "  trang thai: $status sau ${waited}s"
  if [ "$status" != "healthy" ]; then
    echo "  50 dong log cuoi:"
    docker logs --tail 50 "$CONTAINER" 2>&1 | sed 's/^/    /'
    echo "  Backend KHONG healthy. Quay lai ban truoc: $0 --rollback"
    exit 1
  fi
}

summary() {
  echo "== Tom tat (khong co secret)"
  echo "  utc       : $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "  image     : $(docker inspect -f '{{.Config.Image}}' "$CONTAINER")"
  echo "  image id  : $(docker inspect -f '{{.Image}}' "$CONTAINER")"
  local url; url="$(docker exec "$CONTAINER" printenv SPRING_DATASOURCE_URL 2>/dev/null || true)"
  url="${url#jdbc:postgresql://}"
  echo "  datasource: ${url%%\?*} (sslmode=$(printf '%s' "$url" | grep -o 'sslmode=[a-z-]*' | cut -d= -f2))"
  echo "  previous  : $(get PREVIOUS_BACKEND_IMAGE)"
  local port; port="$(get FRONTEND_PORT)"; port="${port:-8081}"
  if command -v curl >/dev/null 2>&1; then
    echo "  GET /api/v1/post qua nginx (khong token): $(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$port/api/v1/post") (mong doi 401)"
    echo "  GET /api/v1/account/check?username=admin: $(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$port/api/v1/account/check?username=admin") (mong doi 200: backend doc duoc DB)"
  fi
}

recreate_backend() {
  echo "== Recreate backend (--no-deps: khong dung frontend, cloudflared, db)"
  "${COMPOSE[@]}" up -d --no-deps --no-build backend
}

case "$MODE" in
  check)
    preflight
    [ "$FAILURES" -eq 0 ]
    ;;
  deploy)
    [ -n "$IMAGE" ] || { echo "Can --image <ten:tag>" >&2; exit 2; }
    preflight
    [ "$FAILURES" -eq 0 ] || { echo "Dung lai: sua cac muc [FAIL] truoc."; exit 1; }
    if [ -n "$TAR" ]; then
      echo "== docker load -i $TAR"
      docker load -i "$TAR"
    fi
    docker image inspect "$IMAGE" >/dev/null 2>&1 || { echo "Khong co image $IMAGE tren VM." >&2; exit 1; }
    confirm
    current="$(get BACKEND_IMAGE)"
    current="${current:-vivacon-backend:latest}"
    if [ "$current" != "$IMAGE" ]; then
      set_kv PREVIOUS_BACKEND_IMAGE "$current"
    fi
    set_kv BACKEND_IMAGE "$IMAGE"
    echo "  BACKEND_IMAGE: $current -> $IMAGE"
    recreate_backend
    wait_healthy
    [ -n "$TAR" ] && rm -f "$TAR" && echo "  da xoa $TAR"
    summary
    ;;
  rollback)
    prev="$(get PREVIOUS_BACKEND_IMAGE)"
    [ -n "$prev" ] || { echo "PREVIOUS_BACKEND_IMAGE rong: khong co ban truoc de quay ve." >&2; exit 1; }
    docker image inspect "$prev" >/dev/null 2>&1 || { echo "Image $prev khong con tren VM." >&2; exit 1; }
    preflight
    [ "$FAILURES" -eq 0 ] || { echo "Dung lai: sua cac muc [FAIL] truoc."; exit 1; }
    confirm
    current="$(get BACKEND_IMAGE)"
    set_kv BACKEND_IMAGE "$prev"
    set_kv PREVIOUS_BACKEND_IMAGE "$current"
    echo "  BACKEND_IMAGE: $current -> $prev (rollback)"
    recreate_backend
    wait_healthy
    summary
    ;;
esac
