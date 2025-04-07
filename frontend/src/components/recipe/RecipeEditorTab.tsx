import { useState, useEffect, useMemo } from 'react'; // Added useMemo
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // Added useMutation, useQueryClient
import { styled } from '@linaria/react';
import { fetchRecipeById, getAllRecipes, RecipeSearchResult, createRecipe, updateRecipe } from '../../api/recipes'; // Added createRecipe, updateRecipe
import { getAllIngredients } from '../../api/ingredients'; // Added getAllIngredients
import { fetchDefaultSteps } from '../../api/defaultSteps'; // Added default steps fetch
import { RecipeDetails, RecipeIngredient, LinkedRecipeInfo, CreateRecipeDto, UpdateRecipeDto } from '../../types/recipe'; // Added DTOs

// Define the props interface
interface RecipeEditorTabProps {
  recipeId?: string; // ID if editing an existing recipe
  tabId: string; // The ID of this editor tab itself
  onClose: () => void; // Function to close this tab
  onOpenRecipeTab: (recipeId: string, recipeName: string) => void; // Function to open a recipe display tab
}

// Basic styling (can be expanded later)
const EditorContainer = styled.div`
  /* Padding is handled by parent TabContent */
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl); /* Increase gap between sections */
  max-width: 900px;
  margin: var(--space-lg) auto; /* Add vertical margin */
  overflow-x: hidden;
`;

// Inherits h3 styles from global.ts
const SectionHeading = styled.h3`
  margin-top: 0; /* Remove top margin, rely on gap */
  margin-bottom: var(--space-lg);
  color: var(--text-color-strong);
  border-top: var(--border-width) solid var(--border-color-light);
  padding-top: var(--space-xl);
  font-size: var(--font-size-lg); /* Slightly smaller heading */

  /* Remove border/padding for the first heading */
  &:first-of-type {
      border-top: none;
      padding-top: 0;
  }
`;
// Form specific styles
const FormGroup = styled.div`
  margin-bottom: var(--space-lg);
  display: flex;
  flex-direction: column;
`;

const FormLabel = styled.label`
  margin-bottom: var(--space-xs);
  font-weight: 500;
  color: var(--text-color);
  font-size: var(--font-size-sm);
  display: block; /* Ensure it takes full width */
`;

// Inherits global input styles
const FormInput = styled.input`
  /* Add any specific overrides here if needed */
  /* Example: */
  /* &[type="number"] { max-width: 150px; } */
`;

// Inherits global select styles
const FormSelect = styled.select`
  /* Add any specific overrides here if needed */
  cursor: pointer;
`;

const BaseYieldContainer = styled.div`
   display: flex;
   align-items: center;
   gap: var(--space-sm); /* Use new spacing */

   & > ${FormInput}[type="number"] {
      width: 100px;
      flex-shrink: 0; /* Prevent shrinking */
   }
   & > span { /* Style the 'g' label */
       color: var(--text-color-light);
       font-size: var(--font-size-sm);
   }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: var(--space-md); /* Use new spacing */
  margin-top: var(--space-xl); /* Use new spacing */
  padding-top: var(--space-xl); /* Add padding */
  border-top: var(--border-width) solid var(--border-color-light); /* Add separator */
  justify-content: flex-end; /* Align buttons to the right */
`;

// Base button for this component - inherits global styles
// Use specific variants like PrimaryButton, SecondaryButton below
const Button = styled.button`
  /* Inherits global styles */
`;

// Primary action button (e.g., Save)
const PrimaryButton = styled(Button)`
  background-color: var(--primary-color);
  color: var(--text-on-primary);
  border-color: var(--primary-color);

  &:hover:not(:disabled) {
    background-color: var(--primary-color-dark);
    border-color: var(--primary-color-dark);
  }
`;

// Secondary action button (e.g., Cancel, Add Step)
const SecondaryButton = styled(Button)`
  background-color: var(--surface-color);
  color: var(--text-color);
  border-color: var(--border-color);

  &:hover:not(:disabled) {
    background-color: var(--background-color);
  }
`;

