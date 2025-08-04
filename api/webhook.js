// Simple webhook handler for Telegram bot
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // For GET requests, return status
    if (req.method === 'GET') {
      return res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'TrashLinkPro Bot Webhook'
      });
    }

    // For POST requests
    if (req.method === 'POST') {
      const body = req.body;
      
      // Log the request for debugging
      console.log('Webhook received:', JSON.stringify(body, null, 2));
      
      // Handle Telegram updates
      if (body && body.message) {
        const message = body.message;
        const chatId = message.chat.id;
        const text = message.text;
        
        console.log(`Message from ${chatId}: ${text}`);
        
        // Get bot token from environment
        const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.telegram_bot_token;
        
        if (!TELEGRAM_BOT_TOKEN) {
          console.error('No bot token found');
          return res.status(200).json({ success: false, error: 'No bot token' });
        }
        
        let responseMessage = '';
        
        // Handle different commands
        if (text === '/start') {
          responseMessage = `🗑️ *Welcome to TrashLinkPro!*

Hi ${message.from.first_name || 'User'}! I'm your smart trash can monitoring assistant.

*Available Commands:*
/help - Show all commands
/status - Check current trash status
/test - Test bot functionality

Ready to help you manage your smart trash can! 🚮✨`;
        } else if (text === '/help') {
          responseMessage = `🤖 *TrashLinkPro Bot Commands*

*User Commands:*
/start - Initialize and register
/help - Show this help message
/status - Check current trash status
/test - Test bot functionality

*Features:*
• 📊 Real-time trash level monitoring
• 🚨 Smart alerts when trash is full
• 📈 Historical data tracking
• 👥 Multi-user support
• 🔄 24/7 monitoring

Need help? The bot is working! 💬`;
        } else if (text === '/status') {
          responseMessage = `📊 *Trash Can Status*

*System Status:* 🟢 Online
*Bot Status:* ✅ Active
*Webhook:* ✅ Connected
*Last Check:* ${new Date().toLocaleString()}

*Note:* Connect your IoT sensor to start receiving real trash level data!

Ready to monitor your trash can! 🗑️`;
        } else if (text === '/test') {
          responseMessage = `✅ *Bot Test Successful!*

*Connection:* ✅ Working
*Webhook:* ✅ Active  
*Timestamp:* ${new Date().toISOString()}
*Chat ID:* ${chatId}

Your TrashLinkPro bot is working perfectly! 🎉`;
        } else {
          responseMessage = `❓ Unknown command: "${text}"

Send /help to see available commands, or /test to check if the bot is working.`;
        }
        
        // Send response to Telegram
        const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const telegramResponse = await fetch(telegramApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: responseMessage,
            parse_mode: 'Markdown'
          })
        });
        
        const telegramResult = await telegramResponse.json();
        console.log('Telegram API response:', telegramResult);
        
        if (!telegramResult.ok) {
          console.error('Telegram API error:', telegramResult);
        }
      }
      
      // Handle sensor data
      if (body && body.height !== undefined) {
        console.log(`Sensor data received: height=${body.height}cm`);
        
        // For now, just log it. You can add database storage here later
        const fullnessPercentage = ((100 - body.height) / 100 * 100).toFixed(1);
        console.log(`Trash fullness: ${fullnessPercentage}%`);
      }
      
      return res.status(200).json({ success: true });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('Webhook error:', error);
    // Always return 200 for Telegram webhooks to avoid retries
    return res.status(200).json({ success: false, error: error.message });
  }
}
