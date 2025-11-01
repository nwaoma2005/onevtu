#!/usr/bin/env bash
set -o errexit

echo "Installing dependencies..."
npm run install-all

echo "Building React frontend..."
npm run build-client

echo "Build completed!"