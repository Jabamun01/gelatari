import React, { useState, useEffect, useRef } from 'react';
import { styled } from '@linaria/react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '../../utils/hooks';
import { normalizeText } from '../../utils/formatting';

const SearchInput = styled.input`
  font-size: var(--font-size-base);
  padding: var(--space-sm) var(--space-md);
  box-shadow: var(--shadow-xs);
  width: 100%;
  margin-bottom: 0;
`;

const ResultsContainer = styled.div`
  position: relative;
`;

const ResultsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: var(--surface-color);
  border: var(--border-width) solid var(--border-color);
  border-top: none;
  border-radius: 0 0 var(--border-radius) var(--border-radius);
  box-shadow: var(--shadow-md);
  max-height: 280px;
  overflow-y: auto;
  z-index: 50;
  scrollbar-gutter: stable;
`;

const ResultItem = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm) var(--space-md);
  border-bottom: var(--border-width) solid var(--border-color-light);
  gap: var(--space-md);

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: 640px) {
    flex-wrap: wrap;
    gap: var(--space-sm);
  }
`;

const ItemDetails = styled.div`
  flex-grow: 1;
  overflow: hidden;
`;

const ItemName = styled.span`
  font-weight: 500;
  font-size: var(--font-size-sm);
  display: block;
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
  flex-shrink: 0;
`;

const AmountInput = styled.input`
  width: 64px;
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--font-size-sm);
  text-align: right;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  @media (max-width: 640px) {
    width: 56px;
  }
`;

const AddItemButton = styled.button`
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--font-size-sm);
  white-space: nowrap;
  background-color: var(--primary-color);
  color: var(--text-on-primary);
  border-color: var(--primary-color);
  min-height: 36px;

  &:hover:not(:disabled) {
    background-color: var(--primary-color-dark);
    border-color: var(--primary-color-dark);
  }

  &:disabled {
    opacity: 0.5;
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

export interface SelectableItem {
  id: string;
  name: string;
  type: 'ingredient' | 'recipe';
}

interface SearchableSelectorProps<T extends SelectableItem> {
  queryKeyBase: string | readonly unknown[];
  queryFn: (searchTerm: string) => Promise<T[]>;
  onAdd?: (item: T, amount: number) => void;
  onSelect?: (item: T) => void;
  placeholder?: string;
  minSearchLength?: number;
  initialSearchTerm?: string;
  disabled?: boolean;
  showAddControls?: boolean;
}

export const SearchableSelector = <T extends SelectableItem>({
  queryKeyBase,
  queryFn,
  onAdd,
  onSelect,
  placeholder = 'Cerca...',
  minSearchLength = 2,
  initialSearchTerm = '',
  disabled = false,
  showAddControls = true,
}: SearchableSelectorProps<T>) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [isListVisible, setIsListVisible] = useState(false);
  const [itemAmounts, setItemAmounts] = useState<Record<string, string>>({});
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const queryKey = [queryKeyBase, debouncedSearchTerm];

  const { data: results = [], isLoading, isError, error } = useQuery<T[], Error>({
    queryKey: queryKey,
    queryFn: () => queryFn(normalizeText(debouncedSearchTerm)),
    enabled: debouncedSearchTerm.length >= minSearchLength && !disabled,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    setItemAmounts({});
  }, [results]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = event.target.value;
    setSearchTerm(newSearchTerm);
    setIsListVisible(newSearchTerm.length > 0);
  };

  const handleAmountChange = (itemId: string, amount: string) => {
    setItemAmounts((prev) => ({ ...prev, [itemId]: amount }));
  };

  const handleAddItemClick = (item: T) => {
    if (onAdd) {
      const amountString = itemAmounts[item.id] || '';
      const amountNumber = parseFloat(amountString);

      if (!isNaN(amountNumber) && amountNumber > 0) {
        onAdd(item, amountNumber);
        setSearchTerm('');
        setIsListVisible(false);
        setItemAmounts({});
      } else {
        console.warn(
          `Invalid amount entered for item ${item.name} (ID: ${item.id}): ${amountString}`
        );
      }
    } else {
      console.warn('onAdd handler is not provided to SearchableSelector');
    }
  };

  const handleFocus = () => {
    if (searchTerm.length > 0) {
      setIsListVisible(true);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsListVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const showResultsList =
    isListVisible && !disabled && debouncedSearchTerm.length >= minSearchLength;
  const showLoading = showResultsList && isLoading;
  const showError = showResultsList && isError;
  const showNoResults =
    showResultsList && !isLoading && !isError && results.length === 0;
  const showItems =
    showResultsList && !isLoading && !isError && results.length > 0;
  const showMinLengthMessage =
    isListVisible &&
    !disabled &&
    searchTerm.length > 0 &&
    debouncedSearchTerm.length < minSearchLength;

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
        aria-expanded={showResultsList}
        aria-controls="search-results-list"
      />
      {(showResultsList || showMinLengthMessage) && (
        <ResultsList ref={null} id="search-results-list" role="listbox">
          {showLoading && <StatusMessage>Carregant...</StatusMessage>}
          {showError && (
            <StatusMessage>
              Error:{' '}
              {error instanceof Error ? error.message : 'Error desconegut'}
            </StatusMessage>
          )}
          {showMinLengthMessage && (
            <StatusMessage>
              Introdueix almenys {minSearchLength} caràcters...
            </StatusMessage>
          )}
          {showNoResults && (
            <StatusMessage>
              No s'han trobat resultats per &ldquo;{debouncedSearchTerm}
              &rdquo;.
            </StatusMessage>
          )}
          {showItems &&
            results.map((item: T) => {
              const currentAmount = itemAmounts[item.id] || '';
              const isAmountValid =
                !isNaN(parseFloat(currentAmount)) &&
                parseFloat(currentAmount) > 0;

              const handleItemClick = () => {
                if (!showAddControls && onSelect) {
                  onSelect(item);
                  setSearchTerm('');
                  setIsListVisible(false);
                  setItemAmounts({});
                }
              };

              return (
                <ResultItem
                  key={item.id}
                  onClick={handleItemClick}
                  style={{
                    cursor:
                      !showAddControls && onSelect ? 'pointer' : 'default',
                  }}
                  title={
                    !showAddControls && onSelect
                      ? `Seleccionar ${item.name}`
                      : ''
                  }
                >
                  <ItemDetails>
                    <ItemName>{item.name}</ItemName>
                    <ItemType>
                      {item.type === 'ingredient' ? 'Ingredient' : 'Recepta'}
                    </ItemType>
                  </ItemDetails>
                  {showAddControls && (
                    <>
                      <AmountInputContainer>
                        <AmountInput
                          type="number"
                          min="0"
                          step="any"
                          placeholder="g"
                          value={currentAmount}
                          onChange={(e) =>
                            handleAmountChange(item.id, e.target.value)
                          }
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Quantitat per ${item.name}`}
                        />
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-color-light)' }}>g</span>
                      </AmountInputContainer>
                      <AddItemButton
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddItemClick(item);
                        }}
                        disabled={!isAmountValid || disabled || !onAdd}
                      >
                        Afegir
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
