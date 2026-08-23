#!/bin/bash
set -e

echo "=== Running pre-release quality and security validations ==="

echo "1. Validating backend Spring Boot services..."
cd backend
./mvnw clean test
cd ..

echo "2. Validating frontend Next.js applications..."
cd frontend
npm run lint
npm run test
npm run build
cd ..

echo "=== All quality and security validation gates passed successfully! ==="
