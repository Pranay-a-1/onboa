# PranayBank Merchant Onboarding

PranayBank is a microfrontend-based B2B merchant onboarding platform with role-based access:
- `USER` (merchant): self-registers, submits onboarding application, tracks status
- `ADMIN` (bank employee): reviews and approves/rejects applications

## Local Development

### Prerequisites
- Java 17
- Node.js 18+
- Auth0 tenant
- PostgreSQL-compatible database (Neon recommended)

### Run Backend
```bash
cd backend
./mvnw spring-boot:run
```

### Run Shell App
```bash
cd frontend/shell-app
npm install
npm run dev
```

### Run Remotes
```bash
cd frontend/onboarding-mfe && npm install && npm run dev
cd frontend/dashboard-mfe && npm install && npm run dev
```

## Auth0 Setup (Critical)

Use PRD Section 11 as source of truth.

### Required Roles
- `ADMIN`
- `USER`

### Required JWT Custom Claim
Configure an Auth0 Action/Rule to add roles into:
- `https://pranaybank.com/roles`

### Admin Provisioning Model
- Admin accounts are **pre-seeded** in Auth0.
- Admin self-registration is **not supported**.
- Initial admin creation/assignment is an **operational super-admin responsibility** in the Auth0 dashboard.
- Merchant users can self-register through the normal signup flow.

## Role Routing Behavior
- `ADMIN` users are routed to `/dashboard`
- `USER` users are routed to `/onboarding`

## Notes
If a user appears in the wrong route, verify the Auth0 role claim payload first (`https://pranaybank.com/roles`).
