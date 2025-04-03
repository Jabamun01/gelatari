# Backend Step 17: Define Default Steps Model/Schema (Optional)

## Task Description
Define a structure for storing default recipe steps, categorized by recipe type ('ice cream' or 'sorbet'). This could be a simple Mongoose schema/model or potentially managed via a configuration file if updates are infrequent. Choose the Mongoose model approach for consistency.

## Files to Read
*   None (Creating a new file).

## Constraints Reminder
*   Use only arrow functions (=>). No `function`, `class`, or `this`.
*   Write all code exclusively within the provided tool.
*   Adhere to the "No Shared Code" policy between frontend and backend.

## Deliverables
*   Creation of the `src/models/DefaultSteps.ts` file.
*   Content of `src/models/DefaultSteps.ts` should include:
    *   Importing `Schema`, `model`, `Document` from `mongoose`.
    *   Defining a TypeScript interface `IDefaultSteps` extending `Document`:
        *   `category`: `'ice cream' | 'sorbet'`
        *   `steps`: `string[]`
    *   Defining the Mongoose `Schema` instance (`defaultStepsSchema`):
        *   `category`: `{ type: String, enum: ['ice cream', 'sorbet'], required: true, unique: true }` // Unique category
        *   `steps`: `[{ type: String, required: true }]`
    *   Creating and exporting the Mongoose model using `model<IDefaultSteps>('DefaultSteps', defaultStepsSchema)`.

## Manual Testing Note
After implementing, verify the file `src/models/DefaultSteps.ts` exists and contains the schema, interface, and model export. Run `pnpm tsc` to check for compilation errors. Data for this model will likely be seeded manually into the database or via a separate script/endpoint later.