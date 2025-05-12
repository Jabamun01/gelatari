import React, { useState, useEffect, useRef } from 'react'; // Removed useCallback
import { styled } from '@linaria/react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '../../utils/hooks'; // Assuming a debounce hook exists or will be created

// --- Reusable Styles (Consider moving to a shared location if used elsewhere) ---

// Inherits global input styles
const SearchInput = styled.input`
  font-size: var(--font-size-base); /* Use base size for component context */
  padding: var(--space-sm) var(--space-md);
  box-shadow: var(--shadow-sm); /* Subtle shadow */
  width: 100%; /* Take full width of container */
  margin-bottom: var(--space-xs); /* Space before results */
`;

const ResultsContainer = styled.div`
  position: relative; /* Needed for absolute positioning of the list */
`;

const ResultsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  position: absolute;
  top: 100%; /* Position below the input */
  left: 0;
  right: 0;
  background-color: var(--surface-color);
  border: var(--border-width) solid var(--border-color);
  border-top: none; /* Avoid double border with input */
  border-radius: 0 0 var(--border-radius) var(--border-radius);
  box-shadow: var(--shadow-md);
  max-height: 250px; /* Limit height */
  overflow-y: auto;
  z-index: 10; /* Ensure it appears above other content */
  scrollbar-gutter: stable;
`;

// Styles for the result item, now including amount input and button
const ResultItem = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm) var(--space-md);
  border-bottom: var(--border-width) solid var(--border-color-light); /* Use lighter border */
  gap: var(--space-md);

  &:last-child {
    border-bottom: none;
  }

  /* No hover effect on the whole item anymore */
`;

const ItemDetails = styled.div`
  flex-grow: 1;
  overflow: hidden; /* Prevent long names from breaking layout */
`;

const ItemName = styled.span`
  font-weight: 500;
  font-size: var(--font-size-sm);
  display: block; /* Ensure it takes space */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ItemType = styled.span`
  font-size: var(--font-size-xs);
  color: var(--text-color-light);
  display: block;
`;



const AmountInputContainer = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-xs);
`;

// Inherits global input styles, but smaller for the list context
const AmountInput = styled.input`
  width: 60px; /* Smaller width */
  padding: var(--space-xs) var(--space-sm); /* Smaller padding */
  font-size: var(--font-size-sm);
  text-align: right;
  /* Remove default browser arrows for number input */
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

// Inherits global button styles, but smaller
const AddItemButton = styled.button`
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--font-size-sm);
  white-space: nowrap;
  /* Add specific styles if needed, e.g., primary color */
  background-color: var(--primary-color);
  color: var(--text-on-primary);
  border-color: var(--primary-color);

  &:hover:not(:disabled) {
    background-color: var(--primary-color-dark);
    border-color: var(--primary-color-dark);
  }

  &:disabled {
    background-color: var(--disabled-color);
    border-color: var(--disabled-color);
    cursor: not-allowed;
  }
`;

const StatusMessage = styled.div`
  padding: var(--space-sm) var(--space-md);
  color: var(--text-color-light);
  font-style: italic;
  font-size: var(--font-size-sm);
  text-align: center;
