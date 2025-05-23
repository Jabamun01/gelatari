import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { styled } from '@linaria/react';
import Papa from 'papaparse';
import { fetchRecipeById, fetchRecipes, RecipeSearchResult, createRecipe, updateRecipe } from '../../api/recipes';
// Import specific API functions needed for resolving
import { getAllIngredients, addAliasToIngredient, createIngredient as createIngredientApi } from '../../api/ingredients';
import { fetchDefaultSteps } from '../../api/defaultSteps';
import { RecipeDetails, RecipeIngredient, LinkedRecipeInfo, CreateRecipeDto, UpdateRecipeDto } from '../../types/recipe';
import { Ingredient, CreateIngredientDto as CreateIngredientApiDto } from '../../types/ingredient'; // Import DTO type
import { SearchableSelector, SelectableItem } from '../common/SearchableSelector';
import { Modal } from '../common/Modal'; // Import the Modal component

// Type for parsed CSV data
interface ParsedCsvIngredient {
  name: string;
  amountGrams: number;
  originalRow: number; // Keep track of original row for error messages
}

// Type for unmatched ingredients needing user action
interface UnmatchedIngredient extends ParsedCsvIngredient {
  reason: string; // e.g., "Not found in database"
}
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

// BaseYieldContainer removed as it's no longer used in this component

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