// Styles for the components list and add form
const ComponentList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 var(--space-lg) 0;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius);
  background-color: var(--surface-color);
  overflow: hidden;
  box-shadow: var(--shadow-sm); /* Add shadow */
`;

const ComponentListItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md) var(--space-lg); /* Increase padding slightly */
  border-bottom: var(--border-width) solid var(--border-color-light);
  transition: background-color 0.15s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
      background-color: var(--surface-color-light); /* Subtle hover */
  }
`;

const ComponentName = styled.span<{ isAllergen?: boolean }>`
  font-weight: ${props => props.isAllergen ? '600' : '500'}; /* Adjust weight */
  color: ${props => props.isAllergen ? 'var(--danger-color)' : 'inherit'};
  margin-right: var(--space-sm);
`;

const ComponentAmount = styled.span`
  color: var(--text-color-light);
  margin-left: var(--space-sm); /* Use new spacing */
  font-size: var(--font-size-sm); /* Smaller font */
  white-space: nowrap; /* Prevent wrapping */
`;

// Subtle button for removing items - styled for text
const RemoveButton = styled.button`
  background: none;
  border: none;
  color: var(--danger-color);
  cursor: pointer;
  font-size: var(--font-size-sm);
  padding: var(--space-xs) var(--space-sm); /* Adjusted padding for text */
  margin-left: var(--space-md);
  line-height: 1.2; /* Adjusted line-height for text */
  border-radius: var(--border-radius); /* Standard border radius */
  transition: background-color 0.15s ease, color 0.15s ease;
  font-weight: 500; /* Slightly bolder */

  &:hover:not(:disabled) {
    color: var(--text-on-primary); /* White text */
    background-color: var(--danger-color); /* Red background */
  }

  &:focus {
      outline: none;
      background-color: var(--danger-color-dark); /* Darker red on focus */
      color: var(--text-on-primary);
      box-shadow: 0 0 0 3px var(--focus-ring-color); /* Standard focus ring */
  }

  /* Remove explicit width/height and flex centering */
`;

const AddComponentForm = styled.div`
  display: flex;
  flex-wrap: wrap; /* Allow wrapping on smaller screens */
  gap: var(--space-md);
  align-items: flex-end;
  margin-top: var(--space-lg);
  padding: var(--space-lg); /* Add padding all around */
  border: var(--border-width) solid var(--border-color-light); /* Use lighter border */
  border-radius: var(--border-radius);
  background-color: var(--surface-color-light); /* Slightly different background */
`;

const AddComponentControls = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-width: 200px;
`;

const AmountInputGroup = styled.div`
  display: flex;
  flex-direction: column;
  width: 120px;
  flex-shrink: 0;

  /* Target the input within this specific group's BaseYieldContainer */
  & > ${BaseYieldContainer} > ${FormInput}[type="number"] {
      width: 70px;
      padding: var(--space-sm) var(--space-sm);
      box-shadow: none; /* Remove shadow */
   }
`;

// Use the PrimaryButton variant defined earlier
const AddButton = styled(PrimaryButton)`
  white-space: nowrap;
  /* Ensure consistent height with inputs */
  height: calc(var(--font-size-base) * var(--line-height-base) + var(--space-sm) * 2 + var(--border-width) * 2);
`;

// Styles for the Steps section
// List for steps in the editor
// List for steps in the editor
const StepList = styled.ol`
  list-style: none;
  padding: 0;
  margin: 0 0 var(--space-lg) 0;
  counter-reset: editor-step-counter;
`;

const StepListItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
  padding: var(--space-md) 0; /* Add vertical padding */
  border-bottom: var(--border-width) solid var(--border-color-light);
  position: relative;
  padding-left: var(--space-xl);

  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }

  /* Style the step number */
  &::before {
    counter-increment: editor-step-counter;
    content: counter(editor-step-counter) ".";
    position: absolute;
    left: 0;
    top: calc(var(--space-md) + 2px); /* Align with textarea top padding */
    font-weight: 600;
    color: var(--text-color-light);
    font-size: var(--font-size-base);
    line-height: var(--line-height-base);
  }
`;

