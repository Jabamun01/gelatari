import { Schema, model, Document } from 'mongoose';

/**
 * Represents an ice cream flavor for tracking mix, frozen product,
 * containers, locations, and essential status.
 */
export interface IIceCreamFlavor extends Document {
  name: string;

  // --- Mix tracking (kg) ---
  iceCreamMixKg: number;

  // --- Overrun tracking: cumulative values for historical average ---
  totalMixConvertedKg: number;   // total kg of mix ever converted to frozen
  totalFrozenProducedL: number;  // total L of frozen ever produced from mix

  // --- Large containers (averaged size ~5L each) ---
  largeWarehouseContainers: number;
  largeWarehouseLiters: number;
  largeParadetaContainers: number;
  largeParadetaLiters: number;

  // --- Small containers (exactly 1L each) ---
  smallWarehouseCount: number;
  smallParadetaCount: number;

  // --- Essential flags (separate for large / small) ---
  essentialLarge: boolean;
  essentialSmall: boolean;

  // --- Computed virtuals ---
  totalLargeContainers: number;
  totalLargeLiters: number;
  totalSmallCount: number;
  totalFrozenLiters: number;
  averageLargeContainerLiters: number;
  overrunPercent: number;
}

const iceCreamFlavorSchema = new Schema<IIceCreamFlavor>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    iceCreamMixKg: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalMixConvertedKg: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalFrozenProducedL: {
      type: Number,
      default: 0,
      min: 0,
    },
    largeWarehouseContainers: {
      type: Number,
      default: 0,
      min: 0,
    },
    largeWarehouseLiters: {
      type: Number,
      default: 0,
      min: 0,
    },
    largeParadetaContainers: {
      type: Number,
      default: 0,
      min: 0,
    },
    largeParadetaLiters: {
      type: Number,
      default: 0,
      min: 0,
    },
    smallWarehouseCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    smallParadetaCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    essentialLarge: {
      type: Boolean,
      default: false,
    },
    essentialSmall: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Virtual for computed fields
iceCreamFlavorSchema.virtual('totalLargeContainers').get(function () {
  return this.largeWarehouseContainers + this.largeParadetaContainers;
});

iceCreamFlavorSchema.virtual('totalLargeLiters').get(function () {
  return this.largeWarehouseLiters + this.largeParadetaLiters;
});

iceCreamFlavorSchema.virtual('totalSmallCount').get(function () {
  return this.smallWarehouseCount + this.smallParadetaCount;
});

iceCreamFlavorSchema.virtual('totalFrozenLiters').get(function () {
  return this.totalLargeLiters + this.totalSmallCount;
});

iceCreamFlavorSchema.virtual('averageLargeContainerLiters').get(function () {
  const total = this.totalLargeContainers;
  return total > 0 ? this.totalLargeLiters / total : 0;
});

iceCreamFlavorSchema.virtual('overrunPercent').get(function () {
  if (this.totalMixConvertedKg <= 0) return 0;
  return ((this.totalFrozenProducedL / this.totalMixConvertedKg) - 1) * 100;
});

// Ensure virtuals are included in JSON and Object output
iceCreamFlavorSchema.set('toJSON', { virtuals: true });
iceCreamFlavorSchema.set('toObject', { virtuals: true });

const IceCreamFlavor = model<IIceCreamFlavor>('IceCreamFlavor', iceCreamFlavorSchema);

export default IceCreamFlavor;
