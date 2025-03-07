#!/bin/bash

# Install dependencies
npm install

# Ensure libsql client dependency is installed
npm install @libsql/client@0.14.0

# Print environment information for debugging
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

# Print tsconfig.json for debugging
echo "tsconfig.json contents:"
cat tsconfig.json

# Print jsconfig.json for debugging
echo "jsconfig.json contents:"
cat jsconfig.json

# Build the application
NEXT_TELEMETRY_DISABLED=1 npm run build 