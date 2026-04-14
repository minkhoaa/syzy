FROM node:20-alpine AS builder

WORKDIR /app

# Build arguments for Next.js public env vars (baked at build time)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_RPC_URL
ARG NEXT_PUBLIC_REOWN_PROJECT_ID
ARG NEXT_PUBLIC_PROGRAM_ID
ARG NEXT_PUBLIC_WAITLIST_API_URL

# Set env vars from build args
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_RPC_URL=$NEXT_PUBLIC_RPC_URL
ENV NEXT_PUBLIC_REOWN_PROJECT_ID=$NEXT_PUBLIC_REOWN_PROJECT_ID
ENV NEXT_PUBLIC_PROGRAM_ID=$NEXT_PUBLIC_PROGRAM_ID
ENV NEXT_PUBLIC_WAITLIST_API_URL=$NEXT_PUBLIC_WAITLIST_API_URL

# Copy package files
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build with webpack (required for snarkjs WASM)
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy built application and dependencies
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.ts ./next.config.ts

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME="0.0.0.0"

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Start command - Next.js production mode
CMD ["pnpm", "start"]
