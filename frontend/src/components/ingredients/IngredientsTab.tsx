import { useState, useEffect } from 'react'; // Import useEffect
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'; // Import keepPreviousData
import { styled } from '@linaria/react';
import {
  getAllIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  PaginatedIngredientsResponse, // Import the new response type
} from '../../api/ingredients';
import { Ingredient, CreateIngredientDto, UpdateIngredientDto } from '../../types/ingredient';
import { useDebounce } from '../../utils/hooks'; // Import the debounce hook

// --- Styled Components ---

const PageTitle = styled.h2`
  text-align: center; /* Default centering */
  margin-bottom: var(--space-lg); /* Keep bottom margin */
  /* Inherits global h2 styles potentially */

  @media (min-width: 1024px) {
    grid-column: 1 / -1; /* Span across all columns in the grid */
  }
`;

const IngredientsContainer = styled.div`
  /* Padding is handled by parent TabContent */
  display: flex; /* Default: single column */
  flex-direction: column;
  gap: var(--space-xl);
  max-width: 1200px; /* Allow wider content for two columns */
  margin: var(--space-lg) auto;

  @media (min-width: 1024px) {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); /* Give more space to the list */
    align-items: start; /* Align items to the top of their grid cell */
    column-gap: var(--space-2xl); /* Explicitly set column gap */
    /* row-gap can be added if needed, but title margin might suffice */
    max-width: 1200px; /* Ensure container can expand */
  }
`;

// New wrapper for the left column content
const LeftColumnWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: var(--space-lg); /* Maintain gap between elements in the left column */
`;


const IngredientList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  border: var(--border-width) solid var(--border-color); /* Use new variables */
  border-radius: var(--border-radius);
  background-color: var(--surface-color); /* Use surface color */
  box-shadow: var(--shadow-sm); /* Add subtle shadow */
  overflow: hidden;
`;

const IngredientItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md) var(--space-lg);
  border-bottom: var(--border-width) solid var(--border-color-light);
  transition: background-color 0.15s ease; /* Add hover transition */

  &:last-child {
    border-bottom: none;
  }

  &:hover {
      background-color: var(--surface-color-light); /* Subtle hover */
  }
`;

// Base span for name
const BaseIngredientName = styled.span`
  flex-grow: 1;
  margin-right: var(--space-md);
  color: var(--text-color);
  font-weight: 500; /* Make names slightly bolder */
`;


const StatusMessage = styled.div`
  padding: var(--space-md) var(--space-lg); /* Use new spacing */
  color: var(--text-color-light); /* Use lighter text */
  font-style: italic;
  text-align: center;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: var(--space-sm); /* Use new spacing */
  margin-left: var(--space-md); /* Use new spacing */
  flex-shrink: 0; /* Prevent buttons from shrinking */
`;

// Basic button styling, can be refined
// Inherit global button styles and customize for subtle actions
// Inherit global button styles and customize for subtle actions
const ActionButton = styled.button`
  /* Inherits base styles */
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--font-size-sm);
  font-weight: 500;
  border: var(--border-width) solid var(--border-color);
  background-color: var(--surface-color);
  color: var(--text-color);
  box-shadow: none;

  &:hover:not(:disabled) {
    background-color: var(--background-color);
    border-color: var(--border-color);
  }
`;

// Inherit ActionButton styles and make it danger-themed
const DeleteButton = styled(ActionButton)`
  border-color: transparent; /* Make border transparent initially */
  color: var(--danger-color);

   &:hover:not(:disabled) {
    background-color: var(--danger-color);
    color: var(--text-on-primary);
    border-color: var(--danger-color); /* Show border on hover */
  }
`;


const AddIngredientForm = styled.form`
  margin-top: var(--space-xl); /* Default top margin */
  padding: var(--space-lg);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  background-color: var(--surface-color);
  box-shadow: var(--shadow-sm);

  h3 {
    /* Inherits global h3 styles */
    margin-bottom: var(--space-md);
    font-size: var(--font-size-lg); /* Match other section headings */
  }

  label {
    font-weight: 500;
    color: var(--text-color);
    font-size: var(--font-size-sm);
    margin-bottom: var(--space-xs); /* Add margin below label */
    display: block; /* Ensure label is on its own line */
  }

  input[type="text"] {
    /* Inherits global input styles */
    /* flex-grow: 1; - Not needed in column layout */
  }

  input[type="checkbox"] {
     width: 1rem;
     height: 1rem;
     accent-color: var(--primary-color);
     margin-right: var(--space-sm);
     cursor: pointer;
     vertical-align: middle; /* Align checkbox better with label */
  }

  /* Style the submit button */
  button[type="submit"] {
      /* Inherits global button styles */
      background-color: var(--primary-color);
      color: var(--text-on-primary);
      border-color: var(--primary-color);
      align-self: flex-start;

      &:hover:not(:disabled) {
          background-color: var(--primary-color-dark);
          border-color: var(--primary-color-dark);
      }
  }

  /* Remove .form-row as labels are now above inputs */
  /* .form-row { ... } */

  .checkbox-row {
      display: flex;
      align-items: center;
      gap: var(--space-xs);
      margin-bottom: var(--space-sm);
      /* Adjust label style within checkbox row */
      label {
          margin-bottom: 0; /* Remove bottom margin */
          display: inline; /* Allow label next to checkbox */
      }
  }

  .status-indicator {
      font-style: italic;
      color: var(--danger-color);
      font-size: var(--font-size-sm);
      height: 1.2em; /* Keep reserved space */
      margin-top: calc(var(--space-xs) * -1); /* Pull up slightly */
  }

  @media (min-width: 1024px) {
      margin-top: 0; /* Remove top margin when in grid */
  }
