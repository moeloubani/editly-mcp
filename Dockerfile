# Self-contained Dockerfile for editly-mcp
# Provides a complete environment with all dependencies and fixed Node.js version

FROM node:18-bullseye as builder

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    pkg-config \
    python3-dev \
    python3-pip \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    ffmpeg \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install npm dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Run setup (skip postinstall in container)
ENV SKIP_EDITLY_POSTINSTALL=true
RUN npm run setup

# Final runtime stage
FROM node:18-bullseye-slim

# Install only runtime dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    ffmpeg \
    libcairo2 \
    libpango-1.0-0 \
    libjpeg62-turbo \
    libgif7 \
    librsvg2-2 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create app user
RUN useradd -m -u 1000 editly

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=editly:editly /app /app

# Switch to non-root user
USER editly

# Expose port (if needed for HTTP interface)
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV SKIP_EDITLY_POSTINSTALL=true

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('healthy')" || exit 1

# Default command
CMD ["node", "index.js"]

# Labels
LABEL org.opencontainers.image.title="editly-mcp"
LABEL org.opencontainers.image.description="MCP server providing comprehensive Editly video editing functionality"
LABEL org.opencontainers.image.version="0.1.0-beta"
LABEL org.opencontainers.image.authors="Moe Loubani"
LABEL org.opencontainers.image.source="https://github.com/moeloubani/editly-mcp"
LABEL org.opencontainers.image.licenses="MIT"