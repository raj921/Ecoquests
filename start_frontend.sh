#!/bin/bash

# EcoQuest Frontend Startup Script
# Starts the React Native Expo app

echo "📱 Starting EcoQuest Frontend (React Native)"
echo "============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm first."
    exit 1
fi

# Navigate to frontend directory
cd frontend

# Check if .env file exists
if [ -f ".env" ]; then
    echo "✅ Frontend .env file found"
    if grep -q "EXPO_PUBLIC_BACKEND_URL=http://localhost:8000" .env; then
        echo "✅ Backend URL configured correctly"
    else
        echo "⚠️  Warning: Backend URL may not be configured properly"
        echo "   Please check frontend/.env file"
    fi
else
    echo "❌ frontend/.env file not found"
    echo "   Creating default .env file..."
    echo "EXPO_PUBLIC_BACKEND_URL=http://localhost:8000" > .env
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

# Check if Expo CLI is available
if ! command -v expo &> /dev/null; then
    if ! command -v npx &> /dev/null; then
        echo "❌ Neither expo nor npx found. Please install Expo CLI."
        exit 1
    else
        echo "✅ Using npx expo"
        EXPO_CMD="npx expo"
    fi
else
    echo "✅ Expo CLI found"
    EXPO_CMD="expo"
fi

echo ""
echo "🚀 Starting Expo development server..."
echo "   Make sure the backend is running on http://localhost:8000"
echo "   You can scan the QR code with Expo Go app"
echo "   Or press 'w' to open in web browser"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

$EXPO_CMD start