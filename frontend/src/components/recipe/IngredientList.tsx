import { styled } from '@linaria/react';
import React, { useState, useCallback } from 'react'; // Import useState and useCallback
import { RecipeIngredient, LinkedRecipeInfo } from '../../types/recipe';
import { formatAmount } from '../../utils/formatting';

// --- Constants ---
const COMPLETION_THRESHOLD = 0.999; // Allow for minor floating point inaccuracies

// --- Props Interfaces ---
interface IngredientListProps {
  ingredients: RecipeIngredient[];
  linkedRecipes: LinkedRecipeInfo[];
  scaleFactor: number;
  onOpenRecipeTab: (recipeId: string, recipeName: string, initialScaleFactor?: number) => void;
  isProductionMode: boolean;
  trackedAmounts: Record<string, number>;
  onAmountTracked: (ingredientId: string, addedAmountGrams: number) => void;
}

interface ProductionIngredientItemProps {
  itemId: string;
  itemName: string;
  targetAmountGrams: number;
  trackedAmountGrams: number;
  onAmountTracked: (ingredientId: string, addedAmountGrams: number) => void;
}

// --- Styled Components ---
const SectionHeading = styled.h3`
  margin-bottom: var(--space-md);
  font-size: var(--font-size-lg);
`;

const IngredientListContainer = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  /* Styles removed: border, border-radius, background-color, box-shadow, overflow */
  /* These are now handled by the parent wrapper in RecipeTab for grid layout */
`;

const IngredientItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md) var(--space-lg);
  border-bottom: var(--border-width) solid var(--border-color-light);
  transition: background-color 0.15s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: var(--surface-color-light);
  }
`;

const BaseIngredientName = styled.span`
  flex-grow: 1;
  margin: 0 var(--space-md); /* Adjust margin for checkbox */
  color: var(--text-color);
  font-weight: 500;
`;

const IngredientAmount = styled.span`
  font-weight: 500;
  white-space: nowrap;
  color: var(--text-color-light);
  font-size: var(--font-size-sm);
  min-width: 60px;
  text-align: right;
`;

const LinkedRecipeButton = styled.button`
  background: transparent;
  border: var(--border-width) solid var(--border-color);
  padding: var(--space-xs) var(--space-sm); /* Add some padding */
  margin: 0 var(--space-md); /* Adjust margin for checkbox */
  font: inherit;
  font-weight: 500;
  color: var(--primary-color);
  text-decoration: none;
  cursor: pointer;
  display: inline;
  text-align: left;
  flex-grow: 1;
  transition: color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease;

  &:hover {
    color: var(--primary-color-dark);
    text-decoration: underline;
    background-color: var(--surface-color-hover);
    border-color: var(--border-color-hover);
  }

  &:focus {
    outline: none;
    text-decoration: underline;
    color: var(--primary-color-dark);
    background-color: var(--surface-color-hover);
    border-color: var(--border-color-hover);
    box-shadow: 0 0 0 2px var(--focus-ring-color);
  }
`;

// --- Production Mode Specific Styles ---
const ProdItemWrapper = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  cursor: pointer; /* Indicate interactivity */
`;

const LargeCheckbox = styled.input`
  /* Reset default checkbox styles */
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-color: var(--surface-color-light);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius-sm);
  padding: 0;
  margin: 0;
  display: inline-block;
  position: relative;
  cursor: pointer;

  /* Size */
  width: 28px; /* Larger size */
  height: 28px;
  flex-shrink: 0; /* Prevent shrinking */

  /* Custom checkmark */
  &:checked {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
  }

  &:checked::after {
    content: '✔'; /* Checkmark character */
    font-size: 18px; /* Adjust size */
    color: var(--text-color-on-primary); /* White checkmark */
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    font-weight: bold;
  }

  /* Focus state */
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--primary-color-light);
  }
`;

const QuantityDisplay = styled.button<{ state: 'not-added' | 'partial' | 'full' }>`
  background: transparent;
  border: var(--border-width) solid var(--border-color);
  padding: var(--space-xs) var(--space-sm);
  margin: 0;
  font: inherit;
  font-size: var(--font-size-sm);
  font-weight: 500;
  white-space: nowrap;
  text-align: right;
  cursor: pointer;
  border-radius: var(--border-radius-sm);
  transition: background-color 0.15s ease, color 0.15s ease, text-decoration 0.15s ease;
  min-width: 100px; /* Ensure enough space */
  color: ${({ state }) =>
    state === 'full' ? 'var(--success-color)' :
    state === 'partial' ? 'var(--warning-color-dark)' : // Use a distinct color for partial
    'var(--text-color-light)'};
  text-decoration: ${({ state }) => (state === 'full' ? 'line-through' : 'none')};

  &:hover {
    background-color: var(--surface-color-hover);
    border-color: var(--border-color-hover);
  }

  &:focus {
    outline: none;
    background-color: var(--surface-color-hover);
    border-color: var(--border-color-hover);
    box-shadow: 0 0 0 2px var(--focus-ring-color);
  }
