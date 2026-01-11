#!/bin/bash
# Simple script to start a local server for Girl Math

echo "Starting Girl Math local server..."
echo ""
echo "Choose a method:"
echo "1. Python 3 (port 8000)"
echo "2. Node.js with npx serve (port 3000)"
echo "3. Python 2 (port 8000)"
echo ""
read -p "Enter choice (1-3) or press Enter for default (1): " choice
choice=${choice:-1}

case $choice in
    1)
        echo "Starting Python 3 server on http://localhost:8000"
        python3 -m http.server 8000
        ;;
    2)
        echo "Starting Node.js server on http://localhost:3000"
        npx serve -p 3000
        ;;
    3)
        echo "Starting Python 2 server on http://localhost:8000"
        python -m SimpleHTTPServer 8000
        ;;
    *)
        echo "Invalid choice. Using Python 3..."
        python3 -m http.server 8000
        ;;
esac
