# Multi-stage Dockerfile for Skills Factory
# Stage 1: Build CLI
FROM node:22-alpine AS cli-builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source and build CLI
COPY src/ ./src/
RUN npm run build:cli

# Stage 2: Build Web
FROM node:22-alpine AS web-builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY next.config.mjs ./
COPY tailwind.config.ts ./
COPY postcss.config.cjs ./
COPY tsconfig*.json ./

# Install all dependencies (including dev for build)
RUN npm ci

# Copy source and build
COPY src/ ./src/
COPY public/ ./public/ 2>/dev/null || true
RUN npm run build:web

# Stage 3: Production image
FROM node:22-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy CLI build
COPY --from=cli-builder /app/dist ./dist

# Copy Web build
COPY --from=web-builder /app/.next ./.next
COPY --from=web-builder /app/public ./public
COPY --from=web-builder /app/next.config.mjs ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set permissions
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose ports
# 3000 - Web interface (Next.js)
# 3001 - API server (Express)
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start both services
CMD ["sh", "-c", "npm run web & npm run api"]
