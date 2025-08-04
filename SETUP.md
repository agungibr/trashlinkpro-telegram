# TrashLinkPro Bot - Environment Setup

To set up your TrashLinkPro bot, copy this file to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Then edit the `.env` file with your actual values:

## Required Environment Variables

### TELEGRAM_BOT_TOKEN
Get this from [@BotFather](https://t.me/BotFather) on Telegram:
1. Send `/newbot` to BotFather
2. Follow the prompts to create your bot
3. Copy the token provided

### DATABASE_URL  
Get this from [Neon Console](https://console.neon.tech/):
1. Create a new project
2. Copy the connection string from the dashboard
3. It should look like: `postgresql://user:password@host/database?sslmode=require`

### Optional Configuration
- `TRASH_CAPACITY_HEIGHT`: Maximum height of your trash container in cm (default: 100)
- `ALERT_THRESHOLD`: Percentage at which to send warnings (default: 80)
- `CHECK_INTERVAL`: How often to check for alerts in milliseconds (default: 300000 = 5 minutes)

## Quick Start

1. Copy and configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Start the bot:
   ```bash
   npm start
   ```

5. For development with auto-reload:
   ```bash
   npm run dev
   ```

## Testing Your Bot

Once running, send `/start` to your bot in Telegram to begin!
