#!/bin/sh
set -e

CERT_DIR="$(dirname "$0")/certs"
CERT_FILE="$CERT_DIR/nura.crt"
KEY_FILE="$CERT_DIR/nura.key"

# Ensure certs directory exists
mkdir -p "$CERT_DIR"

if [ -f "$CERT_FILE" ] && [ -f "$KEY_FILE" ]; then
    echo "SSL Certificates already exist at $CERT_DIR"
else
    echo "Generating new local self-signed SSL Certificates..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$KEY_FILE" \
        -out "$CERT_FILE" \
        -subj "/C=US/ST=State/L=City/O=Nura/OU=Development/CN=localhost"
    echo "SSL Certificates generated successfully!"
fi
chmod 600 "$KEY_FILE"
chmod 644 "$CERT_FILE"
