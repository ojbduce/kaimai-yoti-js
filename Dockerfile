FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install --production

# Create keys directory and copy PEM file
RUN mkdir -p /app/keys
COPY ./keys/yoti-prod.pem /app/keys/yoti-prod.pem

# Copy application files
COPY client/ ./client/
COPY server/ ./server/

# Set permissions
RUN chown -R node:node /app && chmod -R 755 /app

# Switch to non-root user
USER node

# Docker Compose,Docker Secrets, HashiCorp Vault, Azure Key Vault
ENV NODE_ENV=production \
    PORT=8080 \
    APP_URL=https://kaimaiyoti.azurewebsites.net \
    YOTI_KEY_FILE_PATH=/app/keys/yoti-prod.pem \
    YOTI_CLIENT_SDK_ID='754182a1-fbf6-4a20-8615-cf4666f964cc'
    

EXPOSE 8080

CMD ["node", "server/server.js"]
