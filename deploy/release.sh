#!/usr/bin/env bash
set -Eeuo pipefail
cd "$(dirname "$0")"
: "${LEO_IMAGE:?Set LEO_IMAGE to the already built new image ID/tag}"
: "${NGINX_IMAGE:?Set NGINX_IMAGE to a pinned image digest}"
: "${CLOUDFLARED_IMAGE:?Set CLOUDFLARED_IMAGE to a pinned image digest}"
exec 9>/var/lib/leo/deploy.lock
flock -n 9 || { echo 'Another deployment is running.' >&2; exit 1; }
compose=(docker compose -f compose.yaml)
old_container=$("${compose[@]}" ps -q app)
old_image=''
if [[ -n "$old_container" ]]; then old_image=$(docker inspect --format '{{.Image}}' "$old_container"); fi
candidate="leo-candidate-$$"
switched=0
drained=0
cleanup() {
  local code=$?
  docker rm -f "$candidate" >/dev/null 2>&1 || true
  if (( code != 0 && switched == 1 )) && [[ -n "$old_image" ]]; then
    echo 'New release failed; restoring the previous application image.' >&2
    LEO_IMAGE="$old_image" "${compose[@]}" up -d --no-deps --wait app || true
  fi
  if (( drained == 1 )); then "${compose[@]}" exec -T app npm run ops -- resume || true; fi
  exit "$code"
}
trap cleanup EXIT
docker image inspect "$LEO_IMAGE" >/dev/null
# No secrets are printed. The existing app/tunnel remain running during validation.
if [[ -n "$old_container" ]]; then
  "${compose[@]}" exec -T app npm run backup
fi
docker run --rm --env-file /etc/leo/production.env -v /var/lib/leo:/data "$LEO_IMAGE" npm run db:migrate
docker run -d --name "$candidate" --network none --env-file /etc/leo/production.env -e LEO_CANDIDATE=1 -v /var/lib/leo:/data:ro "$LEO_IMAGE" >/dev/null
healthy=0
for attempt in {1..30}; do
  if docker exec "$candidate" node scripts/healthcheck.mjs; then healthy=1; break; fi
  sleep 2
done
(( healthy == 1 )) || { echo 'Candidate did not become healthy.' >&2; exit 1; }
docker rm -f "$candidate" >/dev/null
if [[ -n "$old_container" ]]; then
  "${compose[@]}" exec -T app npm run ops -- drain
  drained=1
fi
switched=1
"${compose[@]}" up -d --no-deps --wait --wait-timeout 90 app
"${compose[@]}" exec -T app npm run ops -- resume
drained=0
"${compose[@]}" up -d gateway tunnel
echo 'Release is healthy. The named tunnel and public domain are unchanged.'
# Schema rollback is deliberately not automatic. Only additive migrations are allowed
# while the old version is running; a destructive migration needs a separate plan.