`;

// --- Component Props ---

// Generic type for selectable items
export interface SelectableItem {
  id: string; // Unique identifier (e.g., 'ing_123', 'rec_456')
  name: string; // Display name
  type: 'ingredient' | 'recipe'; // Type identifier
}

interface SearchableSelectorProps<T extends SelectableItem> {
  queryKeyBase: string | readonly unknown[]; // Base key for react-query (e.g., 'componentSearch')
  queryFn: (searchTerm: string) => Promise<T[]>; // Function to fetch data
  onAdd?: (item: T, amount: number) => void; // Callback when Add button is clicked (now optional)
  onSelect?: (item: T) => void; // Callback when an item is selected (no amount)
  placeholder?: string; // Placeholder text for the input
  minSearchLength?: number; // Minimum characters to trigger search
  initialSearchTerm?: string; // Optional initial value for the input
  disabled?: boolean; // Disable the input
  showAddControls?: boolean; // Show amount input and add button (default: true)
}

// --- Component Implementation ---

export const SearchableSelector = <T extends SelectableItem>({
  queryKeyBase,
  queryFn,
  onAdd, // Can be undefined now
  onSelect, // New prop
  placeholder = "Search...",
  minSearchLength = 2,
  initialSearchTerm = '',
  disabled = false,
  showAddControls = true, // Default to true
}: SearchableSelectorProps<T>) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [isListVisible, setIsListVisible] = useState(false);
  // highlightedIndex is no longer needed for selection, removing it.
  // State to hold amounts for each item in the results list
  const [itemAmounts, setItemAmounts] = useState<Record<string, string>>({}); // { itemId: amountString }
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // 300ms debounce
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const queryKey = [queryKeyBase, debouncedSearchTerm];

  // Explicitly type useQuery
  const { data: results = [], isLoading, isError, error } = useQuery<T[], Error>({
    queryKey: queryKey,
    queryFn: () => queryFn(debouncedSearchTerm),
    enabled: debouncedSearchTerm.length >= minSearchLength && !disabled, // Fetch whenever term is long enough
    staleTime: 5 * 60 * 1000, // 5 minutes
    // keepPreviousData: true, // Consider if needed for smoother loading
  });

  // Clear amounts when the actual results change
  useEffect(() => {
    setItemAmounts({});
  }, [results]); // Dependency array includes results

  // --- Event Handlers ---

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = event.target.value;
    setSearchTerm(newSearchTerm);
    // Show list if input has content, hide if empty
    setIsListVisible(newSearchTerm.length > 0);
    // Reset amounts when typing (optional, could keep them)
    // setItemAmounts({});
  };

  // Handle amount change for a specific item
  const handleAmountChange = (itemId: string, amount: string) => {
    setItemAmounts(prev => ({ ...prev, [itemId]: amount }));
  };

  // Handle clicking the Add button for a specific item
  const handleAddItemClick = (item: T) => {
    // Ensure onAdd exists before calling
    if (onAdd) {
        const amountString = itemAmounts[item.id] || ''; // Get amount string
        const amountNumber = parseInt(amountString, 10); // Parse it

        if (!isNaN(amountNumber) && amountNumber > 0) { // Check if valid number > 0
            onAdd(item, amountNumber); // Call the callback
            // Clear search and hide list after successful add
            setSearchTerm('');
            setIsListVisible(false);
            setItemAmounts({}); // Clear amounts
        } else {
            // Optional: Add visual feedback for invalid amount?
            console.warn(`Invalid amount entered for item ${item.name} (ID: ${item.id}): ${amountString}`); // Use amountString here
        }
    } else {
        console.warn('onAdd handler is not provided to SearchableSelector');
    }
  };

  // handleSelectItem and highlightedIndex are removed as selection is replaced by direct add

  const handleFocus = () => {
    // Show list on focus if there's already a search term potentially
    // Show list on focus only if there's already text
    if (searchTerm.length > 0) {
      setIsListVisible(true);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsListVisible(false);
        // setHighlightedIndex(-1); // Removed
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Keyboard navigation logic removed as item selection is no longer the primary action.
  // Tabbing between amount inputs and Add buttons will follow default browser behavior.
  // Could add more complex keyboard handling later if needed (e.g., arrow keys moving between items).

  // Scrolling logic removed as highlighting is removed.


  // --- Render Logic ---

  const showResultsList = isListVisible && !disabled && debouncedSearchTerm.length >= minSearchLength;
  const showLoading = showResultsList && isLoading;
  const showError = showResultsList && isError;
  const showNoResults = showResultsList && !isLoading && !isError && results.length === 0;
  const showItems = showResultsList && !isLoading && !isError && results.length > 0;
  // Show min length message only if list is visible but search term is too short
  const showMinLengthMessage = isListVisible && !disabled && searchTerm.length > 0 && debouncedSearchTerm.length < minSearchLength;

  return (
    <ResultsContainer ref={containerRef}>
      <SearchInput
        ref={inputRef}
        type="search"
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={handleFocus}
        disabled={disabled}
        aria-autocomplete="list"
        aria-expanded={showResultsList} // Expand if list is potentially visible
        aria-controls="search-results-list" // ID of the results list
        // aria-activedescendant removed
      />
      {(showResultsList || showMinLengthMessage) && ( // Show list container if results are expected or min length message needed
        <ResultsList ref={listRef} id="search-results-list" role="listbox"> {/* Role might change as items aren't directly selectable */}
          {showLoading && <StatusMessage>Loading...</StatusMessage>}
          {showError && <StatusMessage>Error: {error instanceof Error ? error.message : 'Unknown error'}</StatusMessage>}
          {showMinLengthMessage && <StatusMessage>Enter at least {minSearchLength} characters...</StatusMessage>}
          {showNoResults && <StatusMessage>No results found for "{debouncedSearchTerm}".</StatusMessage>}
          {showItems && results.map((item: T) => { // Add explicit type for item
            const currentAmount = itemAmounts[item.id] || '';
            const isAmountValid = !isNaN(parseInt(currentAmount, 10)) && parseInt(currentAmount, 10) > 0;
            const handleItemClick = () => {
                if (!showAddControls && onSelect) {
                    onSelect(item);
                    setSearchTerm(''); // Clear search on select
                    setIsListVisible(false);
                    setItemAmounts({});
                }
                // If showAddControls is true, clicking the item does nothing by default
            };

            return (
              <ResultItem
                key={item.id}
                onClick={handleItemClick}
                style={{ cursor: (!showAddControls && onSelect) ? 'pointer' : 'default' }} // Add pointer cursor if selectable
                title={(!showAddControls && onSelect) ? `Select ${item.name}` : ''} // Add title attribute for clarity
              >
                <ItemDetails>
                  <ItemName>{item.name}</ItemName>
                  <ItemType>
                    {item.type === 'ingredient' ? 'Ingredient' : 'Recipe'}
                  </ItemType>
                </ItemDetails>
                {showAddControls && ( // Conditionally render amount/add controls
                  <>
                    <AmountInputContainer>
                      <AmountInput
                        type="number"
                        min="1"
                        placeholder="g"
                        value={currentAmount}
                        onChange={(e) => handleAmountChange(item.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()} // Prevent click from closing list
                        aria-label={`Amount for ${item.name}`}
                      />
                      <span>g</span>
                    </AmountInputContainer>
                    <AddItemButton
                      type="button"
                      onClick={(e) => {
                          e.stopPropagation(); // Prevent click from closing list
                          handleAddItemClick(item);
                      }}
                      disabled={!isAmountValid || disabled || !onAdd} // Also disable if onAdd is not provided
                    >
                      Add
                    </AddItemButton>
                  </>
                )}
              </ResultItem>
            );
          })}
        </ResultsList>
      )}
    </ResultsContainer>
  );
};