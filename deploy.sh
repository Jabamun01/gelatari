#!/usr/bin/env bash
set -euo pipefail

# Deploy gelatari to TrueNAS SCALE
# Usage: ./deploy.sh [--skip-build]
#   --skip-build  Skip building/pushing, only sync files

SSH_HOST="${SSH_HOST:-truenas_admin@192.168.18.69}"
SSH_PASS="${SSH_PASS:-patata!36}"
REMOTE_DIR="${REMOTE_DIR:-/mnt/MegaTzem/apps/gelatari/code}"
COMPOSE_BACKUP="${COMPOSE_BACKUP:-/tmp/gelatari-correct-compose.yml}"
TAR_PATH=/tmp/gelatari-update.tar.gz

echo "🔨 Creating archive (excluding .git, node_modules, .pi, docker-compose.yml)..."
cd "$(dirname "$0")"
rm -f "$TAR_PATH"
tar --exclude='.git' \
    --exclude='node_modules' \
    --exclude='.pi' \
    --exclude='measure.html' \
    --exclude='progress.md' \
    --exclude='validation-*' \
    --exclude='docker-compose.yml' \
    -czf "$TAR_PATH" .

echo "📡 SCP to ${SSH_HOST}..."
sshpass -p "$SSH_PASS" scp -o StrictHostKeyChecking=no "$TAR_PATH" "${SSH_HOST}:/tmp/"

echo "📦 Extracting and deploying on remote..."
sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no "$SSH_HOST" << EOF
  echo '$SSH_PASS' | sudo -S tar xzf /tmp/gelatari-update.tar.gz -C "$REMOTE_DIR"
  echo '$SSH_PASS' | sudo -S cp "$COMPOSE_BACKUP" "$REMOTE_DIR/docker-compose.yml"
  cd "$REMOTE_DIR"
  echo '$SSH_PASS' | sudo -S docker compose up -d --build 2>&1 | tail -10
EOF

echo "✅ Deploy complete."
