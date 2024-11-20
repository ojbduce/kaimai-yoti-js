FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Create keys directory
RUN mkdir -p /app/keys

# Copy application files (including keys directory)
COPY . .

# Set proper permissions
RUN chown -R node:node /app && \
    chmod 600 /app/keys/Kaimai-Yoti-ultra-basic-share-keys.pem

USER node

ENV NODE_ENV=production \
    PORT=8080

EXPOSE 8080

CMD ["node", "server/server.js"]
