# Supplier Hub

Supplier onboarding portal built with Next.js App Router, TypeScript, Tailwind, shadcn/ui, Microsoft Entra ID auth, and Dataverse API integration.

## Quick Local Test (5 minutes)

1. Create .env.local from .env.example.
2. Fill in NEXTAUTH_URL, NEXTAUTH_SECRET, TENANT_ID, CLIENT_ID, CLIENT_SECRET, DATAVERSE_URL.
3. Run npm install.
4. Run npm run dev.
5. Open http://localhost:3000 and choose a demo login profile.
6. Open /register to submit a self-registration request.
7. Open /test-center and click Run Health Check.

If everything is configured, you should see:
- HTTP status 200
- status: "ok"
- your session role/contactId/accountId
- Dataverse check ok: true

## Useful Commands

- npm run dev: start local dev server
- npm run lint: lint the project
- npm run build: production build
- npm run verify: lint + build in one command

## Required Environment Variables

- NEXTAUTH_URL
- NEXTAUTH_SECRET
- TENANT_ID
- CLIENT_ID
- CLIENT_SECRET
- DATAVERSE_URL

## Test Endpoints

- /login: demo sign-in page
- /register: supplier self-registration + status tracker
- /dashboard: protected page
- /admin: reviewer-only page
- /test-center: one-click validation page
- /api/health: protected health endpoint (auth + Dataverse check)
- /api/access-request: create access request
- /api/access-request/{id}: get request decision
