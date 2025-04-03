# Frontend Broad Development Plan: Ice Cream Recipe Workshop App

This document outlines the major phases for developing the frontend of the Ice Cream Recipe Workshop application using React, TypeScript, Linaria, and @tanstack/react-query. Each phase will be broken down into granular, self-contained steps suitable for stateless AI coding agents.

## Phase 1: Project Setup & Core Layout
*   **Goal:** Initialize the React project, set up dependencies, basic styling, and the main application layout including the tab structure.
*   **Steps:**
    *   Initialize React project using Vite (or similar) with TypeScript template via PNPM.
    *   Install core dependencies: React, ReactDOM, Linaria, @tanstack/react-query, react-router-dom (if needed for future routing, though tabs are primary).
    *   Set up Linaria for CSS-in-JS styling.
    *   Define basic CSS variables for colors, fonts, spacing in a global style file.
    *   Create the main `App.tsx` component.
    *   Implement the core layout: a container for the tab bar and a container for the active tab's content.
    *   Implement the basic `TabManager` component (or context/hook) responsible for holding the state of open tabs (list of {id, title, type: 'search' | 'recipe', recipeId?: string}).
    *   Implement the `TabBar` component displaying closable tabs based on the `TabManager` state. Clicking a tab activates it.
    *   Implement the `TabContent` area that renders the component corresponding to the *active* tab.

## Phase 2: Search Tab & Functionality
*   **Goal:** Implement the initial search tab, including the live search input and display of results.
*   **Steps:**
    *   Create the `SearchTab` component. This is the default, non-closable tab.
    *   Add a large, prominent search input field.
    *   Add a toggle/checkbox to switch between searching "ice cream recipes" only and "all recipes".
    *   Use `@tanstack/react-query` to fetch search results from the backend API as the user types (debounced).
    *   Display search results (recipe names) in a list below the search bar.
    *   Clicking a search result should trigger the `TabManager` to open a new 'recipe' tab for that specific recipe ID, making it the active tab.

## Phase 3: Recipe Tab - Display & Scaling
*   **Goal:** Implement the component for displaying a single recipe's details, including ingredients, steps, and scaling.
*   **Steps:**
    *   Create the `RecipeTab` component, which takes a `recipeId` prop.
    *   Use `@tanstack/react-query` to fetch the full recipe details based on the `recipeId`.
    *   Display recipe name, type, and category (if applicable).
    *   Implement the `IngredientList` component:
        *   Takes ingredients array and current scale factor as props.
        *   Displays each ingredient name, scaled amount (X.Ykg or Zg format), and highlights allergens visually.
    *   Implement the `StepList` component:
        *   Takes steps array as props.
        *   Displays steps sequentially.
    *   Implement the `ScalingControl` component:
        *   Slider with 30kg/10kg/5kg snaps and a manual input field.
        *   Updates a local state variable representing the current scale factor (default: 1).
        *   Pass the scale factor down to `IngredientList`.
    *   Handle loading and error states for the recipe fetch query.
    *   Clicking on a linked recipe within the steps/description should open that linked recipe in a new, active tab, scaled appropriately based on the `amountGrams` specified in the parent recipe's `linkedRecipes` data.

## Phase 4: Production Mode
*   **Goal:** Implement the production mode features within the `RecipeTab`.
*   **Steps:**
    *   Add a "Production Mode" toggle button to the `RecipeTab`.
    *   When Production Mode is active:
        *   Modify the `IngredientList` component (or create a `ProductionIngredientList` variant):
            *   Display scaled target amount (e.g., " / 1.2kg").
            *   Add an input or button mechanism next to each ingredient to track the amount added (e.g., display "500g added").
            *   Store this "added amount" state locally within the `RecipeTab` (or a dedicated context/reducer scoped to the tab instance). This state is *not* persisted to the backend and resets when the tab is closed.
        *   Implement a `Timer` component:
            *   Simple start/stop/reset stopwatch functionality.
            *   Display elapsed time.
            *   Timer state is also local to the `RecipeTab` instance and resets on tab close.
    *   Ensure the Production Mode state and its associated ingredient tracking/timer state are managed per-tab instance.

## Phase 5: Ingredient Management UI (Optional/Stretch)
*   **Goal:** Create a separate section or tab for managing the global list of ingredients.
*   **Steps:**
    *   Create an `IngredientManagement` component/tab.
    *   Use `@tanstack/react-query` to fetch the list of all ingredients.
    *   Display ingredients with their allergen status.
    *   Implement forms/buttons to add new ingredients (name, allergen toggle).
    *   Implement functionality to edit existing ingredients (e.g., toggle allergen status).
    *   Implement functionality to delete ingredients (consider implications if used in recipes).
    *   Use mutations from `@tanstack/react-query` to interact with the backend ingredient endpoints.

## Phase 6: Default Steps Integration (Recipe Editor - If Added)
*   **Goal:** If a recipe editor is implemented, integrate fetching and inserting default steps.
*   **Steps:** (Assuming an editor component exists)
    *   Add buttons like "Add Ice Cream Defaults" and "Add Sorbet Defaults" to the editor.
    *   On button click, fetch the relevant default steps from the backend API based on the recipe's category.
    *   Append the fetched steps to the recipe's current step list in the editor state.

## Phase 7: Styling Refinement & Finalization
*   **Goal:** Polish the UI/UX, ensure responsiveness, and perform final testing.
*   **Steps:**
    *   Review all components for consistent styling using Linaria and CSS variables.
    *   Ensure the layout is responsive and works well on tablet screen sizes.
    *   Verify touch target sizes and usability.
    *   Test all interactions: searching, opening/closing tabs, switching tabs, scaling, production mode, timer, ingredient management (if implemented).
    *   Refine error handling display for API requests.
    *   Ensure pleasant look-and-feel while prioritizing clarity.