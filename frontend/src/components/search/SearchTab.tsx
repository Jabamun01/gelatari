import React, { useState, useEffect } from 'react';
import { styled } from '@linaria/react';
import { useQuery } from '@tanstack/react-query';
import { fetchRecipes, RecipeSearchResult, RecipeTypeFilter } from '../../api/recipes';
const SearchContainer = styled.div`
  display: flex;
  flex-direction: column;
  /* Padding is handled by parent TabContent */
  gap: var(--space-lg);
  max-width: 700px; /* Slightly wider */
  margin: var(--space-lg) auto; /* Add vertical margin and center */
`;

// Use global input styles defined in global.ts
// Inherits global input styles
const SearchInput = styled.input`
  font-size: var(--font-size-lg);
  /* Add a bit more vertical padding for a chunkier feel */
  padding-top: var(--space-md);
  padding-bottom: var(--space-md);
  box-shadow: var(--shadow-md); /* Add shadow */
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-sm); /* Use new spacing */
`;

const ToggleLabel = styled.label`
  cursor: pointer;
  user-select: none;
  color: var(--text-color-light); /* Use lighter text */
  font-size: var(--font-size-sm); /* Use smaller font size */
`;

const ToggleCheckbox = styled.input`
  cursor: pointer;
  width: 1rem; /* 16px */
  height: 1rem; /* 16px */
  accent-color: var(--primary-color); /* Style the check color */
`;

// Styled components for results display
const ResultsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  margin-top: var(--space-sm);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius);
  background-color: var(--surface-color);
  box-shadow: var(--shadow-md);
  max-height: 400px;
  overflow-y: auto;
  /* Add slight delay before showing scrollbar to avoid layout shift */
  scrollbar-gutter: stable;
`;

const ResultItem = styled.li`
  padding: var(--space-md) var(--space-lg);
  border-bottom: var(--border-width) solid var(--border-color-light);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease; /* Faster transition */
  font-weight: 500; /* Slightly bolder */

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: var(--primary-color); /* Use primary color for hover */
    color: var(--text-on-primary); /* White text on hover */
  }

  /* Focus style */
  &:focus {
      outline: none;
      background-color: var(--primary-color);
      color: var(--text-on-primary);
      /* Add focus ring inside the item */
      box-shadow: inset 0 0 0 2px var(--primary-color-dark);
  }
`;

const StatusMessage = styled.div`
  padding: var(--space-md) var(--space-lg); /* Use new spacing */
  color: var(--text-color-light); /* Use lighter text */
  font-style: italic;
  text-align: center; /* Center status messages */
`;
// Specific styled component for the 'no results' message item
const NoResultsItem = styled(ResultItem)`
  font-style: italic;
  color: var(--text-color-light);
  cursor: default;
  &:hover {
    background-color: transparent; /* Keep transparent */
    color: var(--text-color-light); /* Keep original color */
  }
  &:focus {
      background-color: transparent;
      color: var(--text-color-light);
      box-shadow: none; /* Remove focus ring */
  }
`;

// Define props for SearchTab
interface SearchTabProps {
  onOpenRecipeTab: (recipeId: string, recipeName: string) => void;
}

export const SearchTab = ({ onOpenRecipeTab }: SearchTabProps) => { // Destructure the prop
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [searchAll, setSearchAll] = useState(false); // Default to searching only ice cream recipes

  // Debounce effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms debounce delay

    // Cleanup function to cancel the timeout if searchTerm changes again quickly
    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]); // Only re-run the effect if searchTerm changes

  const typeFilter: RecipeTypeFilter | undefined = searchAll ? undefined : 'ice cream recipe';
  const minSearchLength = 2;

  // Fetch recipes using useQuery
  const { data: recipes, isLoading, isError, error } = useQuery<RecipeSearchResult[], Error>({
    // Query key includes debounced term and filter type to ensure re-fetching when they change
    queryKey: ['recipes', debouncedSearchTerm, typeFilter],
    // Query function calls our fetchRecipes API utility
    queryFn: () => fetchRecipes(debouncedSearchTerm, typeFilter),
    // Only enable the query if the debounced search term meets the minimum length
    enabled: debouncedSearchTerm.length >= minSearchLength,
    // Optional: Keep previous data while fetching new results for a smoother experience
    // keepPreviousData: true,
  });

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleToggleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchAll(event.target.checked);
  };

  return (
    <SearchContainer>
      <SearchInput
        type="search"
        placeholder="Search recipes..."
        value={searchTerm}
        onChange={handleSearchChange}
        aria-label="Search Recipes"
      />
      <ToggleContainer>
        <ToggleCheckbox
          type="checkbox"
          id="search-scope-toggle"
          checked={searchAll}
          onChange={handleToggleChange}
        />
        <ToggleLabel htmlFor="search-scope-toggle">
          {searchAll ? 'Searching All Recipes' : 'Searching Ice Cream/Sorbet Only'}
        </ToggleLabel>
      </ToggleContainer>

      {/* Results Area */}
      {debouncedSearchTerm.length < minSearchLength && searchTerm.length > 0 && (
         <StatusMessage>Please enter at least {minSearchLength} characters...</StatusMessage>
      )}

      {isLoading && debouncedSearchTerm.length >= minSearchLength && (
        <StatusMessage>Loading recipes...</StatusMessage>
      )}

      {isError && debouncedSearchTerm.length >= minSearchLength && (
        <StatusMessage>Error fetching recipes: {error?.message || 'Unknown error'}</StatusMessage>
      )}

      {!isLoading && !isError && debouncedSearchTerm.length >= minSearchLength && recipes && (
        <ResultsList>
          {recipes.length === 0 ? (
            <NoResultsItem key="no-results">
              No recipes found matching "{debouncedSearchTerm}".
            </NoResultsItem>
          ) : (
            recipes.map((recipe) => (
              <ResultItem
                key={recipe._id} // Use _id for the key
                // Call the passed-in handler on click
                onClick={() => onOpenRecipeTab(recipe._id, recipe.name)} // Pass _id
                role="button" // Indicate clickability
                tabIndex={0} // Make it focusable
                // Also call the handler on Enter/Space key press for accessibility
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpenRecipeTab(recipe._id, recipe.name); }} // Pass _id
              >
                {recipe.name}
              </ResultItem>
            ))
          )}
        </ResultsList>
      )}
    </SearchContainer>
  );
};