export type TabType = 'search' | 'recipe' | 'ingredients' | 'recipeEditor';

export interface Tab {
  id: string; // Unique identifier for the tab instance (e.g., generated UUID or 'search' for the static one)
  title: string; // Text displayed on the tab
  type: TabType;
  recipeId?: string; // Present if type is 'recipe' or 'recipeEditor' (for editing existing)
  isCloseable: boolean;
  initialScaleFactor?: number; // Optional initial scale for the recipe tab
  // State for production mode, specific to recipe tabs
  isProductionMode?: boolean;
  trackedAmounts?: Record<string, number>; // Ingredient ID -> added amount (grams)
  // State for production mode timer, specific to recipe tabs
  timerElapsedTime?: number; // in seconds
  timerIsRunning?: boolean;
}