#!/bin/bash

echo "=========================================="
echo "Context Graph Query System - Setup Script"
echo "=========================================="
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "Node.js version: $(node --version)"
echo

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install backend dependencies"
    exit 1
fi
cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install frontend dependencies"
    exit 1
fi
cd ..

echo
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo
echo "Next steps:"
echo "1. Create PostgreSQL database: createdb context_graph"
echo "2. Configure backend/.env with your database credentials"
echo "3. Initialize database: cd backend && npm run seed"
echo "4. Ingest data: npm run ingest"
echo "5. Start backend: npm run dev"
echo "6. Start frontend (new terminal): cd frontend && npm run dev"
echo "7. Open http://localhost:5173 in your browser"
echo
