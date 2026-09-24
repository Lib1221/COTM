# Setup

## Prerequisites

- Node.js 20+ (22 LTS recommended)
- pnpm 10+ (`npm install -g pnpm`)
- Docker and Docker Compose

## Local development

```bash
pnpm install
docker compose -p cms -f docker/docker-compose.yml up -d postgres
cp .env.example .env            # DATABASE_URL points at localhost:5434
pnpm db:generate
pnpm db:migrate
pnpm db:seed                    # optional sample data, idempotent
pnpm dev                        # web on :3000, api on :4000
```

- Frontend: http://localhost:3000
- API: http://localhost:4000/api
- Swagger: http://localhost:4000/api/docs

## Full stack in Docker

```bash
pnpm docker:up        # postgres + api + web, migrations run on boot
pnpm docker:seed      # optional
pnpm docker:logs
pnpm docker:down
```

`pnpm docker:migrate` applies migrations without rebuilding.

## Environment variables

| Variable | Purpose |
| -------- | ------- |
| `DATABASE_URL` | Prisma connection string |
| `JWT_SECRET` | Signing secret; 32+ characters required in production |
| `ENABLE_SWAGGER` | `true` to expose `/api/docs` outside local Docker |
| `NODE_ENV` | `development` or `production` |

## Quality checks

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Deployment notes

- Set a strong `JWT_SECRET` and a managed PostgreSQL `DATABASE_URL`.
- Use `/api/health/live` for liveness and `/api/health/ready` for readiness probes.
- Containers run as non-root; keep it that way when extending the Dockerfiles.
