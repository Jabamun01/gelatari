import { styled } from '@linaria/react';
import { RecipeIngredient, LinkedRecipeInfo } from '../../types/recipe'; // Add LinkedRecipeInfo
import { formatAmount } from '../../utils/formatting'; // Import the utility

// --- Props Interface ---
interface IngredientListProps {
  ingredients: RecipeIngredient[];
  linkedRecipes: LinkedRecipeInfo[];
  scaleFactor: number;
  onOpenRecipeTab: (recipeId: string, recipeName: string, initialScaleFactor?: number) => void;
  isProductionMode: boolean; // Add production mode flag
  trackedAmounts: Record<string, number>; // Add tracked amounts state
  onAmountTracked: (ingredientId: string, addedAmountGrams: number) => void; // Add handler for tracking updates
}

// Helper function moved to utils/formatting.ts
// --- Styled Components ---
// Add a heading for the section
const SectionHeading = styled.h3`
  /* Inherits global h3 styles */
  margin-bottom: var(--space-md);
  font-size: var(--font-size-lg); /* Slightly smaller heading */
`;

const IngredientListContainer = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius);
  background-color: var(--surface-color);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
`;

const IngredientItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md) var(--space-lg);
  border-bottom: var(--border-width) solid var(--border-color-light);
  /* Add subtle hover effect */
  transition: background-color 0.15s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
      background-color: var(--surface-color-light); /* Use light surface on hover */
  }
`;

// Base span for name, allows extending for allergen styling
const BaseIngredientName = styled.span`
  flex-grow: 1;
  margin-right: var(--space-md);
  color: var(--text-color);
  font-weight: 500; /* Make names slightly bolder */
`;

// Specific style for allergens, extending the base
const AllergenHighlight = styled(BaseIngredientName)`
  color: var(--danger-color); /* Use danger color for allergens */
  font-weight: 600; /* Use semi-bold */
`;

const IngredientAmount = styled.span`
  font-weight: 500;
  white-space: nowrap;
  color: var(--text-color-light);
  font-size: var(--font-size-sm);
  min-width: 60px; /* Ensure minimum width for alignment */
  text-align: right;
`;

// --- Production Mode Specific Styles ---
const TrackingWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-left: auto;
  padding-left: var(--space-md);
  flex-shrink: 0; /* Prevent shrinking */
`;

// Inherit global input styles and customize
const TrackingInput = styled.input`
  width: 70px;
  padding: var(--space-xs) var(--space-sm);
  /* Inherits border, radius, focus from global */
  text-align: right;
  font-size: var(--font-size-sm);
  box-shadow: none; /* Remove shadow for smaller input */

  /* Hide spinner buttons */
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

const AddedAmountText = styled.span`
  font-size: var(--font-size-sm);
  color: var(--text-color-light);
  white-space: nowrap;
  min-width: 100px; /* Give space for "XXXg added /" */
  text-align: right;
`;

// --- Original Styled Components ---
// Styled component for the clickable linked recipe name (similar to StepList's previous button)
// Style like a link, but using a button element for semantics
const LinkedRecipeButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  font: inherit;
  font-weight: 500; /* Match ingredient name weight */
  color: var(--primary-color);
  text-decoration: none;
  cursor: pointer;
  display: inline;
  text-align: left;
  flex-grow: 1;
  margin-right: var(--space-md);
  transition: color 0.15s ease;

  &:hover {
    color: var(--primary-color-dark);
    text-decoration: underline;
  }

  &:focus {
      outline: none;
      text-decoration: underline;
      color: var(--primary-color-dark);
      /* Optional: Add focus ring */
      /* box-shadow: 0 0 0 2px var(--primary-color); */
  }
`;


// --- Component Implementation ---
export const IngredientList = ({
  ingredients,
  linkedRecipes,
  scaleFactor,
  onOpenRecipeTab,
  isProductionMode, // Destructure new props
  trackedAmounts,
  onAmountTracked,
}: IngredientListProps) => {
  return (
    <div> {/* Wrap list in a div to contain the heading */}
      <SectionHeading>Ingredients</SectionHeading>
      <IngredientListContainer>
      {ingredients.map((item) => {
        const scaledAmount = item.amountGrams * scaleFactor;
        const formattedAmount = formatAmount(scaledAmount);
        // Choose the correct styled component for the name based on allergen status
        const IngredientNameComponent = item.ingredient.isAllergen
          ? AllergenHighlight
          : BaseIngredientName;

        return (
          <IngredientItem key={item.ingredient._id}>
            <IngredientNameComponent>
              {item.ingredient.name}
            </IngredientNameComponent>
            <TrackingWrapper>
              {isProductionMode && (
                <>
                  <AddedAmountText>
                    {formatAmount(trackedAmounts[item.ingredient._id] ?? 0)} added /
                  </AddedAmountText>
                  <TrackingInput
                    type="number"
                    value={trackedAmounts[item.ingredient._id] ?? ''} // Use empty string if undefined for controlled input
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      // Only call handler if it's a valid non-negative number
                      if (!isNaN(value) && value >= 0) {
                        onAmountTracked(item.ingredient._id, value);
                      } else if (e.target.value === '') {
                         // Allow clearing the input, treat as 0
                         onAmountTracked(item.ingredient._id, 0);
                      }
                    }}
                    min="0" // Prevent negative numbers
                    step="1" // Increment by grams
                    aria-label={`Tracked amount for ${item.ingredient.name}`}
                  />
                </>
              )}
              <IngredientAmount>
                {isProductionMode ? ` ${formattedAmount}` : formattedAmount} {/* Add space before target amount in prod mode */}
              </IngredientAmount>
            </TrackingWrapper>
          </IngredientItem>
        );
      })}
      {/* Render Linked Recipes */}
      {linkedRecipes.map((linkedItem) => {
        const scaledAmount = linkedItem.amountGrams * scaleFactor;
        const formattedAmount = formatAmount(scaledAmount);
        // Calculate the initial scale factor based on the *parent's* current scaleFactor
        // and the amount of this linked recipe used in the parent's base (1kg) recipe.
        const initialScaleFactor = (linkedItem.amountGrams * scaleFactor) / 1000;
        // Removed console.log

        return (
          <IngredientItem key={linkedItem.recipe._id}>
            {/* Use the button for the name */}
            <LinkedRecipeButton
              onClick={() => {
                // Removed console.log
                onOpenRecipeTab(
                  linkedItem.recipe._id,
                  linkedItem.recipe.name,
                  initialScaleFactor
                );
              }}
            >
              {linkedItem.recipe.name} {/* Display linked recipe name */}
            </LinkedRecipeButton>
            {/* Add tracking wrapper for linked recipes */}
            <TrackingWrapper>
              {isProductionMode && (
                <>
                  <AddedAmountText>
                    {formatAmount(trackedAmounts[linkedItem.recipe._id] ?? 0)} added /
                  </AddedAmountText>
                  <TrackingInput
                    type="number"
                    value={trackedAmounts[linkedItem.recipe._id] ?? ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && value >= 0) {
                        onAmountTracked(linkedItem.recipe._id, value);
                      } else if (e.target.value === '') {
                         onAmountTracked(linkedItem.recipe._id, 0);
                      }
                    }}
                    min="0"
                    step="1"
                    aria-label={`Tracked amount for ${linkedItem.recipe.name}`}
                  />
                </>
              )}
              <IngredientAmount>
                 {isProductionMode ? ` ${formattedAmount}` : formattedAmount}
              </IngredientAmount>
            </TrackingWrapper>
          </IngredientItem>
        );
      })}
      </IngredientListContainer>
    </div>
  );
};