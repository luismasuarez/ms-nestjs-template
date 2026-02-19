# Use the official Node.js 20 Alpine image as the base for both stages
FROM node:20-alpine AS builder

# Declare build-time argument
ARG DATABASE_URL
ARG RABBITMQ_URL

# Make it available as ENV for Prisma
ENV DATABASE_URL=${DATABASE_URL}
ENV RABBITMQ_URL=${RABBITMQ_URL}

# Install pnpm globally
RUN npm install -g pnpm

# Set the working directory
WORKDIR /app

# Copy package.json and pnpm-lock.yaml first to leverage Docker layer caching
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Copy the source code
COPY . .

RUN npx prisma generate

# Build the application
RUN pnpm build

# ---------------------------
# Production stage
# ---------------------------
FROM node:20-alpine AS production

# Install pnpm and wget (needed for healthcheck)
RUN apk add --no-cache wget && npm install -g pnpm

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

WORKDIR /app

# Copy node_modules and dist from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/shared/prisma ./src/shared/prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY package.json ./

# Switch to non-root user
USER nestjs