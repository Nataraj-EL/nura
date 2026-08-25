# Database Backup & Recovery Procedure

This document outlines the backup and recovery operations for the Nura production PostgreSQL database.

## Prerequisites

- Access to the host system running the Docker stack.
- Correct configuration in the `.env` file at the project root.

---

## 1. Database Backup

To create a new backup of the PostgreSQL database, run the `backup.sh` script:

```bash
./scripts/backup.sh
```

### What this script does:
1. Automatically resolves the project path and loads environment variables from `.env` (to identify the database container name, username, and database name).
2. Creates a directory named `backups/` in the project root if it does not already exist.
3. Spawns `pg_dump` securely inside the PostgreSQL container without passing passwords on the command line.
4. Generates a timestamped SQL dump (e.g., `backups/nura_backup_2026-08-25_192618.sql`).

---

## 2. Database Restore

To restore the database from an existing backup SQL dump, run the `restore.sh` script, passing the path to the backup file:

```bash
./scripts/restore.sh backups/nura_backup_YYYY-MM-DD_HHMMSS.sql
```

### Recovery Steps:
1. Ensure the docker containers are currently running (`docker compose up -d`).
2. Run the restore command above.
3. When prompted, confirm the operation by entering `y`.
4. The script streams the SQL file back into the container's PostgreSQL client, rebuilding schemas and populating data.
5. Verify application integrity by visiting the dashboard or calling health checks.

> [!WARNING]
> Restoring a backup overwrites any matching tables in the current target database. Ensure you take a fresh backup before performing a restore.
