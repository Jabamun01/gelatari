// Defines the structure for populated ingredient data within a recipe
export interface RecipeIngredient {
  ingredient: {
    _id: string;
    name: string;
  };
  amountGrams: number;
}

// Defines the structure for populated linked recipe data
export interface LinkedRecipeInfo { // Add export keyword
   recipe: {
     _id: string;
     name: string;
   };
   amountGrams: number;
}

// Defines the detailed structure of a recipe fetched by ID
export interface RecipeDetails {
  _id: string;
  name: string;
  type: 'ice cream recipe' | 'not ice cream recipe';
  category?: 'ice cream' | 'sorbet'; // Optional category
  ingredients: RecipeIngredient[];
  steps: string[];
  baseYieldGrams: number;
  linkedRecipes: LinkedRecipeInfo[];
  // Add other fields here if the backend API provides more details
}

// Structure matching backend API expectations for POST /api/recipes
export interface CreateRecipeDto {
    name: string;
    type: 'ice cream recipe' | 'not ice cream recipe';
    category?: 'ice cream' | 'sorbet';
    ingredients: { ingredient: string; amountGrams: number }[]; // ingredient is ID string
    steps: string[];
    baseYieldGrams: number;
    linkedRecipes: { recipe: string; amountGrams: number }[]; // recipe is ID string
}
// Structure matching backend API expectations for PUT /api/recipes/:id
export type UpdateRecipeDto = Partial<CreateRecipeDto>; // Allow partial updates