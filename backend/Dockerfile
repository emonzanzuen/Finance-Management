# Build stage
FROM node:22-slim AS builder

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./
RUN DATABASE_URL="postgresql://build:build@127.0.0.1:5432/finmanage_build" DIRECT_URL="postgresql://build:build@127.0.0.1:5432/finmanage_build" npx prisma generate

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

# Production stage
FROM node:22-slim

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma
COPY prisma.config.ts ./
RUN DATABASE_URL="postgresql://build:build@127.0.0.1:5432/finmanage_build" DIRECT_URL="postgresql://build:build@127.0.0.1:5432/finmanage_build" npx prisma generate

COPY --from=builder /app/dist ./dist

RUN chown -R node:node /app
USER node

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && exec node dist/server.js"]
