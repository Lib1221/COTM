# ---- builder ----
FROM node:25-bookworm-slim AS builder
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
FROM node:25-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma
COPY package.json ./
EXPOSE 4000
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy --schema=packages/db/prisma/schema.prisma && node apps/api/dist/main.js"]