`;

// --- Pagination Styles ---
const PaginationControls = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-md);
  margin-top: var(--space-lg);
  margin-bottom: var(--space-lg); /* Add margin below pagination */

  button {
    /* Inherits base button styles */
    padding: var(--space-sm) var(--space-md);
  }

  span {
    font-size: var(--font-size-sm);
    color: var(--text-color-light);
  }
`;

// --- Controls Container Styles (for Search + Limit) ---
const ControlsContainer = styled.div`
    display: flex;
    align-items: center;
    gap: var(--space-lg); /* Larger gap between search and limit */
    margin-bottom: var(--space-lg); /* Add margin below controls */
`;

// --- Search Input Styles ---
// Inherits global input styles
const SearchInput = styled.input`
  flex-grow: 1; /* Take up available space */
  font-size: var(--font-size-md); /* Slightly smaller than main search */
  padding-top: var(--space-sm);
  padding-bottom: var(--space-sm);
  box-shadow: var(--shadow-sm); /* Subtle shadow */
`;


// --- Limit Selector Styles (now part of ControlsContainer) ---
const LimitSelector = styled.div`
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    flex-shrink: 0; /* Prevent shrinking */

    label {
        font-size: var(--font-size-sm);
        color: var(--text-color-light);
        white-space: nowrap; /* Prevent label wrapping */
    }

    select {
        padding: var(--space-xs) var(--space-sm);
        border: var(--border-width) solid var(--border-color);
        border-radius: var(--border-radius);
        background-color: var(--surface-color);
        color: var(--text-color);
        font-size: var(--font-size-sm);
    }
`;


// --- Component Implementation ---

const DEFAULT_LIMIT = 5;
const LIMIT_OPTIONS = [5, 10, 20, 50];

