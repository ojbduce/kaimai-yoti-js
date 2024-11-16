FROM node:20-alpine

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Clean install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create keys directory
RUN mkdir -p keys && \
    chown -R node:node /app

# Switch to non-root user
USER node

# Set environment
ENV NODE_ENV=production \
    PORT=8080

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8080/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start app
CMD ["node", "server/server.js"]
