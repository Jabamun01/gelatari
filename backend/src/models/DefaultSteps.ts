import { Schema, model, Document } from 'mongoose';

// Interface representing the DefaultSteps document structure
export interface IDefaultSteps extends Document {
  category: 'ice cream' | 'sorbet';
  steps: string[];
}

// Mongoose schema definition for DefaultSteps
const defaultStepsSchema = new Schema<IDefaultSteps>({
  category: {
    type: String,
    enum: ['ice cream', 'sorbet'],
    required: true,
    unique: true, // Ensure category is unique
  },
  steps: [
    {
      type: String,
      required: true,
      trim: true, // Trim whitespace from steps
    },
  ],
});

// Create and export the Mongoose model
const DefaultSteps = model<IDefaultSteps>('DefaultSteps', defaultStepsSchema);

export default DefaultSteps;