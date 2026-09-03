# ---- builder ----
FROM node:26-bookworm-slim AS builder
WORKDIR /app
RUN npm install -g pnpm@11.22.0
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @cms/db exec prisma generate
RUN pnpm --filter @cms/api run build

# ---- runner ----
FROM node:26-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system cms \
  && useradd --system --gid cms --create-home cms
COPY --from=builder --chown=cms:cms /app/node_modules ./node_modules
COPY --from=builder --chown=cms:cms /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=cms:cms /app/packages/db/prisma ./packages/db/prisma
COPY --from=builder --chown=cms:cms /app/packages/db/package.json ./packages/db/package.json
COPY --from=builder --chown=cms:cms /app/packages/db/tsconfig.json ./packages/db/tsconfig.json
COPY --from=builder --chown=cms:cms /app/package.json ./
USER cms
EXPOSE 4000
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy --schema=packages/db/prisma/schema.prisma && node apps/api/dist/main.js"]
