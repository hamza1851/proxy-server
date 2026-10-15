import mongoose, { Schema, Document } from 'mongoose';
import { Device } from '../../types/index.js';

export interface IDeviceDocument extends Document, Omit<Device, 'id'> {
  id: string;
}

const CustomSplashSchema = new Schema({
  enabled: { type: Boolean, default: true },
  title: { type: String, default: 'ACCESS RESTRICTED BY CYBER OPERATOR' },
  badge: { type: String, default: '⛔' },
  message: { type: String, default: 'This domain violates proxy policy. Return to authorized terminals.' },
  imageUrl: { type: String, default: '' }
}, { _id: false });

const CurfewSchema = new Schema({
  enabled: { type: Boolean, default: false },
  startHour: { type: Number, default: 23 },
  endHour: { type: Number, default: 6 },
  active: { type: Boolean, default: false },
  manualFreezeUntil: { type: String, default: null }
}, { _id: false });

const DeviceSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  ip: { type: String, required: true },
  mac: { type: String, default: '' },
  os: { type: String, default: 'device' },
  status: { type: String, enum: ['online', 'offline', 'active'], default: 'online' },
  bypassed: { type: Boolean, default: false },
  blockedServices: { type: [String], default: [] },
  customRules: { type: [String], default: [] },
  customSplash: { type: CustomSplashSchema, default: () => ({}) },
  curfew: { type: CurfewSchema, default: () => ({}) }
}, {
  timestamps: true,
  toJSON: {
    transform: (_doc, ret: Record<string, any>) => {
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

export const DeviceModel = mongoose.models.Device || mongoose.model<IDeviceDocument>('Device', DeviceSchema);
