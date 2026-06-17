import { Schema, model, Document } from 'mongoose';

export interface IDailyParadetaIncome extends Document {
  date: Date;            // the work day (date-only, unique)
  cardAmount: number;    // total card revenue (€)
  endCash: number;       // cash counted at day end (€)
  cashRetired: number;   // cash removed from register during the day (€)
  notes?: string;        // optional free-text notes
  startCashOverride?: number; // persisted start cash (for first day of season)
}

const dailyParadetaIncomeSchema = new Schema<IDailyParadetaIncome>(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
      index: true,
    },
    cardAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    endCash: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    cashRetired: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    notes: {
      type: String,
      default: undefined,
      trim: true,
    },
    startCashOverride: {
      type: Number,
      default: undefined,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

const DailyParadetaIncome = model<IDailyParadetaIncome>(
  'DailyParadetaIncome',
  dailyParadetaIncomeSchema,
);

export default DailyParadetaIncome;