`;

const PartialInputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-xs);
`;

const PartialInput = styled.input`
  width: 70px;
  padding: var(--space-xs) var(--space-sm);
  text-align: right;
  font-size: var(--font-size-sm);
  box-shadow: none;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius-sm);
  background-color: var(--surface-color-light);

  /* Hide spinner buttons */
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  &:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 1px var(--primary-color-light);
  }
`;

const InputUnitLabel = styled.span`
    font-size: var(--font-size-xs);
    color: var(--text-color-lighter);
    white-space: nowrap;
`;

// --- Production Ingredient Item Component ---
const ProductionIngredientItem: React.FC<ProductionIngredientItemProps> = ({
  itemId,
  itemName,
  targetAmountGrams,
  trackedAmountGrams,
  onAmountTracked,
}) => {
  const [isPartialInputVisible, setIsPartialInputVisible] = useState(false);
  const [partialInputValue, setPartialInputValue] = useState(''); // Local state for input

  const isFullyAdded = trackedAmountGrams >= targetAmountGrams * COMPLETION_THRESHOLD;
  const isPartiallyAdded = trackedAmountGrams > 0 && !isFullyAdded;
  const state = isFullyAdded ? 'full' : isPartiallyAdded ? 'partial' : 'not-added';

  const handleCheckboxChange = useCallback(() => {
    if (isFullyAdded) {
      onAmountTracked(itemId, 0); // Reset if clicking when full
    } else {
      onAmountTracked(itemId, targetAmountGrams); // Mark as full
    }
    setIsPartialInputVisible(false); // Hide input on checkbox change
    setPartialInputValue(''); // Clear input value
  }, [isFullyAdded, itemId, targetAmountGrams, onAmountTracked]);

  const handleQuantityClick = useCallback(() => {
    if (!isFullyAdded) {
      setIsPartialInputVisible(true);
      // Pre-fill input with current tracked amount if partial, otherwise empty
      setPartialInputValue(isPartiallyAdded ? String(Math.round(trackedAmountGrams)) : '');
    }
    // If fully added, clicking does nothing for now (could potentially reset?)
  }, [isFullyAdded, isPartiallyAdded, trackedAmountGrams]);

  const handlePartialInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPartialInputValue(e.target.value); // Update local input state immediately
  }, []);

  const handlePartialInputBlur = useCallback(() => {
      const value = parseFloat(partialInputValue);
      if (!isNaN(value) && value >= 0) {
          onAmountTracked(itemId, value); // Update parent state
          setIsPartialInputVisible(false); // Always hide input after valid entry
          setPartialInputValue(''); // Clear input
      } else if (partialInputValue === '') {
          onAmountTracked(itemId, 0);
          setIsPartialInputVisible(false); // Hide input if cleared
      } // else: Input is invalid (not a number or negative) - keep input visible for correction
  }, [partialInputValue, itemId, onAmountTracked]);

   const handlePartialInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handlePartialInputBlur(); // Apply value on Enter
      (e.target as HTMLInputElement).blur(); // Remove focus
    } else if (e.key === 'Escape') {
      setIsPartialInputVisible(false); // Hide on Escape
      setPartialInputValue(''); // Reset input value
    }
  }, [handlePartialInputBlur]);


  const renderQuantityDisplay = () => {
    const useKg = targetAmountGrams >= 1000; // Determine unit based on target
    const unit = useKg ? 'kg' : 'g';
    const divisor = useKg ? 1000 : 1;
    const decimalPlaces = useKg ? 1 : 0;

    // Helper to format a gram value based on the determined unit (kg or g)
    const formatValue = (grams: number) => {
        const value = grams / divisor;
        // Use toFixed for kg, Math.round for g
        return useKg ? value.toFixed(decimalPlaces) : String(Math.round(value));
    };

    const formattedTracked = formatValue(trackedAmountGrams);
    const formattedTargetDisplay = formatValue(targetAmountGrams); // Consistently formatted target

    // For remaining amount, format based on its own value using the original helper
    const remainingRaw = Math.max(0, targetAmountGrams - trackedAmountGrams);
    const formattedRemaining = formatAmount(remainingRaw);

    switch (state) {
      case 'full':
        // Use the consistently formatted target for the display
        return `${formattedTargetDisplay}${unit} ✔️`;
      case 'partial':
        // Display consistently formatted tracked and target amounts
        return `${formattedTracked} / ${formattedTargetDisplay} ${unit} (restants: ${formattedRemaining})`;
      case 'not-added':
      default:
        // Use the consistently formatted target for the display
        return `${formattedTargetDisplay}${unit}`;
    }
  };

  return (
    <ProdItemWrapper onClick={handleCheckboxChange}>
      <LargeCheckbox
        type="checkbox"
        checked={isFullyAdded}
        onChange={handleCheckboxChange}
        onClick={(e: React.MouseEvent) => e.stopPropagation()} // Prevent double toggle when checkbox itself is clicked
        aria-label={`Mark ${itemName} as added`}
      />
      <BaseIngredientName>{itemName}</BaseIngredientName>
      {isPartialInputVisible ? (
        <PartialInputWrapper onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          <PartialInput
            type="number"
            value={partialInputValue}
            onChange={handlePartialInputChange}
            onBlur={handlePartialInputBlur} // Apply value on blur
            onKeyDown={handlePartialInputKeyDown} // Handle Enter/Escape
            onClick={(e: React.MouseEvent) => e.stopPropagation()} // Prevent click from bubbling to ProdItemWrapper
            min="0"
            step="1" // Or adjust step based on ingredient type if needed
            aria-label={`Enter added amount for ${itemName}`}
            autoFocus // Focus the input when it appears
          />
          <InputUnitLabel>{formatAmount(0).replace(/[\d.,\s]+/g, '')}</InputUnitLabel> {/* Extract unit */}
        </PartialInputWrapper>
      ) : (
        <QuantityDisplay state={state} onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleQuantityClick(); }} aria-label={`Current amount for ${itemName}: ${renderQuantityDisplay()}`}>
          {renderQuantityDisplay()}
        </QuantityDisplay>
      )}
    </ProdItemWrapper>
  );
};


