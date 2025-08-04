const TelegramBot = require('node-telegram-bot-api');

// Environment variables with defaults
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.telegram_bot_token;
const DATABASE_URL = process.env.DATABASE_URL || process.env.database_url;
const TRASH_CAPACITY_HEIGHT = parseInt(process.env.TRASH_CAPACITY_HEIGHT || '100');
const ALERT_THRESHOLD = parseInt(process.env.ALERT_THRESHOLD || '80');

// Simple in-memory storage for demo (in production, use a database)
const users = new Map();
const sensorReadings = [];

// Initialize bot without polling (webhook mode)
let bot;
if (TELEGRAM_BOT_TOKEN) {
  bot = new TelegramBot(TELEGRAM_BOT_TOKEN);
}

// Simple command handlers
const handleStart = async (msg) => {
  const chatId = msg.chat.id;
  const user = {
    telegramId: chatId,
    username: msg.from.username || 'Anonymous',
    firstName: msg.from.first_name || 'User',
    isActive: true,
    createdAt: new Date().toISOString()
  };
  
  users.set(chatId, user);
  
  const welcomeMessage = `🗑️ *Welcome to TrashLinkPro!*

Hi ${user.firstName}! I'm your smart trash can monitoring assistant.

*Available Commands:*
/help - Show all commands
/status - Check current trash status
/monitoring - Toggle monitoring on/off
/history - View recent readings
/stats - Show statistics

Ready to help you manage your smart trash can! 🚮✨`;

  await bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
};

const handleHelp = async (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `🤖 *TrashLinkPro Bot Commands*

*User Commands:*
/start - Initialize and register
/help - Show this help message
/status - Check current trash status
/monitoring - Toggle monitoring alerts
/history - View recent sensor readings
/stats - Show usage statistics
/stop - Pause notifications
/resume - Resume notifications

*Features:*
• 📊 Real-time trash level monitoring
• 🚨 Smart alerts when trash is full
• 📈 Historical data tracking
• 👥 Multi-user support
• 🔄 24/7 monitoring

Send sensor data via webhook: POST /api/webhook
Example: {"height": 85, "timestamp": "2025-08-04T05:00:00Z"}

Need help? Contact the development team! 💬`;

  await bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
};

const handleStatus = async (msg) => {
  const chatId = msg.chat.id;
  
  // Get latest sensor reading
  const latestReading = sensorReadings[sensorReadings.length - 1];
  
  if (!latestReading) {
    await bot.sendMessage(chatId, '📊 No sensor data available yet. Sensor readings will appear here once data is received.');
    return;
  }
  
  const fullnessPercentage = ((TRASH_CAPACITY_HEIGHT - latestReading.height) / TRASH_CAPACITY_HEIGHT * 100).toFixed(1);
  const status = fullnessPercentage >= ALERT_THRESHOLD ? '🚨 FULL' : '✅ OK';
  
  const statusMessage = `🗑️ *Trash Can Status*

*Current Level:* ${fullnessPercentage}%
*Status:* ${status}
*Height Reading:* ${latestReading.height}cm
*Last Updated:* ${new Date(latestReading.timestamp).toLocaleString()}

*Thresholds:*
• Alert at: ${ALERT_THRESHOLD}%
• Capacity: ${TRASH_CAPACITY_HEIGHT}cm

*System:* 🟢 Online`;

  await bot.sendMessage(chatId, statusMessage, { parse_mode: 'Markdown' });
};

const handleDefault = async (msg) => {
  const chatId = msg.chat.id;
  await bot.sendMessage(chatId, '❓ Unknown command. Send /help to see available commands.');
};

