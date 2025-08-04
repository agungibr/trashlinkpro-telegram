#!/bin/bash
# Simple deployment script for TrashLinkPro Bot

echo "🗑️ TrashLinkPro Bot Deployment Script"
echo "======================================"

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "📝 Please copy .env.example to .env and configure your settings:"
    echo "   cp .env.example .env"
    echo "   # Then edit .env with your TELEGRAM_BOT_TOKEN and DATABASE_URL"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found! Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found! Please install npm first."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Failed to build project"
    exit 1
fi

echo "✅ Build completed successfully!"
echo ""
echo "🚀 To start the bot:"
echo "   npm start"
echo ""
echo "🛠️ For development mode:"
echo "   npm run dev"
echo ""
echo "📱 Don't forget to send /start to your bot in Telegram!"
