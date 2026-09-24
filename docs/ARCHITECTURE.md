# Architecture

Liben CMS is a pnpm monorepo with a Next.js frontend, a NestJS REST API, and a shared Prisma package on top of PostgreSQL.

## Components

| Component | Location | Responsibility |
| --------- | -------- | -------------- |
| Web app | `apps/web` | Next.js 16 / React 19 UI: dashboard, projects, BOQs, materials, inventory, settings. Uses TanStack Query for server state, TanStack Table for grids, React Hook Form + Zod for forms, next-themes for palettes and light/dark. |
| API | `apps/api` | NestJS 11 REST API on port 4000 under `/api`. JWT auth, Helmet, rate limiting, class-validator DTOs, Swagger at `/api/docs`. Health probes at `/api/health`, `/api/health/live`, `/api/health/ready`. |
| Database package | `packages/db` | Prisma schema, generated client, migrations, and the idempotent seed script shared by both apps. |
| Docker | `docker/` | `docker-compose.yml` (postgres, api, web), `api.Dockerfile`, `web.Dockerfile`. Images run as non-root; the API image applies migrations on boot. |
| CI | `.github/workflows/ci.yml`, `pages.yml` | Lint, typecheck, build on pull requests; static export to GitHub Pages. |

## Request flow

```
Browser -> Next.js (apps/web) -> fetch /api/* -> NestJS controllers -> services -> Prisma -> PostgreSQL
```

- The web app talks to the API only through HTTP; there is no direct database access from the frontend.
- Each request gets an `X-Request-Id` that is echoed in error payloads for tracing.
- Login is rate-limited (5 attempts per minute). Protected routes require a Bearer JWT.

## Domain model

- **Project**: a construction project with status and dates.
- **BOQ item**: bill-of-quantities line attached to a project (material, quantity, unit rate).
- **Material**: catalog entry (cement, steel, sand, gravel, brick in the seed).
- **Stock movement**: stock in / stock out records that drive inventory levels.
- **Progress record**: dated site progress entries per project.

The seed (`pnpm db:seed`) creates two projects, five materials, BOQ items, stock movements, and progress records; it is safe to re-run.

## Frontend structure

- App Router pages per domain (dashboard, projects, materials, inventory, settings).
- Appearance system: Hi-Vis (default), Blueprint, Steel, Timber palettes, plus system/light/dark.
- Command palette (`Cmd/Ctrl+K`) and jump keys (`G` then `D/P/M/I/S`).
- CSV export on the projects, materials, and inventory tables.

## Configuration

- `.env` at the repo root (`DATABASE_URL`, `JWT_SECRET`, `ENABLE_SWAGGER`, ports). See `.env.example`.
- In `NODE_ENV=production` the API refuses to start unless `JWT_SECRET` is at least 32 characters.
- Swagger is off in production unless `ENABLE_SWAGGER=true`.
