import TelegramBot from 'node-telegram-bot-api';
import { DatabaseService, User } from './database';

export class TelegramService {
  private bot: TelegramBot;
  private dbService: DatabaseService;

  constructor(bot: TelegramBot, dbService: DatabaseService) {
    this.bot = bot;
    this.dbService = dbService;
    this.setupCommands();
  }

  private setupCommands() {
    // Start command
    this.bot.onText(/\/start/, async (msg) => {
      await this.handleStart(msg);
    });

    // Help command
    this.bot.onText(/\/help/, async (msg) => {
      await this.handleHelp(msg);
    });

    // Test command
    this.bot.onText(/\/test/, async (msg) => {
      await this.handleTest(msg);
    });

    // Monitoring command
    this.bot.onText(/\/monitoring/, async (msg) => {
      await this.handleMonitoring(msg);
    });

    // Status command
    this.bot.onText(/\/status/, async (msg) => {
      await this.handleStatus(msg);
    });

    // History command
    this.bot.onText(/\/history/, async (msg) => {
      await this.handleHistory(msg);
    });

    // Stop notifications command
    this.bot.onText(/\/stop/, async (msg) => {
      await this.handleStop(msg);
    });

    // Resume notifications command
    this.bot.onText(/\/resume/, async (msg) => {
      await this.handleResume(msg);
    });

    // Stats command
    this.bot.onText(/\/stats/, async (msg) => {
      await this.handleStats(msg);
    });
  }

  private async handleStart(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id.toString() || '';
    const username = msg.from?.username;
    const firstName = msg.from?.first_name;
    const lastName = msg.from?.last_name;

    try {
      await this.dbService.createUser(telegramId, username, firstName, lastName);
      
      const welcomeMessage = `
🗑️ *Welcome to TrashLinkPro Bot!* 🤖

Hello ${firstName || 'there'}! I'm your smart trash monitoring assistant.

*Available Commands:*
/monitoring - View current trash status
/test - Test if bot is working
/status - Quick status check
/history - View recent readings
/stats - View 24-hour statistics
/stop - Stop receiving notifications
/resume - Resume notifications
/help - Show this help message

I'll automatically notify you when the trash is getting full!

Ready to keep your trash management smart and efficient! 🚀
      `;

      await this.bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error in handleStart:', error);
      await this.bot.sendMessage(chatId, '❌ Sorry, there was an error setting up your account. Please try again.');
    }
  }

  private async handleHelp(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    
    const helpMessage = `
🗑️ *TrashLinkPro Bot Commands* 📱

*Main Commands:*
/monitoring - 📊 View current trash status and fill level
/test - 🔧 Test if the bot is working properly
/status - ⚡ Quick status check
/history - 📈 View recent sensor readings
/stats - 📋 View 24-hour statistics and trends

*Notification Management:*
/stop - 🔇 Stop receiving notifications
/resume - 🔔 Resume receiving notifications

*Information:*
/help - 🆘 Show this help message
/start - 🚀 Start using the bot

*About TrashLinkPro:*
This bot monitors your smart trash can and sends alerts when it's getting full. The system uses height sensors to track fill levels and provides real-time monitoring capabilities.

Need support? Contact your system administrator.
    `;

    await this.bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
  }

