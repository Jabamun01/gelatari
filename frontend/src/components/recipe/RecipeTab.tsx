import { useState } from 'react'; // Remove useEffect, useRef
import { styled } from '@linaria/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchRecipeById, deleteRecipe } from '../../api/recipes';
import { RecipeDetails } from '../../types/recipe'; // Import from the correct types file
import { Tab } from '../../types/tabs'; // Import Tab type
import { IngredientList } from './IngredientList'; // Import the ingredient list component
import { StepList } from './StepList'; // Import the new step list component
import { ScalingControl } from './ScalingControl'; // Import the scaling control
import { Timer } from '../common/Timer'; // Import the Timer component

interface RecipeTabProps {
  recipeId: string;
  tabs: Tab[];
  handleOpenRecipeTab: (recipeId: string, recipeName: string, initialScaleFactor?: number) => void;
  // Add props for lifted state and handlers
  isProductionMode: boolean;
  trackedAmounts: Record<string, number>;
  onToggleProductionMode: () => void; // Handler now takes no args as tabId is known in parent
  onAmountTracked: (ingredientId: string, addedAmountGrams: number) => void; // Handler now takes no tabId
  // Add timer props (passed down from App -> TabContent)
  elapsedTime: number;
  isRunning: boolean;
  onTimerStart: () => void; // Handlers no longer need tabId here
  onTimerStop: () => void;
  onTimerReset: () => void;
  // Add prop for opening the editor
  onOpenEditor: (recipeId: string, recipeName: string) => void;
  onClose: () => void; // Prop to close the tab
}

const RecipeContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
  max-width: 900px; /* Limit width */
  margin: var(--space-lg) auto; /* Add vertical margin and center */
`;

const LoadingMessage = styled.div`
  font-style: italic;
  color: var(--text-color-light); /* Use lighter text */
  padding: var(--space-xl) 0; /* Add padding for visual spacing */
  text-align: center;
`;

const ErrorMessage = styled.div`
  color: var(--danger-color); /* Use danger color */
  font-weight: 500; /* Slightly less bold */
  padding: var(--space-lg);
  background-color: rgba(239, 68, 68, 0.1); /* Light red background */
  border: 1px solid var(--danger-color);
  border-radius: var(--border-radius);
  text-align: center;
`;

// Inherits h2 styles from global.ts
const RecipeHeader = styled.h2`
  margin-bottom: var(--space-sm);
  color: var(--text-color-strong);
  display: flex;
  align-items: baseline; /* Align text baseline */
  gap: var(--space-md);
  flex-wrap: wrap;
`;

const RecipeName = styled.span`
  flex-grow: 1; /* Allow name to take available space */
`;

const RecipeInfo = styled.div`
  font-size: var(--font-size-sm);
  color: var(--text-color-light);
  display: flex;
  justify-content: space-between; /* Keep space between */
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-md);
  padding-bottom: var(--space-lg); /* Increase padding */
  border-bottom: var(--border-width) solid var(--border-color-light); /* Use variable */
  margin-bottom: var(--space-lg); /* Add margin below separator */
`;

// --- Styled Components (Continued) ---
const ControlsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  margin-top: var(--space-xl); /* Increase top margin */
  padding-top: var(--space-xl); /* Increase top padding */
  border-top: var(--border-width) solid var(--border-color-light); /* Use variable */
`;

