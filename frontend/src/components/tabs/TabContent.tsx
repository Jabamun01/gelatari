import { styled } from '@linaria/react';
import { Tab } from '../../types/tabs';
import { SearchTab } from '../search/SearchTab';
import { RecipeTab } from '../recipe/RecipeTab'; // Import the RecipeTab component
import { IngredientsTab } from '../ingredients/IngredientsTab'; // Import the IngredientsTab component
import { RecipeEditorTab } from '../recipe/RecipeEditorTab'; // Import the RecipeEditorTab component

interface TabContentProps {
  activeTab: Tab | undefined;
  tabs: Tab[];
  onOpenRecipeTab: (recipeId: string, recipeName: string, initialScaleFactor?: number) => void;
  onCloseTab: (tabId: string) => void; // Add the close tab handler prop
  // Add props for production mode state and handlers
  isProductionMode: boolean;
  trackedAmounts: Record<string, number>;
  onToggleProductionMode: (tabId: string) => void;
  onAmountTracked: (tabId: string, ingredientId: string, addedAmountGrams: number) => void;
  // Add props for timer state and handlers
  elapsedTime: number;
  isRunning: boolean;
  onTimerStart: (tabId: string) => void;
  onTimerStop: (tabId: string) => void;
  onTimerReset: (tabId: string) => void;
  // Add prop for opening the editor tab
  onOpenRecipeEditor: (recipeId: string, recipeName: string) => void;
}

const ContentContainer = styled.div`
  padding: var(--space-xl); /* Use new spacing variable */
  background-color: var(--tab-active-bg); /* Use new variable (likely surface-color) */
  flex-grow: 1; /* Take remaining vertical space */
  overflow-y: auto; /* Keep vertical scroll */
  /* Optional: Add a subtle border or shadow if needed to separate from TabBar */
  /* border-top: 1px solid var(--border-color-light); */
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
  // Destructure timer props
  elapsedTime,
  isRunning,
  onTimerStart,
  onTimerStop,
  onTimerReset,
  onOpenRecipeEditor, // Destructure the new prop
}: TabContentProps) => {
  // console.log('TabContent received activeTab:', activeTab); // Log the received activeTab prop - REMOVED
  if (!activeTab) {
    return <ContentContainer>No active tab selected.</ContentContainer>; // Fallback
  }

  const renderContent = () => {
    switch (activeTab.type) {
      case 'search':
        // Pass the handler down to SearchTab
        return <SearchTab onOpenRecipeTab={onOpenRecipeTab} />;
      case 'recipe': {
        // Re-check activeTab here to satisfy TS control flow analysis
        if (!activeTab) return null;
        // console.log('Rendering recipe content for recipeId:', activeTab.recipeId); // Log the recipeId - REMOVED
        // Render the RecipeTab component, passing the guaranteed recipeId
        return (
          <RecipeTab
            key={activeTab.id}
            recipeId={activeTab.recipeId!}
            tabs={tabs}
            handleOpenRecipeTab={onOpenRecipeTab}
            // Pass the state and handlers down
            isProductionMode={isProductionMode}
            trackedAmounts={trackedAmounts}
            onToggleProductionMode={() => onToggleProductionMode(activeTab!.id)} // Pass tabId
            onAmountTracked={(ingredientId: string, amount: number) => onAmountTracked(activeTab!.id, ingredientId, amount)} // Pass tabId with explicit types
            // Pass timer state and handlers down, calling handlers with the active tab ID
            elapsedTime={elapsedTime}
            isRunning={isRunning}
            onTimerStart={() => onTimerStart(activeTab!.id)}
            onTimerStop={() => onTimerStop(activeTab!.id)}
            onTimerReset={() => onTimerReset(activeTab!.id)}
            onOpenEditor={onOpenRecipeEditor} // Pass the handler down
            onClose={() => onCloseTab(activeTab!.id)} // Pass the bound close handler
          />
        );
      } // Add closing brace for case 'recipe'
      case 'ingredients':
        return <IngredientsTab />; // Render the IngredientsTab component
      case 'recipeEditor':
        // Re-check activeTab to satisfy TS
        if (!activeTab) return null;
        return <RecipeEditorTab
                 recipeId={activeTab.recipeId}
                 tabId={activeTab.id} // Pass the tab's own ID
                 onClose={() => onCloseTab(activeTab.id)} // Pass a function that closes THIS tab
                 onOpenRecipeTab={onOpenRecipeTab} // Pass down the recipe opener
               />;
      default: {
        // Ensure exhaustiveness for TabType
        // Re-check activeTab here as well
        if (!activeTab) return null;
        // const _exhaustiveCheck: never = activeTab.type; // This check is no longer exhaustive due to 'recipeEditor'
        return <div>Unknown tab type: {activeTab.type}</div>;
      } // Add closing brace for default case
    } // Add closing brace for switch statement
  };

  return (
    <ContentContainer>
      {renderContent()}
    </ContentContainer>
  );
};