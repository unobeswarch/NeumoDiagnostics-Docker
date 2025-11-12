# Multi-stage build for optimized production image
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Development stage
FROM base AS development
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application code
COPY . .

# Expose ports (3000 for HTTP, 3443 for HTTPS)
EXPOSE 3000 3443

# Default to development mode with HTTPS
ENV NODE_ENV=development
ENV USE_HTTPS=true

# Run custom server with HTTPS support
CMD ["node", "server.js"]

# Build stage for production
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production stage
FROM base AS production
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy server.js for HTTPS support
COPY --from=builder /app/server.js ./server.js

# Create certs directory (certificates should be mounted as volume)
RUN mkdir -p ./certs && chown nextjs:nodejs ./certs

# Change ownership
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose ports
EXPOSE 3000 3443

# Default to HTTP in production (use reverse proxy for HTTPS)
ENV USE_HTTPS=false

# Start production server
CMD ["node", "server.js"]