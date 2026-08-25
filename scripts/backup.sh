#!/bin/bash
set -e

# Resolve script directory to load .env from project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

if [ -f "${PROJECT_ROOT}/.env" ]; then
  echo "Loading configuration from .env file..."
  export $(grep -v '^#' "${PROJECT_ROOT}/.env" | xargs)
fi

DB_CONTAINER=${DB_CONTAINER_NAME:-nura-db}
DB_USER=${DB_USER:-nura}
DB_NAME=${DB_NAME:-nura}

BACKUP_DIR="${PROJECT_ROOT}/backups"
mkdir -p "$BACKUP_DIR"

BACKUP_FILE="${BACKUP_DIR}/nura_backup_$(date +%Y-%m-%d_%H%M%S).sql"

echo "Initiating database backup..."
echo "Container: ${DB_CONTAINER}"
echo "Database:  ${DB_NAME}"
echo "User:      ${DB_USER}"

# Run pg_dump within the container
docker exec -t "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE"

if [ -s "$BACKUP_FILE" ]; then
  echo "Database backup completed successfully!"
  echo "Backup saved to: ${BACKUP_FILE}"
else
  echo "Error: Backup file is empty. Backup may have failed."
  exit 1
fi
