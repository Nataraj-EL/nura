# Nura — Wellness & Menstrual Cycle Companion

Nura is a privacy-first menstrual cycle and wellness companion. It is designed to empower users with tracking and insights while keeping their personal health data secure and local by design.

---

## Architecture

Nura uses a decoupled client-server architecture inside a monorepo structure:
- **Frontend**: A highly responsive, mobile-first Next.js web application built with TypeScript and styled using Tailwind CSS v4.
- **Backend**: A robust REST API built with Java 17 and Spring Boot.
- **Database**: PostgreSQL (to be integrated in a later sprint).

```
nura/
├── frontend/             # Next.js & TypeScript client app
├── backend/              # Spring Boot & Java API application
├── .gitignore            # Git exclusions for both frontend and backend
└── README.md             # This file
```

---

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 (CSS-first configuration)
- **Linting & Formatting**: ESLint & Prettier

### Backend
- **Framework**: Spring Boot (Java 17)
- **Build Tool**: Maven
- **Observability**: Spring Boot Actuator

---

## Getting Started

### Prerequisites
- **Node.js** (v18.x or later)
- **Java JDK** 17
- **Maven** 3.9+
- **Git**

---

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment configuration:
   ```bash
   cp .env.example .env.local
   ```
   *(Note: Modify `.env.local` to fit your local development environment. Do not commit `.env.local` to git.)*
4. Run the local development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Compile and package the application:
   ```bash
   ./mvnw clean compile
   ```
3. Run the Spring Boot application:
   ```bash
   ./mvnw spring-boot:run
   ```
   The backend will start on [http://localhost:8080](http://localhost:8080).
4. Verify server health:
   ```bash
   curl http://localhost:8080/actuator/health
   ```

---

## Development Commands

| Directory | Command | Description |
| :--- | :--- | :--- |
| **frontend/** | `npm run dev` | Starts the React/Next.js dev server at port 3000. |
| **frontend/** | `npm run build` | Compiles the frontend for production. |
| **frontend/** | `npm run lint` | Runs ESLint check across source code files. |
| **backend/** | `./mvnw spring-boot:run` | Starts the Spring Boot API at port 8080. |
| **backend/** | `./mvnw clean compile` | Cleans and compiles the backend Java source. |
| **backend/** | `./mvnw clean test` | Runs backend unit and integration tests. |

---

## Git Workflow

For development updates:
1. Ensure your local branch is up-to-date:
   ```bash
   git pull origin main
   ```
2. Implement features or sprint goals locally.
3. Test your changes locally (ensure linting and compiles succeed).
4. Commit your changes using descriptive commit messages (e.g. `feat(sprint-1): establish project foundation`).
5. Push to the remote repository:
   ```bash
   git push origin main
   ```
