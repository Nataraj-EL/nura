#!/bin/bash
echo "Stopping and removing all Nura production containers..."
docker rm -f nura-db backend frontend nura-proxy 2>/dev/null || true
echo "Nura containers stopped successfully."