export const IngredientsTab = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // 300ms debounce

  const { data, isLoading, isFetching, isError, error } = useQuery<PaginatedIngredientsResponse, Error, PaginatedIngredientsResponse, readonly (string | number)[]>({
    // Include page, limit, and debounced search term in the query key
    queryKey: ['ingredients', currentPage, limit, debouncedSearchTerm],
    // Pass all params to the query function
    queryFn: () => getAllIngredients(currentPage, limit, debouncedSearchTerm),
    // Use placeholderData with keepPreviousData for smoother UX in TanStack Query v5+
    placeholderData: keepPreviousData,
  });

  // Effect to reset page to 1 when search term or limit changes
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
    // We only want this effect to run when the *debounced* term or limit changes,
    // not the instant search term or the page number itself.
  }, [debouncedSearchTerm, limit]); // eslint-disable-line react-hooks/exhaustive-deps

  // Extract ingredients and pagination info safely
  const ingredients: Ingredient[] | undefined = data?.data;
  const pagination = data?.pagination;

  // State for the new ingredient form
  const [newName, setNewName] = useState('');

  // Get QueryClient instance
  const queryClient = useQueryClient();

  // Mutation for creating an ingredient
  const createMutation = useMutation({
    mutationFn: createIngredient,
    onSuccess: () => {
      // Invalidate and refetch the ingredients list
      // Invalidate the base key; React Query will refetch the active query matching ['ingredients', currentPage, ...]
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      // Clear the form
      setNewName('');
      // Optional: Show success notification (can be added later)
      console.log("Ingredient added successfully!");
    },
    onError: (error) => {
      // Handle error (e.g., display message - duplicate name?)
      console.error("Error creating ingredient:", error);
      // Optional: Show error notification (can be added later)
      alert(`Error adding ingredient: ${error.message || 'Unknown error'}`);
    },
  });

  // Form submission handler
  const handleAddIngredient = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newName.trim()) {
      // Basic validation: name is required
      alert("El nom de l'ingredient no pot estar buit."); // Replace with better UI later
      return;
    }
    const ingredientData: CreateIngredientDto = {
      name: newName.trim(),
    };
    createMutation.mutate(ingredientData);
  };

  // --- Mutations for Update and Delete ---

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateIngredientDto }) =>
      updateIngredient(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      // Optional: Show success notification
    },
    onError: (error) => {
      console.error("Error updating ingredient:", error);
      alert(`Error en actualitzar l'ingredient: ${error.message || 'Error desconegut'}`);
      // Optional: Show error notification
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteIngredient, // Pass the API function directly
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      // Optional: Show success notification
    },
    onError: (error) => {
      console.error("Error deleting ingredient:", error);
      alert(`Error en eliminar l'ingredient: ${error.message || 'Error desconegut'}`);
      // Optional: Show error notification
    },
  });

  // --- Handlers for Update and Delete ---


  // Handler for search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleDeleteIngredient = (id: string, name: string) => {
     // Prevent action if another mutation is already in progress for simplicity
    if (updateMutation.isPending || deleteMutation.isPending) return;
    // Simple confirmation dialog
    if (window.confirm(`Esteu segur que voleu eliminar "${name}"? Això podria afectar receptes existents.`)) {
       deleteMutation.mutate(id);
    }
  };

  // Handler for changing the limit
  const handleLimitChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = parseInt(event.target.value, 10);
    setLimit(newLimit);
    setCurrentPage(1); // Reset to first page when limit changes
  };

  return (
    <IngredientsContainer>
      <PageTitle>Gestió d'Ingredients</PageTitle>

      {/* Left Column Content */}
      <LeftColumnWrapper>
        {/* Title moved outside */}

        {/* Search and Limit Controls */}
        <ControlsContainer>
            <SearchInput
                type="search"
                placeholder="Cerca ingredients..."
                value={searchTerm}
                onChange={handleSearchChange}
                aria-label="Search Ingredients"
                disabled={isLoading} // Disable while initial load
            />
            <LimitSelector>
                <label htmlFor="items-per-page">Per pàgina:</label>
                <select
                    id="items-per-page"
                    value={limit}
                    onChange={handleLimitChange}
                    disabled={isLoading || isFetching} // Disable during any fetch
                >
                    {LIMIT_OPTIONS.map(option => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            </LimitSelector>
        </ControlsContainer>

        {/* Loading/Error States for the list */}
        {isLoading && <StatusMessage>Carregant ingredients...</StatusMessage>}
        {isError && (
          <StatusMessage>
            Error al carregar ingredients: {error?.message || 'Error desconegut'}
          </StatusMessage>
        )}

        {/* Display Ingredient List & Pagination - Conditionally render based on loading/error states */}
        {!isLoading && !isError && ingredients && pagination && (
           <>
              <IngredientList aria-live="polite"> {/* Announce changes for screen readers */}
              {ingredients.length === 0 ? (
                  <IngredientItem>
                      {debouncedSearchTerm
                          ? `No s'han trobat ingredients que coincideixin amb "${debouncedSearchTerm}"`
                          : "No s'han trobat ingredients"}
                  </IngredientItem>
              ) : (
                  ingredients.map((ingredient: Ingredient) => { // Add explicit type
                  return (
                      <IngredientItem key={ingredient._id}>
                      <BaseIngredientName>
                          {ingredient.name}
                      </BaseIngredientName>
                      <ButtonContainer>
                          <DeleteButton
                          onClick={() => handleDeleteIngredient(ingredient._id, ingredient.name)}
                          disabled={updateMutation.isPending || deleteMutation.isPending}
                          >
                          Eliminar
                          </DeleteButton>
                      </ButtonContainer>
                      </IngredientItem>
                  );
                  })
              )}
              </IngredientList>

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                  <PaginationControls>
                      <button
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1 || isLoading || isFetching}
                      >
                          Anterior
                      </button>
                      <span>
                          Pàgina {pagination.currentPage} de {pagination.totalPages}
                      </span>
                      <button
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.totalPages))}
                          disabled={currentPage === pagination.totalPages || isLoading || isFetching}
                      >
                          Següent
                      </button>
                  </PaginationControls>
              )}
           </>
        )}
      </LeftColumnWrapper>

      {/* Right Column Content (Add Ingredient Form) */}
      <AddIngredientForm onSubmit={handleAddIngredient}>
        <h3>Afegir Nou Ingredient</h3>
        {/* Use column layout now */}
        <div>
          <label htmlFor="ingredient-name">Nom:</label>
          <input
            id="ingredient-name"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="p.ex., Farina"
            required
            disabled={createMutation.isPending}
          />
        </div>
        <button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Afegint...' : 'Afegir Ingredient'}
        </button>
         <div className="status-indicator">
            {createMutation.isError ? `Error: ${createMutation.error?.message}` : ''}
         </div>
      </AddIngredientForm>
    </IngredientsContainer>
  );
};