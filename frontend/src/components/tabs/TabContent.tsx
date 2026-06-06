import React from 'react';
import { styled } from '@linaria/react';
import { TabData, RecipeTabData } from '../../types/tabs';
import { SearchTab } from '../search/SearchTab';
import { RecipeTab } from '../recipe/RecipeTab';
import { IngredientsTab } from '../ingredients/IngredientsTab';
import { RecipeEditorTab } from '../recipe/RecipeEditorTab';
import IngredientEditTab from '../ingredients/IngredientEditTab';
import DefaultStepsTab from '../defaultSteps/DefaultStepsTab';

interface TabContentProps {
  activeTab: TabData | undefined;
  tabs: TabData[];
  onOpenRecipeTab: (recipeId: string, recipeName: string, initialScaleFactor?: number) => void;
  onCloseTab: (tabId: string) => void;
  isProductionMode: boolean;
  trackedAmounts: Record<string, number>;
  onToggleProductionMode: (tabId: string) => void;
  onAmountTracked: (tabId: string, ingredientId: string, addedAmountGrams: number) => void;
  onOpenRecipeEditor: (recipeId: string, recipeName: string) => void;
  onOpenIngredientEditTab: (ingredientName: string, ingredientId?: string) => void;
  scaleFactor: number;
  onScaleChange: (tabId: string, newScaleFactor: number) => void;
}

const ContentContainer = styled.div`
  padding: var(--space-xl);
  background-color: var(--tab-active-bg);
  flex-grow: 1;
  overflow-y: auto;

  @media (max-width: 640px) {
    padding: var(--space-md);
  }
`;

const TabPanelWrapper = styled.div`
  height: 100%;
  overflow-y: auto;
`;

export const TabContent = ({
  activeTab,
  tabs,
  onOpenRecipeTab,
  onCloseTab,
  isProductionMode,
  trackedAmounts,
  onToggleProductionMode,
  onAmountTracked,
  onOpenRecipeEditor,
  onOpenIngredientEditTab,
  scaleFactor,
  onScaleChange,
}: TabContentProps) => {
  if (!activeTab) {
    return (
      <ContentContainer>
        <p style={{ textAlign: 'center', color: 'var(--text-color-light)', marginTop: 'var(--space-2xl)' }}>
          No s'ha seleccionat cap pestanya.
        </p>
      </ContentContainer>
    );
  }

  const renderContent = (): React.ReactElement | null => {
    switch (activeTab.type) {
      case 'search':
        return <SearchTab onOpenRecipeTab={onOpenRecipeTab} onOpenRecipeEditor={onOpenRecipeEditor} />;
      case 'recipe': {
        if (activeTab.type !== 'recipe' || !activeTab.recipeId) return null;
        const recipeActiveTab = activeTab as RecipeTabData;

        return (
          <RecipeTab
            key={recipeActiveTab.id}
            recipeId={recipeActiveTab.recipeId}
            tabs={tabs}
            handleOpenRecipeTab={onOpenRecipeTab}
            isProductionMode={isProductionMode}
            trackedAmounts={trackedAmounts}
            onToggleProductionMode={() => onToggleProductionMode(recipeActiveTab.id)}
            onAmountTracked={(ingredientId: string, amount: number) =>
              onAmountTracked(recipeActiveTab.id, ingredientId, amount)
            }
            onOpenEditor={onOpenRecipeEditor}
            onClose={() => onCloseTab(recipeActiveTab.id)}
            scaleFactor={scaleFactor}
            onScaleChange={(newScale: number) => onScaleChange(recipeActiveTab.id, newScale)}
          />
        );
      }
      case 'ingredients':
        return (
          <IngredientsTab
            onOpenIngredientEditTab={onOpenIngredientEditTab}
            onOpenRecipeEditTab={(recipeId) => onOpenRecipeEditor(recipeId, 'Edita Recepta')}
          />
        );
      case 'recipeEditor':
        if (activeTab.type !== 'recipeEditor') return null;
        return (
          <RecipeEditorTab
            key={activeTab.id}
            recipeId={activeTab.recipeId}
            tabId={activeTab.id}
            onClose={() => onCloseTab(activeTab.id)}
            onOpenRecipeTab={onOpenRecipeTab}
          />
        );
      case 'ingredientEdit':
        if (activeTab.type !== 'ingredientEdit') return null;
        return (
          <IngredientEditTab
            key={activeTab.id}
            tab={activeTab}
            onCloseTab={onCloseTab}
          />
        );
      case 'defaultSteps':
        if (activeTab.type !== 'defaultSteps') return null;
        return <DefaultStepsTab />;
      default:
        console.warn('Unhandled tab type in TabContent renderContent:', activeTab);
        return (
          <div style={{ textAlign: 'center', color: 'var(--text-color-light)', marginTop: 'var(--space-2xl)' }}>
            Contingut no disponible per a aquest tipus de pestanya.
          </div>
        );
    }
  };

  const currentContent = renderContent();

  return (
    <ContentContainer>
      {tabs.map((tab) => (
        <TabPanelWrapper
          key={tab.id}
          id={`tabpanel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${tab.id}`}
          hidden={activeTab?.id !== tab.id}
        >
          {activeTab?.id === tab.id && currentContent}
        </TabPanelWrapper>
      ))}
      {!activeTab && (
        <ContentContainer>
          <p style={{ textAlign: 'center', color: 'var(--text-color-light)' }}>
            No s'ha seleccionat cap pestanya.
          </p>
        </ContentContainer>
      )}
    </ContentContainer>
  );
};
