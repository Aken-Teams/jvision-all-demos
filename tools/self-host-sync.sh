#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=${JVISION_REPO_ROOT:-$(dirname -- "$SCRIPT_DIR")}
DEPLOY_BRANCH=${JVISION_DEPLOY_BRANCH:-feat/homepage-impact}
APP_PORT=${JVISION_APP_PORT:-4173}
LOCK_FILE=${JVISION_SYNC_LOCK_FILE:-/tmp/jvision-github-sync.lock}
FAILED_SHA_FILE=${JVISION_FAILED_SHA_FILE:-/tmp/jvision-github-sync.failed-sha}
PID_FILE=${JVISION_PID_FILE:-/tmp/jvision-demo-4173.pid}
APP_LOG=${JVISION_APP_LOG:-/tmp/jvision-demo-4173.log}
BUNDLE_PATH=${JVISION_BUNDLE_PATH:-}
BUNDLE_REF=${JVISION_BUNDLE_REF:-}

log() {
  printf '%s %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$*"
}

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  log "Another deployment check is already running."
  exit 0
fi

cd "$REPO_ROOT"
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  log "Deployment checkout has tracked local changes; refusing to overwrite them."
  exit 1
fi

stop_app() {
  if [ ! -f "$PID_FILE" ]; then
    return 0
  fi
  app_pid=$(cat "$PID_FILE" 2>/dev/null || true)
  case "$app_pid" in
    *[!0-9]*|"") rm -f -- "$PID_FILE"; return 0 ;;
  esac
  if kill -0 "$app_pid" 2>/dev/null; then
    process_args=$(tr '\000' ' ' <"/proc/$app_pid/cmdline" 2>/dev/null || true)
    case "$process_args" in
      *"node server.mjs"*) kill "$app_pid" ;;
      *) log "PID $app_pid is not the JVision Node process; refusing to stop it."; return 1 ;;
    esac
    wait_count=0
    while kill -0 "$app_pid" 2>/dev/null && [ "$wait_count" -lt 10 ]; do
      sleep 1
      wait_count=$((wait_count + 1))
    done
  fi
  rm -f -- "$PID_FILE"
}

start_app() {
  release_sha=$1
  nohup env \
    HOST=0.0.0.0 \
    PORT="$APP_PORT" \
    JVISION_RELEASE_SHA="$release_sha" \
    JVISION_DEPLOY_BRANCH="$DEPLOY_BRANCH" \
    node server.mjs >>"$APP_LOG" 2>&1 &
  echo "$!" >"$PID_FILE"
}

health_matches() {
  expected_sha=$1
  health_body=$(curl --fail --silent --show-error --max-time 5 "http://127.0.0.1:$APP_PORT/api/health" 2>/dev/null || true)
  case "$health_body" in
    *"\"ok\":true"*"\"release\":\"$expected_sha\""*) return 0 ;;
    *) return 1 ;;
  esac
}

wait_for_health() {
  expected_sha=$1
  health_attempt=0
  while [ "$health_attempt" -lt 20 ]; do
    if health_matches "$expected_sha"; then
      return 0
    fi
    sleep 1
    health_attempt=$((health_attempt + 1))
  done
  return 1
}

restart_release() {
  release_sha=$1
  stop_app
  start_app "$release_sha"
  wait_for_health "$release_sha"
}

if [ -n "$BUNDLE_PATH" ]; then
  if [ -z "$BUNDLE_REF" ] || [ ! -f "$BUNDLE_PATH" ]; then
    log "Bundle deployment requires an existing bundle path and an explicit bundle ref."
    exit 1
  fi
  git fetch --quiet "$BUNDLE_PATH" "$BUNDLE_REF"
else
  git fetch --quiet origin "$DEPLOY_BRANCH"
fi
current_sha=$(git rev-parse HEAD)
candidate_sha=$(git rev-parse FETCH_HEAD)

if [ "$candidate_sha" = "$current_sha" ]; then
  if health_matches "$current_sha"; then
    log "Already current at $current_sha."
    exit 0
  fi
  log "Current release is not healthy; restarting $current_sha."
  if restart_release "$current_sha"; then
    log "Recovered release $current_sha."
    exit 0
  fi
  log "Release $current_sha did not recover."
  exit 1
fi

if [ -f "$FAILED_SHA_FILE" ] && [ "$(cat "$FAILED_SHA_FILE" 2>/dev/null || true)" = "$candidate_sha" ]; then
  log "Skipping previously failed release $candidate_sha."
  exit 1
fi

STAGE_DIR="/tmp/jvision-stage-$candidate_sha-$$"
cleanup_stage() {
  git -C "$REPO_ROOT" worktree remove --force "$STAGE_DIR" >/dev/null 2>&1 || true
  rm -rf -- "$STAGE_DIR"
}
trap cleanup_stage EXIT HUP INT TERM

log "Validating candidate $candidate_sha."
git worktree add --quiet --detach "$STAGE_DIR" "$candidate_sha"
node --check "$STAGE_DIR/server.mjs"
node --check "$STAGE_DIR/app.js"
node --check "$STAGE_DIR/project-expert.js"
node -e "JSON.parse(require('node:fs').readFileSync(process.argv[1], 'utf8'))" "$STAGE_DIR/projects-index.json"

dependency_changed=0
if ! git diff --quiet "$current_sha" "$candidate_sha" -- package-lock.json; then
  dependency_changed=1
  (cd "$STAGE_DIR" && npm ci --omit=dev --ignore-scripts)
fi
(cd "$STAGE_DIR" && NODE_PATH="$REPO_ROOT/node_modules" node tools/test-self-hosted-runtime.mjs)

log "Activating release $candidate_sha."
git reset --hard --quiet "$candidate_sha"
if [ "$dependency_changed" -eq 1 ]; then
  npm ci --omit=dev --ignore-scripts
fi

if restart_release "$candidate_sha"; then
  rm -f -- "$FAILED_SHA_FILE"
  log "Deployment succeeded: $current_sha -> $candidate_sha."
  exit 0
fi

log "Health check failed for $candidate_sha; rolling back to $current_sha."
printf '%s\n' "$candidate_sha" >"$FAILED_SHA_FILE"
stop_app || true
git reset --hard --quiet "$current_sha"
if [ "$dependency_changed" -eq 1 ]; then
  npm ci --omit=dev --ignore-scripts
fi
if restart_release "$current_sha"; then
  log "Rollback succeeded at $current_sha."
else
  log "Rollback could not restore a healthy service at $current_sha."
fi
exit 1
