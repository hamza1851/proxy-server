import mongoose, { Schema, Document } from 'mongoose';
import { QueryLogEntry } from '../../types/index.js';

export interface IQueryLogDocument extends Document, Omit<QueryLogEntry, 'id'> {
  id: string;
}

const QueryLogSchema = new Schema({
  id: { type: String, required: true, index: true },
  time: { type: String, required: true, index: true },
  clientIp: { type: String, required: true, index: true },
  clientName: { type: String, default: 'Client Device' },
  question: { type: String, required: true, index: true },
  status: { type: String, enum: ['allowed', 'blocked', 'bypassed'], default: 'allowed' },
  reason: { type: String, default: 'Upstream Resolver' },
  elapsedMs: { type: Number, default: 0.01 }
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

export const QueryLogModel = mongoose.models.QueryLog || mongoose.model<IQueryLogDocument>('QueryLog', QueryLogSchema);
