const TelegramBot = require('node-telegram-bot-api');
const { DatabaseService } = require('../dist/services/database');
const { TelegramService } = require('../dist/services/telegram');
const { MonitoringService } = require('../dist/services/monitoring');

let bot;
let dbService;
let telegramService;
let monitoringService;

// Initialize services
function initializeServices() {
  if (!bot) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN is required');
    }

    bot = new TelegramBot(token);
    dbService = new DatabaseService();
    telegramService = new TelegramService(bot, dbService);
    monitoringService = new MonitoringService(dbService, telegramService);
  }
}

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
        service: 'TrashLinkPro Bot Webhook'
      });
    }

    if (req.method === 'POST') {
      initializeServices();
      
      // Initialize database if not already done
      await dbService.initialize();
      
      // Handle Telegram webhook updates
      if (req.body && req.body.message) {
        await bot.processUpdate(req.body);
      }
      
      // Handle sensor data
      if (req.body && req.body.height !== undefined) {
        const { height, timestamp } = req.body;
        await monitoringService.processSensorData(height, timestamp);
      }
      
      return res.json({ success: true });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
