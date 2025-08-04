#!/bin/bash

# TrashLinkPro Bot Webhook Setup Script
# This script sets up the Telegram webhook to point to your Vercel deployment

echo "🤖 Setting up TrashLinkPro Bot Webhook..."

# Get bot token from environment or prompt user
if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    echo "Please enter your Telegram Bot Token:"
    read -s TELEGRAM_BOT_TOKEN
fi

# Vercel URL
WEBHOOK_URL="https://trashlinkpro-9spjymmg1-agungibrs-projects.vercel.app/api/webhook"

echo "📡 Setting webhook URL: $WEBHOOK_URL"

# Set webhook
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
     -H "Content-Type: application/json" \
     -d "{\"url\":\"$WEBHOOK_URL\"}"

echo ""
echo "✅ Webhook setup complete!"
echo ""
echo "🔍 You can now test your bot by:"
echo "1. Starting a chat with your bot on Telegram"
echo "2. Sending /start command"
echo "3. Using other commands like /help, /status, etc."
echo ""
echo "📊 API Endpoints:"
echo "- Health Check: https://trashlinkpro-9spjymmg1-agungibrs-projects.vercel.app/api"
echo "- Webhook: https://trashlinkpro-9spjymmg1-agungibrs-projects.vercel.app/api/webhook"
echo "- Sensor Data: POST to webhook endpoint with {\"height\": value, \"timestamp\": \"ISO_DATE\"}"
