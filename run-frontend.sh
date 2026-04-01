#!/bin/bash
# Quick start script to run and test the dashboard

echo "🛡️ ChildGuard Wristband - Frontend Testing Guide"
echo "------------------------------------------------"
echo ""

# Check if Python is available
if command -v python3 &> /dev/null; then
    echo "✓ Python3 found"
    echo ""
    echo "Starting frontend server on http://localhost:8000"
    echo "Press Ctrl+C to stop"
    echo ""
    cd "$(dirname "$0")/frontend"
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "✓ Python found"
    echo ""
    echo "Starting frontend server on http://localhost:8000"
    echo "Press Ctrl+C to stop"
    echo ""
    cd "$(dirname "$0")/frontend"
    python -m SimpleHTTPServer 8000
elif command -v node &> /dev/null; then
    echo "✓ Node.js found"
    echo ""
    echo "Starting frontend server..."
    echo ""
    cd "$(dirname "$0")/frontend"
    npx http-server -p 8000
else
    echo "❌ No suitable HTTP server found."
    echo "Please install Python3, Python, or Node.js"
    echo ""
    echo "Options:"
    echo "1. macOS: brew install python3"
    echo "2. Linux: apt-get install python3"
    echo "3. Windows: Download from https://www.python.org"
    exit 1
fi