// --- Main Component Implementation ---
export const IngredientList = ({
  ingredients,
  linkedRecipes,
  scaleFactor,
  onOpenRecipeTab,
  isProductionMode,
  trackedAmounts,
  onAmountTracked,
}: IngredientListProps) => {
  const renderItem = (
    item: RecipeIngredient | LinkedRecipeInfo,
    isLinkedRecipe: boolean
  ) => {
    const itemId = isLinkedRecipe ? (item as LinkedRecipeInfo).recipe._id : (item as RecipeIngredient).ingredient._id;
    const itemName = isLinkedRecipe ? (item as LinkedRecipeInfo).recipe.name : (item as RecipeIngredient).ingredient.name;
    const scaledAmount = item.amountGrams * scaleFactor;
    const formattedAmount = formatAmount(scaledAmount);
    const trackedAmount = trackedAmounts[itemId] ?? 0;

    if (isProductionMode) {
      return (
        <ProductionIngredientItem
          key={itemId}
          itemId={itemId}
          itemName={itemName}
          targetAmountGrams={scaledAmount}
          trackedAmountGrams={trackedAmount}
          onAmountTracked={onAmountTracked}
        />
      );
    } else {
      // Original rendering logic for non-production mode
      if (isLinkedRecipe) {
        const linkedItem = item as LinkedRecipeInfo;
        const initialScaleFactor = (linkedItem.amountGrams * scaleFactor) / 1000;
        return (
          <>
            <LinkedRecipeButton
              onClick={() => onOpenRecipeTab(linkedItem.recipe._id, linkedItem.recipe.name, initialScaleFactor)}
            >
              {itemName}
            </LinkedRecipeButton>
            <IngredientAmount>{formattedAmount}</IngredientAmount>
          </>
        );
      } else {
        return (
          <>
            <BaseIngredientName>{itemName}</BaseIngredientName>
            <IngredientAmount>{formattedAmount}</IngredientAmount>
          </>
        );
      }
    }
  };

  return (
    <React.Fragment> {/* Use Fragment instead of div */}
      <SectionHeading>Ingredients</SectionHeading>
      <IngredientListContainer>
        {ingredients.map((item) => (
          <IngredientItem key={item.ingredient._id}>
            {renderItem(item, false)}
          </IngredientItem>
        ))}
        {linkedRecipes.map((linkedItem) => (
          <IngredientItem key={linkedItem.recipe._id}>
            {renderItem(linkedItem, true)}
          </IngredientItem>
        ))}
      </IngredientListContainer>
    </React.Fragment>
  );
};