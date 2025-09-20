#!/bin/bash

# EcoQuest Backend Startup Script
# Starts the FastAPI backend with Groq AI integration

echo "🌍 Starting EcoQuest Backend with Groq AI"
echo "=========================================="

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Creating one..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r backend/requirements.txt
else
    echo "✅ Activating virtual environment..."
    source venv/bin/activate
fi

# Check if Groq API key is configured
if [ -f "backend/.env" ]; then
    if grep -q "GROQ_API_KEY=gsk_" backend/.env; then
        echo "✅ Groq API key detected"
    else
        echo "⚠️  Warning: Groq API key may not be configured properly"
        echo "   Please check backend/.env file"
    fi
else
    echo "❌ backend/.env file not found"
    echo "   Please create it with your API keys"
    exit 1
fi

# Start MongoDB if not running (macOS with Homebrew)
if command -v brew &> /dev/null; then
    if ! pgrep -x "mongod" > /dev/null; then
        echo "🔄 Starting MongoDB..."
        brew services start mongodb-community
        sleep 3
    else
        echo "✅ MongoDB is already running"
    fi
fi

# Start the backend server
echo "🚀 Starting FastAPI server..."
echo "   Backend URL: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo "   Health Check: http://localhost:8000/api/"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

cd backend && uvicorn server:app --host 0.0.0.0 --port 8000 --reload