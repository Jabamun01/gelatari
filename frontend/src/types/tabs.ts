// Common properties for all tabs
interface BaseTabConfig {
  id: string; // Unique identifier for the tab instance (e.g., generated UUID or 'search' for the static one)
  title: string; // Text displayed on the tab
  isCloseable: boolean;
}

// Specific tab data interfaces
export interface SearchTabData extends BaseTabConfig {
  type: 'search';
}

export interface IngredientsTabData extends BaseTabConfig {
  type: 'ingredients';
}

export interface RecipeTabData extends BaseTabConfig {
  type: 'recipe';
  recipeId: string; // recipeId is mandatory for a 'recipe' tab
  initialScaleFactor?: number;
  scaleFactor?: number;
  isProductionMode?: boolean;
  trackedAmounts?: Record<string, number>; // Ingredient ID -> added amount (grams)
}

export interface RecipeEditorTabData extends BaseTabConfig {
  type: 'recipeEditor';
  recipeId?: string; // Optional for new recipes, mandatory for editing existing
}

// New tab type for editing ingredients
export interface IngredientEditTabData extends BaseTabConfig {
  type: 'ingredientEdit';
  ingredientId?: string; // Optional for new ingredients
  ingredientName?: string; // For display in tab title or pre-filling form, optional for new
}

// New tab type for managing default recipe steps
export interface DefaultStepsTabData extends BaseTabConfig {
  type: 'defaultSteps';
}

// Union type for all possible tab data structures
export type TabData =
  | SearchTabData
  | IngredientsTabData
  | RecipeTabData
  | RecipeEditorTabData
  | IngredientEditTabData
  | DefaultStepsTabData; // Added DefaultStepsTabData

// Update TabType to be derived from TabData. This will now include 'ingredientEdit' and 'defaultSteps'.
export type TabType = TabData['type'];