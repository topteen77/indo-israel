# Frontend - Next.js (multi-stage)
# Use /opt/apravas to avoid conflict with existing /app on production host
# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /opt/apravas

COPY package*.json ./
RUN npm ci

COPY . .

# NEXT_PUBLIC_API_URL: '' = same-origin /api (nginx), or full URL. Omit = http://localhost:5000
ARG NEXT_PUBLIC_API_URL=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# Stage 2: Production
FROM node:18-alpine AS runner

WORKDIR /opt/apravas

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output (builder uses WORKDIR /opt/apravas)
COPY --from=builder /opt/apravas/public ./public
COPY --from=builder --chown=nextjs:nodejs /opt/apravas/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /opt/apravas/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
