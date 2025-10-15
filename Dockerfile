# Multi-stage build for production
FROM node:18-alpine AS builder

# Install FFmpeg for video processing
RUN apk add --no-cache ffmpeg

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies
RUN npm ci --only=production
RUN cd server && npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install FFmpeg for video processing
RUN apk add --no-cache ffmpeg

WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server/node_modules ./server/node_modules

# Create uploads directory
RUN mkdir -p uploads/videos uploads/audio uploads/images uploads/proxies

# Expose ports
EXPOSE 3000 5001

# Start both frontend and backend
CMD ["sh", "-c", "npm run start & cd server && npm start"]