# 🛡️ ThreatGuard - Threat Incident Management System (SOC Platform)

[![Build Status](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-blue.svg)](https://github.com/Pranav-0440/threat-incident-management/actions)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.5-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://www.oracle.com/java/)
[![React](https://img.shields.io/badge/React-19.2-61dafb.svg)](https://react.dev/)
[![Redis](https://img.shields.io/badge/Cache-Redis%20%2F%20Upstash-DC382D.svg)](https://redis.io/)
[![Supabase](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E.svg)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Contributing](https://img.shields.io/badge/Contributions-Welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Code of Conduct](https://img.shields.io/badge/Code%20of%20Conduct-v2.1-orange.svg)](CODE_OF_CONDUCT.md)

**ThreatGuard** is a full-stack Security Operations Center (SOC) reference application for reporting, investigating, triaging, collaborating on, and resolving physical and cybersecurity incidents.

Built with a **Spring Boot 3.3** backend, **Redis (Upstash)** in-memory cache layer, **Supabase PostgreSQL** (with an optional local PostgreSQL container), and a responsive **React 19** dashboard. The current AI-labelled experiences are deterministic client-side helpers; they do not call an external LLM service.

---

## 📸 Enterprise Platform Highlights

<p align="center">
  <img src="https://github.com/user-attachments/assets/415c6acf-da2a-4c86-96ce-82f375a27fde" alt="ThreatGuard SOC Intelligence Dashboard" width="900" style="border-radius: 12px; box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5); max-width: 100%; height: auto;" />
</p>

---

## 🏛️ System Architecture

```mermaid
graph TD
    User([Browser Client / React 19 App]) -->|HTTPS / REST API| Nginx[Production / Vercel]
    Nginx -->|JWT Bearer Auth| SpringBoot[Spring Boot 3.3.5 Backend Service]
    
    subgraph Caching & Persistence
        SpringBoot -->|Fast Cache Lookup <1ms| Redis[(Redis / Upstash Cache)]
        Redis -.->|Cache Miss / Eviction| Postgres[(Supabase PostgreSQL)]
        SpringBoot -->|Spring Data JPA| Postgres
        SpringBoot -->|Configured filesystem| UploadsDir[uploads/ File Store]
        SpringBoot -.->|Optional search fallback| Elasticsearch[(Elasticsearch)]
    end

    subgraph Application Services
        SpringBoot -->|Risk score and priority calculation| RiskEngine[Deterministic Risk Calculator]
        SpringBoot -->|Audit logging service| AuditLogs[(Audit Log Records)]
        SpringBoot -->|Notification service| Notifications[In-App Notifications]
    end
```

PostgreSQL is the backend system of record. Evidence files use the local filesystem path configured by `file.upload-dir` (default `uploads`); production deployments therefore require persistent/shared storage or an explicitly configured storage provider.

---

## ⚡ Redis In-Memory Caching Layer

ThreatGuard integrates **Spring Cache + Spring Data Redis (Lettuce)** to eliminate repeated database roundtrips during authentication and active investigation workflows:

| Cache Region | Target Method | TTL | Eviction Strategy |
| :--- | :--- | :--- | :--- |
| `userDetails` | `UserService.loadUserByUsername()` | **10 minutes** | Cleared on registration (`registerUser`) & role updates (`updateUserRole`) |
| `incidents` | `IncidentService.getIncidentById()` | **5 minutes** | Auto-evicted on updates |
| `default` | General cached entities | **15 minutes** | Automatic TTL expiration |

---

## 🚀 Key Feature Modules

### 1. 🔒 Hardened Authentication & Role-Based Access Control (RBAC)
- **Role Selection Cards**: Register as a **SOC Analyst** or **Administrator** directly on the sign-up page.
- **First-User Bootstrap**: The first registered system account automatically receives `ROLE_SUPER_ADMIN`.
- **Effective Role Hierarchy**: A `ROLE_SUPER_ADMIN` account is treated as an administrator and analyst by the database-backed authority mapping; ordinary registration accepts only `ANALYST` or `ADMIN`.
- **Login Identifier**: Authentication accepts either username or registered email address.
- **Admin User Management Console (`/admin/users`)**: Dedicated admin control panel to view registered analyst accounts, manage roles (`ANALYST` / `ADMIN`), and review active assigned workloads.

### 2. 🕵️ Security Analyst Investigation Workspace
- **Tabbed Workspace (`IncidentDetailPage.jsx`)**:
  - **Overview**: High-level metadata, risk assessment score gauge (0-100), client-side executive summary preview, and 6-item interactive SOC investigation checklist.
  - **Timeline**: Vertical Jira-style chronological history rendering audit-log records.
  - **Comments**: Threaded investigation discussion box.
  - **Evidence Files**: Multi-media file manager supporting screenshots, log files, PDFs, audio/video.
- **Lifecycle Stepper**: Visual 5-step progress pipeline (`OPEN` → `INVESTIGATING` → `WAITING_EVIDENCE` → `RESOLVED` → `CLOSED`).

### 3. AI-Labelled Client Helpers
- **Floating Assistant (`AiCopilotWidget.jsx`)**: An authenticated client-side helper that fetches incidents and applies deterministic keyword rules for common investigation prompts.
- **Auto-Suggestion (`CreateIncidentPage.jsx`)**: A local keyword heuristic suggests severity, category, priority (`P1-P4`), and risk score; the user remains responsible for the submitted values.
- **Executive Summary Preview (`IncidentDetailPage.jsx`)**: Generates a deterministic client-side summary from incident fields. There is no external LLM or backend AI endpoint in the current implementation.

### 4. 📊 Dashboard Analytics & Interactive Workspaces
- **Clickable Dashboard KPI Cards**: Click "Open Incidents" or "Critical Alerts" on `DashboardPage.jsx` to open the workspace pre-filtered.
- **Visual Analytics**: Interactive Severity Breakdown Donut Charts and Lifecycle Pipeline Bar Charts.
- **"My Incidents" Workspace Tabs**: Sub-header tabs for *All Incidents*, *Assigned to Me*, *Reported by Me*, and *Resolved*.
- **Starred Saved Presets Bar**: 1-Click filter shortcuts (`★ P1 Critical`, `★ Assigned To Me`, `★ High Risk (>70)`, `★ Today's Incidents`).

### 5. 📄 Executive Reports & Data Exporter
- **1-Click PDF Report Generator**: Produces branded Executive Incident Summaries with risk gauges and incident metadata; any AI-labelled notes are client-side text, not external model output.
- **Bulk CSV Exporter**: Exports filtered incident tables into downloadable CSV spreadsheets.

### 6. Audit Logs & In-App Notifications
- **Audit Logging Service**: Records creation, status updates, assignments, checklist toggles, comments, and attachment uploads with actor metadata and timestamps. The current application does not provide audit-log mutation endpoints; database-level immutability is not claimed here.
- **Notification Center Drawer**: Real-time notification drawer in `Navbar.jsx` with unread counter badge and "Mark all read" capabilities.

---

## ⚖️ Risk Score & Priority Matrix Formula

ThreatGuard calculates a risk score (0-100) from severity and category weights, assigning an SLA priority window:

$$\text{Risk Score} = \text{Severity Weight} + \text{Category Weight}$$

| Severity Factor | Points | Category Factor | Points |
| :--- | :---: | :--- | :---: |
| **CRITICAL** | +50 | **WORKPLACE_VIOLENCE** | +30 |
| **HIGH** | +35 | **CYBER_THREAT** | +25 |
| **MEDIUM** | +20 | **THREAT** | +20 |
| **LOW** | +10 | **SUSPICIOUS_ACTIVITY** | +15 |
| | | **PHYSICAL_SECURITY** | +15 |

### Priority & Target Response SLA Windows
| Priority | Trigger Criteria | Target SLA |
| :--- | :--- | :---: |
| 🔴 **P1 - Critical** | Severity = CRITICAL or Risk Score $\ge 70$ | **4 Hours** |
| 🟠 **P2 - High** | Severity = HIGH or Risk Score $\ge 50$ | **8 Hours** |
| 🟡 **P3 - Medium** | Severity = MEDIUM or Risk Score $\ge 30$ | **24 Hours** |
| 🟢 **P4 - Low** | Severity = LOW or Risk Score $< 30$ | Standard queue |

---

## 🔌 REST API Reference & Interactive Docs

Interactive OpenAPI documentation is available when running the backend:
- **Swagger UI**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **OpenAPI JSON Spec**: [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

### Core Endpoints

#### Authentication (`/api/v1/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Public | Registers a new user with selected role (`ANALYST` or `ADMIN`) |
| `POST` | `/api/v1/auth/login` | Public | Authenticates credentials against database and returns JWT token |
| `POST` | `/api/v1/auth/forgot-password` | Public | Requests a reset link using a username or email without revealing account existence |
| `POST` | `/api/v1/auth/reset-password` | Public | Applies a valid, unexpired, single-use reset token to a new BCrypt password |

#### Incidents (`/api/v1/incidents`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/incidents` | Authenticated | Legacy unpaged list of security incidents |
| `GET` | `/api/v1/incidents/page` | Authenticated | Get bounded, filtered, stably sorted incident pages |
| `GET` | `/api/v1/incidents/{id}` | Authenticated | Get detailed incident by ID |
| `GET` | `/api/v1/incidents/{id}/related` | Authenticated | Get matching historical incidents |
| `GET` | `/api/v1/incidents/search?q=` | Authenticated | Full-text PostgreSQL native search |
| `GET` | `/api/v1/incidents/stats` | Authenticated | Get scoped dashboard counts and risk metrics |
| `GET` | `/api/v1/incidents/analytics` | Authenticated | Get server-derived scoped analytics metrics |
| `POST` | `/api/v1/incidents` | Analyst, Admin | Create a new security incident |
| `PUT` | `/api/v1/incidents/{id}` | Analyst, Admin | Update incident details |
| `PATCH` | `/api/v1/incidents/{id}/status` | Admin, Super Admin | Update lifecycle status (`OPEN`, `INVESTIGATING`, etc.) |
| `PATCH` | `/api/v1/incidents/{id}/assign` | Admin, Super Admin | Assign analyst to incident |
| `PATCH` | `/api/v1/incidents/{id}/checklist/{itemId}/toggle` | Admin, Super Admin | Toggle investigation checklist item |
| `DELETE` | `/api/v1/incidents/{id}` | Admin, Super Admin | Delete incident record |

#### Evidence (`/api/v1/attachments`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/attachments/upload/{incidentId}` | Authenticated | Store an incident attachment on the configured backend filesystem |
| `GET` | `/api/v1/attachments/incident/{incidentId}` | Authenticated | List attachments for an incident |
| `GET` | `/api/v1/attachments/files/{fileName}` | Authenticated | Stream an attachment by stored filename |
| `DELETE` | `/api/v1/attachments/{id}` | Authenticated | Delete an attachment record and local file |

#### Comments (`/api/v1/incidents/{incidentId}/comments`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/incidents/{incidentId}/comments` | Authenticated | Add a comment using the authenticated user as author |
| `GET` | `/api/v1/incidents/{incidentId}/comments` | Authenticated | List incident comments |
| `DELETE` | `/api/v1/incidents/{incidentId}/comments/{commentId}` | Admin, Super Admin | Delete an incident comment subject to service authorization |

#### Audit Logs (`/api/v1/audit-logs`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/audit-logs/incident/{incidentId}` | Authenticated | List logs associated with an incident |
| `GET` | `/api/v1/audit-logs` | Admin | List all audit logs |

#### Notifications (`/api/v1/notifications`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/notifications` | Authenticated | List notifications for the authenticated user |
| `GET` | `/api/v1/notifications/unread-count` | Authenticated | Return the authenticated user’s unread count |
| `PATCH` | `/api/v1/notifications/{id}/read` | Authenticated | Mark one notification as read |
| `PATCH` | `/api/v1/notifications/read-all` | Authenticated | Mark all notifications as read |

#### User Management (`/api/v1/users`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/users` | Admin, Super Admin | Get user workload summaries |
| `PATCH` | `/api/v1/users/{id}/role` | Admin, Super Admin | Update user role (`ANALYST` / `ADMIN`) |

---

## 🛠️ Local Development Setup

### Prerequisites
- **Java 21 JDK** (Eclipse Temurin recommended)
- **Maven 3.9+**
- **Node.js 20+** / **Node.js 22+**
- **Redis Server** or **Upstash Account** *(Optional local Docker container available)*

---

### 1. Environment Configuration

Create `backend/.env` in the backend root:

```env
# Database (Supabase or Local PostgreSQL)
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/postgres
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=your_postgres_password

# Security & JWT
JWT_SECRET=OGY0ZTIxYTljM2Q1YjdlMGYxYTJiM2M0ZDVlNmY3YThiOWMwZDFlMmYzYTRiNWM2ZDdlOGY5YTBiMWMyZDNlNA==

# Redis Caching (Upstash or Local)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_SSL=false
```

---

### 2. Start Backend Service (Spring Boot)

```bash
cd backend
mvn spring-boot:run
```
> Server runs on **`http://localhost:8080`**.

---

### 3. Start Frontend Dashboard (React + Vite)

```bash
cd frontend
npm install
npm run dev
```
> Dashboard runs on **`http://localhost:5173`**.

---

## 🧪 Testing & Quality Assurance

```bash
# Backend unit & integration test suite
cd backend
mvn test --batch-mode

# Frontend linter & production bundle verification
cd frontend
npm run lint
npm run build
```

---

## 🤝 Contributing

Contributions are warmly welcomed! Please read our [**Contributing Guide**](CONTRIBUTING.md) and [**Code of Conduct**](CODE_OF_CONDUCT.md) for full details on our branching workflow, code conventions, and pull request process.

1. Fork the repo & create your feature branch: `git checkout -b feat/your-feature-name`
2. Commit your changes following [Conventional Commits](https://www.conventionalcommits.org/): `git commit -m 'feat: add new feature'`
3. Push to your branch: `git push origin feat/your-feature-name`
4. Open a **Pull Request**

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.
