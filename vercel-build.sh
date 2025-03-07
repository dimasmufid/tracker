#!/bin/bash

# Install dependencies
npm install

# Ensure libsql dependencies are installed
npm install libsql@0.14.0 @libsql/client@0.14.0

# Build the application
npm run build 