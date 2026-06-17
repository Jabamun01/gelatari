/**
 * One-time migration: set all ingredients with costPerKg === 0 to unset (undefined).
 *
 * After this migration, costPerKg is only present on ingredients where
 * a user explicitly entered a price. 0 means "not set", not "costs zero".
 *
 * Usage:
 *   npx ts-node scripts/migrateCostPerKg.ts
 *
 * Or after building:
 *   node dist/scripts/migrateCostPerKg.js
 */

import mongoose from 'mongoose';
import Ingredient from '../src/models/Ingredient';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gelatari';

async function migrate() {
  console.log(`Connecting to ${MONGODB_URI} ...`);
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

  const result = await Ingredient.updateMany(
    { costPerKg: 0 },
    { $unset: { costPerKg: '' } },
  );

  console.log(`Migrated ${result.modifiedCount} ingredient(s) — costPerKg: 0 → unset.`);

  // Also list the names for audit
  const affected = await Ingredient.find({ costPerKg: { $exists: false } }).select('name').lean();
  if (affected.length > 0) {
    console.log('Affected ingredients:');
    for (const ing of affected) {
      console.log(`  - ${ing.name}`);
    }
  }

  console.log('\nDone.');
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
