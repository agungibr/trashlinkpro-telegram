import { DatabaseService } from './database';
import { TelegramService } from './telegram';

export class MonitoringService {
  private dbService: DatabaseService;
  private telegramService: TelegramService;
  private checkInterval: NodeJS.Timeout | null = null;
  private lastAlertTime: Date | null = null;
  private alertCooldown = 30 * 60 * 1000; // 30 minutes in milliseconds

  constructor(dbService: DatabaseService, telegramService: TelegramService) {
    this.dbService = dbService;
    this.telegramService = telegramService;
  }

  public async processSensorData(height: number, timestamp?: string) {
    try {
      const sensorTimestamp = timestamp ? new Date(timestamp) : new Date();
      
      // Store the sensor reading
      const reading = await this.dbService.addSensorReading(height, sensorTimestamp);
      
      // Check if we need to send alerts
      await this.checkAndSendAlerts(reading.volume_percentage);
      
      console.log(`📊 Sensor data processed: ${height}cm (${reading.volume_percentage.toFixed(1)}%)`);
      
      return reading;
    } catch (error) {
      console.error('Error processing sensor data:', error);
      throw error;
    }
  }

  private async checkAndSendAlerts(volumePercentage: number) {
    const alertThreshold = parseFloat(process.env.ALERT_THRESHOLD || '80');
    const now = new Date();
    
    // Check if we're in cooldown period
    if (this.lastAlertTime && (now.getTime() - this.lastAlertTime.getTime()) < this.alertCooldown) {
      return;
    }

    let shouldAlert = false;
    let alertMessage = '';
    let alertType: 'full' | 'warning' | 'system' = 'system';

    if (volumePercentage >= 95) {
      alertMessage = `
🚨 *URGENT: TrashLinkPro Alert* 🚨

🔴 *TRASH IS FULL!*
📊 Fill Level: *${volumePercentage.toFixed(1)}%*
⚠️ *IMMEDIATE ACTION REQUIRED*

The trash container has reached critical capacity and needs to be emptied immediately!

🕐 Alert Time: ${now.toLocaleString()}
      `;
      alertType = 'full';
      shouldAlert = true;
    } else if (volumePercentage >= alertThreshold) {
      alertMessage = `
⚠️ *TrashLinkPro Warning* ⚠️

🟡 *Trash Getting Full*
📊 Fill Level: *${volumePercentage.toFixed(1)}%*
📈 Threshold: *${alertThreshold}%*

The trash container is approaching capacity. Please consider emptying it soon.

🕐 Alert Time: ${now.toLocaleString()}
      `;
      alertType = 'warning';
      shouldAlert = true;
    }

    if (shouldAlert) {
      await this.telegramService.sendAlert(alertMessage, alertType);
      this.lastAlertTime = now;
      console.log(`🚨 Alert sent: ${alertType} (${volumePercentage.toFixed(1)}%)`);
    }
  }

  public startPeriodicCheck() {
    const interval = parseInt(process.env.CHECK_INTERVAL || '300000'); // 5 minutes default
    
    this.checkInterval = setInterval(async () => {
      try {
        await this.performPeriodicCheck();
      } catch (error) {
        console.error('Error in periodic check:', error);
      }
    }, interval);

    console.log(`🔄 Periodic monitoring started (checking every ${interval / 1000} seconds)`);
  }

  public stopPeriodicCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('⏹️ Periodic monitoring stopped');
    }
  }

  private async performPeriodicCheck() {
    try {
      const latest = await this.dbService.getLatestSensorReading();
      
      if (!latest) {
        // No data available, maybe send a system alert if this persists
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        if (!this.lastAlertTime || this.lastAlertTime < oneHourAgo) {
          await this.telegramService.sendAlert(
            `⚠️ *System Alert*\n\nNo sensor data received for over an hour. Please check the TrashLinkPro system.`,
            'system'
          );
          this.lastAlertTime = new Date();
        }
        return;
      }

      // Check if data is stale (older than 1 hour)
      const dataAge = Date.now() - new Date(latest.timestamp).getTime();
      const oneHour = 60 * 60 * 1000;
      
      if (dataAge > oneHour) {
        const hoursOld = Math.round(dataAge / oneHour);
        await this.telegramService.sendAlert(
          `⚠️ *System Alert*\n\nSensor data is ${hoursOld} hour(s) old. Last reading: ${latest.volume_percentage.toFixed(1)}% at ${new Date(latest.timestamp).toLocaleString()}`,
          'system'
        );
        return;
      }

      // Check current fill level and send alerts if needed
      await this.checkAndSendAlerts(latest.volume_percentage);
      
    } catch (error) {
      console.error('Error in periodic check:', error);
    }
  }

  public async getSystemStatus() {
    try {
      const latest = await this.dbService.getLatestSensorReading();
      const stats = await this.dbService.getTrashStats();
      
      return {
        isOnline: true,
        lastReading: latest,
        stats: stats,
        monitoringActive: this.checkInterval !== null,
        lastAlertTime: this.lastAlertTime
      };
    } catch (error) {
      console.error('Error getting system status:', error);
      return {
        isOnline: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  public async generateDailyReport() {
    try {
      const stats = await this.dbService.getTrashStats();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const readings = await this.dbService.getSensorReadingsSince(yesterday);
      
      const maxFill = readings.length > 0 
        ? Math.max(...readings.map(r => r.volume_percentage))
        : 0;
        
      const minFill = readings.length > 0 
        ? Math.min(...readings.map(r => r.volume_percentage))
        : 0;

      const reportMessage = `
📋 *TrashLinkPro Daily Report*
📅 ${new Date().toDateString()}

*24-Hour Summary:*
📊 Current Level: ${stats.current?.volume_percentage.toFixed(1) || 'N/A'}%
📈 Maximum Level: ${maxFill.toFixed(1)}%
📉 Minimum Level: ${minFill.toFixed(1)}%
📊 Average Level: ${((stats.averageHeight24h / parseFloat(process.env.TRASH_CAPACITY_HEIGHT || '100')) * 100).toFixed(1)}%

*System Health:*
📡 Total Readings: ${stats.readingsCount24h}
✅ System Status: Online
🕐 Report Generated: ${new Date().toLocaleString()}

${maxFill >= 90 ? '⚠️ *Note:* Trash reached critical levels during this period' : '✅ Trash levels remained within normal range'}
      `;

      return reportMessage;
    } catch (error) {
      console.error('Error generating daily report:', error);
      return '❌ Error generating daily report';
    }
  }
}
