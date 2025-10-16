# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Install FFmpeg and other dependencies
RUN apk add --no-cache ffmpeg wget

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY server/package*.json ./server/

# Install all dependencies
RUN npm install --include=dev
RUN cd server && npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create a robust startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "Starting VEdit Video Editor..."' >> /app/start.sh && \
    echo 'echo "Environment: $NODE_ENV"' >> /app/start.sh && \
    echo 'echo "Port: $PORT"' >> /app/start.sh && \
    echo 'echo "Working directory: $(pwd)"' >> /app/start.sh && \
    echo 'echo "Files in /app:"' >> /app/start.sh && \
    echo 'ls -la /app' >> /app/start.sh && \
    echo 'echo "Files in /app/dist:"' >> /app/start.sh && \
    echo 'ls -la /app/dist || echo "dist directory not found"' >> /app/start.sh && \
    echo 'echo "Starting server..."' >> /app/start.sh && \
    echo 'npm start' >> /app/start.sh && \
    chmod +x /app/start.sh

# Expose port
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

# Start the application
CMD ["/app/start.sh"]