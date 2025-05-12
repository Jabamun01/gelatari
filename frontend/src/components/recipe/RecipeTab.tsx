import { styled } from '@linaria/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchRecipeById, deleteRecipe } from '../../api/recipes';
import { RecipeDetails } from '../../types/recipe'; // Import from the correct types file
import { Tab } from '../../types/tabs'; // Import Tab type
import { IngredientList } from './IngredientList'; // Import the ingredient list component
import { StepList } from './StepList'; // Import the new step list component
import { ScalingControl } from './ScalingControl'; // Import the scaling control

interface RecipeTabProps {
  recipeId: string;
  tabs: Tab[];
  handleOpenRecipeTab: (recipeId: string, recipeName: string, initialScaleFactor?: number) => void;
  // Add props for lifted state and handlers
  isProductionMode: boolean;
  trackedAmounts: Record<string, number>;
  onToggleProductionMode: () => void; // Handler now takes no args as tabId is known in parent
  onAmountTracked: (ingredientId: string, addedAmountGrams: number) => void; // Handler now takes no tabId
  // Add prop for opening the editor
  onOpenEditor: (recipeId: string, recipeName: string) => void;
  onClose: () => void; // Prop to close the tab
  // Add props for scale factor state and handler
  scaleFactor: number;
  onScaleChange: (newScaleFactor: number) => void;
}

const RecipeContainer = styled.div`
  /* --- Grid Layout (Tablet Landscape & Larger) --- */
  @media (min-width: 1024px) {
    display: grid;
    grid-template-columns: 1fr 1fr; /* Two equal columns */
    grid-template-rows: auto auto 1fr auto; /* Header, Info, Ingredients (expand), Scaling */
    grid-template-areas:
      "header header"
      "info   info"
      "ingredients steps"
      "scaling steps"; /* Scaling below ingredients, steps span */
    gap: var(--space-lg) var(--space-xl); /* Row gap, Column gap */
    padding: var(--space-lg);
    /* Attempt to make it take available height - might need adjustment based on parent */
    height: calc(100vh - 150px); /* Example: Adjust 150px based on actual header/tab heights */
    overflow: hidden; /* Prevent container itself from scrolling */
    max-width: none; /* Remove max-width for grid */
    margin: 0; /* Remove margin for grid */
  }

  /* --- Flex Layout (Mobile & Smaller Tablets) --- */
  @media (max-width: 1023px) {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg); /* Keep consistent gap */
    padding: var(--space-md); /* Slightly less padding on mobile */
    max-width: 900px; /* Restore max-width */
    margin: var(--space-lg) auto; /* Restore centering */
  }
`;

const LoadingMessage = styled.div`
  grid-column: 1 / -1; /* Span full width in grid if loading */
  font-style: italic;
  color: var(--text-color-light); /* Use lighter text */
  padding: var(--space-xl) 0; /* Add padding for visual spacing */
  text-align: center;
`;

const ErrorMessage = styled.div`
  grid-column: 1 / -1; /* Span full width in grid if error */
  color: var(--danger-color); /* Use danger color */
  font-weight: 500; /* Slightly less bold */
  padding: var(--space-lg);
  background-color: rgba(239, 68, 68, 0.1); /* Light red background */
  border: 1px solid var(--danger-color);
  border-radius: var(--border-radius);
  text-align: center;
`;

const RecipeHeader = styled.h2`
  grid-area: header; /* Assign grid area */
  margin-bottom: 0; /* Remove bottom margin, grid gap handles spacing */
  color: var(--text-color-strong);
  display: flex;
  align-items: center; /* Align items vertically */
  justify-content: space-between; /* Space out title and controls */
  gap: var(--space-md);
  flex-wrap: wrap; /* Allow wrapping on smaller screens within the header */
`;

const RecipeName = styled.span`
  flex-grow: 1; /* Allow name to take available space */
`;

const RecipeInfo = styled.div`
  grid-area: info; /* Assign grid area */
  font-size: var(--font-size-sm);
  color: var(--text-color-light);
  display: flex;
  justify-content: space-between; /* Keep space between */
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-md);
  padding-bottom: var(--space-md); /* Reduce padding */
  border-bottom: var(--border-width) solid var(--border-color-light); /* Use variable */
  margin-bottom: 0; /* Remove bottom margin, grid gap handles spacing */
`;

