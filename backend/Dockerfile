# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install Python and pip
RUN apk add --no-cache python3 py3-pip

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Install Python dependencies
COPY requirements.txt ./
RUN pip3 install -r requirements.txt

# Copy source code
COPY . .

# Production stage
FROM node:20-alpine

# Install Python and pip
RUN apk add --no-cache python3 py3-pip

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Install Python dependencies
COPY requirements.txt ./
RUN pip3 install -r requirements.txt

# Copy built application from builder stage
COPY --from=builder /app/src ./src

# Create temp directory for file processing
RUN mkdir temp && chmod 777 temp

# Add labels for better maintainability
LABEL maintainer="Your Name <your.email@example.com>"
LABEL version="1.0"
LABEL description="Backend API for Test Platform"

# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Expose the port your app runs on
EXPOSE 5000

# Environment variables
ENV NODE_ENV=production
ENV PORT=5000
ENV PYTHONUNBUFFERED=1

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/api/health || exit 1

# Start the application
CMD ["node", "src/index.js"] 