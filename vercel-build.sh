#!/bin/bash

# Print environment information for debugging
echo "Starting build process..."
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Current directory: $(pwd)"

# Install dependencies
echo "Installing dependencies..."
npm install

# Ensure libsql client dependency is installed
echo "Installing libsql client..."
npm install @libsql/client@0.14.0

# Explicitly install TypeScript
echo "Installing TypeScript..."
npm install --save-dev typescript@5.3.3

# Print directory contents
echo "Directory contents:"
ls -la

# Print tsconfig.json for debugging
echo "tsconfig.json contents:"
cat tsconfig.json

# Print jsconfig.json for debugging
echo "jsconfig.json contents:"
cat jsconfig.json

# Print next.config.mjs for debugging
echo "next.config.mjs contents:"
cat next.config.mjs

# Check if TypeScript is installed correctly
echo "TypeScript version:"
npx tsc --version

# Build the application
echo "Building the application..."
NEXT_TELEMETRY_DISABLED=1 NODE_OPTIONS=--max-old-space-size=4096 npm run build 