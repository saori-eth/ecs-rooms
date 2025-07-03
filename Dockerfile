# Use Node.js 18 Alpine image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the client
RUN npm run build

# Expose port
EXPOSE 8080

# Start the server
CMD ["npm", "start"]