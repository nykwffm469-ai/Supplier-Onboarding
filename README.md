# Supplier Hub

Supplier Hub is a role-aware supplier onboarding portal built with Next.js App Router, TypeScript, Tailwind CSS, and lightweight reusable UI primitives.

It supports two operating modes:

- Demo mode (no Azure or Dataverse credentials required)
- Dataverse mode (live CRUD against Dataverse tables)

The project is designed for fast demos, quick proof-of-concept iterations, and an easy path to production hardening.

## Table of Contents

1. What This App Does
2. Core User Journeys
3. Tech Stack
4. Project Structure
5. Local Setup
6. Configuration
7. Running and Verifying
8. Route Map
9. API Surface
10. Demo Data and Reset Workflow
11. UI and Theme Behavior
12. Dataverse Integration Notes
13. Troubleshooting
14. Deployment Notes
15. Demo Script (Suggested)

## What This App Does

Supplier Hub models a full onboarding flow where suppliers can:

- Maintain company profile and identifiers
- Manage capabilities and certifications
- Track credit ratings
- Complete onboarding questionnaires
- Monitor onboarding progress from a dashboard

Reviewers can:

- See onboarding and request activity
- Review pending access requests
- Assign and review questionnaires

## Core User Journeys

### Supplier Journey

1. Sign in via demo login
2. Complete profile and identifiers
3. Add capabilities and certifications
4. Review credit ratings
5. Complete questionnaires
6. Reach full onboarding completion on dashboard

### Reviewer Journey

1. Sign in as reviewer
2. View high-level pending metrics on dashboard
3. Process access requests in admin area
4. Inspect questionnaire pipeline and statuses

## Tech Stack

- Framework: Next.js 16 App Router
- Language: TypeScript
- UI: Tailwind CSS v4 + composable UI components
- Auth model: demo cookie session (with optional NextAuth scaffolding)
- Data model:
	- In-memory global stores for demo mode
	- Dataverse API for connected mode
- Icons: Lucide

## Project Structure

Top-level highlights:

- app
	- auth and portal route groups
	- API route handlers
	- global styles and root layout
- components
	- admin views
	- auth forms
	- portal feature components
	- shared UI primitives
- lib
	- session/auth helpers
	- feature service modules
	- Dataverse abstraction
- types
	- ambient typings

Feature services in lib/server are the primary business logic boundary used by API routes.

## Local Setup

### Prerequisites

- Node.js 20+
- npm 10+

### Quick Start (Demo Mode)

1. Install dependencies.

```bash
npm install
```

2. Start development server.

```bash
npm run dev
```

3. Open:

- http://localhost:3000/login

4. Choose one of the demo profiles:

- Continue as Supplier (Demo)
- Continue as Reviewer (Demo)

No environment variables are required for demo mode.

## Configuration

### Environment Variables for Dataverse Mode

Create a .env.local file in supplier-hub root and set:

- NEXTAUTH_URL
- NEXTAUTH_SECRET
- TENANT_ID
- CLIENT_ID
- CLIENT_SECRET
- DATAVERSE_URL

Optional Dataverse choice-mapping variables:

- DATAVERSE_REQUESTTYPE_VALUES
- DATAVERSE_ROLE_VALUES
- DATAVERSE_DECISION_VALUES

Optional lookup override variables:

- DATAVERSE_ACCESSREQUEST_CONTACT_LOOKUP
- DATAVERSE_ACCESSREQUEST_ACCOUNT_LOOKUP

If Dataverse credentials are not present, the app automatically runs in demo mode.

## Running and Verifying

### Development

```bash
npm run dev
```

### Lint

```bash
npm run lint
```

### Production Build

```bash
npm run build
```

### Combined Verify

```bash
npm run verify
```

## Route Map

### Auth and Entry

- /login
- /register

### Supplier and Shared Portal

- /dashboard
- /profile
- /questionnaires
- /capabilities
- /certifications
- /credit
- /test-center

### Reviewer

- /admin
- /admin/requests

### Diagnostics

- /api/health

## API Surface

### Access Request

- POST /api/access-request
- GET /api/access-request/[id]
- POST /api/access-request/[id]/demo-decision

### Admin Requests

- GET /api/admin/requests
- POST /api/admin/requests/[id]/decide

### Dashboard and Profile

- GET /api/dashboard
- GET/PATCH/POST/DELETE /api/profile

### Feature Domains

- GET/POST/DELETE /api/capabilities
- GET/POST/DELETE /api/certifications
- GET/POST /api/credit
- GET /api/questionnaires
- POST /api/questionnaires/create
- POST /api/questionnaires/assign
- GET/PATCH /api/questionnaires/[id]

### Demo Utilities

- POST /api/demo/reset

### Dataverse Proxy

- /api/dataverse/[table]
- /api/dataverse/[table]/[id]

## Demo Data and Reset Workflow

The app seeds story-driven demo data for:

- Access requests
- Supplier profile and identifiers
- Capabilities and certifications
- Credit ratings
- Questionnaire templates and questionnaire instances

Reset behavior:

- Test Center includes a Reset Demo Story Data button.
- This calls POST /api/demo/reset.
- Reset repopulates all in-memory stores to baseline values.

Important note:

- Visiting /api/demo/reset directly in a browser sends GET and returns 405.
- Use the Test Center button or send POST.

## UI and Theme Behavior

- Theme options are available in the app shell: System, Light, Dark.
- Theme preference persists in local storage under supplierhub-theme.
- Root layout applies theme class early to reduce flash during hydration.
- Global CSS includes dark-mode compatibility fallbacks for legacy utility classes.

## Dataverse Integration Notes

- All feature services first check whether Dataverse is configured.
- In demo mode, services read/write in-memory global stores.
- In Dataverse mode, services call table endpoints through a shared server abstraction.
- This makes feature components API-stable regardless of backing mode.

## Troubleshooting

### Health badge shows System Check Failed

This usually indicates /api/health is returning 503 because Dataverse credentials are missing or invalid.

Expected behavior:

- App should still load and operate in demo mode.
- Badge reflects degraded health but does not block usage.

### Blank page after theme changes

If needed, clear stored theme:

1. Open browser DevTools console.
2. Run localStorage.removeItem("supplierhub-theme").
3. Reload the page.

### Reviewer dashboard pending counts look wrong

Use Reset Demo Story Data in Test Center to restore baseline seed state.

### Lint/build issues after local edits

Run:

```bash
npm run verify
```

## Deployment Notes

- For production, ensure all secrets are injected through secure environment configuration.
- Replace demo cookie auth with real identity flow as needed.
- Add persistent storage for non-demo operation if Dataverse is not the long-term backend.

## Demo Script (Suggested)

### 8-minute flow

1. Open /test-center and click Reset Demo Story Data.
2. Sign in as Supplier and walk through:
	 - Dashboard completion
	 - Profile details and identifiers
	 - Capabilities, certifications, credit, questionnaires
3. Sign out and sign in as Reviewer.
4. Show reviewer dashboard counts.
5. Open Admin > Access Requests and process a request.
6. Return to dashboard to show metrics shift.

This sequence consistently tells a complete onboarding story with minimal setup friction.