module.exports = async (req, res) => {
  try {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method === 'GET') {
      return res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'TrashLinkPro Bot Webhook',
        users: users.size,
        readings: sensorReadings.length
      });
    }

    if (req.method === 'POST') {
      const body = req.body;
      
      // Handle Telegram webhook updates
      if (body && body.message && bot) {
        const msg = body.message;
        const text = msg.text;
        
        if (text) {
          if (text.startsWith('/start')) {
            await handleStart(msg);
          } else if (text.startsWith('/help')) {
            await handleHelp(msg);
          } else if (text.startsWith('/status')) {
            await handleStatus(msg);
          } else if (text.startsWith('/monitoring')) {
            await bot.sendMessage(msg.chat.id, '🔔 Monitoring is always active! You\'ll receive alerts when trash is full.');
          } else if (text.startsWith('/history')) {
            const recentReadings = sensorReadings.slice(-5).reverse();
            if (recentReadings.length === 0) {
              await bot.sendMessage(msg.chat.id, '📊 No sensor readings available yet.');
            } else {
              let historyMessage = '📈 *Recent Sensor Readings*\n\n';
              recentReadings.forEach((reading, index) => {
                const fullness = ((TRASH_CAPACITY_HEIGHT - reading.height) / TRASH_CAPACITY_HEIGHT * 100).toFixed(1);
                historyMessage += `${index + 1}. ${fullness}% (${reading.height}cm) - ${new Date(reading.timestamp).toLocaleString()}\n`;
              });
              await bot.sendMessage(msg.chat.id, historyMessage, { parse_mode: 'Markdown' });
            }
          } else if (text.startsWith('/stats')) {
            const statsMessage = `📊 *TrashLinkPro Statistics*

*System Status:* 🟢 Online
*Total Users:* ${users.size}
*Total Readings:* ${sensorReadings.length}
*Average Fullness:* ${sensorReadings.length > 0 ? (sensorReadings.reduce((sum, r) => sum + ((TRASH_CAPACITY_HEIGHT - r.height) / TRASH_CAPACITY_HEIGHT * 100), 0) / sensorReadings.length).toFixed(1) : 0}%
*Uptime:* Since deployment

*Configuration:*
• Capacity: ${TRASH_CAPACITY_HEIGHT}cm
• Alert Threshold: ${ALERT_THRESHOLD}%
• Environment: Production`;
            await bot.sendMessage(msg.chat.id, statsMessage, { parse_mode: 'Markdown' });
          } else {
            await handleDefault(msg);
          }
        }
        
        return res.json({ success: true });
      }
      
      // Handle sensor data
      if (body && body.height !== undefined) {
        const { height, timestamp } = body;
        const reading = {
          height: parseFloat(height),
          timestamp: timestamp || new Date().toISOString(),
          id: Date.now()
        };
        
        sensorReadings.push(reading);
        
        // Keep only last 100 readings
        if (sensorReadings.length > 100) {
          sensorReadings.shift();
        }
        
        // Check if alert needed
        const fullnessPercentage = ((TRASH_CAPACITY_HEIGHT - reading.height) / TRASH_CAPACITY_HEIGHT * 100);
        
        if (fullnessPercentage >= ALERT_THRESHOLD && bot) {
          // Send alert to all users
          const alertMessage = `🚨 *TRASH ALERT!*

Your trash can is ${fullnessPercentage.toFixed(1)}% full!

*Details:*
• Current height: ${reading.height}cm
• Fullness: ${fullnessPercentage.toFixed(1)}%
• Time: ${new Date(reading.timestamp).toLocaleString()}

Please empty the trash can soon! 🗑️`;

          for (const [chatId, user] of users) {
            if (user.isActive) {
              try {
                await bot.sendMessage(chatId, alertMessage, { parse_mode: 'Markdown' });
              } catch (error) {
                console.log(`Failed to send alert to user ${chatId}:`, error.message);
              }
            }
          }
        }
        
        return res.json({ success: true, reading, fullness: fullnessPercentage.toFixed(1) + '%' });
      }
      
      return res.json({ success: true, message: 'Webhook received' });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(200).json({ success: true }); // Always return 200 for Telegram
  }
};
