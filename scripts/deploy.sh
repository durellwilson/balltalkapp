#!/bin/bash

# BallTalk App Deployment Script
# This script builds and deploys the BallTalk app to Expo

# Set error handling
set -e

# Display banner
echo "====================================="
echo "  BallTalk App Deployment"
echo "====================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "Error: package.json not found. Please run this script from the project root."
  exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  echo "Warning: You have uncommitted changes."
  echo "It's recommended to commit your changes before deploying."
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 1
  fi
fi

# Install dependencies if node_modules doesn't exist or is outdated
if [ ! -d "node_modules" ] || [ "$(find package.json -newer node_modules -print)" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Skip tests for now
echo "Skipping tests for now..."

# Build the app for web
echo "Building the app for web..."
npm run build:web || {
  echo "Build failed. Fix the issues before deploying."
  exit 1
}

# Deploy to Expo
echo "Deploying to Expo..."
npx eas update --auto --branch preview || {
  echo "Deployment failed."
  exit 1
}

echo ""
echo "====================================="
echo "  Deployment Completed Successfully!"
echo "=====================================" 