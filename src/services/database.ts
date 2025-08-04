import { neon } from '@neondatabase/serverless';

export interface User {
  id: number;
  telegram_id: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface SensorReading {
  id: number;
  height: number;
  volume_percentage: number;
  timestamp: Date;
  created_at: Date;
}

export interface Alert {
  id: number;
  user_id: number;
  message: string;
  sent_at: Date;
  alert_type: 'full' | 'warning' | 'system';
}

export class DatabaseService {
  private sql: any;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required');
    }
    this.sql = neon(databaseUrl);
  }

  async initialize() {
    // Create tables if they don't exist
    await this.createTables();
  }

  private async createTables() {
    // Users table
    await this.sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        telegram_id VARCHAR(50) UNIQUE NOT NULL,
        username VARCHAR(100),
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Sensor readings table
    await this.sql`
      CREATE TABLE IF NOT EXISTS sensor_readings (
        id SERIAL PRIMARY KEY,
        height DECIMAL(10, 2) NOT NULL,
        volume_percentage DECIMAL(5, 2) NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Alerts table
    await this.sql`
      CREATE TABLE IF NOT EXISTS alerts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        message TEXT NOT NULL,
        alert_type VARCHAR(20) DEFAULT 'system',
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create indexes for better performance
    await this.sql`
      CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id)
    `;
    
    await this.sql`
      CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp ON sensor_readings(timestamp DESC)
    `;
    
    await this.sql`
      CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id)
    `;
  }

  // User management
  async createUser(telegramId: string, username?: string, firstName?: string, lastName?: string): Promise<User> {
    const result = await this.sql`
      INSERT INTO users (telegram_id, username, first_name, last_name)
      VALUES (${telegramId}, ${username || null}, ${firstName || null}, ${lastName || null})
      ON CONFLICT (telegram_id) 
      DO UPDATE SET 
        username = EXCLUDED.username,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    return result[0];
  }

  async getUser(telegramId: string): Promise<User | null> {
    const result = await this.sql`
      SELECT * FROM users WHERE telegram_id = ${telegramId}
    `;
    return result[0] || null;
  }

  async getAllActiveUsers(): Promise<User[]> {
    const result = await this.sql`
      SELECT * FROM users WHERE is_active = true
    `;
    return result;
  }

  async updateUserStatus(telegramId: string, isActive: boolean): Promise<void> {
    await this.sql`
      UPDATE users 
      SET is_active = ${isActive}, updated_at = CURRENT_TIMESTAMP
      WHERE telegram_id = ${telegramId}
    `;
  }

  // Sensor data management
  async addSensorReading(height: number, timestamp: Date = new Date()): Promise<SensorReading> {
    const maxHeight = parseFloat(process.env.TRASH_CAPACITY_HEIGHT || '100');
    const volumePercentage = Math.min(100, (height / maxHeight) * 100);

    const result = await this.sql`
      INSERT INTO sensor_readings (height, volume_percentage, timestamp)
      VALUES (${height}, ${volumePercentage}, ${timestamp})
      RETURNING *
    `;
    return result[0];
  }

  async getLatestSensorReading(): Promise<SensorReading | null> {
    const result = await this.sql`
      SELECT * FROM sensor_readings 
      ORDER BY timestamp DESC 
      LIMIT 1
    `;
    return result[0] || null;
  }

  async getSensorReadings(limit: number = 24): Promise<SensorReading[]> {
    const result = await this.sql`
      SELECT * FROM sensor_readings 
      ORDER BY timestamp DESC 
      LIMIT ${limit}
    `;
    return result;
  }

  async getSensorReadingsSince(since: Date): Promise<SensorReading[]> {
    const result = await this.sql`
      SELECT * FROM sensor_readings 
      WHERE timestamp >= ${since}
      ORDER BY timestamp DESC
    `;
    return result;
  }

  // Alert management
  async addAlert(userId: number, message: string, alertType: 'full' | 'warning' | 'system' = 'system'): Promise<Alert> {
    const result = await this.sql`
      INSERT INTO alerts (user_id, message, alert_type)
      VALUES (${userId}, ${message}, ${alertType})
      RETURNING *
    `;
    return result[0];
  }

  async getRecentAlerts(userId: number, limit: number = 10): Promise<Alert[]> {
    const result = await this.sql`
      SELECT * FROM alerts 
      WHERE user_id = ${userId}
      ORDER BY sent_at DESC 
      LIMIT ${limit}
    `;
    return result;
  }

  // Statistics
  async getTrashStats() {
    const latest = await this.getLatestSensorReading();
    const last24h = await this.getSensorReadingsSince(new Date(Date.now() - 24 * 60 * 60 * 1000));
    
    const averageHeight24h = last24h.length > 0 
      ? last24h.reduce((sum, reading) => sum + parseFloat(reading.height.toString()), 0) / last24h.length
      : 0;

    const maxHeight24h = last24h.length > 0 
      ? Math.max(...last24h.map(reading => parseFloat(reading.height.toString())))
      : 0;

    return {
      current: latest,
      averageHeight24h: Math.round(averageHeight24h * 100) / 100,
      maxHeight24h: Math.round(maxHeight24h * 100) / 100,
      readingsCount24h: last24h.length
    };
  }
}
