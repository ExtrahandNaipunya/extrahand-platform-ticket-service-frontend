# ExtraHand Ticket Service Frontend (Next.js) - CapRover-ready
FROM node:18-alpine AS base

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
# Cache bust: CapRover sets CAPROVER_GIT_COMMIT_SHA on deploy; or set CACHEBUST env in app config to force fresh build
ARG CACHEBUST=
ARG CAPROVER_GIT_COMMIT_SHA=
RUN echo "Build cache bust: CACHEBUST=${CACHEBUST} GIT_SHA=${CAPROVER_GIT_COMMIT_SHA}"
COPY . .
# Build-time env for NEXT_PUBLIC_* (optional; runtime uses API_URL / NEXT_PUBLIC_API_URL from server)
ARG NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_BACKEND_URL=${NEXT_PUBLIC_BACKEND_URL}
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
# CapRover sets PORT at runtime
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
