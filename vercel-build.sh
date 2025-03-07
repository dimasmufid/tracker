#!/bin/bash

# Install dependencies
npm install

# Ensure libsql client dependency is installed
npm install @libsql/client@0.14.0

# Build the application
npm run build 