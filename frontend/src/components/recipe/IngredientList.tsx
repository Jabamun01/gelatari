import { styled } from '@linaria/react';
import React, { useState, useCallback } from 'react';
import { RecipeIngredient, LinkedRecipeInfo } from '../../types/recipe';
import { formatAmount } from '../../utils/formatting';

const COMPLETION_THRESHOLD = 0.999;

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

const SectionHeading = styled.h3`
  margin: 0 0 var(--space-md) 0;
  font-size: var(--font-size-lg);
  color: var(--text-color-strong);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-sm);
`;

const IngredientListContainer = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const IngredientItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-sm) 0;
  border-bottom: var(--border-width) solid var(--border-color-light);
  transition: background-color 0.15s ease;

  &:last-child {
    border-bottom: none;
  }
`;

const BaseIngredientName = styled.span`
  flex-grow: 1;
  margin: 0 var(--space-md);
  color: var(--text-color);
  font-weight: 500;
  font-size: var(--font-size-sm);

  @media (max-width: 640px) {
    margin: 0 var(--space-xs);
    font-size: var(--font-size-xs);
  }
`;

const IngredientAmount = styled.span`
  font-weight: 500;
  white-space: nowrap;
  color: var(--text-color-light);
  font-size: var(--font-size-sm);
  min-width: 60px;
  text-align: right;

  @media (max-width: 640px) {
    font-size: var(--font-size-xs);
    min-width: 50px;
  }
`;

const LinkedRecipeButton = styled.button`
  background: transparent;
  border: none;
  padding: 0;
  margin: 0 var(--space-md);
  font: inherit;
  font-weight: 500;
  font-size: var(--font-size-sm);
  color: var(--primary-color);
  cursor: pointer;
  flex-grow: 1;
  text-align: left;
  transition: color 0.15s ease;
  min-height: auto;
  box-shadow: none;

  &:hover {
    color: var(--primary-color-dark);
    text-decoration: underline;
  }

  &:focus {
    outline: none;
    text-decoration: underline;
    box-shadow: none;
  }
`;

const ProdItemWrapper = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  cursor: pointer;
  gap: var(--space-sm);

  @media (max-width: 640px) {
    gap: var(--space-xs);
  }
`;

const LargeCheckbox = styled.input`
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-color: var(--surface-color-light);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  display: inline-block;
  position: relative;
  cursor: pointer;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  margin: 0;
  transition: background-color 0.15s ease, border-color 0.15s ease;

  &:checked {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
  }

  &:checked::after {
    content: '✓';
    font-size: 16px;
    color: var(--text-on-primary);
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    font-weight: bold;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--focus-ring-color);
  }

  @media (max-width: 640px) {
    width: 24px;
    height: 24px;

    &:checked::after {
      font-size: 14px;
    }
  }
`;

const QuantityDisplay = styled.button<{
  state: 'not-added' | 'partial' | 'full';
}>`
  background: transparent;
  border: var(--border-width) solid var(--border-color-light);
  padding: var(--space-xs) var(--space-sm);
  margin: 0;
  font: inherit;
  font-size: var(--font-size-xs);
  font-weight: 500;
  white-space: nowrap;
  text-align: right;
  cursor: pointer;
  border-radius: var(--border-radius-sm);
  transition: background-color 0.15s ease, color 0.15s ease;
  min-width: 90px;
  min-height: 32px;
  box-shadow: none;
  color: ${({ state }) =>
    state === 'full'
      ? 'var(--success-color)'
      : state === 'partial'
        ? 'var(--warning-color-dark)'
        : 'var(--text-color-light)'};
  text-decoration: ${({ state }) =>
    state === 'full' ? 'line-through' : 'none'};

  &:hover {
    border-color: var(--border-color-hover);
    background-color: var(--surface-color-hover);
  }

  @media (max-width: 640px) {
    min-width: 75px;
    font-size: 0.7rem;
  }
`;

const PartialInputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-xs);
`;

const PartialInput = styled.input`
  width: 64px;
  padding: var(--space-xs) var(--space-sm);
  text-align: right;
  font-size: var(--font-size-sm);
  box-shadow: none;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius-sm);
  background-color: var(--surface-color-light);

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 1px var(--focus-ring-color);
  }

  @media (max-width: 640px) {
    width: 56px;
  }
`;

const InputUnitLabel = styled.span`
  font-size: var(--font-size-xs);
  color: var(--text-color-lighter);
  white-space: nowrap;