// Style as a toggle button, inheriting base button styles
// Style as a toggle button, using secondary color when active
const ProductionModeToggle = styled.button<{ isActive: boolean }>`
  /* Inherits base button styles */
  border: var(--border-width) solid ${props => (props.isActive ? 'var(--secondary-color)' : 'var(--border-color)')};
  background-color: ${props => (props.isActive ? 'var(--secondary-color)' : 'var(--surface-color)')}; /* Use surface color when inactive */
  color: ${props => (props.isActive ? 'var(--text-on-secondary)' : 'var(--secondary-color)')}; /* Use secondary color text when inactive */
  font-weight: 600;
  align-self: flex-start;
  min-width: 200px; /* Give it some width */
  text-align: center;

  &:hover:not(:disabled) {
    background-color: ${props => (props.isActive ? 'var(--secondary-color-dark)' : 'rgba(16, 185, 129, 0.1)')}; /* Light secondary on hover inactive */
    border-color: ${props => (props.isActive ? 'var(--secondary-color-dark)' : 'var(--secondary-color)')};
    color: ${props => (props.isActive ? 'var(--text-on-secondary)' : 'var(--secondary-color-dark)')};
  }
`;

// Style as a secondary/utility button
// Style as a secondary/utility button
const EditButton = styled.button`
  /* Inherits base button styles */
  padding: var(--space-xs) var(--space-sm);
  background-color: var(--surface-color); /* Use surface color */
  color: var(--text-color);
  border: var(--border-width) solid var(--border-color);
  font-size: var(--font-size-sm);
  font-weight: 500;
  box-shadow: none;

  &:hover:not(:disabled) {
    background-color: var(--background-color); /* Use background for hover */
    border-color: var(--border-color);
  }
`;

// Style as a danger button
// Style as a danger button
const DeleteButton = styled.button`
  /* Inherits base button styles */
  padding: var(--space-xs) var(--space-sm);
  background-color: transparent; /* Make background transparent */
  color: var(--danger-color); /* Use danger color for text */
  border-color: transparent; /* Make border transparent */
  font-size: var(--font-size-sm);
  font-weight: 500;
  box-shadow: none;

  &:hover:not(:disabled) {
    background-color: rgba(239, 68, 68, 0.1); /* Light red background on hover */
    color: var(--danger-color-dark); /* Darken text on hover */
    border-color: transparent;
  }
`;


