# PranayBank Merchant Onboarding — Implementation Plan

## Goal
Build an E2E B2B merchant onboarding platform: 3 React 18 microfrontends (Vite + Module Federation), Spring Boot 3.x backend, Auth0 OAuth2, Neon PostgreSQL, deployed via Vercel/Render with GitHub Actions CI/CD.

---

## Proposed Changes

### 1. Backend — Spring Boot Application

#### [NEW] [backend/](file:///home/pran/anotherDrive/synecodes/onboa/backend)
Initialize Spring Boot 3.x project (Java 17) with dependencies: Spring Web, Spring Data JPA, Spring Security OAuth2 Resource Server, PostgreSQL driver, Lombok, Spring Boot DevTools.

Key files:

- **`pom.xml`** — Maven project with all dependencies
- **`application.yml`** — Auth0 issuer-uri, Neon DB connection, CORS config
- **Entities** (6 JPA entities with UUIDs):
  - `MerchantUser` — auth0Id, email, role, createdAt
  - `OnboardingApplication` — status, currentStep, merchantId, adminNotes, timestamps
  - `BusinessInfo`, `BusinessAddress`, `AuthorizedRep`, `ProcessingInfo`, `BankAccount` — one-to-one with application
- **Repositories** — JpaRepository for each entity
- **Services** — `ApplicationService` (CRUD + status workflow + merchant ID generation), `UserService` (Auth0 sync)
- **Controllers**:
  - `ApplicationController` — `/api/v1/applications/**` (USER endpoints)
  - `AdminController` — `/api/v1/admin/**` (ADMIN endpoints)
  - `UserController` — `/api/v1/users/**` (sync + profile)
- **Security** — `SecurityConfig` with OAuth2 resource server, role-based method security, CORS

---

### 2. Shell App (Host MFE)

#### [NEW] [frontend/shell-app/](file:///home/pran/anotherDrive/synecodes/onboa/frontend/shell-app)
Vite + React 18 host application. Module Federation host consuming two remotes.

- **`vite.config.js`** — Module Federation host config with shared deps
- **`src/main.jsx`** — Auth0Provider wrapper, router setup
- **`src/App.jsx`** — Layout: Navbar + Sidebar + Content area
- **`src/components/Navbar.jsx`** — Logo, nav links, user avatar, logout
- **`src/components/Sidebar.jsx`** — Admin-only sidebar navigation
- **`src/components/ProtectedRoute.jsx`** — Role-based route guard
- **`src/pages/`** — Landing, Login callback, lazy-loaded MFE containers
- **`src/auth/`** — Auth0 config, role extraction from JWT, auth context

---

### 3. Onboarding MFE (Remote)

#### [NEW] [frontend/onboarding-mfe/](file:///home/pran/anotherDrive/synecodes/onboa/frontend/onboarding-mfe)
Vite + React 18 remote. Exposes `./OnboardingApp` component.

- **`vite.config.js`** — Module Federation remote config, exposes root component
- **`src/OnboardingApp.jsx`** — Root component (Router for stepper + client portal)
- **`src/components/OnboardingStepper.jsx`** — MUI Stepper with 6 steps
- **`src/components/steps/`** — 6 step form components (BusinessInfoStep, BusinessAddressStep, AuthRepStep, ProcessingInfoStep, BankAccountStep, ReviewStep)
- **`src/components/ClientPortal.jsx`** — Status tracker, application summary, merchant info
- **`src/services/api.js`** — Axios calls for application CRUD
- **`src/hooks/useApplication.js`** — Custom hook for application state management

---

### 4. Dashboard MFE (Remote)

#### [NEW] [frontend/dashboard-mfe/](file:///home/pran/anotherDrive/synecodes/onboa/frontend/dashboard-mfe)
Vite + React 18 remote. Exposes `./DashboardApp` component.

- **`vite.config.js`** — Module Federation remote config
- **`src/DashboardApp.jsx`** — Root component (Router for dashboard views)
- **`src/components/StatsCards.jsx`** — Quick stat cards (total, pending, approved, rejected)
- **`src/components/ApplicationList.jsx`** — Filterable table of applications
- **`src/components/ApplicationDetail.jsx`** — Full application detail view
- **`src/components/ApproveRejectDialog.jsx`** — Modal for admin action with notes
- **`src/services/api.js`** — Axios calls for admin endpoints

---

### 5. CI/CD

#### [NEW] [.github/workflows/](file:///home/pran/anotherDrive/synecodes/onboa/.github/workflows)
- **`backend.yml`** — Build JAR with Maven, deploy to Render via webhook/API
- **`shell-app.yml`** — Build + deploy shell-app to Vercel
- **`onboarding-mfe.yml`** — Build + deploy onboarding-mfe to Vercel
- **`dashboard-mfe.yml`** — Build + deploy dashboard-mfe to Vercel

Each workflow triggers on push to `main` with path filters for its directory.

---

### 6. Project Root

#### [MODIFY] [README.md](file:///home/pran/anotherDrive/synecodes/onboa/README.md)
Full project documentation: setup, architecture, local dev, deployment.

---

## Implementation Order

1. **Backend** — Entities, repos, services, controllers, security (this is foundational)
2. **Shell App** — Auth0 integration, layout, module federation host
3. **Onboarding MFE** — Stepper form, draft save, client portal
4. **Dashboard MFE** — Stats, list, detail, approve/reject
5. **CI/CD** — GitHub Actions workflows
6. **README** — Documentation

---

## Verification Plan

### Automated Tests
Tests are skipped per user requirement.

### Manual Verification
Since Auth0 requires account setup by the user, full E2E verification requires the user's Auth0 tenant. I will verify:

1. **Backend compiles & starts**: `cd backend && ./mvnw spring-boot:run` — verify no errors, endpoints respond on `localhost:8080`
2. **Frontend MFEs build**: `cd frontend/shell-app && npm run build`, same for each MFE — verify clean builds
3. **Module federation loads**: Start all 3 MFEs locally (`npm run dev` on ports 3000, 3001, 3002) — verify shell app loads remote components
4. **Browser verification**: Open `http://localhost:3000` in browser, verify layout renders, navigation works, MFEs load

> [!IMPORTANT]
> Full Auth0 flow and database operations require the user to:
> 1. Create an Auth0 tenant and configure it per the PRD (Section 11)
> 2. Set up a Neon PostgreSQL database and add connection string to `application.yml`
> 3. I will provide placeholder env vars and instructions for setup
