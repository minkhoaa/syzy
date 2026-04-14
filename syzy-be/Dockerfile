FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy prisma schema and generate client before copying source
# This ensures Prisma client is generated with matching dependencies
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile && pnpm exec prisma generate

# Copy source and build
COPY . .
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy built application, dependencies, and prisma for migrations
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

# Environment variables
ENV NODE_ENV=production
ENV PORT=7788

# Expose port
EXPOSE 7788

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:7788/health || exit 1

# Start command
CMD ["node", "dist/main.js"]