// --- Component ---
export const RecipeTab = ({
  recipeId,
  tabs,
  handleOpenRecipeTab,
  isProductionMode, // Destructure new props
  trackedAmounts,
  onToggleProductionMode,
  onAmountTracked,
  // Destructure timer props
  elapsedTime,
  isRunning,
  onTimerStart,
  onTimerStop,
  onTimerReset,
  onOpenEditor, // Destructure the new prop
  onClose, // Destructure the close handler
}: RecipeTabProps) => {
  // Find the current tab to get the initial scale factor
  const currentTab = tabs.find(tab => tab.id === recipeId);
  const initialScale = currentTab?.initialScaleFactor ?? 1;
  const [scaleFactor, setScaleFactor] = useState(initialScale); // Initialize with tab's scale factor or default to 1
  // Removed local isProductionMode state
  // Removed local trackedAmounts state
  // REMOVED Timer State (useState, useRef) - Now managed in App.tsx

  // --- Fetch Recipe Data ---
  const {
    data: recipe,
    isLoading,
    isError,
    error,
  } = useQuery<RecipeDetails, Error>({
    queryKey: ['recipe', recipeId], // Unique key for this recipe query
    queryFn: () => fetchRecipeById(recipeId), // Function to fetch data
    // Optional: Add staleTime or cacheTime if needed
    // staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const queryClient = useQueryClient();

  // --- Delete Mutation ---
  const deleteRecipeMutation = useMutation({
    mutationFn: deleteRecipe, // API function to call
    onSuccess: () => {
      // Invalidate queries to refresh lists/search
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      // Remove specific recipe query data immediately
      queryClient.removeQueries({ queryKey: ['recipe', recipeId] });

      // Close the current tab AFTER successful deletion
      onClose();
      // Optional: Add success notification here
      console.log(`Recipe ${recipeId} deleted successfully.`);
    },
    onError: (error) => {
      console.error("Error deleting recipe:", error);
      alert(`Failed to delete recipe: ${error.message || 'Unknown error'}. See console for details.`); // Use better UI feedback later
    },
  });

  // --- Delete Handler ---
  const handleDeleteRecipe = () => {
    // Check if recipe data exists before attempting delete (useQuery data)
    if (!recipe) return;

    if (window.confirm(`Are you sure you want to delete the recipe "${recipe.name}"? This action cannot be undone.`)) {
      deleteRecipeMutation.mutate(recipeId); // recipeId is from props
    }
  };

  // REMOVED Timer Effect (useEffect for interval) - Now managed in App.tsx
  // REMOVED Timer Handlers (handleTimerStart, etc.) - Using props directly
  // REMOVED Effect to reset timer on production mode toggle - Now handled in App.tsx reducer logic

  // Removed local handleAmountTracked handler (using prop onAmountTracked directly)
  // Removed local toggleProductionMode handler (using prop onToggleProductionMode directly)

  if (isLoading) {
    return <RecipeContainer><LoadingMessage>Loading recipe details...</LoadingMessage></RecipeContainer>;
  }

  if (isError) {
    return (
      <RecipeContainer>
        <ErrorMessage>Error loading recipe: {error?.message || 'Unknown error'}</ErrorMessage>
      </RecipeContainer>
    );
  }

  // If data is successfully fetched
  if (recipe) {
    return (
      <RecipeContainer>
        <RecipeHeader>
          <RecipeName>{recipe.name}</RecipeName> {/* Wrap name in span */}
          {/* Edit Button */}
          <EditButton
            onClick={() => onOpenEditor(recipeId, recipe.name)}
            disabled={deleteRecipeMutation.isPending} // Disable if delete is pending
          >
            Edit
          </EditButton>
          {/* Delete Button */}
          <DeleteButton
            onClick={handleDeleteRecipe}
            disabled={!recipe || deleteRecipeMutation.isPending} // Disable if no data or delete pending
          >
            {deleteRecipeMutation.isPending ? 'Deleting...' : 'Delete Recipe'}
          </DeleteButton>
        </RecipeHeader>
        <RecipeInfo>
          <span> {/* Wrap text in span to allow flex alignment */}
            Type: {recipe.type}
            {recipe.category && ` | Category: ${recipe.category}`}
          </span>
        </RecipeInfo>

        {/* Placeholders for future components */}
        {/* Render IngredientList */}
        <IngredientList
          ingredients={recipe.ingredients}
          linkedRecipes={recipe.linkedRecipes} // Pass linked recipes here
          scaleFactor={scaleFactor}
          onOpenRecipeTab={handleOpenRecipeTab} // Pass handler here
          isProductionMode={isProductionMode} // Pass production mode status
          trackedAmounts={trackedAmounts} // Pass down prop
          onAmountTracked={onAmountTracked} // Pass down prop
        />
        {/* Render StepList */}
        <StepList steps={recipe.steps} /> {/* Remove props no longer needed */}
        {/* Wrapper for Controls */}
        <ControlsWrapper>
          <ScalingControl
            scaleFactor={scaleFactor}
            onScaleChange={setScaleFactor}
            baseYieldGrams={recipe.baseYieldGrams}
          />
          {/* Production Mode Toggle */}
          <ProductionModeToggle
            isActive={isProductionMode}
            onClick={onToggleProductionMode} // Use the handler passed via props
          >
            {isProductionMode ? 'Production Mode: ON' : 'Production Mode: OFF'}
          </ProductionModeToggle>
          {/* Conditionally render Timer */}
          {isProductionMode && (
            <Timer
              isRunning={isRunning} // Use prop directly
              elapsedTime={elapsedTime} // Use prop directly
              onStart={onTimerStart} // Use prop directly
              onStop={onTimerStop} // Use prop directly
              onReset={onTimerReset} // Use prop directly
            />
          )}
        </ControlsWrapper>
      </RecipeContainer>
    );
  }

  // Fallback case (should ideally not be reached if query handles states correctly)
  return <RecipeContainer>No recipe data available.</RecipeContainer>;
};