// Inherits global textarea styles
// Inherits global textarea styles
const StepTextArea = styled.textarea`
  flex-grow: 1;
  min-height: 80px; /* Make taller */
  resize: vertical;
  /* Inherits padding, border, focus styles */
`;

const StepButtonContainer = styled.div`
  display: flex;
  flex-wrap: wrap; /* Allow wrapping */
  gap: var(--space-md);
  margin-top: var(--space-lg);
`;


// Define the initial empty state structure based on RecipeDetails
// Ensure defaults match the requirements
const initialRecipeState: Omit<RecipeDetails, '_id' | 'baseYieldGrams'> = { // Removed baseYieldGrams
  name: '',
  type: 'ice cream recipe',
  category: 'ice cream', // Default category when type is 'ice cream recipe'
  ingredients: [],
  steps: [], // Initialize steps as empty array
  linkedRecipes: [],
};


export const RecipeEditorTab = ({ recipeId, onClose, onOpenRecipeTab }: RecipeEditorTabProps) => {
  const isEditing = !!recipeId;
  const queryClient = useQueryClient(); // Get query client instance

  // State to hold the form data
  const [recipeData, setRecipeData] = useState<Omit<RecipeDetails, '_id' | 'baseYieldGrams'>>(initialRecipeState); // Adjusted type

  // Fetch existing recipe data if editing
  const { data: existingRecipe, isLoading: isLoadingExisting, isError, error } = useQuery({
    queryKey: ['recipe', recipeId],
    queryFn: () => fetchRecipeById(recipeId!), // ! assertion is safe due to the enabled flag
    enabled: isEditing, // Only run the query if recipeId is provided
    staleTime: 5 * 60 * 1000, // Example: 5 minutes stale time
    // cacheTime: 10 * 60 * 1000, // Example: 10 minutes cache time
  });

  // Effect to populate form state when existingRecipe data loads
  useEffect(() => {
    if (isEditing && existingRecipe) {
      // Populate state with fetched data, ensuring all fields are covered
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _id, baseYieldGrams, ...restOfRecipe } = existingRecipe; // Extract _id and baseYieldGrams
      setRecipeData({
        ...initialRecipeState, // Start with defaults
        ...restOfRecipe,       // Override with fetched data (without _id or baseYieldGrams)
        category: existingRecipe.type === 'ice cream recipe'
          ? (existingRecipe.category ?? 'ice cream')
          : undefined,
        // baseYieldGrams is now calculated, removed from form population
        ingredients: existingRecipe.ingredients ?? [],
        steps: existingRecipe.steps ?? [], // Ensure steps are initialized from fetched data or default
        linkedRecipes: existingRecipe.linkedRecipes ?? [],
      });
    } else if (!isEditing) {
      setRecipeData(initialRecipeState);
    }
  }, [isEditing, existingRecipe, recipeId]);

  // --- Fetch available ingredients and recipes for the "Add Component" dropdown ---
  // Fetch *all* ingredients for the dropdown by requesting page 1 with a very large limit.
  // Use `select` to extract the data array from the paginated response.
  const { data: availableIngredients = [], isLoading: isLoadingIngredients } = useQuery({
    queryKey: ['ingredients', 'all'], // Add 'all' to differentiate from paginated queries
    queryFn: () => getAllIngredients(1, 9999), // Fetch page 1, limit 9999
    staleTime: 10 * 60 * 1000,
    select: (paginatedData) => paginatedData.data, // Extract the array from the response
  });

  const { data: availableRecipes = [], isLoading: isLoadingRecipes } = useQuery<RecipeSearchResult[]>({
    queryKey: ['recipes'],
    queryFn: getAllRecipes,
    staleTime: 10 * 60 * 1000,
  });

  // --- State for the "Add Component" form ---
  const [selectedComponentId, setSelectedComponentId] = useState<string>('');
  const [componentAmount, setComponentAmount] = useState<string>('');

  // --- Memoized combined list for the dropdown ---
  const availableComponents = useMemo(() => {
    const ingredients = availableIngredients.map(ing => ({ id: `ing_${ing._id}`, name: ing.name, type: 'ingredient' as const }));
    const recipes = availableRecipes
      .filter((rec: RecipeSearchResult) => rec._id !== recipeId)
      .map((rec: RecipeSearchResult) => ({ id: `rec_${rec._id}`, name: rec.name, type: 'recipe' as const }));
    return { ingredients, recipes };
  }, [availableIngredients, availableRecipes, recipeId]);


  // --- Event Handlers ---
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type: elementType } = event.target;
    // Exclude baseYieldGrams from direct state updates via input
    if (name === 'baseYieldGrams') return;

    const processedValue = elementType === 'number' ? parseFloat(value) || 0 : value;

    setRecipeData(prev => ({
      ...prev,
      [name]: processedValue,
      ...(name === 'type' && value !== 'ice cream recipe' && { category: undefined }),
      ...(name === 'type' && value === 'ice cream recipe' && !prev.category && { category: 'ice cream' }),
      // Removed baseYieldGrams handling as input is gone
    }));
  };

  const handleAddRecipeComponent = () => {
    const amountGrams = parseInt(componentAmount, 10);
    if (!selectedComponentId || !componentAmount || isNaN(amountGrams) || amountGrams <= 0) {
      alert('Please select a component and enter a valid positive amount.');
      return;
    }

    const [type, id] = selectedComponentId.split('_');

    if (type === 'ing') {
      const ingredientToAdd = availableIngredients.find(ing => ing._id === id);
      if (!ingredientToAdd) return;
      if (recipeData.ingredients?.some(item => item.ingredient._id === id)) {
         alert(`${ingredientToAdd.name} is already in the recipe.`);
         return;
      }
      const newRecipeIngredient: RecipeIngredient = {
        ingredient: { _id: id, name: ingredientToAdd.name, isAllergen: ingredientToAdd.isAllergen },
        amountGrams: amountGrams,
      };
      setRecipeData(prev => ({ ...prev, ingredients: [...(prev.ingredients || []), newRecipeIngredient] }));

    } else if (type === 'rec') {
      const recipeToAdd = availableRecipes.find((rec: RecipeSearchResult) => rec._id === id);
      if (!recipeToAdd) return;
      if (recipeData.linkedRecipes?.some(item => item.recipe._id === id)) {
         alert(`${recipeToAdd.name} is already linked in the recipe.`);
         return;
      }
      const newLinkedRecipe: LinkedRecipeInfo = {
        recipe: { _id: id, name: recipeToAdd.name },
        amountGrams: amountGrams,
      };
      setRecipeData(prev => ({ ...prev, linkedRecipes: [...(prev.linkedRecipes || []), newLinkedRecipe] }));
    }

    setSelectedComponentId('');
    setComponentAmount('');
  };

  const handleRemoveRecipeComponent = (componentIdToRemove: string, componentType: 'ingredient' | 'recipe') => {
    if (componentType === 'ingredient') {
      setRecipeData(prev => ({ ...prev, ingredients: prev.ingredients?.filter(item => item.ingredient._id !== componentIdToRemove) || [] }));
    } else if (componentType === 'recipe') {
      setRecipeData(prev => ({ ...prev, linkedRecipes: prev.linkedRecipes?.filter(item => item.recipe._id !== componentIdToRemove) || [] }));
    }
  };

  // --- Step Handlers ---
  const handleStepChange = (index: number, value: string) => {
    setRecipeData(prev => {
      const newSteps = [...(prev.steps || [])];
      newSteps[index] = value;
      return { ...prev, steps: newSteps };
    });
  };

  const handleAddStep = () => {
    setRecipeData(prev => ({
      ...prev,
      steps: [...(prev.steps || []), ''], // Add empty string for new step
    }));
  };

  const handleRemoveStep = (index: number) => {
    setRecipeData(prev => ({
      ...prev,
      steps: prev.steps?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleAppendDefaultSteps = async (category: 'ice cream' | 'sorbet') => {
      try {
          // TODO: Consider adding loading state feedback
          console.log(`Fetching default steps for: ${category}`);
          const defaultSteps = await fetchDefaultSteps(category);
          console.log(`Fetched default steps:`, defaultSteps);
          setRecipeData(prev => ({
              ...prev,
              steps: [...(prev.steps || []), ...defaultSteps],
          }));
      } catch (error) {
          console.error("Failed to fetch default steps:", error);
          alert(`Failed to load default steps for ${category}. Check console for details.`); // Use better UI in future
      }
  };

  // --- Mutations ---
  const handleSaveSuccess = (savedRecipe: RecipeDetails) => {
      console.log('Save successful:', savedRecipe);
      queryClient.invalidateQueries({ queryKey: ['recipes'] }); // Invalidate list view
      if (isEditing) {
          queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] }); // Invalidate specific recipe view/edit
      }
      // Option 1: Close editor, open RecipeTab for the saved recipe
      onClose(); // Close the editor tab using the passed function
      onOpenRecipeTab(savedRecipe._id, savedRecipe.name); // Open the display tab using the passed function

      // Option 2: Stay in editor, maybe reset 'dirty' state (more complex)
      // For now, we implement Option 1
  };

  const handleSaveError = (error: unknown) => {
      console.error("Save failed:", error);
      // Display error to user (e.g., using a toast notification library or a simple alert)
      alert(`Failed to save recipe: ${error instanceof Error ? error.message : 'Unknown error'}`);
  };

  const createRecipeMutation = useMutation({
      mutationFn: createRecipe,
      onSuccess: handleSaveSuccess,
      onError: handleSaveError,
  });

  const updateRecipeMutation = useMutation({
      mutationFn: ({ id, data }: { id: string, data: UpdateRecipeDto }) => updateRecipe(id, data),
      onSuccess: handleSaveSuccess,
      onError: handleSaveError,
  });

  // --- Save/Cancel Handlers ---
  const handleSave = () => {
    console.log('Save clicked. Recipe Data:', recipeData);

    // Basic validation
    if (!recipeData.name.trim()) {
        alert('Recipe name is required.');
        return;
    }
    // Removed baseYieldGrams validation as it's now calculated

    // Calculate total weight for baseYieldGrams
    const totalIngredientWeight = recipeData.ingredients?.reduce((sum, item) => sum + item.amountGrams, 0) || 0;
    const totalLinkedRecipeWeight = recipeData.linkedRecipes?.reduce((sum, item) => sum + item.amountGrams, 0) || 0;
    const calculatedBaseYield = totalIngredientWeight + totalLinkedRecipeWeight;

    // Ensure base yield is at least 1 if components exist, otherwise 0
    const finalBaseYield = calculatedBaseYield > 0 ? calculatedBaseYield : 0;

    // Construct DTO payload
    const payload = {
        name: recipeData.name,
        type: recipeData.type,
        category: recipeData.type === 'ice cream recipe' ? recipeData.category : undefined,
        baseYieldGrams: finalBaseYield, // Use calculated yield
        steps: recipeData.steps || [],
        // Map ingredients and linked recipes to only include IDs and amounts
        ingredients: recipeData.ingredients?.map(item => ({
            ingredient: item.ingredient._id,
            amountGrams: item.amountGrams,
        })) || [],
        linkedRecipes: recipeData.linkedRecipes?.map(item => ({
            recipe: item.recipe._id,
            amountGrams: item.amountGrams,
        })) || [],
    };

    if (isEditing) {
        console.log('Calling update mutation with ID:', recipeId, 'and payload:', payload);
        updateRecipeMutation.mutate({ id: recipeId!, data: payload as UpdateRecipeDto });
    } else {
        console.log('Calling create mutation with payload:', payload);
        createRecipeMutation.mutate(payload as CreateRecipeDto);
    }
  };

  const handleCancel = () => {
    console.log('Cancel clicked.');
    onClose(); // Call the passed onClose function
  };

  // --- Render Logic ---
  const isLoading = isLoadingExisting || createRecipeMutation.isPending || updateRecipeMutation.isPending;

  // Calculate current total yield for display (optional, but good UX)
  const currentTotalYield = useMemo(() => {
      const ingredientYield = recipeData.ingredients?.reduce((sum, item) => sum + item.amountGrams, 0) || 0;
      const linkedRecipeYield = recipeData.linkedRecipes?.reduce((sum, item) => sum + item.amountGrams, 0) || 0;
      return ingredientYield + linkedRecipeYield;
  }, [recipeData.ingredients, recipeData.linkedRecipes]);


  if (isEditing && isLoadingExisting) return <EditorContainer>Loading recipe data...</EditorContainer>; // Show loading only for initial fetch
  if (isEditing && isError) return <EditorContainer>Error loading recipe: {error instanceof Error ? error.message : 'Unknown error'}</EditorContainer>;

  return (
    <EditorContainer>
      <h2 style={{ textAlign: 'center' }}>{isEditing ? `Edit Recipe: ${existingRecipe?.name ?? '...'}` : 'Create New Recipe'}</h2>

      <form onSubmit={(e) => e.preventDefault()}>
        {/* Basic Information Section */}
        <div>
          <SectionHeading>Basic Information</SectionHeading>
          <FormGroup>
            <FormLabel htmlFor="recipe-name">Name</FormLabel>
            <FormInput type="text" id="recipe-name" name="name" value={recipeData.name || ''} onChange={handleInputChange} required disabled={isLoading} />
          </FormGroup>
          <FormGroup>
            <FormLabel htmlFor="recipe-type">Type</FormLabel>
            <FormSelect id="recipe-type" name="type" value={recipeData.type || 'ice cream recipe'} onChange={handleInputChange} disabled={isLoading}>
              <option value="ice cream recipe">Ice Cream Recipe</option>
              <option value="not ice cream recipe">Not Ice Cream Recipe</option>
            </FormSelect>
          </FormGroup>
          {recipeData.type === 'ice cream recipe' && (
            <FormGroup>
              <FormLabel htmlFor="recipe-category">Category</FormLabel>
              <FormSelect id="recipe-category" name="category" value={recipeData.category || 'ice cream'} onChange={handleInputChange} required disabled={isLoading}>
                <option value="ice cream">Ice Cream</option>
                <option value="sorbet">Sorbet</option>
              </FormSelect>
            </FormGroup>
          )}
        </div>

        {/* Combined Components Section */}
        <div>
          <SectionHeading>Components</SectionHeading>
          <ComponentList>
            {(recipeData.ingredients?.length === 0 && recipeData.linkedRecipes?.length === 0) && (
              <ComponentListItem>No components added yet.</ComponentListItem>
            )}
            {recipeData.ingredients?.map((item) => (
              <ComponentListItem key={`ing-${item.ingredient._id}`}>
                <div>
                  <ComponentName isAllergen={item.ingredient.isAllergen}>{item.ingredient.name}</ComponentName>
                  <ComponentAmount>({item.amountGrams}g - Ingredient)</ComponentAmount>
                </div>
                <RemoveButton onClick={() => handleRemoveRecipeComponent(item.ingredient._id, 'ingredient')} disabled={isLoading}>Remove</RemoveButton>
              </ComponentListItem>
            ))}
            {recipeData.linkedRecipes?.map((item) => (
              <ComponentListItem key={`rec-${item.recipe._id}`}>
                <div>
                  <ComponentName>{item.recipe.name}</ComponentName>
                  <ComponentAmount>({item.amountGrams}g - Recipe)</ComponentAmount>
                </div>
                <RemoveButton onClick={() => handleRemoveRecipeComponent(item.recipe._id, 'recipe')} disabled={isLoading}>Remove</RemoveButton>
              </ComponentListItem>
            ))}
          </ComponentList>

          {/* Display Calculated Yield */}
          <FormGroup>
              <FormLabel>Calculated Base Yield (Read-only)</FormLabel>
              <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: '500' }}>{currentTotalYield} g</p>
          </FormGroup>

          <AddComponentForm>
             {(isLoadingIngredients || isLoadingRecipes) ? ( <p>Loading components...</p> ) : (
               <>
                 <AddComponentControls>
                   <FormLabel htmlFor="component-select">Add Component</FormLabel>
                   <FormSelect id="component-select" value={selectedComponentId} onChange={(e) => setSelectedComponentId(e.target.value)} disabled={isLoading}>
                     <option value="" disabled>-- Select Component --</option>
                     <optgroup label="Ingredients">
                       {availableComponents.ingredients.map(ing => (<option key={ing.id} value={ing.id}>{ing.name}</option>))}
                     </optgroup>
                     <optgroup label="Recipes">
                       {availableComponents.recipes.map((rec) => (<option key={rec.id} value={rec.id}>{rec.name}</option>))}
                     </optgroup>
                   </FormSelect>
                 </AddComponentControls>

                 <AmountInputGroup>
                   <FormLabel htmlFor="component-amount">Amount</FormLabel>
                   <BaseYieldContainer> {/* Reusing BaseYieldContainer for input+label */}
                      <FormInput type="number" id="component-amount" min="1" value={componentAmount} onChange={(e) => setComponentAmount(e.target.value)} placeholder="grams" disabled={isLoading} />
                      <span>g</span>
                   </BaseYieldContainer>
                 </AmountInputGroup>

                 <AddButton type="button" onClick={handleAddRecipeComponent} disabled={isLoading || !selectedComponentId || !componentAmount}>Add</AddButton>
               </>
             )}
          </AddComponentForm>
        </div>

        {/* Steps Section */}
        <div>
          <SectionHeading>Steps</SectionHeading>
          <StepList>
            {(recipeData.steps?.length === 0) && (
              <StepListItem>No steps added yet.</StepListItem> // Display message if no steps
            )}
            {recipeData.steps?.map((step, index) => (
              <StepListItem key={index}>
                <StepTextArea
                  value={step}
                  onChange={(e) => handleStepChange(index, e.target.value)}
                  rows={3} // Start with a reasonable height
                  disabled={isLoading}
                />
                <RemoveButton onClick={() => handleRemoveStep(index)} disabled={isLoading}>Remove</RemoveButton>
              </StepListItem>
            ))}
          </StepList>
          <StepButtonContainer>
            <SecondaryButton type="button" onClick={handleAddStep} disabled={isLoading}>Add New Step</SecondaryButton>
            {recipeData.type === 'ice cream recipe' && (
              <>
                <SecondaryButton type="button" onClick={() => handleAppendDefaultSteps('ice cream')} disabled={isLoading}>Add Ice Cream Defaults</SecondaryButton>
                <SecondaryButton type="button" onClick={() => handleAppendDefaultSteps('sorbet')} disabled={isLoading}>Add Sorbet Defaults</SecondaryButton>
              </>
            )}
          </StepButtonContainer>
        </div>

        {/* Base Yield Section Removed - Now calculated automatically */}

        {/* Action Buttons */}
        <ButtonContainer>
          {/* Use PrimaryButton for Save, SecondaryButton for Cancel */}
          <SecondaryButton type="button" onClick={handleCancel} disabled={isLoading}>Cancel</SecondaryButton>
          <PrimaryButton type="button" onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Recipe')}
          </PrimaryButton>
        </ButtonContainer>
      </form>
    </EditorContainer>
  );
};