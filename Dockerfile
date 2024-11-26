FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy application files
COPY client/ ./client/
COPY server/ ./server/

# Ensure permissions are set before switching users
RUN chown -R node:node /app && chmod -R 755 /app

# Switch to non-root user
USER node

ENV NODE_ENV=production \
    PORT=8080

EXPOSE 8080

CMD ["node", "server/server.js"]
