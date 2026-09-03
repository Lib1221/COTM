# Liben CMS

A production-ready construction management system for creating projects, defining BOQs, managing materials/inventory, and recording site progress.

The web app includes a site-specific appearance system (Hi-Vis, Blueprint, Steel, Timber palettes with light/dark), a command palette, CSV export, and keyboard shortcuts.

## Tech Stack

| Layer    | Technology                                                                                                          |
| -------- | ------------------------------------------------------------------------------------------------------------------- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, next-themes, TanStack Query, TanStack Table, React Hook Form, Zod |
| Backend  | NestJS 11, REST API, Swagger/OpenAPI, Helmet, rate limiting, JWT auth, class-validator                              |
| Database | PostgreSQL 16, Prisma ORM 6                                                                                         |
| DevOps   | Docker Compose (non-root images), pnpm workspaces, GitHub Actions, Dependabot, ESLint, Prettier                     |

## Project Structure

```
COTM/
├── apps/
│   ├── web/          # Next.js frontend (port 3000)
│   └── api/          # NestJS backend (port 4000)
├── packages/
│   └── db/           # Shared Prisma schema, client, and seed
├── docker/
│   ├── docker-compose.yml
│   ├── api.Dockerfile
│   └── web.Dockerfile
├── pnpm-workspace.yaml
└── package.json
```

## Prerequisites

- Node.js >= 20 (22 LTS recommended)
- pnpm >= 10 (`npm install -g pnpm`)
- Docker & Docker Compose

## Getting Started (local development)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start PostgreSQL

```bash
docker compose -p cms -f docker/docker-compose.yml up -d postgres
```

### 3. Configure environment

```bash
cp .env.example .env
# DATABASE_URL already points at postgres on localhost:5434
```

### 4. Run database migrations and generate the Prisma client

```bash
pnpm db:generate
pnpm db:migrate
```

### 5. Seed sample data

```bash
pnpm db:seed
```

Creates two sample projects, five materials (cement, steel, sand, gravel, brick), BOQ items, stock in/out, and progress records. Safe to re-run.

### 6. Start development servers

```bash
pnpm dev              # starts both web and api in parallel
```

- Frontend: http://localhost:3000
- API: http://localhost:4000/api
- Swagger docs: http://localhost:4000/api/docs

## Docker (full stack)

The API image runs Prisma migrations on boot. After the stack is healthy, seed once:

```bash
# Start postgres + api + web
pnpm docker:up

# Seed sample data (optional, idempotent)
pnpm docker:seed

# Stop
pnpm docker:down

# View logs
pnpm docker:logs
```

- Frontend: http://localhost:3000
- API / health: http://localhost:4000/api/health
- Swagger: http://localhost:4000/api/docs (on in local Docker; set `ENABLE_SWAGGER=false` to hide it)

`pnpm docker:migrate` is available if you need to apply migrations without rebuilding. Fresh `docker:up` already migrates automatically.

For a real deployment, set a strong `JWT_SECRET` (32+ characters) in the environment. The compose default is only for local Docker.

## Appearance and shortcuts

- **Palettes:** Hi-Vis (default), Blueprint, Steel, Timber — plus system/light/dark color mode
- **Settings:** `/settings` for density and reduced motion
- **Command palette:** `⌘K` / `Ctrl+K`
- **Jump keys:** `G` then `D` dashboard, `P` projects, `M` materials, `I` inventory, `S` settings
- **CSV export** on projects, materials, and inventory tables

## Production notes

- API refuses to boot in `NODE_ENV=production` unless `JWT_SECRET` is a strong 32+ character value
- `/api/health/live` is a liveness probe; `/api/health` and `/api/health/ready` ping the database
- Request IDs are returned as `X-Request-Id` and included in error payloads
- Swagger is off in production unless `ENABLE_SWAGGER=true`
- Containers run as non-root users
- Login is rate-limited (5 attempts / minute)

## API Endpoints

### Projects

