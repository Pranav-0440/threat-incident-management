# Contributing to ThreatGuard

First off, thank you for considering contributing to **ThreatGuard**! 🎉

We welcome contributions from everyone — whether you're fixing a bug, adding new features, improving documentation, or opening an issue.

---

## 📜 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [How Can I Contribute?](#-how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Pull Requests](#pull-requests)
- [Development Setup](#-development-setup)
  - [Prerequisites](#prerequisites)
  - [Backend Setup (Spring Boot)](#backend-setup-spring-boot)
  - [Frontend Setup (React + Vite)](#frontend-setup-react--vite)
- [Branching Strategy & Commit Guidelines](#-branching-strategy--commit-guidelines)
  - [Branch Naming](#branch-naming)
  - [Commit Messages](#commit-messages)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Pull Request Checklist](#-pull-request-checklist)

---

## 🤝 Code of Conduct

This project and everyone participating in it is governed by the [ThreatGuard Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [pranavghorpade61@gmail.com](mailto:pranavghorpade61@gmail.com).

---

## 💡 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues as you might find that you don't need to create a new one. When you are creating a bug report, please include as many details as possible:

* **Clear, descriptive title**
* **Steps to reproduce the problem**
* **Expected vs actual behavior**
* **Screenshots / logs if applicable**
* **Environment details** (OS, Node.js version, Java version, Browser)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please describe:

* **Use case / Goal**: Why is this feature needed?
* **Proposed Solution**: How should it work?
* **Alternatives Considered**: Any other approaches you explored?

### Pull Requests

1. **Fork the repository** to your own GitHub account.
2. **Clone the fork** locally:
   ```bash
   git clone https://github.com/<your-username>/threat-incident-management.git
   cd threat-incident-management
   ```
3. **Create a new branch** off `main` (see [Branch Naming](#branch-naming)).
4. **Make your changes** following the code standards.
5. **Run tests & linter** to ensure nothing is broken.
6. **Commit & push** your branch to your fork.
7. **Open a Pull Request** against the `main` branch of `Pranav-0440/threat-incident-management`.

---

## 🛠️ Development Setup

### Prerequisites

* **Java 21 JDK** (Eclipse Temurin recommended)
* **Maven 3.9+**
* **Node.js 20+** or **Node.js 22+**
* **npm 10+**
* **Docker** *(Optional - for local database/redis containers)*

---

### Backend Setup (Spring Boot)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Copy the `.env` template or configure environment variables:
   ```properties
   SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/postgres
   SPRING_DATASOURCE_USERNAME=postgres
   SPRING_DATASOURCE_PASSWORD=your_password
   JWT_SECRET=your_base64_encoded_256bit_jwt_secret
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   REDIS_SSL=false
   ```

3. Build and run the backend:
   ```bash
   mvn clean spring-boot:run
   ```
   > The server will start at `http://localhost:8080`.
   > Interactive OpenAPI / Swagger UI is available at `http://localhost:8080/swagger-ui.html`.

---

### Frontend Setup (React + Vite)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   > The app will be available at `http://localhost:5173`.

---

## 🌿 Branching Strategy & Commit Guidelines

### Branch Naming

Use descriptive branch names with a relevant prefix:

| Prefix | Description | Example |
| :--- | :--- | :--- |
| `feat/` | New features or capabilities | `feat/incident-filter-presets` |
| `fix/` | Bug fixes | `fix/auth-token-expiry` |
| `docs/` | Documentation improvements | `docs/update-api-reference` |
| `refactor/` | Code refactoring without behavioral changes | `refactor/user-service-cache` |
| `test/` | Adding or updating tests | `test/incident-service-tests` |
| `chore/` | Maintenance tasks, dependencies | `chore/update-dependencies` |

### Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <short summary>

[optional body explaining details]

[optional footer(s), e.g. Closes #123]
```

**Examples:**
* `feat(backend): add Redis caching for user authentication lookups`
* `fix(frontend): resolve 403 error on user registration`
* `docs: add contributing guide and code of conduct`
* `test(backend): add unit tests for RedisConfig cache manager`

---

## 🧪 Testing & Quality Assurance

Before submitting your PR, verify that all checks pass:

### Backend Tests
```bash
cd backend
mvn test --batch-mode
```

### Frontend Linting & Build
```bash
cd frontend
npm run lint
npm run build
```

---

## ✅ Pull Request Checklist

Before submitting your Pull Request, please ensure:

- [ ] My code follows the code style and formatting of this project.
- [ ] I have performed a self-review of my own code.
- [ ] I have added appropriate tests (if applicable) and all existing tests pass.
- [ ] I have updated the documentation where necessary.
- [ ] My branch is up to date with the latest `main` branch.
- [ ] My commit messages follow the Conventional Commits format.

---

Thank you for helping improve ThreatGuard! 🛡️
