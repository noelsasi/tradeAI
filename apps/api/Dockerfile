FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Install all dependencies
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
RUN pnpm install --frozen-lockfile

# Build
FROM deps AS build
COPY packages/types ./packages/types
COPY apps/api ./apps/api
RUN pnpm --filter api build

# Production image — only runtime deps
FROM node:22-alpine AS runner
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
RUN pnpm install --frozen-lockfile --prod

COPY --from=build /app/packages/types ./packages/types
COPY --from=build /app/apps/api/dist ./apps/api/dist

ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "apps/api/dist/index.js"]