// Wrappers for list components to control grid placement and scrolling
const IngredientsWrapper = styled.div`
  grid-area: ingredients;
  overflow-y: auto; /* Enable vertical scrolling */
  min-height: 0; /* Allow shrinking in flex/grid context */
  border: var(--border-width) solid var(--border-color-light); /* Optional: Add border */
  border-radius: var(--border-radius);
  padding: var(--space-md);
  background-color: var(--surface-color-raised); /* Slightly different background */

  @media (max-width: 1023px) {
    overflow-y: visible; /* Disable scrolling on mobile */
    border: none;
    padding: 0;
    background-color: transparent;
  }
`;

const StepsWrapper = styled.div`
  grid-area: steps;
  overflow-y: auto; /* Enable vertical scrolling */
  min-height: 0; /* Allow shrinking in flex/grid context */
  border: var(--border-width) solid var(--border-color-light); /* Optional: Add border */
  border-radius: var(--border-radius);
  padding: var(--space-md);
  background-color: var(--surface-color-raised); /* Slightly different background */

  @media (max-width: 1023px) {
    overflow-y: visible; /* Disable scrolling on mobile */
    border: none;
    padding: 0;
    background-color: transparent;
  }
`;

// Wrapper for scaling control placement
const ScalingWrapper = styled.div`
  grid-area: scaling;
  /* Add margin-top if needed for spacing below ingredients */
  /* margin-top: var(--space-md); */
`;


// ControlsWrapper removed as controls are now in the header

