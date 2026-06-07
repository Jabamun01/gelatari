import { Schema, model, Document, Types } from 'mongoose';

/**
 * Represents a point-in-time event in the ice-cream lifecycle.
 * Each event records what happened and a full state snapshot after the event,
 * enabling historical analysis, trend computation, and audit trails.
 */
export interface IIceCreamEvent extends Document {
  flavorId: Types.ObjectId;
  flavorName: string; // denormalised for query convenience
  type: 'production' | 'conversion' | 'sale' | 'movement';
  timestamp: Date;

  // --- Event-specific payload ---

  /** Production (recipe finalised → mix added) */
  recipeId?: Types.ObjectId;
  recipeName?: string;       // denormalised
  mixKgAdded?: number;       // amount of mix added to stock

  /** Conversion (mix → frozen containers) */
  mixKgConverted?: number;
  frozenLitersProduced?: number;
  largeContainersAdded?: number;
  smallContainersAdded?: number;
  batchOverrunPercent?: number;

  /** Sale (one container deducted) */
  soldContainerType?: 'large' | 'small';
  soldLocation?: 'warehouse' | 'paradeta';

  /** Movement (containers relocated) */
  movedCount?: number;
  movedFrom?: 'warehouse' | 'paradeta';
  movedTo?: 'warehouse' | 'paradeta';
  movedContainerType?: 'large' | 'small';

  // --- Full state snapshot of the flavor AFTER the event (for point-in-time analysis) ---
  // Mix-level fields are on the Recipe, not on the Flavor — they are NOT in this snapshot.
  snapshot: {
    largeWarehouseContainers: number;
    largeWarehouseLiters: number;
    largeParadetaContainers: number;
    largeParadetaLiters: number;
    smallWarehouseCount: number;
    smallParadetaCount: number;
  };
}

const iceCreamEventSchema = new Schema<IIceCreamEvent>(
  {
    flavorId: {
      type: Schema.Types.ObjectId,
      ref: 'IceCreamFlavor',
      required: true,
      index: true,
    },
    flavorName: { type: String, required: true },
    type: {
      type: String,
      enum: ['production', 'conversion', 'sale', 'movement'],
      required: true,
      index: true,
    },
    timestamp: { type: Date, default: Date.now, index: true },

    // Production
    recipeId: { type: Schema.Types.ObjectId, ref: 'Recipe' },
    recipeName: String,
    mixKgAdded: Number,

    // Conversion
    mixKgConverted: Number,
    frozenLitersProduced: Number,
    largeContainersAdded: Number,
    smallContainersAdded: Number,
    batchOverrunPercent: Number,

    // Sale
    soldContainerType: { type: String, enum: ['large', 'small'] },
    soldLocation: { type: String, enum: ['warehouse', 'paradeta'] },

    // Movement
    movedCount: Number,
    movedFrom: { type: String, enum: ['warehouse', 'paradeta'] },
    movedTo: { type: String, enum: ['warehouse', 'paradeta'] },
    movedContainerType: { type: String, enum: ['large', 'small'] },

    // Snapshot
    snapshot: {
      type: new Schema(
        {
          largeWarehouseContainers: { type: Number, required: true },
          largeWarehouseLiters: { type: Number, required: true },
          largeParadetaContainers: { type: Number, required: true },
          largeParadetaLiters: { type: Number, required: true },
          smallWarehouseCount: { type: Number, required: true },
          smallParadetaCount: { type: Number, required: true },
        },
        { _id: false },
      ),
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for dashboard-style queries
iceCreamEventSchema.index({ flavorId: 1, timestamp: -1 });
iceCreamEventSchema.index({ type: 1, timestamp: -1 });

const IceCreamEvent = model<IIceCreamEvent>(
  'IceCreamEvent',
  iceCreamEventSchema,
);

export default IceCreamEvent;
