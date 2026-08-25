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

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Error: Missing backup file argument."
  echo "Usage: $0 <path_to_backup_file.sql>"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file '${BACKUP_FILE}' not found."
  exit 1
fi

echo "Warning: This will overwrite existing data in the database '${DB_NAME}'."
read -p "Are you sure you want to proceed? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Restore aborted by user."
  exit 1
fi

echo "Initiating database restore..."
echo "Container: ${DB_CONTAINER}"
echo "Database:  ${DB_NAME}"
echo "User:      ${DB_USER}"
echo "Source:    ${BACKUP_FILE}"

# Stream backup into the container's psql
docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" < "$BACKUP_FILE"

echo "Database restore completed successfully!"
