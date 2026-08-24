# Nura — Wellness & Menstrual Cycle Companion

Nura is a privacy-first menstrual cycle and wellness companion. It is designed to empower users with cycle tracking and insights while keeping their personal health data secure and local by design.

---

## Production Deployment Architecture

In production, Nura is deployed as a fully containerized stack managed via Docker or Kubernetes. The architecture consists of four primary components running inside a private Docker bridge network:

```
                  ┌───────────────────────┐
                  │      User Browser     │
                  └───────────┬───────────┘
                              │ HTTPS (:443)
                              ▼
                  ┌───────────────────────┐
                  │   Nginx Proxy Port    │
                  └───────────┬───────────┘
                              │
             ┌────────────────┴────────────────┐
             │ /api/ or /actuator/             │ / (all other routes)
             ▼                                 ▼
   ┌───────────────────┐             ┌───────────────────┐
   │  Spring Boot API  │             │ Next.js Frontend  │
   │  Container (:8080)│             │  Container (:3000)│
   └─────────┬─────────┘             └───────────────────┘
             │
             ▼
   ┌───────────────────┐
   │ PostgreSQL DB 15  │
   │  Container (:5432)│
   └───────────────────┘
```

1. **`nura-proxy` (Nginx Alpine)**: The single entrypoint for ingress traffic. Listens on ports `80` (redirects to HTTPS) and `443` (terminates SSL/TLS). Manages secure headers (HSTS, CSP, X-Frame-Options) and forwards paths to upstream containers.
2. **`frontend` (Next.js Node 20)**: Serves static assets and compiled React layouts on port `3000`. Runs under a non-root user (`nextjs`) for enhanced container safety.
3. **`backend` (Spring Boot JRE 17)**: Handles the REST API, rate limits, OTP verification, and JWT session issuing on port `8080`.
4. **`nura-db` (PostgreSQL 15)**: Persists user-profiles, cycle logging data, and session tables using persistent Docker volume maps.

---

## Required Environment Variables

All secrets, credentials, and parameters must be configured via environment variables. Do *never* hardcode or commit them to the repository. Use a secure `.env` file mapped at the root directory:

| Environment Variable | Description | Example / Fallback |
| :--- | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | Configures the Spring execution environment. | `prod` (production) / `dev` |
| `DB_HOST` | Hostname of the PostgreSQL service container. | `nura-db` |
| `DB_PORT` | Execution port of the PostgreSQL database. | `5432` |
| `DB_NAME` | Database identifier schema name. | `nura` |
| `DB_USER` | Access username of the database schema. | `nura` |
| `DB_PASSWORD` | Encrypted password string. | `nura` |
| `CORS_ALLOWED_ORIGINS` | Restricts API requests to verified frontend domains. | `https://localhost` |
| `NEXT_PUBLIC_API_URL` | Base URL of the API client inside browser. | `https://localhost` |
| `SMTP_HOST` | SMTP server endpoint domain. | `smtp-relay.brevo.com` |
| `SMTP_PORT` | Delivery protocol port. | `587` |
| `SMTP_USERNAME` | SMTP account login identifier. | *(e.g. `user@smtp-brevo.com`)* |
| `SMTP_PASSWORD` | SMTP authentication keys or tokens. | *(Brevo SMTP API key)* |
| `SMTP_FROM_EMAIL` | Verified sender email address. | *(e.g. `sender@gmail.com`)* |
| `SMTP_FROM_NAME` | Display name of the email sender. | `Nura` |
| `OTP_EXPIRY_MINUTES` | Lifecycle bounds of valid OTP codes. | `5` |
| `OTP_COOLDOWN_SECONDS`| Delay interval required between OTP resends. | `60` |

---

## Getting Started

### Local Production Setup (Localhost HTTPS Testing)

#### 1. Generate SSL Certificates
To test the full HTTPS and proxy pipeline locally, generate a self-signed SSL certificate:
```bash
./nginx/generate-certs.sh
```
This generates `nura.crt` and `nura.key` inside the `nginx/certs/` folder.

#### 2. Start the Stack (Docker Compose / Runner)
If Docker Compose is installed:
```bash
docker compose up -d --build
```
On environments where `docker compose` CLI is unavailable, run the customized runner script:
```bash
./prod-run.sh
```
This script creates a private network, starts the database, builds the production Java and Node images, and executes Nginx proxy routing locally.

To stop and clean up containers:
```bash
./prod-stop.sh
```

---

## Database Operations

### 1. Auto-Migrations
Database schemas are automatically maintained via Flyway. When the `backend` container starts, it will auto-run SQL scripts in `backend/src/main/resources/db/migration` prior to starting the web listener.

### 2. Manual Backup
To backup the production PostgreSQL database:
```bash
docker exec -t nura-db pg_dump -U nura -d nura > nura_backup_$(date +%F).sql
```

### 3. Restore / Rollback
To restore a backup:
1. Drop current tables or spin up an empty container.
2. Load the SQL file:
```bash
cat nura_backup_XXXX.sql | docker exec -i nura-db psql -U nura -d nura
```

---

## Production Health Checks

### Actuator Monitoring
Exposed health probes check critical subsystem readiness:
- **Liveness Probe**: `https://localhost/actuator/health/liveness` (Returns `{"status": "UP"}` if JVM is alive).
- **Readiness Probe**: `https://localhost/actuator/health/readiness` (Returns `{"status": "UP"}` if DB connection is active and ready).

---

## Production Smoke-Test Checklist

After launching the production deployment, verify these checklist items:

1. **SSL & Ingress Routing**:
   - [ ] Verify that opening `http://localhost` redirects to `https://localhost`.
   - [ ] Verify that the self-signed certificate warning loads and can be bypassed for testing.
2. **Health Endpoints**:
   - [ ] Curl `https://localhost/actuator/health` and verify the database status is `UP`.
   - [ ] Verify that the header `X-Correlation-ID` is present on all actuator responses.
3. **Authentication Flow (Brevo SMTP)**:
   - [ ] Request a verification code at `https://localhost/login` with a valid email.
   - [ ] Check your Brevo mailbox and verify the OTP delivers within 1 minute.
   - [ ] Submit the correct 6-digit code. Verify that you are redirected to the dashboard.
   - [ ] Inspect browser cookies for `nura_session`. Verify it contains the `Secure; HttpOnly; SameSite=Lax` parameters.
4. **Logout Invalidation**:
   - [ ] Perform a logout at `https://localhost/settings` or via navigation controls.
   - [ ] Confirm that `nura_session` cookie is cleared and the session is deleted from the backend.
