import React from 'react';
import { styled } from '@linaria/react';
import { TabData, RecipeTabData } from '../../types/tabs'; // Updated import
import { SearchTab } from '../search/SearchTab';
import { RecipeTab } from '../recipe/RecipeTab'; // Import the RecipeTab component
import { IngredientsTab } from '../ingredients/IngredientsTab'; // Import the IngredientsTab component
import { RecipeEditorTab } from '../recipe/RecipeEditorTab'; // Import the RecipeEditorTab component
import IngredientEditTab from '../ingredients/IngredientEditTab'; // Import the new IngredientEditTab component
import DefaultStepsTab from '../defaultSteps/DefaultStepsTab'; // Placeholder for the new component

interface TabContentProps {
  activeTab: TabData | undefined; // Use TabData
  tabs: TabData[]; // Use TabData
  onOpenRecipeTab: (recipeId: string, recipeName: string, initialScaleFactor?: number) => void;
  onCloseTab: (tabId: string) => void;
  isProductionMode: boolean;
  trackedAmounts: Record<string, number>;
  onToggleProductionMode: (tabId: string) => void;
  onAmountTracked: (tabId: string, ingredientId: string, addedAmountGrams: number) => void;
  onOpenRecipeEditor: (recipeId: string, recipeName: string) => void;
  onOpenIngredientEditTab: (ingredientName: string, ingredientId?: string) => void; // Allow optional ingredientId for creation
  scaleFactor: number;
  onScaleChange: (tabId: string, newScaleFactor: number) => void;
}

const ContentContainer = styled.div`
  padding: var(--space-xl); /* Use new spacing variable */
  background-color: var(--tab-active-bg); /* Use new variable (likely surface-color) */
  flex-grow: 1; /* Take remaining vertical space */
  overflow-y: auto; /* Keep vertical scroll */
  /* Optional: Add a subtle border or shadow if needed to separate from TabBar */
  /* border-top: 1px solid var(--border-color-light); */
`;

// Wrapper for individual tab panel content for ARIA attributes
const TabPanelWrapper = styled.div`
  height: 100%; // Ensure it fills the ContentContainer
  overflow-y: auto; // Allow internal scrolling if content overflows
`;

export const TabContent = ({
  activeTab,
  tabs,
  onOpenRecipeTab,
  onCloseTab, // Destructure the new prop
  isProductionMode, // Destructure new props
  trackedAmounts,
  onToggleProductionMode,
  onAmountTracked,
  onOpenRecipeEditor,
  onOpenIngredientEditTab, // Destructure new prop
  scaleFactor,
  onScaleChange,
}: TabContentProps) => {
  if (!activeTab) {
    return <ContentContainer>No s'ha seleccionat cap pestanya.</ContentContainer>; // Fallback
  }

  const renderContent = (): React.ReactElement | null => {
    switch (activeTab.type) {
      case 'search':
        // Pass the handler down to SearchTab
        return <SearchTab onOpenRecipeTab={onOpenRecipeTab} onOpenRecipeEditor={onOpenRecipeEditor} />;
      case 'recipe': {
        // Re-check activeTab here to satisfy TS control flow analysis
        // activeTab is already confirmed to be RecipeTabData by the switch case
        // and its existence is confirmed by the initial check.
        // However, to be absolutely safe with strict null checks if properties were optional on RecipeTabData:
        if (activeTab.type !== 'recipe' || !activeTab.recipeId) return null;
        const recipeActiveTab = activeTab as RecipeTabData; // Explicit cast for clarity

        return (
          <RecipeTab
            key={recipeActiveTab.id}
            recipeId={recipeActiveTab.recipeId} // No longer needs !
            tabs={tabs}
            handleOpenRecipeTab={onOpenRecipeTab}
            isProductionMode={isProductionMode}
            trackedAmounts={trackedAmounts}
            onToggleProductionMode={() => onToggleProductionMode(recipeActiveTab.id)}
            onAmountTracked={(ingredientId: string, amount: number) => onAmountTracked(recipeActiveTab.id, ingredientId, amount)}
            onOpenEditor={onOpenRecipeEditor}
            onClose={() => onCloseTab(recipeActiveTab.id)}
            scaleFactor={scaleFactor}
            onScaleChange={(newScale: number) => onScaleChange(recipeActiveTab.id, newScale)}
          />
        );
      }
      case 'ingredients':
        // Pass the onOpenIngredientEditTab prop to IngredientsTab
        return <IngredientsTab onOpenIngredientEditTab={onOpenIngredientEditTab} onOpenRecipeEditTab={(recipeId) => onOpenRecipeEditor(recipeId, "Edit Recipe")} />;
      case 'recipeEditor':
        if (activeTab.type !== 'recipeEditor') return null; // Type guard
        return <RecipeEditorTab
                 key={activeTab.id} // Add key for consistency
                 recipeId={activeTab.recipeId} // recipeId is optional on RecipeEditorTabData
                 tabId={activeTab.id}
                 onClose={() => onCloseTab(activeTab.id)}
                 onOpenRecipeTab={onOpenRecipeTab}
               />;
      case 'ingredientEdit': // New case for ingredient edit tab
        if (activeTab.type !== 'ingredientEdit') return null; // Type guard
        return (
          <IngredientEditTab
            key={activeTab.id} // Add key for stable component instance
            tab={activeTab} // Pass the full activeTab object, which is IngredientEditTabData
            onCloseTab={onCloseTab} // Pass the onCloseTab function
          />
        );
      case 'defaultSteps': // Placeholder for the new tab type
        if (activeTab.type !== 'defaultSteps') return null;
        return <DefaultStepsTab />;
      default: {
        // This case should be unreachable if all TabData types are handled above.
        // TypeScript knows activeTab is 'never' here.
        console.warn("Unhandled tab type in TabContent renderContent:", activeTab);
        return <div>Contingut no disponible per a aquest tipus de pestanya.</div>;
      }
    }
  };

  // Get the currently rendered content
  const currentContent = renderContent();

  return (
    <ContentContainer>
      {/* Render all tab panels but only display the active one.
          This is one approach. Another is to only render the active one.
          Rendering all allows for keeping state of inactive tabs, but might have performance implications
          for very many complex tabs. For this app, it's likely fine.
          The visibility is controlled by the parent ensuring only activeTab's content is effectively shown.
      */}
      {tabs.map(tab => (
        <TabPanelWrapper
          key={tab.id}
          id={`tabpanel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${tab.id}`}
          hidden={activeTab?.id !== tab.id} // Hide non-active tab panels
        >
          {/* Conditionally render content only if it's the active tab to avoid running logic for hidden tabs unnecessarily */}
          {activeTab?.id === tab.id && currentContent}
        </TabPanelWrapper>
      ))}
      {/* Fallback if no active tab somehow (should not happen with current logic) */}
      {!activeTab && <ContentContainer>No s'ha seleccionat cap pestanya.</ContentContainer>}
    </ContentContainer>
  );
};