  private async handleTest(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const startTime = Date.now();
    
    try {
      // Test database connection
      const user = await this.dbService.getUser(msg.from?.id.toString() || '');
      const responseTime = Date.now() - startTime;
      
      const testMessage = `
✅ *Bot Test Results*

🤖 Bot Status: *Online*
🏃‍♂️ Response Time: *${responseTime}ms*
💾 Database: *Connected*
👤 User Status: *${user ? 'Registered' : 'Not registered'}*
🕐 Server Time: *${new Date().toLocaleString()}*

Everything is working perfectly! 🎉
      `;

      await this.bot.sendMessage(chatId, testMessage, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error in handleTest:', error);
      await this.bot.sendMessage(chatId, `❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleMonitoring(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    
    try {
      const latest = await this.dbService.getLatestSensorReading();
      const maxHeight = parseFloat(process.env.TRASH_CAPACITY_HEIGHT || '100');
      const alertThreshold = parseFloat(process.env.ALERT_THRESHOLD || '80');
      
      if (!latest) {
        await this.bot.sendMessage(chatId, '📊 No sensor data available yet. The system may be initializing or no readings have been recorded.');
        return;
      }

      const fillPercentage = latest.volume_percentage;
      const height = latest.height;
      const hoursAgo = Math.round((Date.now() - new Date(latest.timestamp).getTime()) / (1000 * 60 * 60) * 10) / 10;
      
      let statusEmoji = '🟢';
      let statusText = 'Normal';
      
      if (fillPercentage >= 90) {
        statusEmoji = '🔴';
        statusText = 'Critical - FULL!';
      } else if (fillPercentage >= alertThreshold) {
        statusEmoji = '🟡';
        statusText = 'Warning - Getting Full';
      }

      const monitoringMessage = `
🗑️ *TrashLinkPro Monitoring Status*

${statusEmoji} *Status:* ${statusText}

📏 *Current Height:* ${height}cm
📊 *Fill Level:* ${fillPercentage.toFixed(1)}%
📦 *Capacity:* ${Math.round(fillPercentage)}% of ${maxHeight}cm
⏰ *Last Update:* ${hoursAgo}h ago
🕐 *Timestamp:* ${new Date(latest.timestamp).toLocaleString()}

${fillPercentage >= alertThreshold ? '⚠️ *Action Required:* Trash needs to be emptied soon!' : '✅ *Status:* Trash level is within normal range'}
      `;

      await this.bot.sendMessage(chatId, monitoringMessage, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error in handleMonitoring:', error);
      await this.bot.sendMessage(chatId, '❌ Error retrieving monitoring data. Please try again.');
    }
  }

  private async handleStatus(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    
    try {
      const latest = await this.dbService.getLatestSensorReading();
      
      if (!latest) {
        await this.bot.sendMessage(chatId, '⚡ Status: No data available');
        return;
      }

      const fillPercentage = latest.volume_percentage;
      let emoji = '🟢';
      
      if (fillPercentage >= 90) emoji = '🔴';
      else if (fillPercentage >= 80) emoji = '🟡';
      
      await this.bot.sendMessage(chatId, `${emoji} *Status:* ${fillPercentage.toFixed(1)}% full`, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error in handleStatus:', error);
      await this.bot.sendMessage(chatId, '❌ Error getting status');
    }
  }

  private async handleHistory(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    
    try {
      const readings = await this.dbService.getSensorReadings(10);
      
      if (readings.length === 0) {
        await this.bot.sendMessage(chatId, '📈 No historical data available yet.');
        return;
      }

      let historyMessage = '📈 *Recent Sensor Readings:*\n\n';
      
      readings.forEach((reading, index) => {
        const time = new Date(reading.timestamp).toLocaleString();
        const percentage = reading.volume_percentage;
        let emoji = '🟢';
        
        if (percentage >= 90) emoji = '🔴';
        else if (percentage >= 80) emoji = '🟡';
        
        historyMessage += `${emoji} ${percentage.toFixed(1)}% - ${time}\n`;
      });

      await this.bot.sendMessage(chatId, historyMessage, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error in handleHistory:', error);
      await this.bot.sendMessage(chatId, '❌ Error retrieving history data.');
    }
  }

  private async handleStats(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    
    try {
      const stats = await this.dbService.getTrashStats();
      
      if (!stats.current) {
        await this.bot.sendMessage(chatId, '📋 No statistics available yet.');
        return;
      }

      const statsMessage = `
📋 *24-Hour Statistics*

📊 *Current Level:* ${stats.current.volume_percentage.toFixed(1)}%
📈 *Average Level:* ${((stats.averageHeight24h / parseFloat(process.env.TRASH_CAPACITY_HEIGHT || '100')) * 100).toFixed(1)}%
🔝 *Maximum Level:* ${((stats.maxHeight24h / parseFloat(process.env.TRASH_CAPACITY_HEIGHT || '100')) * 100).toFixed(1)}%
📡 *Readings Count:* ${stats.readingsCount24h}

*Height Measurements:*
📏 Current: ${stats.current.height}cm
📏 Average: ${stats.averageHeight24h}cm
📏 Maximum: ${stats.maxHeight24h}cm
      `;

      await this.bot.sendMessage(chatId, statsMessage, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error in handleStats:', error);
      await this.bot.sendMessage(chatId, '❌ Error retrieving statistics.');
    }
  }

  private async handleStop(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id.toString() || '';
    
    try {
      await this.dbService.updateUserStatus(telegramId, false);
      await this.bot.sendMessage(chatId, '🔇 Notifications stopped. Use /resume to start receiving notifications again.');
    } catch (error) {
      console.error('Error in handleStop:', error);
      await this.bot.sendMessage(chatId, '❌ Error stopping notifications.');
    }
  }

  private async handleResume(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id.toString() || '';
    
    try {
      await this.dbService.updateUserStatus(telegramId, true);
      await this.bot.sendMessage(chatId, '🔔 Notifications resumed. You will receive alerts when the trash is getting full.');
    } catch (error) {
      console.error('Error in handleResume:', error);
      await this.bot.sendMessage(chatId, '❌ Error resuming notifications.');
    }
  }

  public async sendAlert(message: string, alertType: 'full' | 'warning' | 'system' = 'system') {
    try {
      const activeUsers = await this.dbService.getAllActiveUsers();
      
      for (const user of activeUsers) {
        try {
          await this.bot.sendMessage(user.telegram_id, message, { parse_mode: 'Markdown' });
          await this.dbService.addAlert(user.id, message, alertType);
        } catch (error) {
          console.error(`Error sending alert to user ${user.telegram_id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error sending alerts:', error);
    }
  }

  public async sendMessageToUser(telegramId: string, message: string) {
    try {
      await this.bot.sendMessage(telegramId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error(`Error sending message to user ${telegramId}:`, error);
    }
  }
}
