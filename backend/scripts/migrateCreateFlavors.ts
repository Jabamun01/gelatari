/**
 * One-time migration: create IceCreamFlavor documents for all existing ice cream recipes
 * that don't have one yet, and backfill the flavorId / sourceRecipeId references.
 *
 * Usage:
 *   npx ts-node scripts/migrateCreateFlavors.ts
 *
 * Or after building:
 *   node dist/scripts/migrateCreateFlavors.js
 *
 * Run this once after deploying the code changes.
 */

import mongoose from 'mongoose';
import Recipe from '../src/models/Recipe';
import IceCreamFlavor from '../src/models/IceCreamFlavor';

// Load environment or use defaults — adjust connection string as needed.
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gelatari';

async function migrate() {
  console.log(`Connecting to ${MONGODB_URI} ...`);
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

  // Find ice cream recipes that don't have a flavorId yet
  const recipes = await Recipe.find({
    type: 'ice cream recipe',
    flavorId: { $exists: false },
  }).lean();

  console.log(`Found ${recipes.length} ice cream recipe(s) without a linked flavor.`);

  let created = 0;
  let skipped = 0;

  for (const recipe of recipes) {
    // Sanity check — recipe should have an _id
    if (!recipe._id) {
      console.warn(`  ⚠ Recipe "${recipe.name}" has no _id, skipping.`);
      skipped++;
      continue;
    }

    // Check if a flavor already exists for this recipe (by sourceRecipeId)
    const existingFlavor = await IceCreamFlavor.findOne({
      sourceRecipeId: recipe._id,
    });
    if (existingFlavor) {
      console.log(`  → Flavor already exists for "${recipe.name}" (${existingFlavor._id}), just backfilling flavorId.`);
      await Recipe.findByIdAndUpdate(recipe._id, {
        $set: { flavorId: existingFlavor._id },
      });
      created++;
      continue;
    }

    // Check if a flavor with the same name already exists (legacy data)
    const flavorByName = await IceCreamFlavor.findOne({
      name: { $regex: `^${recipe.name}$`, $options: 'i' },
    });

    let flavor;
    if (flavorByName) {
      // Reuse existing flavor and set its sourceRecipeId
      flavorByName.sourceRecipeId = recipe._id as mongoose.Types.ObjectId;
      flavor = await flavorByName.save();
      console.log(`  → Reused existing flavor "${recipe.name}" and set sourceRecipeId.`);
    } else {
      // Create new flavor
      flavor = await IceCreamFlavor.create({
        name: recipe.name,
        sourceRecipeId: recipe._id,
        iceCreamMixKg: 0,
      });
      console.log(`  ✓ Created flavor "${recipe.name}" (${flavor._id}).`);
    }

    // Backfill the recipe's flavorId
    await Recipe.findByIdAndUpdate(recipe._id, {
      $set: { flavorId: flavor._id },
    });

    created++;
  }

  console.log(`\nDone. Created/backfilled ${created} flavor(s). Skipped ${skipped}.`);
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
