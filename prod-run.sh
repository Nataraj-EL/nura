#!/bin/bash
set -e

# Ensure network exists
docker network inspect nura-net >/dev/null 2>&1 || docker network create nura-net

# Stop existing containers if running
echo "Stopping old containers..."
docker rm -f nura-db backend frontend nura-proxy nura-postgres 2>/dev/null || true

# 1. Start Database
echo "Starting Database container..."
docker run --name nura-db \
  --network nura-net \
  -p 5432:5432 \
  -e POSTGRES_DB=nura \
  -e POSTGRES_USER=nura \
  -e POSTGRES_PASSWORD=nura \
  -v nura_pgdata:/var/lib/postgresql/data \
  -d postgres:15-alpine

# Wait for DB to be healthy
echo "Waiting for database to initialize..."
until docker exec nura-db pg_isready -U nura -d nura >/dev/null 2>&1; do
  sleep 1
done
echo "Database is ready."

# Load Env parameters from .env
if [ -f .env ]; then
  # Export variables from .env for build/run stages
  export $(grep -v '^#' .env | xargs)
fi

# 2. Build Backend Image
echo "Building Backend image..."
docker build -t nura-backend ./backend

# 3. Start Backend
echo "Starting Backend container..."
docker run --name backend \
  --network nura-net \
  -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e DB_HOST=nura-db \
  -e DB_PORT=5432 \
  -e DB_NAME=nura \
  -e DB_USER=nura \
  -e DB_PASSWORD=nura \
  -e CORS_ALLOWED_ORIGINS=${CORS_ALLOWED_ORIGINS:-https://localhost} \
  -e SMTP_HOST=${SMTP_HOST:-smtp-relay.brevo.com} \
  -e SMTP_PORT=${SMTP_PORT:-587} \
  -e SMTP_USERNAME=${SMTP_USERNAME} \
  -e SMTP_PASSWORD=${SMTP_PASSWORD} \
  -e SMTP_FROM_EMAIL=${SMTP_FROM_EMAIL} \
  -e SMTP_FROM_NAME="${SMTP_FROM_NAME:-Nura}" \
  -d nura-backend

# 4. Build Frontend Image
echo "Building Frontend image..."
docker build -t nura-frontend --build-arg NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-https://localhost} ./frontend

# 5. Start Frontend
echo "Starting Frontend container..."
docker run --name frontend \
  --network nura-net \
  -p 3000:3000 \
  -d nura-frontend

# 6. Start Nginx Proxy
echo "Starting Proxy container..."
docker run --name nura-proxy \
  --network nura-net \
  -p 80:80 \
  -p 443:443 \
  -v "$(pwd)/nginx/nginx.conf:/etc/nginx/nginx.conf:ro" \
  -v "$(pwd)/nginx/certs:/etc/nginx/certs:ro" \
  -d nginx:alpine

echo "Nura containers are up and running!"