const ComponentName = styled.span`
  font-weight: 500;
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
  background: transparent;
  border: var(--border-width) solid var(--border-color);
  color: var(--danger-color);
  cursor: pointer;
  font-size: var(--font-size-sm);
  padding: var(--space-xs) var(--space-sm); /* Adjusted padding for text */
  margin-left: var(--space-md);
  line-height: 1.2; /* Adjusted line-height for text */
  border-radius: var(--border-radius); /* Standard border radius */
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  font-weight: 500; /* Slightly bolder */

  &:hover:not(:disabled) {
    color: var(--danger-color-dark);
    background-color: rgba(239, 68, 68, 0.1); /* var(--danger-bg-hover) or similar */
    border-color: var(--border-color-hover);
  }

  &:focus {
      outline: none;
      background-color: rgba(239, 68, 68, 0.15); /* Slightly darker hover for focus */
      color: var(--danger-color-dark);
      border-color: var(--border-color-hover);
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

// Styles for the Steps section
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
  align-items: center; /* Align items vertically */
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
  const [recipeData, setRecipeData] = useState<Omit<RecipeDetails, '_id' | 'baseYieldGrams'>>(initialRecipeState);
  // --- State for the "Add Component" search ---
  // --- State for CSV Import ---
  const [selectedCsvFile, setSelectedCsvFile] = useState<File | null>(null);
  const [isParsingCsv, setIsParsingCsv] = useState(false);
  const [unmatchedIngredients, setUnmatchedIngredients] = useState<UnmatchedIngredient[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolvingIngredientIndex, setResolvingIngredientIndex] = useState<number | null>(null); // Index of the item in unmatchedIngredients being resolved

  // --- State for the "Add Component" search ---
  // (Existing state remains)
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
    } else { // This covers the !isEditing case
      setRecipeData(initialRecipeState);
      // Reset CSV state when creating a new recipe or switching editor tabs
      setSelectedCsvFile(null);
      setUnmatchedIngredients([]);
      if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Clear file input visually
      }
    }
  }, [isEditing, existingRecipe, recipeId]);
  // --- Fetch components (ingredients & recipes) based on search term ---
  const minSearchLength = 2;
  // The query key base passed to SearchableSelector. The debounced term is added internally by the component.
  const componentQueryKeyBase = ['componentSearch', recipeId]; // Used for linked recipes
  const ingredientsForFormQueryKeyBase = ['ingredientsForFormSearch', recipeId];


  const fetchIngredientsForForm = useCallback(async (term: string): Promise<SelectableItem[]> => {
    if (term.length < minSearchLength) {
      return [];
    }
    console.log(`Fetching ingredients for form, term: "${term}"`);
    try {
      const ingredientsResponse = await getAllIngredients(1, 20, term);
      return ingredientsResponse.data.map((ing: Ingredient): SelectableItem => ({
        id: `ing_${ing._id}`, // Keep ing_ prefix for consistency if SearchableSelector expects it
        name: ing.name,
        type: 'ingredient', // Explicitly set type
      }));
    } catch (error) {
      console.error("Failed to fetch ingredients for form:", error);
      return [];
    }
  }, []);


  const fetchLinkedRecipeCandidates = useCallback(async (term: string): Promise<SelectableItem[]> => {
    if (term.length < minSearchLength) {
      return [];
    }
    console.log(`Fetching recipe candidates for term: "${term}"`);
    try {
      // Call fetchRecipes with page, limit, and searchTerm
      const recipesApiResponse = await fetchRecipes(1, 20, term); // Default page 1, limit 20
      return recipesApiResponse.recipes // Access the 'recipes' array from the response
        .filter((rec: RecipeSearchResult) => rec._id !== recipeId) // Exclude current recipe
        .map((rec: RecipeSearchResult): SelectableItem => ({
          id: `rec_${rec._id}`,
          name: rec.name,
          type: 'recipe',
        }));
    } catch (error) {
      console.error("Failed to fetch recipe candidates:", error);
      return [];
    }
  }, [recipeId]);


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

  // New handler for adding ingredients directly from SearchableSelector
  const handleAddIngredientFromSelector = (item: SelectableItem, quantity: number) => {
    if (item.type !== 'ingredient') {
      console.warn("handleAddIngredientFromSelector called with non-ingredient item:", item);
      return;
    }
    // Ensure item.id has 'ing_' prefix before stripping, or handle cases where it might not
    const ingredientId = item.id.startsWith('ing_') ? item.id.substring(4) : item.id;
    const ingredientName = item.name;

    console.log("Adding ingredient from selector:", ingredientId, ingredientName, "Amount:", quantity);
    if (recipeData.ingredients?.some(ingItem => ingItem.ingredient._id === ingredientId)) {
      alert(`${ingredientName} is already in the recipe.`);
      return;
    }
    const newRecipeIngredient: RecipeIngredient = {
      ingredient: { _id: ingredientId, name: ingredientName },
      amountGrams: quantity,
    };
    setRecipeData(prev => ({ ...prev, ingredients: [...(prev.ingredients || []), newRecipeIngredient] }));
    // Search term clearing and list hiding is handled by SearchableSelector itself.
  };

  // This function now acts as the 'onAdd' callback for SearchableSelector FOR LINKED RECIPES
  const handleAddLinkedRecipe = (item: SelectableItem, amountGrams: number) => {
    console.log("Adding linked recipe:", item, "Amount:", amountGrams);

    const { id: prefixedId, name, type } = item;
    if (type !== 'recipe') {
        console.warn("handleAddLinkedRecipe called with non-recipe item:", item);
        return;
    }
    const id = prefixedId.substring(4); // Remove 'rec_' prefix

    // Check if already added
    if (recipeData.linkedRecipes?.some(recItem => recItem.recipe._id === id)) {
       alert(`${name} is already linked in the recipe.`);
       return;
    }
    const newLinkedRecipe: LinkedRecipeInfo = {
      recipe: { _id: id, name: name },
      amountGrams: amountGrams,
    };
    setRecipeData(prev => ({ ...prev, linkedRecipes: [...(prev.linkedRecipes || []), newLinkedRecipe] }));

    // Resetting state is handled inside SearchableSelector after calling onAdd
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
  
    // --- CSV Import Handlers ---
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files.length > 0) {
        setSelectedCsvFile(event.target.files[0]);
        setUnmatchedIngredients([]); // Clear previous unmatched if a new file is selected
      } else {
        setSelectedCsvFile(null);
      }
    };
  
    const handleImportCsv = async () => {
      if (!selectedCsvFile) {
        alert('Please select a CSV file first.');
        return;
      }
  
      setIsParsingCsv(true);
      setUnmatchedIngredients([]); // Clear previous results
  
      // Fetch *all* ingredients from the database for matching
      // TODO: Optimize this - potentially fetch only needed ones or use a better endpoint
      let allDbIngredients: Ingredient[] = [];
      try {
          // Fetch all pages if pagination exists, or adjust API call if possible
          // For now, assume getAllIngredients can fetch all if limit is high enough (e.g., 1000)
          // This is NOT scalable and needs backend improvement for production.
          const response = await getAllIngredients(1, 1000); // Fetch up to 1000 ingredients
          allDbIngredients = response.data;
          console.log(`Fetched ${allDbIngredients.length} ingredients for matching.`);
      } catch (error) {
          console.error("Failed to fetch ingredients for matching:", error);
          alert(`Failed to fetch database ingredients for matching. ${error instanceof Error ? error.message : ''}`);
          setIsParsingCsv(false);
          return;
      }
  
      Papa.parse<string[]>(selectedCsvFile, {
        header: false, // We'll use indices
        skipEmptyLines: true,
        complete: (results) => {
          console.log('CSV Parsing complete:', results);
          const parsedData: ParsedCsvIngredient[] = [];
          const errors: string[] = [];
          const unmatched: UnmatchedIngredient[] = [];
          const ingredientsToAdd: RecipeIngredient[] = [];
  
          // Start from row 1 to skip header (index 0)
          for (let i = 1; i < results.data.length; i++) {
              const row = results.data[i];
              const originalRow = i + 1; // User-facing row number
  
              // Basic validation: Check if row has at least 2 columns
              if (row.length < 2) {
                  // Ignore potential total rows or malformed rows silently for now
                  // console.warn(`Skipping row ${originalRow}: Expected at least 2 columns, found ${row.length}`);
                  continue;
              }
  
              const name = row[0]?.trim();
              const amountStr = row[1]?.trim();
  // Skip if name is empty or looks like a total row (case-insensitive check)
  const upperCaseName = name?.toUpperCase();
  if (!name || upperCaseName === 'TOTAL (G)' || upperCaseName === 'TOTAL %') {
      continue;
                  continue;
              }
  
              const amountGrams = parseFloat(amountStr);
  
              // Validate amount
              if (isNaN(amountGrams) || amountGrams <= 0) {
                  errors.push(`Row ${originalRow}: Invalid or zero amount for ingredient "${name}" (${amountStr}).`);
                  continue; // Skip this ingredient
              }
  
              const parsedIngredient: ParsedCsvIngredient = { name, amountGrams, originalRow };
              parsedData.push(parsedIngredient);
  
              // --- Attempt to match ---
              const lowerCaseName = name.toLowerCase();
              const matchedDbIngredient = allDbIngredients.find(dbIng =>
                  dbIng.name.toLowerCase() === lowerCaseName ||
                  dbIng.aliases?.some(alias => alias.toLowerCase() === lowerCaseName)
              );
  
              if (matchedDbIngredient) {
                  // Check if already added to *this recipe* (prevent duplicates from CSV itself)
                  const alreadyInRecipe = recipeData.ingredients?.some(ing => ing.ingredient._id === matchedDbIngredient._id) ||
                                          ingredientsToAdd.some(ing => ing.ingredient._id === matchedDbIngredient._id);
  
                  if (!alreadyInRecipe) {
                      ingredientsToAdd.push({
                          ingredient: {
                              _id: matchedDbIngredient._id,
                              name: matchedDbIngredient.name, // Use DB name
                              // We don't need aliases here in the recipe ingredient itself
                          },
                          amountGrams: amountGrams,
                      });
                  } else {
                      console.log(`Ingredient "${matchedDbIngredient.name}" (from CSV "${name}") already in recipe, skipping.`);
                  }
              } else {
                  // Not found in DB by name or alias
                  unmatched.push({ ...parsedIngredient, reason: 'Not found in database' });
              }
          }
  
          // --- Process results ---
          if (errors.length > 0) {
            alert(`CSV Parsing Errors:\n- ${errors.join('\n- ')}`);
            // Continue processing matched/unmatched even if there are errors in other rows
          }
  
          // Add matched ingredients to the form state
          if (ingredientsToAdd.length > 0) {
              setRecipeData(prev => ({
                  ...prev,
                  ingredients: [...(prev.ingredients || []), ...ingredientsToAdd]
              }));
              alert(`Added ${ingredientsToAdd.length} matched ingredients from the CSV.`);
          }
  
          // Handle unmatched ingredients - Open modal if any exist
          if (unmatched.length > 0) {
            setUnmatchedIngredients(unmatched);
            setResolvingIngredientIndex(0); // Start with the first one
            setIsResolveModalOpen(true); // Open the modal
          } else if (errors.length === 0 && ingredientsToAdd.length === 0 && parsedData.length > 0) {
               alert('All ingredients from the CSV were already present in the recipe.');
          } else if (errors.length === 0 && unmatched.length === 0 && ingredientsToAdd.length > 0) {
              // Successfully added some, none unmatched, no errors
               // Maybe clear file input?
               setSelectedCsvFile(null);
               if (fileInputRef.current) fileInputRef.current.value = '';
          } else if (parsedData.length === 0 && errors.length === 0) {
              alert('No valid ingredient rows found in the CSV file.');
          }
  
          setIsParsingCsv(false);
        },
        error: (error) => {
          console.error('CSV Parsing failed:', error);
          alert(`Failed to parse CSV file: ${error.message}`);
          setIsParsingCsv(false);
        }
      });
    };

    // --- Handlers for Resolving Unmatched Ingredients ---

    const handleResolveSuccess = (resolvedIngredient: Ingredient, originalCsvAmount: number) => {
        // Add the resolved/created ingredient to the recipe
        const newRecipeIngredient: RecipeIngredient = {
            ingredient: {
                _id: resolvedIngredient._id,
                name: resolvedIngredient.name,
                // No need for aliases here
            },
            amountGrams: originalCsvAmount,
        };
        setRecipeData(prev => ({
            ...prev,
            ingredients: [...(prev.ingredients || []), newRecipeIngredient]
        }));

        // Remove from unmatched list and move to next or close modal
        handleGoToNextUnmatched();
    };

    const handleGoToNextUnmatched = () => {
        setUnmatchedIngredients(prev => {
            const remaining = prev.filter((_, index) => index !== resolvingIngredientIndex);
            if (remaining.length > 0) {
                // Move to the next item (index 0 of the remaining list)
                setResolvingIngredientIndex(0);
            } else {
                // No more items, close modal
                setIsResolveModalOpen(false);
                setResolvingIngredientIndex(null);
                // Clear file input as import is fully complete
                setSelectedCsvFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
            return remaining; // Update the state with the filtered list
        });
    };

    const handleSkipUnmatched = () => {
        // Just move to the next item without resolving
        const nextIndex = (resolvingIngredientIndex ?? -1) + 1;
        if (nextIndex < unmatchedIngredients.length) {
            setResolvingIngredientIndex(nextIndex);
        } else {
            // Skipped the last one, close modal
            setIsResolveModalOpen(false);
            setResolvingIngredientIndex(null);
            // Optionally clear the remaining unmatched list if skipping means abandoning them
            // setUnmatchedIngredients([]);
        }
    };

    const handleCloseResolveModal = () => {
        setIsResolveModalOpen(false);
        setResolvingIngredientIndex(null);
        // Decide if we should clear unmatchedIngredients when closing manually
        // setUnmatchedIngredients([]);
    };
  // --- Mutations ---
  const handleSaveSuccess = (savedRecipe: RecipeDetails) => {
      console.log('Save successful:', savedRecipe);
      queryClient.invalidateQueries({ queryKey: ['recipes'] }); // Invalidate list view
      if (isEditing) {
          queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] }); // Invalidate specific recipe view/edit
      }
      queryClient.invalidateQueries({ queryKey: ['recipeDependencies'] }); // Invalidate ALL recipe dependency data
      queryClient.invalidateQueries({ queryKey: ['ingredientDependencies'] }); // Invalidate ALL ingredient dependency data
      queryClient.invalidateQueries({ queryKey: ['ingredients'] }); // Invalidate general ingredients list
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
  const isSaving = createRecipeMutation.isPending || updateRecipeMutation.isPending;
  const isLoading = isLoadingExisting || isSaving || isParsingCsv; // Combine loading states

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
      <h2 style={{ textAlign: 'center' }}>{isEditing ? `Edita Recepta: ${existingRecipe?.name ?? '...'}` : 'Nova Recepta'}</h2>

      <form onSubmit={(e) => e.preventDefault()}>
        {/* Basic Information Section */}
        <div>
          <SectionHeading>Informació Bàsica</SectionHeading>
          <FormGroup>
            <FormLabel htmlFor="recipe-name">Nom</FormLabel>
            <FormInput type="text" id="recipe-name" name="name" value={recipeData.name || ''} onChange={handleInputChange} required disabled={isLoading} />
          </FormGroup>
          <FormGroup>
            <FormLabel htmlFor="recipe-type">Tipus</FormLabel>
            <FormSelect id="recipe-type" name="type" value={recipeData.type || 'ice cream recipe'} onChange={handleInputChange} disabled={isLoading}>
              <option value="ice cream recipe">Recepta de Gelat</option>
              <option value="not ice cream recipe">No és Recepta de Gelat</option>
            </FormSelect>
          </FormGroup>
          {recipeData.type === 'ice cream recipe' && (
            <FormGroup>
              <FormLabel htmlFor="recipe-category">Categoria</FormLabel>
              <FormSelect id="recipe-category" name="category" value={recipeData.category || 'ice cream'} onChange={handleInputChange} required disabled={isLoading}>
                <option value="ice cream">Gelat</option>
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
              <ComponentListItem>Encara no hi ha components.</ComponentListItem>
            )}
            {recipeData.ingredients?.map((item) => (
              <ComponentListItem key={`ing-${item.ingredient._id}`}>
                <div>
                  <ComponentName>{item.ingredient.name}</ComponentName>
                  <ComponentAmount>({item.amountGrams}g - Ingredient)</ComponentAmount>
                </div>
                <RemoveButton onClick={() => handleRemoveRecipeComponent(item.ingredient._id, 'ingredient')} disabled={isLoading}>Elimina</RemoveButton>
              </ComponentListItem>
            ))}
            {recipeData.linkedRecipes?.map((item) => (
              <ComponentListItem key={`rec-${item.recipe._id}`}>
                <div>
                  <ComponentName>{item.recipe.name}</ComponentName>
                  <ComponentAmount>({item.amountGrams}g - Recepta)</ComponentAmount>
                </div>
                <RemoveButton onClick={() => handleRemoveRecipeComponent(item.recipe._id, 'recipe')} disabled={isLoading}>Elimina</RemoveButton>
              </ComponentListItem>
            ))}
          </ComponentList>

          {/* Display Calculated Yield */}
          <FormGroup>
              <FormLabel>Rendiment Base (Només lectura)</FormLabel>
              <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: '500' }}>{currentTotalYield} g</p>
          </FormGroup>

          <AddComponentForm>
            {/* Section for adding Ingredients using SearchableSelector */}
            <div style={{ width: '100%', marginBottom: 'var(--space-lg)' }}>
              <FormLabel style={{ marginBottom: 'var(--space-sm)'}}>Afegeix Ingredient a la Recepta</FormLabel>
              <SearchableSelector<SelectableItem>
                queryKeyBase={ingredientsForFormQueryKeyBase}
                queryFn={fetchIngredientsForForm}
                onAdd={handleAddIngredientFromSelector} // Use the new handler
                placeholder="Cerca ingredient per afegir..."
                minSearchLength={minSearchLength}
                disabled={isLoading}
                showAddControls={true} // Explicitly true for clarity, though it's the default
              />
            </div>

            {/* Section for adding Linked Recipes using SearchableSelector */}
            <div style={{ width: '100%' }}>
              <FormLabel style={{ marginBottom: 'var(--space-sm)'}}>Afegeix Recepta Vinculada</FormLabel>
              <SearchableSelector<SelectableItem>
                queryKeyBase={componentQueryKeyBase} // Keep original key for this selector instance
                queryFn={fetchLinkedRecipeCandidates} // Use the new function that only fetches recipes
                onAdd={handleAddLinkedRecipe} // Use the new handler for linked recipes
                placeholder="Cerca i afegeix receptes vinculades..."
                minSearchLength={minSearchLength}
                disabled={isLoading}
                // showAddControls is true by default, which is what we want for linked recipes here
              />
            </div>
          </AddComponentForm>

          {/* --- CSV Import Section --- */}
          <FormGroup style={{ marginTop: 'var(--space-xl)', borderTop: 'var(--border-width) solid var(--border-color-light)', paddingTop: 'var(--space-xl)' }}>
              <FormLabel htmlFor="csv-file-input">Importa Ingredients des de CSV</FormLabel>
              <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
                  <FormInput
                      ref={fileInputRef}
                      type="file"
                      id="csv-file-input"
                      accept=".csv"
                      onChange={handleFileChange}
                      disabled={isLoading}
                      style={{ flexGrow: 1 }} // Allow input to take space
                  />
                  <SecondaryButton
                      type="button"
                      onClick={handleImportCsv}
                      disabled={!selectedCsvFile || isLoading}
                  >
                      {isParsingCsv ? 'Processant...' : 'Importa Fitxer'}
                  </SecondaryButton>
              </div>
              {selectedCsvFile && <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-color-light)', marginTop: 'var(--space-xs)' }}>Selected: {selectedCsvFile.name}</p>}
          </FormGroup>

          {/* --- Unmatched Ingredients Notice & Resolve Button --- */}
          {unmatchedIngredients.length > 0 && !isResolveModalOpen && (
              <div style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-lg)', border: '1px solid var(--warning-color)', borderRadius: 'var(--border-radius)', backgroundColor: 'var(--warning-color-light)' }}>
                  <h4 style={{ marginTop: 0, color: 'var(--warning-color-dark)' }}>Acció Requerida: {unmatchedIngredients.length} Ingredient{unmatchedIngredients.length > 1 ? 's' : ''} no trobat{unmatchedIngredients.length > 1 ? 's' : ''}</h4>
                  <p>Alguns ingredients del CSV no s'han pogut trobar automàticament a la base de dades.</p>
                  <SecondaryButton
                      type="button"
                      onClick={() => {
                          setResolvingIngredientIndex(0); // Start from the first one again
                          setIsResolveModalOpen(true);
                      }}
                      disabled={isLoading}
                  >
                      Resol No Trobats ({unmatchedIngredients.length})
                  </SecondaryButton>
              </div>
          )}
        </div>

        {/* Steps Section */}
        <div>
          <SectionHeading>Passos</SectionHeading>
          <StepList>
            {(recipeData.steps?.length === 0) && (
              <StepListItem>Encara no hi ha passos.</StepListItem> // Display message if no steps
            )}
            {recipeData.steps?.map((step, index) => (
              <StepListItem key={index}>
                <StepTextArea
                  value={step}
                  onChange={(e) => handleStepChange(index, e.target.value)}
                  rows={3} // Start with a reasonable height
                  disabled={isLoading}
                />
                <RemoveButton onClick={() => handleRemoveStep(index)} disabled={isLoading}>Elimina</RemoveButton>
              </StepListItem>
            ))}
          </StepList>
          <StepButtonContainer>
            <SecondaryButton type="button" onClick={handleAddStep} disabled={isLoading}>Afegeix Pas Nou</SecondaryButton>
            {recipeData.type === 'ice cream recipe' && (
              <>
                <SecondaryButton type="button" onClick={() => handleAppendDefaultSteps('ice cream')} disabled={isLoading}>Afegeix Passos per Defecte de Gelat</SecondaryButton>
                <SecondaryButton type="button" onClick={() => handleAppendDefaultSteps('sorbet')} disabled={isLoading}>Afegeix Passos per Defecte de Sorbet</SecondaryButton>
              </>
            )}
          </StepButtonContainer>
        </div>

        {/* Base Yield Section Removed - Now calculated automatically */}

        {/* Action Buttons */}
        <ButtonContainer>
          {/* Use PrimaryButton for Save, SecondaryButton for Cancel */}
          <SecondaryButton type="button" onClick={handleCancel} disabled={isLoading}>Cancel·la</SecondaryButton>
          <PrimaryButton type="button" onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Desant...' : (isEditing ? 'Desa Canvis' : 'Crea Recepta')}
          </PrimaryButton>
        </ButtonContainer>
      </form>

      {/* --- Resolve Unmatched Ingredient Modal --- */}
      {isResolveModalOpen && resolvingIngredientIndex !== null && unmatchedIngredients[resolvingIngredientIndex] && (
          <ResolveUnmatchedIngredientModal
              isOpen={isResolveModalOpen}
              onClose={handleCloseResolveModal}
              unmatchedItem={unmatchedIngredients[resolvingIngredientIndex]}
              itemNumber={resolvingIngredientIndex + 1}
              totalItems={unmatchedIngredients.length}
              onResolveSuccess={handleResolveSuccess}
              onSkip={handleSkipUnmatched}
              existingIngredientsQueryKeyBase={ingredientsForFormQueryKeyBase} // Use specific key for ingredient search
              fetchExistingIngredientsFn={fetchIngredientsForForm} // Use specific fetch for ingredients
          />
      )}
    </EditorContainer>
  );
};

// --- Sub-Component for Modal Content ---
// (Defined here for brevity, could be moved to its own file)

interface ResolveModalProps {
    isOpen: boolean;
    onClose: () => void;
    unmatchedItem: UnmatchedIngredient;
    itemNumber: number;
    totalItems: number;
    onResolveSuccess: (resolvedIngredient: Ingredient, originalCsvAmount: number) => void;
    onSkip: () => void;
    existingIngredientsQueryKeyBase: (string | undefined)[];
    fetchExistingIngredientsFn: (term: string) => Promise<SelectableItem[]>;
}

const ResolveUnmatchedIngredientModal: React.FC<ResolveModalProps> = ({
    isOpen,
    onClose,
    unmatchedItem,
    itemNumber,
    totalItems,
    onResolveSuccess,
    onSkip,
    existingIngredientsQueryKeyBase,
    fetchExistingIngredientsFn,
}) => {
    const queryClient = useQueryClient();
    const [selectedDbIngredient, setSelectedDbIngredient] = useState<SelectableItem | null>(null);
    const [newIngredientName, setNewIngredientName] = useState(unmatchedItem.name);
    const [isSubmittingAlias, setIsSubmittingAlias] = useState(false);
    const [isSubmittingNew, setIsSubmittingNew] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset local state when the unmatchedItem changes (moving to next item)
    useEffect(() => {
        setSelectedDbIngredient(null);
        setNewIngredientName(unmatchedItem.name);
        setError(null);
        setIsSubmittingAlias(false);
        setIsSubmittingNew(false);
    }, [unmatchedItem]);

    // --- Alias Handling ---
    const handleAddAlias = async () => {
        if (!selectedDbIngredient) return;
        setError(null);
        setIsSubmittingAlias(true);
        const dbIngredientId = selectedDbIngredient.id.substring(4); // Remove 'ing_' prefix

        try {
            const updatedIngredient = await addAliasToIngredient(dbIngredientId, unmatchedItem.name);
            // Invalidate queries related to ingredients after adding alias
            queryClient.invalidateQueries({ queryKey: ['ingredients'] });
            queryClient.invalidateQueries({ queryKey: existingIngredientsQueryKeyBase }); // Invalidate search results
            // Call the success handler passed from parent
            onResolveSuccess(updatedIngredient, unmatchedItem.amountGrams);
        } catch (err: unknown) { // Use unknown
            console.error("Failed to add alias:", err);
            // Type check before accessing properties
            const message = err instanceof Error ? err.message : 'An unknown error occurred';
            setError(`Failed to add alias: ${message}`);
        } finally {
            setIsSubmittingAlias(false);
        }
    };

    // --- New Ingredient Handling ---
    const handleCreateNew = async () => {
        setError(null);
        setIsSubmittingNew(true);
        const trimmedNewName = newIngredientName.trim();
        if (!trimmedNewName) {
            setError("New ingredient name cannot be empty.");
            setIsSubmittingNew(false);
            return;
        }

        const createDto: CreateIngredientApiDto = {
            name: trimmedNewName,
            // Add the original CSV name as an alias if it's different from the new name
            aliases: trimmedNewName.toLowerCase() !== unmatchedItem.name.toLowerCase() ? [unmatchedItem.name] : [],
        };

        try {
            const createdIngredient = await createIngredientApi(createDto);
            // Invalidate queries related to ingredients after creation
            queryClient.invalidateQueries({ queryKey: ['ingredients'] });
            queryClient.invalidateQueries({ queryKey: existingIngredientsQueryKeyBase }); // Invalidate search results
            // Call the success handler passed from parent
            onResolveSuccess(createdIngredient, unmatchedItem.amountGrams);
        } catch (err: unknown) { // Use unknown
            console.error("Failed to create ingredient:", err);
            // Type check before accessing properties
            const message = err instanceof Error ? err.message : 'An unknown error occurred';
            setError(`Failed to create ingredient: ${message}`);
        } finally {
            setIsSubmittingNew(false);
        }
    };

    // Filter function for SearchableSelector to only show ingredients
    const filterIngredientsOnly = useCallback(async (term: string): Promise<SelectableItem[]> => {
        const results = await fetchExistingIngredientsFn(term);
        return results.filter(item => item.type === 'ingredient');
    }, [fetchExistingIngredientsFn]);


    const isLoading = isSubmittingAlias || isSubmittingNew;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Resol Ingredient No Trobat (${itemNumber}/${totalItems})`}
            footer={
                <>
                    <SecondaryButton onClick={onSkip} disabled={isLoading}>Salta</SecondaryButton>
                    <SecondaryButton onClick={onClose} disabled={isLoading}>Cancel·la Tot</SecondaryButton>
                    {/* Action buttons are within the sections */}
                </>
            }
        >
            <p>Ingredient del CSV (Fila {unmatchedItem.originalRow}): <strong>{unmatchedItem.name}</strong> ({unmatchedItem.amountGrams}g)</p>
            <p>Aquest ingredient no s'ha trobat a la base de dades per nom o àlies.</p>

            {error && <p style={{ color: 'var(--danger-color)', fontWeight: '500' }}>Error: {error}</p>}

            {/* Option 1: Add as Alias */}
            <ResolveSection>
                <SectionSubHeading>Opció 1: Afegeix com a Àlies</SectionSubHeading>
                <p>Vincula "<strong>{unmatchedItem.name}</strong>" a un ingredient existent a la base de dades.</p>
                <FormGroup>
                    <FormLabel>Cerca Ingredient Existent</FormLabel>
                    <SearchableSelector<SelectableItem>
                        queryKeyBase={[...existingIngredientsQueryKeyBase, 'aliasSearch']} // Unique key for this search instance
                        queryFn={filterIngredientsOnly} // Use the filtered fetch function
                        onSelect={(item) => setSelectedDbIngredient(item)} // Just select, don't add amount
                        placeholder="Cerca ingredients a la base de dades..."
                        minSearchLength={2}
                        disabled={isLoading}
                        showAddControls={false} // Use the correct prop name
                    />
                </FormGroup>
                {selectedDbIngredient && (
                    <div style={{ marginTop: 'var(--space-sm)', padding: 'var(--space-sm)', backgroundColor: 'var(--surface-color-light)', borderRadius: 'var(--border-radius)' }}>
                        Seleccionat: <strong>{selectedDbIngredient.name}</strong>
                        <PrimaryButton
                            onClick={handleAddAlias}
                            disabled={isLoading}
                            style={{ marginLeft: 'var(--space-md)' }}
                        >
                            {isSubmittingAlias ? 'Afegint Àlies...' : `Afegeix "${unmatchedItem.name}" com a Àlies`}
                        </PrimaryButton>
                    </div>
                )}
            </ResolveSection>

            {/* Option 2: Create New Ingredient */}
            <ResolveSection>
                <SectionSubHeading>Opció 2: Crea Ingredient Nou</SectionSubHeading>
                <p>Afegeix "<strong>{unmatchedItem.name}</strong>" com a ingredient nou (o edita el nom a continuació).</p>
                <FormGroup>
                    <FormLabel htmlFor="new-ing-name">Nom de l'Ingredient</FormLabel>
                    <FormInput
                        id="new-ing-name"
                        type="text"
                        value={newIngredientName}
                        onChange={(e) => setNewIngredientName(e.target.value)}
                        disabled={isLoading}
                    />
                     {newIngredientName.toLowerCase() !== unmatchedItem.name.toLowerCase() && (
                        <small style={{ color: 'var(--text-color-light)', marginTop: 'var(--space-xs)'}}>
                            El nom original del CSV "{unmatchedItem.name}" s'afegirà com a àlies.
                        </small>
                    )}
                </FormGroup>
                 <PrimaryButton
                    onClick={handleCreateNew}
                    disabled={isLoading || !newIngredientName.trim()}
                >
                    {isSubmittingNew ? 'Creant...' : 'Crea Ingredient Nou'}
                </PrimaryButton>
            </ResolveSection>

        </Modal>
    );
};

// Simple styled components for the modal sections
const ResolveSection = styled.div`
    margin-top: var(--space-xl);
    padding-top: var(--space-lg);
    border-top: 1px dashed var(--border-color-light);

    &:first-of-type {
        margin-top: var(--space-lg);
        padding-top: 0;
        border-top: none;
    }
`;

const SectionSubHeading = styled.h4`
    margin-top: 0;
    margin-bottom: var(--space-md);
    color: var(--primary-color); /* Use primary color for emphasis */
`;