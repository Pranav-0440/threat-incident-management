# Threat Incident Management System

A full-stack threat incident management application with a Spring Boot REST API backend and a modern React dashboard frontend.

## Architecture

- **Backend**: Spring Boot 3.3, MongoDB, Elasticsearch, JWT Security
- **Frontend**: React + Vite, Axios, React Router, Lucide Icons
- **Infrastructure**: Docker Compose (MongoDB 7, Elasticsearch 8.12)

## Quick Start

### Prerequisites
- Java 21+
- Maven 3.9+
- Node.js 18+
- Docker Desktop

### 1. Start Infrastructure

```bash
docker compose up -d
```

This starts MongoDB (port 27017) and Elasticsearch (port 9200).

### 2. Start Backend

```bash
cd backend
mvn spring-boot:run
```

The API will be available at `http://localhost:8080`.

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

The dashboard will be available at `http://localhost:5173`.

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register a new user |
| POST | `/api/v1/auth/login` | Login and get JWT token |

### Incidents
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/v1/incidents` | Authenticated | List all incidents |
| GET | `/api/v1/incidents/{id}` | Authenticated | Get incident by ID |
| GET | `/api/v1/incidents/search?q=` | Authenticated | Full-text search |
| GET | `/api/v1/incidents/stats` | Authenticated | Dashboard statistics |
| POST | `/api/v1/incidents` | ANALYST, ADMIN | Create incident |
| PUT | `/api/v1/incidents/{id}` | ANALYST, ADMIN | Update incident |
| PATCH | `/api/v1/incidents/{id}/status` | ADMIN | Update status |
| DELETE | `/api/v1/incidents/{id}` | ADMIN | Delete incident |

## Risk Score Calculation

| Factor | Score |
|--------|-------|
| Severity: CRITICAL | +50 |
| Severity: HIGH | +35 |
| Severity: MEDIUM | +20 |
| Severity: LOW | +10 |
| Category: WORKPLACE_VIOLENCE | +30 |
| Category: THREAT | +20 |
| Category: SUSPICIOUS_ACTIVITY | +15 |

Maximum score is capped at **100**.

## Roles

- **ANALYST** — Can view and create incidents
- **ADMIN** — Can view, create, update status, and delete incidents

## Running Tests

```bash
cd backend
mvn test
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend Framework | Spring Boot 3.3.5 |
| Database | MongoDB 7 |
| Search Engine | Elasticsearch 8.12 |
| Authentication | JWT (jjwt 0.12) |
| Frontend | React 19, Vite |
| HTTP Client | Axios |
| Icons | Lucide React |
| CI/CD | GitHub Actions |
