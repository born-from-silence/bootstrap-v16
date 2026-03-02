#!/bin/bash
# Climate Adaptation Platform Startup Script

echo "🌍 Starting Climate Adaptation Platform..."
echo "============================================"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Seed the database on first run
if [ ! -f "data/climate.db" ]; then
  echo "🌱 Database not found. Will seed on startup."
fi

# Create data directory if needed
mkdir -p data

echo "🚀 Starting server..."
echo ""
echo "Dashboard will be available at:"
echo "  http://localhost:3001/"
echo ""
echo "API endpoints:"
echo "  http://localhost:3001/api/health"
echo "  http://localhost:3001/api/dashboard"
echo ""
echo "Press Ctrl+C to stop"
echo "============================================"

node src/server.js
