import React from 'react';
import { styled } from '@linaria/react';
import { TabData } from '../../types/tabs';
import { SearchTab } from '../search/SearchTab';
import { RecipeTab } from '../recipe/RecipeTab';
import { IngredientsTab } from '../ingredients/IngredientsTab';
import { RecipeEditorTab } from '../recipe/RecipeEditorTab';
import { IceCreamDashboardTab } from '../iceCream/IceCreamDashboardTab';
import { CostosTab } from '../costs/CostosTab';

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
  // Ice-cream tab handlers
  onOpenIceCreamDashboardTab?: () => void;
  onOpenIceCreamFlavorEditTab?: (flavorName: string, flavorId?: string, sourceRecipeId?: string, sourceRecipeName?: string) => void;
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
  onOpenIceCreamFlavorEditTab,
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
        if (!activeTab.recipeId) return null;

        return (
          <RecipeTab
            key={activeTab.id}
            recipeId={activeTab.recipeId}
            tabs={tabs}
            handleOpenRecipeTab={onOpenRecipeTab}
            isProductionMode={isProductionMode}
            trackedAmounts={trackedAmounts}
            onToggleProductionMode={() => onToggleProductionMode(activeTab.id)}
            onAmountTracked={(ingredientId: string, amount: number) =>
              onAmountTracked(activeTab.id, ingredientId, amount)
            }
            onOpenEditor={onOpenRecipeEditor}
            onClose={() => onCloseTab(activeTab.id)}
            scaleFactor={scaleFactor}
            onScaleChange={(newScale: number) => onScaleChange(activeTab.id, newScale)}
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
        return (
          <RecipeEditorTab
            key={activeTab.id}
            recipeId={activeTab.recipeId}
            tabId={activeTab.id}
            onClose={() => onCloseTab(activeTab.id)}
            onOpenRecipeTab={onOpenRecipeTab}
          />
        );
      case 'iceCreamDashboard':
        if (activeTab.type !== 'iceCreamDashboard') return null;
        return (
          <IceCreamDashboardTab
            onOpenFlavorEdit={(flavorName, flavorId, sourceRecipeId, sourceRecipeName) =>
              onOpenIceCreamFlavorEditTab?.(flavorName, flavorId, sourceRecipeId, sourceRecipeName)
            }
            onOpenRecipeTab={onOpenRecipeTab}
          />
        );
      case 'costos':
        return (
          <CostosTab
            onOpenIceCreamFlavorEditTab={(flavorName, flavorId, sourceRecipeId, sourceRecipeName) =>
              onOpenIceCreamFlavorEditTab?.(flavorName, flavorId, sourceRecipeId, sourceRecipeName)
            }
          />
        );
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

    </ContentContainer>
  );
};
