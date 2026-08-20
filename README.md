# Mini Construction Management System

A full-stack construction management system for creating projects, defining BOQs, managing materials/inventory, and recording project progress.

## Tech Stack

| Layer    | Technology                                                                                                                 |
| -------- | -------------------------------------------------------------------------------------------------------------------------- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui (manual), TanStack Query, TanStack Table, React Hook Form, Zod |
| Backend  | NestJS 11, REST API, Swagger/OpenAPI, class-validator                                                                      |
| Database | PostgreSQL 16, Prisma ORM 6                                                                                                |
| DevOps   | Docker Compose, pnpm workspaces, ESLint, Prettier                                                                          |

## Project Structure

```
liben/
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

- Node.js >= 20
- pnpm >= 10 (`npm install -g pnpm`)
- Docker & Docker Compose

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start the database

```bash
pnpm docker:up        # starts postgres, api, web
# or just the database:
docker compose -f docker/docker-compose.yml up -d postgres
```

### 3. Run database migrations

```bash
# Create a .env file or set DATABASE_URL in your shell:
export DATABASE_URL="postgresql://cms:cms@localhost:5433/cms?schema=public"

pnpm db:migrate       # runs prisma migrate dev
pnpm db:generate      # generates Prisma client
```

### 4. Seed sample data

```bash
pnpm db:seed
```

### 5. Start development servers

```bash
pnpm dev              # starts both web and api in parallel
```

- Frontend: http://localhost:3000
- API: http://localhost:4000/api
- Swagger docs: http://localhost:4000/api/docs

## Docker (Full Stack)

```bash
# Start everything (postgres + api + web)
pnpm docker:up

# Run migrations inside the container
pnpm docker:migrate

# Seed data
pnpm docker:seed

# Stop
pnpm docker:down

# View logs
pnpm docker:logs
```

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
| PATCH  | `/api/materials/:id`       | Update a material                                     |
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

### Dashboard

| Method | Path             | Description                                              |
| ------ | ---------------- | -------------------------------------------------------- |
| GET    | `/api/dashboard` | Overview: project totals, inventory, project performance |

## Business Rules

1. **BOQ Total**: `total = quantity x unit_price` (auto-calculated on create and update)
2. **Stock-Out Validation**: stock-out quantity must not exceed available stock (returns 400)
3. **Low-Stock Warning**: material is low-stock when `currentStock <= minimumStock`
4. **Latest Progress**: project details return the most recent progress percentage

## Database Schema

Five entities with relationships:

- `projects` 1--* `boq_items`
- `projects` 1--* `progress_records`
- `projects` 1--* `inventory_transactions`
- `materials` 1--* `inventory_transactions`

## Testing

```bash
pnpm test              # run all tests
pnpm --filter @cms/api run test:e2e   # e2e tests (Jest + Supertest)
```

## Scripts

| Command            | Description                 |
| ------------------ | --------------------------- |
| `pnpm dev`         | Start web + api in dev mode |
| `pnpm build`       | Build all packages          |
| `pnpm lint`        | Lint all packages           |
| `pnpm test`        | Run all tests               |
| `pnpm db:migrate`  | Run Prisma migrations       |
| `pnpm db:seed`     | Seed sample data            |
| `pnpm db:studio`   | Open Prisma Studio          |
| `pnpm docker:up`   | Start full stack via Docker |
| `pnpm docker:down` | Stop Docker stack           |
