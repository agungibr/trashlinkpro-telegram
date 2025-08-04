import TelegramBot from 'node-telegram-bot-api';
import express from 'express';
import dotenv from 'dotenv';
import { DatabaseService } from './services/database';
import { TelegramService } from './services/telegram';
import { MonitoringService } from './services/monitoring';

// Load environment variables
dotenv.config();

class TrashLinkProBot {
  private bot: TelegramBot;
  private dbService: DatabaseService;
  private telegramService: TelegramService;
  private monitoringService: MonitoringService;
  private app: express.Application;

  constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN is required');
    }

    this.bot = new TelegramBot(token, { polling: true });
    this.dbService = new DatabaseService();
    this.telegramService = new TelegramService(this.bot, this.dbService);
    this.monitoringService = new MonitoringService(this.dbService, this.telegramService);
    this.app = express();

    this.setupExpress();
    this.setupBot();
    this.startMonitoring();
  }

  private setupExpress() {
    this.app.use(express.json());
    
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'TrashLinkPro Bot'
      });
    });

    // Webhook endpoint for sensor data (for future IoT integration)
    this.app.post('/sensor-data', async (req, res) => {
      try {
        const { height, timestamp } = req.body;
        await this.monitoringService.processSensorData(height, timestamp);
        res.json({ success: true });
      } catch (error) {
        console.error('Error processing sensor data:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    const port = process.env.PORT || 3000;
    this.app.listen(port, () => {
      console.log(`🚀 TrashLinkPro Bot server running on port ${port}`);
    });
  }

  private setupBot() {
    console.log('🤖 TrashLinkPro Bot is starting...');

    // Error handling
    this.bot.on('error', (error) => {
      console.error('Bot error:', error);
    });

    // Polling error handling
    this.bot.on('polling_error', (error) => {
      console.error('Polling error:', error);
    });

    console.log('✅ TrashLinkPro Bot is ready!');
  }

  private startMonitoring() {
    // Start periodic monitoring
    this.monitoringService.startPeriodicCheck();
    console.log('📊 Monitoring service started');
  }

  public async initialize() {
    try {
      await this.dbService.initialize();
      console.log('✅ Database initialized');
    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
      throw error;
    }
  }
}

// Start the bot
async function main() {
  try {
    const bot = new TrashLinkProBot();
    await bot.initialize();
  } catch (error) {
    console.error('❌ Failed to start TrashLinkPro Bot:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down TrashLinkPro Bot...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Shutting down TrashLinkPro Bot...');
  process.exit(0);
});

main().catch(console.error);
