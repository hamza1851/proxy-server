import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config/index.js';
import { UserModel } from './models/User.js';
import { DeviceModel } from './models/Device.js';
import { GlobalRuleModel } from './models/GlobalRule.js';
import { DeviceService } from '../services/deviceService.js';
import { ConfigService } from '../services/configService.js';
import { CleanupService } from '../services/cleanupService.js';

let isConnected = false;

export const isDbConnected = (): boolean => isConnected;

export async function connectDatabase(): Promise<boolean> {
  if (!config.mongoUri) {
    console.log('[Database] MONGODB_URI not set. Running with local storage fallback.');
    return false;
  }

  try {
    console.log('[Database] Connecting to MongoDB...');
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log('[Database] MongoDB connection established successfully.');

    // Seed default admin user if empty
    await seedAdminUser();

    // Seed initial devices if empty
    await seedDevices();

    // Seed initial configs if empty
    await ConfigService.seedDefaults();

    // Seed initial global rules if empty
    await seedGlobalRules();

    // Seed initial query telemetry records if empty
    await CleanupService.ensureSeedData();

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      console.warn('[Database] MongoDB disconnected. Falling back to memory/local storage.');
    });

    mongoose.connection.on('reconnected', () => {
      isConnected = true;
      console.log('[Database] MongoDB reconnected.');
    });

    return true;
  } catch (err) {
    console.warn('[Database] Failed to connect to MongoDB. Using local storage fallback:', err);
    isConnected = false;
    return false;
  }
}

async function seedAdminUser(): Promise<void> {
  try {
    const adminExists = await UserModel.findOne({ username: config.adminUser });
    if (!adminExists) {
      const passwordHash = await bcrypt.hash(config.adminPassword, 10);
      await UserModel.create({
        username: config.adminUser,
        passwordHash,
        role: 'operator'
      });
      console.log(`[Database] Seeded initial operator: "${config.adminUser}"`);
    }
  } catch (err) {
    console.error('[Database] Failed to seed admin user:', err);
  }
}

async function seedDevices(): Promise<void> {
  try {
    const count = await DeviceModel.countDocuments();
    if (count === 0) {
      const localDevices = DeviceService.getAllFromLocal();
      if (localDevices.length > 0) {
        await DeviceModel.insertMany(localDevices);
        console.log(`[Database] Seeded ${localDevices.length} devices from local storage.`);
      }
    }
  } catch (err) {
    console.error('[Database] Failed to seed devices:', err);
  }
}

async function seedGlobalRules(): Promise<void> {
  try {
    const count = await GlobalRuleModel.countDocuments();
    if (count === 0) {
      const initialRules = [
        { domain: 'tiktok.com', name: 'TikTok', category: 'Distraction', enabled: true },
        { domain: 'instagram.com', name: 'Instagram', category: 'Social Feed', enabled: true },
        { domain: 'doubleclick.net', name: 'Telemetry & Ads', category: 'Privacy Shields', enabled: true }
      ];
      await GlobalRuleModel.insertMany(initialRules);
      console.log(`[Database] Seeded ${initialRules.length} default universal rules.`);
    }
  } catch (err) {
    console.error('[Database] Failed to seed global rules:', err);
  }
}
