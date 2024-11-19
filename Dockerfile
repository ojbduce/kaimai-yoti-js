FROM node:20-alpine

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Clean install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create keys directory and set permissions
RUN mkdir -p /app/keys && \
    chown -R node:node /app/keys

# Switch to non-root user
USER node

# Set environment variables
ENV NODE_ENV=production \
    PORT=8080

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=60s --timeout=30s --start-period=30s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8080/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start app
CMD ["node", "server/server.js"]
