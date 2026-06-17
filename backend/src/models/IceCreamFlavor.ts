import { Schema, model, Document, Types } from 'mongoose';

// --- Mix-in subdocument ---
export interface IMixIn {
  ingredient: Types.ObjectId;  // reference to an Ingredient
  amountPerKg: number;          // grams of mix-in per kg of mix used at churn
}

/**
 * Represents an ice cream flavor variant.
 * Each flavor belongs to a recipe (via sourceRecipeId) and
 * is a distinct SKU with its own mix-ins (inclusions folded in at churn time),
 * container inventory, and essential-stock alert settings.
 *
 * Multiple flavors can share the same recipe — they share the recipe's mix pool
 * but differ in their mix-in inclusions (e.g. "Xocolata" vs "Xocolata + ametlles").
 */
export interface IIceCreamFlavor extends Document {
  name: string;
  sourceRecipeId?: Types.ObjectId; // reference to the Recipe (many:1 — multiple flavors per recipe)

  // --- Mix-ins (inclusions added at churn time, e.g. chocolate chips, nuts) ---
  mixIns: IMixIn[];

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

  // --- Sale price ---
  salePriceSmall?: number; // manual sell price for a 1L container

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
    sourceRecipeId: {
      type: Schema.Types.ObjectId,
      ref: 'Recipe',
      default: undefined,
      sparse: true, // allow multiple nulls and many:1
    },
    mixIns: {
      type: [
        {
          ingredient: {
            type: Schema.Types.ObjectId,
            ref: 'Ingredient',
            required: true,
          },
          amountPerKg: {
            type: Number,
            required: true,
            min: 0,
          },
          _id: false,
        },
      ],
      default: [],
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
    salePriceSmall: {
      type: Number,
      default: undefined,
      min: 0,
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

// Ensure virtuals are included in JSON and Object output
iceCreamFlavorSchema.set('toJSON', { virtuals: true });
iceCreamFlavorSchema.set('toObject', { virtuals: true });

const IceCreamFlavor = model<IIceCreamFlavor>('IceCreamFlavor', iceCreamFlavorSchema);

export default IceCreamFlavor;
