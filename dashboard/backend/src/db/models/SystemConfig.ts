import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemConfig extends Document {
  key: string;
  value: string;
  category: 'Network' | 'WireGuard' | 'DNS' | 'Security' | 'System' | 'General';
  description: string;
  isSecret: boolean;
  isSystem: boolean;
  updatedAt: Date;
}

const SystemConfigSchema = new Schema<ISystemConfig>({
  key: { type: String, required: true, unique: true, index: true, uppercase: true, trim: true },
  value: { type: String, required: true, default: '' },
  category: {
    type: String,
    enum: ['Network', 'WireGuard', 'DNS', 'Security', 'System', 'General'],
    default: 'General'
  },
  description: { type: String, required: true, default: '' },
  isSecret: { type: Boolean, default: false },
  isSystem: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now }
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

export const SystemConfigModel = mongoose.models.SystemConfig || mongoose.model<ISystemConfig>('SystemConfig', SystemConfigSchema);
