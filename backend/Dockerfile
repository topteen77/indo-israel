# Backend - Node.js Express API
FROM node:18-alpine

# Use /opt/apravas to avoid conflict with existing /app on production host
WORKDIR /opt/apravas

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy application
COPY . .

# Backend listens on 0.0.0.0 via PORT
EXPOSE 5000

CMD ["node", "server.js"]
