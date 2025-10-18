# Use Node.js 22 LTS (required by Vite and package.json)
FROM node:22-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install ALL dependencies (including dev dependencies for build)
RUN npm install
RUN cd server && npm install

# Copy source code
COPY . .

# Build frontend (vite is now available)
RUN npm run build:frontend

# Server dependencies already installed above

# Expose port
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/ || exit 1

# Start the application
CMD ["node", "start-railway-fixed.cjs"]