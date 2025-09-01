# ==============================================================================
# PRODUCTION DOCKERFILE - Multi-stage build for optimal performance
# ==============================================================================

# Stage 1: Build the client application
FROM node:20-alpine AS client-builder

# Set working directory
WORKDIR /app

# Copy package files for client
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm install --frozen-lockfile

# Copy client source code
COPY client ./client
COPY shared ./shared
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY components.json ./

# Build client application
RUN npm run build

# Stage 2: Build the server application
FROM node:20-alpine AS server-builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm install --frozen-lockfile

# Copy server source code
COPY server ./server
COPY shared ./shared
COPY drizzle.config.ts ./

# Build server application
RUN npm run build

# Stage 3: Production runtime
FROM node:20-alpine AS production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production --frozen-lockfile && \
    npm cache clean --force

# Copy built applications from previous stages
COPY --from=client-builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=server-builder --chown=nodejs:nodejs /app/dist ./server-dist

# Copy additional necessary files
COPY --chown=nodejs:nodejs shared ./shared
COPY --chown=nodejs:nodejs drizzle.config.ts ./

# Create logs directory
RUN mkdir -p logs && chown nodejs:nodejs logs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Start the application
CMD ["node", "server-dist/index.js"]