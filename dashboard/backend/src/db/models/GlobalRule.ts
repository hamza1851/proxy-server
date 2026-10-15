import mongoose, { Schema, Document } from 'mongoose';

export interface IGlobalRule extends Document {
  domain: string;
  name?: string;
  category: string;
  enabled: boolean;
  createdAt: Date;
}

const GlobalRuleSchema = new Schema<IGlobalRule>({
  domain: { type: String, required: true, unique: true, index: true },
  name: { type: String },
  category: { type: String, default: 'Custom Domain' },
  enabled: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export const GlobalRuleModel = mongoose.models.GlobalRule || mongoose.model<IGlobalRule>('GlobalRule', GlobalRuleSchema);
