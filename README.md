# TrashLinkPro Bot 🗑️🤖

A smart Telegram bot for monitoring automatic trash cans using height sensors. This bot provides real-time monitoring, alerts, and statistics for your TrashLinkPro system.

## 🚀 Features

- **Multi-user Support**: Team members can all use the same bot
- **Real-time Monitoring**: Get current trash fill levels and status
- **Smart Alerts**: Automatic notifications when trash is getting full
- **Historical Data**: View trends and statistics
- **24/7 Operation**: Designed for continuous monitoring
- **Cloud Database**: Uses Neon database for reliable data storage
- **Serverless Deployment**: Deploy on Azure or Vercel for cost-effective hosting

## 📱 Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Initialize the bot and register as a user |
| `/help` | Show all available commands and help |
| `/monitoring` | View detailed current trash status |
| `/test` | Test if the bot is working properly |
| `/status` | Quick status check (fill percentage) |
| `/history` | View recent sensor readings |
| `/stats` | View 24-hour statistics and trends |
| `/stop` | Stop receiving notifications |
| `/resume` | Resume receiving notifications |

## 🛠️ Setup Instructions

### Prerequisites

1. **Node.js 18+** installed on your system
2. **Telegram Bot Token** from [@BotFather](https://t.me/BotFather)
3. **Neon Database** account and connection string
4. **Azure** or **Vercel** account for deployment

### Step 1: Create Telegram Bot

1. Open Telegram and search for [@BotFather](https://t.me/BotFather)
2. Send `/newbot` command
3. Follow the instructions to create your bot
4. Save the bot token (you'll need it later)
5. Send `/setcommands` to BotFather and paste this:

```
start - Initialize the bot and register as a user
help - Show all available commands and help
monitoring - View detailed current trash status
test - Test if the bot is working properly
status - Quick status check (fill percentage)
history - View recent sensor readings
stats - View 24-hour statistics and trends
stop - Stop receiving notifications
resume - Resume receiving notifications
```

### Step 2: Setup Neon Database

1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project
3. Copy the connection string (looks like: `postgresql://user:password@host/database?sslmode=require`)

### Step 3: Install Dependencies

```bash
# Install dependencies
npm install

# Install development dependencies (for local development)
npm install --save-dev
```

### Step 4: Environment Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` file and add your credentials:
```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
DATABASE_URL=your_neon_database_connection_string_here
PORT=3000
NODE_ENV=production

# Trash monitoring settings
TRASH_CAPACITY_HEIGHT=100
ALERT_THRESHOLD=80
CHECK_INTERVAL=300000
```

**Configuration Explanation:**
- `TELEGRAM_BOT_TOKEN`: Your bot token from BotFather
- `DATABASE_URL`: Your Neon database connection string
- `TRASH_CAPACITY_HEIGHT`: Maximum height of trash container in cm
- `ALERT_THRESHOLD`: Percentage at which to send warnings (default: 80%)
- `CHECK_INTERVAL`: How often to check for alerts in milliseconds (default: 5 minutes)

### Step 5: Local Development

```bash
# Build the project
npm run build

# Run in development mode (with auto-reload)
npm run dev

# Run in production mode
npm start
```

## 🌐 Deployment Options

### Option 1: Deploy to Vercel (Recommended)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Set environment variables in Vercel dashboard:
   - Go to your project settings
   - Add all environment variables from your `.env` file

4. Your bot will be available at: `https://your-project.vercel.app`

### Option 2: Deploy to Azure Functions

1. Install Azure CLI and Functions Core Tools
2. Create Azure Function App
3. Deploy using:
```bash
func azure functionapp publish your-function-app-name
```

### Option 3: Deploy to Azure Container Instances

1. Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

2. Build and deploy:
```bash
# Build image
docker build -t trashlinkpro-bot .

# Deploy to Azure Container Instances
az container create --resource-group myResourceGroup --name trashlinkpro-bot --image trashlinkpro-bot
```

## 📊 IoT Integration

### Webhook Endpoint for Sensor Data

The bot provides a webhook endpoint for receiving sensor data:

**POST** `/sensor-data`

**Request Body:**
```json
{
  "height": 75.5,
  "timestamp": "2025-01-15T10:30:00Z"
}
```

**Response:**
```json
{
  "success": true
}
```

### Example Arduino/Raspberry Pi Integration

```javascript
// Example code for sending sensor data
const axios = require('axios');

async function sendSensorData(height) {
  try {
    await axios.post('https://your-bot-url.vercel.app/sensor-data', {
      height: height,
      timestamp: new Date().toISOString()
    });
    console.log('Sensor data sent successfully');
  } catch (error) {
    console.error('Error sending sensor data:', error);
  }
}

// Call this function with your sensor reading
sendSensorData(75.5);
```

## 🔧 Configuration

### Alert Thresholds

You can customize when alerts are sent by modifying these environment variables:

- **Warning Alert**: When fill level >= `ALERT_THRESHOLD` (default: 80%)
- **Critical Alert**: When fill level >= 95%
- **System Alert**: When no data received for 1+ hours

### Monitoring Intervals

- **Sensor Check**: Every `CHECK_INTERVAL` milliseconds (default: 5 minutes)
- **Alert Cooldown**: 30 minutes between similar alerts
- **Data Retention**: All historical data is preserved

## 📈 Database Schema

The bot automatically creates these tables:

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  telegram_id VARCHAR(50) UNIQUE NOT NULL,
  username VARCHAR(100),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Sensor Readings Table
```sql
CREATE TABLE sensor_readings (
  id SERIAL PRIMARY KEY,
  height DECIMAL(10, 2) NOT NULL,
  volume_percentage DECIMAL(5, 2) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Alerts Table
```sql
CREATE TABLE alerts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  message TEXT NOT NULL,
  alert_type VARCHAR(20) DEFAULT 'system',
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔍 Monitoring & Maintenance

### Health Check

The bot provides a health check endpoint:
- **GET** `/health`
- Returns system status and timestamp

### Logs

Monitor your bot using:
```bash
# View logs in development
npm run dev

# View logs in production (Vercel)
vercel logs

# View logs in Azure
az webapp log tail --name your-app-name --resource-group your-resource-group
```

### Database Monitoring

Monitor your Neon database:
1. Go to [Neon Console](https://console.neon.tech/)
2. Select your project
3. View metrics and query performance

## 🚨 Troubleshooting

### Common Issues

1. **Bot not responding**
   - Check if `TELEGRAM_BOT_TOKEN` is correct
   - Verify bot is deployed and running
   - Check `/health` endpoint

2. **Database connection failed**
   - Verify `DATABASE_URL` is correct
   - Check if database is accessible
   - Ensure firewall allows connections

3. **No sensor data**
   - Verify webhook endpoint is accessible
   - Check if IoT device can reach the bot URL
   - Review sensor data format

4. **Alerts not working**
   - Check if users are registered (`/start` command)
   - Verify alert thresholds are set correctly
   - Check if users have stopped notifications

### Error Codes

- **500**: Internal server error (check logs)
- **401**: Unauthorized (check bot token)
- **404**: Endpoint not found
- **Database errors**: Check Neon connection

## 📞 Support

For technical support:
1. Check the troubleshooting section above
2. Review the logs for error messages
3. Verify all environment variables are set correctly
4. Ensure your deployment platform (Vercel/Azure) has no issues

## 🔐 Security Considerations

- Keep your `TELEGRAM_BOT_TOKEN` secure and never commit it to version control
- Use environment variables for all sensitive configuration
- Regularly update dependencies for security patches
- Monitor your database for unusual activity
- Consider implementing rate limiting for webhook endpoints

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**TrashLinkPro Bot** - Making waste management smarter, one notification at a time! 🗑️✨
