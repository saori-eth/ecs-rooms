#!/bin/bash

# Build the project
echo "Building the project..."
npm run build

# Deploy to Fly.io
echo "Deploying to Fly.io..."
fly deploy

# Note: Autoscaling is configured in fly.toml
# Machines will auto-scale based on the concurrency settings

echo "Deployment complete!"
echo ""
echo "Monitor your app with:"
echo "  fly status"
echo "  fly logs"
echo "  curl https://digispace.fly.dev/health"