| Method | Path                | Description                                      |
| ------ | ------------------- | ------------------------------------------------ |
| GET    | `/api/projects`     | List projects (search, filter, sort, pagination) |
| GET    | `/api/projects/:id` | Get project details (BOQ, progress, inventory)   |
| POST   | `/api/projects`     | Create a project                                 |
| PATCH  | `/api/projects/:id` | Update a project                                 |
| DELETE | `/api/projects/:id` | Delete a project                                 |

### BOQ

| Method | Path                               | Description                            |
| ------ | ---------------------------------- | -------------------------------------- |
| GET    | `/api/projects/:projectId/boq`     | List BOQ items + total value           |
| POST   | `/api/projects/:projectId/boq`     | Add a BOQ item (total auto-calculated) |
| PATCH  | `/api/projects/:projectId/boq/:id` | Update a BOQ item                      |
| DELETE | `/api/projects/:projectId/boq/:id` | Delete a BOQ item                      |

### Materials

| Method | Path                       | Description                                           |
| ------ | -------------------------- | ----------------------------------------------------- |
| GET    | `/api/materials`           | List materials (search, low-stock filter, pagination) |
| GET    | `/api/materials/low-stock` | List low-stock materials                              |
| GET    | `/api/materials/:id`       | Get a material                                        |
| POST   | `/api/materials`           | Create a material                                     |
| PATCH  | `/api/materials/:id`       | Update a material (not stock — use inventory)         |
| DELETE | `/api/materials/:id`       | Delete a material                                     |

### Inventory

| Method | Path                          | Description                                  |
| ------ | ----------------------------- | -------------------------------------------- |
| GET    | `/api/inventory/transactions` | List transactions (filter, sort, pagination) |
| POST   | `/api/inventory/stock-in`     | Record stock-in (increases currentStock)     |
| POST   | `/api/inventory/stock-out`    | Record stock-out (validates available stock) |

### Progress

| Method | Path                                    | Description              |
| ------ | --------------------------------------- | ------------------------ |
| GET    | `/api/projects/:projectId/progress`     | List progress records    |
| POST   | `/api/projects/:projectId/progress`     | Add a progress record    |
| PATCH  | `/api/projects/:projectId/progress/:id` | Update a progress record |
| DELETE | `/api/projects/:projectId/progress/:id` | Delete a progress record |

### Health

| Method | Path                | Description               |
| ------ | ------------------- | ------------------------- |
| GET    | `/api/health`       | Readiness (database ping) |
| GET    | `/api/health/ready` | Same as `/api/health`     |
| GET    | `/api/health/live`  | Liveness (no database)    |

### Dashboard

| Method | Path             | Description                                              |
| ------ | ---------------- | -------------------------------------------------------- |
| GET    | `/api/dashboard` | Overview: project totals, inventory, project performance |

## Business Rules

1. **BOQ Total**: `total = quantity × unit_price` (auto-calculated on create and update)
2. **Stock-Out Validation**: stock-out quantity must not exceed available stock (returns 400)
3. **Low-Stock Warning**: material is low-stock when `currentStock <= minimumStock`
4. **Latest Progress**: project details return the most recent progress percentage
5. **Stock changes**: only through inventory stock-in / stock-out (not material PATCH)

## Database Schema

Five entities with relationships:

- `projects` 1--* `boq_items`
- `projects` 1--* `progress_records`
- `projects` 1--* `inventory_transactions`
- `materials` 1--* `inventory_transactions`

## Testing

```bash
pnpm test                                 # unit tests
pnpm --filter @cms/api run test:e2e       # e2e tests (needs DATABASE_URL)
```

E2E coverage includes: create project, BOQ total calculation, stock in, stock out, prevent over-issue, and record progress.

## Scripts

| Command            | Description                    |
| ------------------ | ------------------------------ |
| `pnpm dev`         | Start web + api in dev mode    |
| `pnpm build`       | Build all packages             |
| `pnpm lint`        | Lint all packages              |
| `pnpm test`        | Run unit tests                 |
| `pnpm db:migrate`  | Run Prisma migrations          |
| `pnpm db:seed`     | Seed sample data               |
| `pnpm db:studio`   | Open Prisma Studio             |
| `pnpm docker:up`   | Start full stack via Docker    |
| `pnpm docker:down` | Stop Docker stack              |
| `pnpm docker:seed` | Seed data in the API container |