`;

const ProductionIngredientItem: React.FC<ProductionIngredientItemProps> = ({
  itemId,
  itemName,
  targetAmountGrams,
  trackedAmountGrams,
  onAmountTracked,
}) => {
  const [isPartialInputVisible, setIsPartialInputVisible] = useState(false);
  const [partialInputValue, setPartialInputValue] = useState('');

  const isFullyAdded =
    trackedAmountGrams >= targetAmountGrams * COMPLETION_THRESHOLD;
  const isPartiallyAdded = trackedAmountGrams > 0 && !isFullyAdded;
  const state = isFullyAdded
    ? 'full'
    : isPartiallyAdded
      ? 'partial'
      : 'not-added';

  const handleCheckboxChange = useCallback(() => {
    if (isFullyAdded) {
      onAmountTracked(itemId, 0);
    } else {
      onAmountTracked(itemId, targetAmountGrams);
    }
    setIsPartialInputVisible(false);
    setPartialInputValue('');
  }, [isFullyAdded, itemId, targetAmountGrams, onAmountTracked]);

  const handleQuantityClick = useCallback(() => {
    if (!isFullyAdded) {
      setIsPartialInputVisible(true);
      setPartialInputValue(
        isPartiallyAdded ? String(trackedAmountGrams) : ''
      );
    }
  }, [isFullyAdded, isPartiallyAdded, trackedAmountGrams]);

  const handlePartialInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPartialInputValue(e.target.value);
    },
    []
  );

  const handlePartialInputBlur = useCallback(() => {
    const value = parseFloat(partialInputValue);
    if (!isNaN(value) && value >= 0) {
      onAmountTracked(itemId, value);
      setIsPartialInputVisible(false);
      setPartialInputValue('');
    } else if (partialInputValue === '') {
      onAmountTracked(itemId, 0);
      setIsPartialInputVisible(false);
    }
  }, [partialInputValue, itemId, onAmountTracked]);

  const handlePartialInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handlePartialInputBlur();
        (e.target as HTMLInputElement).blur();
      } else if (e.key === 'Escape') {
        setIsPartialInputVisible(false);
        setPartialInputValue('');
      }
    },
    [handlePartialInputBlur]
  );

  const renderQuantityDisplay = () => {
    const formattedTarget = formatAmount(targetAmountGrams);
    const formattedTracked = formatAmount(trackedAmountGrams);
    const remainingRaw = Math.max(0, targetAmountGrams - trackedAmountGrams);
    const formattedRemaining = formatAmount(remainingRaw);

    switch (state) {
      case 'full':
        return `${formattedTarget} ✓`;
      case 'partial':
        return `${formattedTracked} / ${formattedTarget} (restants: ${formattedRemaining})`;
      case 'not-added':
      default:
        return formattedTarget;
    }
  };

  return (
    <ProdItemWrapper onClick={handleCheckboxChange}>
      <LargeCheckbox
        type="checkbox"
        checked={isFullyAdded}
        onChange={handleCheckboxChange}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        aria-label={`Marca ${itemName} com afegit`}
      />
      <BaseIngredientName>{itemName}</BaseIngredientName>
      {isPartialInputVisible ? (
        <PartialInputWrapper onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          <PartialInput
            type="number"
            value={partialInputValue}
            onChange={handlePartialInputChange}
            onBlur={handlePartialInputBlur}
            onKeyDown={handlePartialInputKeyDown}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            min="0"
            step="any"
            aria-label={`Introdueix quantitat afegida per ${itemName}`}
            autoFocus
          />
          <InputUnitLabel>g</InputUnitLabel>
        </PartialInputWrapper>
      ) : (
        <QuantityDisplay
          state={state}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            handleQuantityClick();
          }}
          aria-label={`Quantitat actual per ${itemName}: ${renderQuantityDisplay()}`}
        >
          {renderQuantityDisplay()}
        </QuantityDisplay>
      )}
    </ProdItemWrapper>
  );
};

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
    const itemId = isLinkedRecipe
      ? (item as LinkedRecipeInfo).recipe._id
      : (item as RecipeIngredient).ingredient._id;
    const itemName = isLinkedRecipe
      ? (item as LinkedRecipeInfo).recipe.name
      : (item as RecipeIngredient).ingredient.name;
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
      if (isLinkedRecipe) {
        const linkedItem = item as LinkedRecipeInfo;
        const initialScaleFactor =
          (linkedItem.amountGrams * scaleFactor) / 1000;
        return (
          <>
            <LinkedRecipeButton
              onClick={() =>
                onOpenRecipeTab(
                  linkedItem.recipe._id,
                  linkedItem.recipe.name,
                  initialScaleFactor
                )
              }
            >
              {itemName}
            </LinkedRecipeButton>
            <IngredientAmount>{formattedAmount}</IngredientAmount>
          </>
        );
      } else {
        const ingredientItem = item as RecipeIngredient;
        const mermaPct = ingredientItem.ingredient.mermaPercent;
        return (
          <>
            <BaseIngredientName>
              {itemName}
              {mermaPct ? (
                <span style={{ color: 'var(--warning-color-dark)', marginLeft: 'var(--space-sm)', fontSize: 'var(--font-size-xs)' }}>
                  (merma: {mermaPct}%)
                </span>
              ) : null}
            </BaseIngredientName>
            <IngredientAmount>{formattedAmount}</IngredientAmount>
          </>
        );
      }
    }
  };

  return (
    <>
      <SectionHeading>
        <span>Ingredients</span>
        {isProductionMode && (
          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--secondary-color)',
              fontWeight: 400,
            }}
          >
            Mode producció
          </span>
        )}
      </SectionHeading>
      <IngredientListContainer>
        {ingredients.length === 0 && linkedRecipes.length === 0 && (
          <IngredientItem>
            <span
              style={{
                color: 'var(--text-color-light)',
                fontStyle: 'italic',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              No hi ha ingredients per aquesta recepta.
            </span>
          </IngredientItem>
        )}
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
    </>
  );
};
