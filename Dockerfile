# Use official Node.js LTS image
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install --production=false --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# Build the client
RUN npm run build

# Expose the port Fly.io will forward to the Internet
EXPOSE 8080

# Start the server
CMD ["node", "server/index.js"] 