// Style as a toggle button, using secondary color when active
// Slightly smaller padding than Edit/Delete, consistent font/border-radius
const ProductionModeToggle = styled.button<{ isActive: boolean }>`
  /* Base Styles */
  padding: var(--space-xs) var(--space-sm); /* Smaller padding */
  font-size: var(--font-size-sm);
  font-weight: 500; /* Consistent weight */
  border-radius: var(--border-radius);
  cursor: pointer;
  text-align: center;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;

  /* Conditional Styles */
  border: var(--border-width) solid ${props => (props.isActive ? 'var(--secondary-color)' : 'var(--border-color)')};
  background-color: ${props => (props.isActive ? 'var(--secondary-color)' : 'var(--surface-color)')};
  color: ${props => (props.isActive ? 'var(--text-on-secondary)' : 'var(--secondary-color)')};

  &:hover:not(:disabled) {
    background-color: ${props => (props.isActive ? 'var(--secondary-color-dark)' : 'var(--surface-color-hover)')}; /* Consistent hover background */
    border-color: ${props => (props.isActive ? 'var(--secondary-color-dark)' : 'var(--border-color-hover)')}; /* Consistent hover border */
    color: ${props => (props.isActive ? 'var(--text-on-secondary)' : 'var(--secondary-color-dark)')};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

// Style as a standard action button
// Larger padding, consistent font/border-radius
const EditButton = styled.button`
  /* Base Styles */
  padding: var(--space-sm) var(--space-md); /* Larger padding */
  font-size: var(--font-size-sm);
  font-weight: 500; /* Consistent weight */
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;

  /* Specific Styles */
  background-color: var(--surface-color);
  color: var(--text-color);
  border: var(--border-width) solid var(--border-color);

  &:hover:not(:disabled) {
    background-color: var(--surface-color-hover); /* Consistent hover background */
    border-color: var(--border-color-hover); /* Consistent hover border */
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

// Style as a danger action button
// Larger padding, consistent font/border-radius, danger colors
const DeleteButton = styled.button`
  /* Base Styles */
  padding: var(--space-sm) var(--space-md); /* Larger padding */
  font-size: var(--font-size-sm);
  font-weight: 500; /* Consistent weight */
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;

  /* Specific Styles */
  background-color: transparent;
  color: var(--danger-color);
  border: var(--border-width) solid transparent; /* Consistent border definition */

  &:hover:not(:disabled) {
    background-color: rgba(239, 68, 68, 0.1); /* Subtle danger background on hover */
    color: var(--danger-color-dark);
    border-color: transparent; /* Keep border transparent on hover */
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;


// --- Component ---
export const RecipeTab = ({
  recipeId,
  // tabs, // No longer needed here
  handleOpenRecipeTab,
  isProductionMode, // Destructure new props
  trackedAmounts,
  onToggleProductionMode,
  onAmountTracked,
  onOpenEditor, // Destructure the new prop
  onClose, // Destructure the close handler
  scaleFactor, // Destructure scale factor props
  onScaleChange,
}: RecipeTabProps) => {
  // Removed local scaleFactor state
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

    if (window.confirm(`Estàs segur que vols eliminar la recepta "${recipe.name}"? Aquesta acció no es pot desfer.`)) {
      deleteRecipeMutation.mutate(recipeId); // recipeId is from props
    }
  };

  // REMOVED Timer Effect (useEffect for interval) - Now managed in App.tsx
  // REMOVED Timer Handlers (handleTimerStart, etc.) - Using props directly
  // REMOVED Effect to reset timer on production mode toggle - Now handled in App.tsx reducer logic

  // Removed local handleAmountTracked handler (using prop onAmountTracked directly)
  // Removed local toggleProductionMode handler (using prop onToggleProductionMode directly)

  if (isLoading) {
    return <RecipeContainer><LoadingMessage>Carregant detalls de la recepta...</LoadingMessage></RecipeContainer>;
  }

  if (isError) {
    return (
      <RecipeContainer>
        <ErrorMessage>Error en carregar la recepta: {error?.message || 'Error desconegut'}</ErrorMessage>
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
            Editar
          </EditButton>
          {/* Delete Button */}
          <DeleteButton
            onClick={handleDeleteRecipe}
            disabled={!recipe || deleteRecipeMutation.isPending} // Disable if no data or delete pending
          >
            {deleteRecipeMutation.isPending ? 'Eliminant...' : 'Eliminar recepta'}
          </DeleteButton>
          {/* --- ScalingControl Moved Below Ingredients --- */}
          {/* Production Mode Toggle */}
          <ProductionModeToggle
            isActive={isProductionMode}
            onClick={onToggleProductionMode} // Use the handler passed via props
          >
            {isProductionMode ? 'Mode producció: ACTIU' : 'Mode producció: INACTIU'}
          </ProductionModeToggle>
        </RecipeHeader>
        <RecipeInfo>
          <span> {/* Wrap text in span to allow flex alignment */}
            Tipus: {recipe.type}
            {recipe.category && ` | Categoria: ${recipe.category}`}
          </span>
        </RecipeInfo>

        {/* --- Ingredients Section --- */}
        <IngredientsWrapper>
          {/* Consider adding an <h3>Ingredients</h3> here if desired */}
          <IngredientList
            ingredients={recipe.ingredients}
            linkedRecipes={recipe.linkedRecipes} // Pass linked recipes here
            scaleFactor={scaleFactor}
            onOpenRecipeTab={handleOpenRecipeTab} // Pass handler here
            isProductionMode={isProductionMode} // Pass production mode status
            trackedAmounts={trackedAmounts} // Pass down prop
            onAmountTracked={onAmountTracked} // Pass down prop
          />
        </IngredientsWrapper>

        {/* --- Steps Section --- */}
        <StepsWrapper>
          {/* Consider adding an <h3>Steps</h3> here if desired */}
          <StepList steps={recipe.steps} /> {/* Remove props no longer needed */}
        </StepsWrapper>

        {/* --- Scaling Control Section (Moved from Header) --- */}
        <ScalingWrapper>
           <ScalingControl
             scaleFactor={scaleFactor} // Use prop
             onScaleChange={onScaleChange} // Use prop handler
             baseYieldGrams={recipe.baseYieldGrams}
             disabled={isProductionMode} // Disable when in production mode
           />
        </ScalingWrapper>

        {/* --- Controls Section Removed (Moved to Header) --- */}
        {/* <ControlsWrapper> ... </ControlsWrapper> */}
      </RecipeContainer>
    );
  }

  // Fallback case (should ideally not be reached if query handles states correctly)
  return <RecipeContainer>No hi ha dades de la recepta disponibles.</RecipeContainer>;
};