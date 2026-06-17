import { useState, useEffect } from 'react';
import { styled } from '@linaria/react';
import { TabData, RecipeTabData, RecipeEditorTabData, IngredientsTabData, SearchTabData, IceCreamDashboardTabData, CostosTabData } from './types/tabs';
import { TabBar } from './components/tabs/TabBar';
import { TabContent } from './components/tabs/TabContent';
import { FloatingActionButtonsGroup } from './components/common/FloatingActionButtonsGroup';
import { FloatingTimersDisplay } from './components/timers/FloatingTimersDisplay';
import AlarmSoundHandler from './components/timers/AlarmSoundHandler';
import { useAuth } from './contexts/AuthContext';
import ChangePasswordModal from './components/auth/ChangePasswordModal';
import { DefaultStepsModal } from './components/defaultSteps/DefaultStepsModal';
import { IngredientEditModal } from './components/ingredients/IngredientEditModal';
import { IceCreamFlavorEditModal } from './components/iceCream/IceCreamFlavorEditModal';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--background-color);
  color: var(--text-color);
`;

const TabContentContainer = styled.div`
  flex-grow: 1;
  display: flex;
  overflow: hidden;
  background-color: var(--surface-color-light);

  /* Prevent content from being hidden behind the fixed floating buttons */
  @media (max-width: 640px) {
    padding-bottom: 60px;
  }
`;


const APP_STATE_STORAGE_KEY = 'gelatariAppState';

// Function to load state from localStorage
const loadAppState = (): { tabs: TabData[]; activeTabId: string } | null => {
  try {
    const savedState = localStorage.getItem(APP_STATE_STORAGE_KEY);
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      if (parsedState && Array.isArray(parsedState.tabs) && typeof parsedState.activeTabId === 'string') {
        const searchTabTemplate: SearchTabData = { id: 'search', title: 'Gelatari', type: 'search', isCloseable: false };
        const loadedTabsFromStorage = parsedState.tabs as TabData[];
        const finalTabs: TabData[] = [];
        let searchTabFound = false;

        loadedTabsFromStorage.forEach(loadedTab => {
          let processedTab: TabData = { ...loadedTab };

          switch (loadedTab.type) {
            case 'search': {
              processedTab = {
                ...searchTabTemplate,
                ...loadedTab,
                isCloseable: false
              } as SearchTabData;
              searchTabFound = true;
              break;
            }
            case 'ingredients': {
              processedTab = {
                ...loadedTab,
                type: 'ingredients',
                id: (loadedTab as IngredientsTabData).id || 'ingredients',
                title: (loadedTab as IngredientsTabData).title || 'Ingredients',
                isCloseable: (loadedTab as IngredientsTabData).isCloseable ?? true,
              } as IngredientsTabData;
              break;
            }
            case 'recipe': {
              const tempRecipeTab = loadedTab as RecipeTabData;
              processedTab = {
                ...tempRecipeTab,
                type: 'recipe',
                isCloseable: tempRecipeTab.isCloseable ?? true,
                initialScaleFactor: tempRecipeTab.initialScaleFactor,
                scaleFactor: tempRecipeTab.scaleFactor ?? tempRecipeTab.initialScaleFactor ?? 1,
                isProductionMode: tempRecipeTab.isProductionMode ?? false,
                trackedAmounts: tempRecipeTab.trackedAmounts ?? {},
              } as RecipeTabData;
              break;
            }
            case 'recipeEditor': {
              const tempRecipeEditorTab = loadedTab as RecipeEditorTabData;
              processedTab = {
                ...tempRecipeEditorTab,
                type: 'recipeEditor',
                isCloseable: tempRecipeEditorTab.isCloseable ?? true,
              } as RecipeEditorTabData;
              break;
            }
            case 'iceCreamDashboard': {
              processedTab = {
                ...loadedTab,
                type: 'iceCreamDashboard',
                id: (loadedTab as IceCreamDashboardTabData).id || 'iceCreamDashboard',
                title: (loadedTab as IceCreamDashboardTabData).title || 'Estoc Gelats',
                isCloseable: (loadedTab as IceCreamDashboardTabData).isCloseable ?? true,
              } as IceCreamDashboardTabData;
              break;
            }
            case 'costos': {
              processedTab = {
                ...loadedTab,
                type: 'costos',
                id: (loadedTab as CostosTabData).id || 'costos',
                title: (loadedTab as CostosTabData).title || 'Costos',
                isCloseable: (loadedTab as CostosTabData).isCloseable ?? true,
              } as CostosTabData;
              break;
            }
            default:
              console.warn("Unknown or removed tab type loaded from storage:", loadedTab);
              return;
          }
          finalTabs.push(processedTab);
        });

        if (!searchTabFound) {
          finalTabs.unshift({ ...searchTabTemplate });
        }

        const finalActiveTabId = finalTabs.some(tab => tab.id === parsedState.activeTabId) && parsedState.activeTabId
          ? parsedState.activeTabId
          : finalTabs.find(tab => tab.id === 'search')?.id || finalTabs[0]?.id || 'search';

        return { tabs: finalTabs, activeTabId: finalActiveTabId };
      }
    }
  } catch (error) {
    console.error("Failed to load app state from localStorage:", error);
  }
  return null;
};


const App = () => {
  const { username, logout } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [initialState] = useState(loadAppState);
  const [tabs, setTabs] = useState<TabData[]>(() =>
    initialState?.tabs || [
      { id: 'search', title: 'Gelatari', type: 'search', isCloseable: false } as SearchTabData,
    ],
  );
  const [activeTabId, setActiveTabId] = useState<string>(() =>
    initialState?.activeTabId || 'search',
  );

  // Modal states for single-use editors
  const [showDefaultStepsModal, setShowDefaultStepsModal] = useState(false);
  const [showIngredientEditModal, setShowIngredientEditModal] = useState(false);
  const [ingredientEditId, setIngredientEditId] = useState<string | undefined>(undefined);
  const [ingredientEditName, setIngredientEditName] = useState<string | undefined>(undefined);
  const [showFlavorEditModal, setShowFlavorEditModal] = useState(false);
  const [flavorEditId, setFlavorEditId] = useState<string | undefined>(undefined);
  const [flavorEditName, setFlavorEditName] = useState<string | undefined>(undefined);
  const [flavorEditSourceRecipeId, setFlavorEditSourceRecipeId] = useState<string | undefined>(undefined);
  const [flavorEditSourceRecipeName, setFlavorEditSourceRecipeName] = useState<string | undefined>(undefined);

  // Effect to save state to localStorage whenever tabs or activeTabId change
  useEffect(() => {
    try {
      const stateToSave = { tabs, activeTabId };
      localStorage.setItem(APP_STATE_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.error("Failed to save app state to localStorage:", error);
    }
  }, [tabs, activeTabId]);


  const handleTabClick = (tabId: string) => {
    setActiveTabId(tabId);
  };

  const handleCloseTab = (tabIdToClose: string) => {
      const tabToClose = tabs.find(tab => tab.id === tabIdToClose);
      if (!tabToClose || !tabToClose.isCloseable) return;

      const tabIndex = tabs.findIndex(tab => tab.id === tabIdToClose);
      const remainingTabs = tabs.filter(tab => tab.id !== tabIdToClose);

      let newActiveTabId = activeTabId;
      if (activeTabId === tabIdToClose) {
          newActiveTabId = tabs[tabIndex - 1]?.id || remainingTabs[0]?.id || '';
      }

      setTabs(remainingTabs);
      setActiveTabId(newActiveTabId);
  };

  const handleOpenRecipeTab = (recipeId: string, recipeName: string, initialScaleFactor?: number) => {
    const existingTab = tabs.find(tab => tab.id === recipeId);
    if (existingTab) {
      setActiveTabId(recipeId);
      return;
    }

    const newTab: RecipeTabData = {
      id: recipeId,
      title: recipeName,
      type: 'recipe',
      recipeId: recipeId,
      isCloseable: true,
      initialScaleFactor,
      scaleFactor: initialScaleFactor ?? 1,
      isProductionMode: false,
      trackedAmounts: {},
    };

    setTabs(prevTabs => [...prevTabs, newTab]);
    setActiveTabId(recipeId);
  };

  const handleOpenNewRecipeEditor = () => {
    const newEditorId = `editor-${Date.now()}`;
    const newTab: RecipeEditorTabData = {
      id: newEditorId,
      title: 'Nova Recepta',
      type: 'recipeEditor',
      isCloseable: true,
      recipeId: undefined,
    };
    setTabs(prevTabs => [...prevTabs, newTab]);
    setActiveTabId(newEditorId);
  };

  const handleOpenIngredientsTab = () => {
    const ingredientsTabId = 'ingredients';
    const existingTab = tabs.find(tab => tab.id === ingredientsTabId);

    if (existingTab) {
      setActiveTabId(ingredientsTabId);
      return;
    }

    const newTab: IngredientsTabData = {
      id: ingredientsTabId,
      title: 'Ingredients',
      type: 'ingredients',
      isCloseable: true,
    };
    setTabs(prevTabs => [...prevTabs, newTab]);
    setActiveTabId(ingredientsTabId);
  };

  // Helper to update a recipe tab's properties
  const updateRecipeTab = (
    tabId: string,
    updater: (tab: RecipeTabData) => Partial<RecipeTabData>,
  ) => {
    setTabs(prevTabs =>
      prevTabs.map(tab =>
        tab.id === tabId && tab.type === 'recipe'
          ? { ...tab, ...updater(tab as RecipeTabData) }
          : tab,
      ),
    );
  };

  const handleToggleProductionMode = (tabId: string) => {
    const tabToToggle = tabs.find(tab => tab.id === tabId);

    if (!tabToToggle || tabToToggle.type !== 'recipe') return;

    const recipeTabToToggle = tabToToggle as RecipeTabData;

    const turningOff = recipeTabToToggle.isProductionMode;
    const hasTrackedItems = recipeTabToToggle.trackedAmounts && Object.values(recipeTabToToggle.trackedAmounts).some(amount => typeof amount === 'number' && amount > 0);

    let proceed = true;

    if (turningOff && hasTrackedItems) {
      proceed = window.confirm(
        'Desactivar el Mode Producció reiniciarà el progrés dels ingredients seguits per aquesta recepta. Esteu segurs que voleu continuar?'
      );
    }

    if (proceed) {
      updateRecipeTab(tabId, (tab) => {
        const nextIsProductionMode = !tab.isProductionMode;
        return {
          isProductionMode: nextIsProductionMode,
          trackedAmounts: nextIsProductionMode ? tab.trackedAmounts : {},
        };
      });
    }
  };

  const handleAmountTracked = (tabId: string, ingredientId: string, addedAmountGrams: number) => {
    updateRecipeTab(tabId, (tab) => ({
      trackedAmounts: {
        ...(tab.trackedAmounts ?? {}),
        [ingredientId]: addedAmountGrams,
      },
    }));
  };

  const handleScaleChange = (tabId: string, newScaleFactor: number) => {
    updateRecipeTab(tabId, () => ({ scaleFactor: newScaleFactor }));
  };

  // Handler to open an editor tab for a specific recipe
  const handleOpenRecipeEditor = (recipeId: string, recipeName: string) => {
    const editorTabId = `editor-${recipeId}`;
    const existingTab = tabs.find(tab => tab.id === editorTabId);

    if (existingTab) {
      setActiveTabId(editorTabId);
      return;
    }

    const newTab: RecipeEditorTabData = {
      id: editorTabId,
      title: `Edita: ${recipeName}`,
      type: 'recipeEditor',
      recipeId: recipeId,
      isCloseable: true,
    };

    setTabs(prevTabs => [...prevTabs, newTab]);
    setActiveTabId(editorTabId);
  };

  // Modal handlers for single-use editors
  const handleOpenIngredientEditModal = (ingredientName?: string, ingredientId?: string) => {
    setIngredientEditName(ingredientName);
    setIngredientEditId(ingredientId);
    setShowIngredientEditModal(true);
  };

  const handleCloseIngredientEditModal = () => {
    setShowIngredientEditModal(false);
    setIngredientEditId(undefined);
    setIngredientEditName(undefined);
  };

  const handleOpenDefaultStepsModal = () => {
    setShowDefaultStepsModal(true);
  };

  const handleCloseDefaultStepsModal = () => {
    setShowDefaultStepsModal(false);
  };

  const handleOpenFlavorEditModal = (flavorName: string, flavorId?: string, sourceRecipeId?: string, sourceRecipeName?: string) => {
    setFlavorEditName(flavorName);
    setFlavorEditId(flavorId);
    setFlavorEditSourceRecipeId(sourceRecipeId);
    setFlavorEditSourceRecipeName(sourceRecipeName);
    setShowFlavorEditModal(true);
  };

  const handleCloseFlavorEditModal = () => {
    setShowFlavorEditModal(false);
    setFlavorEditId(undefined);
    setFlavorEditName(undefined);
    setFlavorEditSourceRecipeId(undefined);
    setFlavorEditSourceRecipeName(undefined);
  };

  // Ice-cream dashboard tab
  const handleOpenIceCreamDashboardTab = () => {
    const tabId = 'iceCreamDashboard';
    const existing = tabs.find(t => t.id === tabId);
    if (existing) {
      setActiveTabId(tabId);
      return;
    }
    const newTab: IceCreamDashboardTabData = {
      id: tabId,
      title: 'Estoc Gelats',
      type: 'iceCreamDashboard',
      isCloseable: true,
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(tabId);
  };

  // Costos tab
  const handleOpenCostosTab = () => {
    const tabId = 'costos';
    const existing = tabs.find(t => t.id === tabId);
    if (existing) {
      setActiveTabId(tabId);
      return;
    }
    const newTab: CostosTabData = {
      id: tabId,
      title: 'Costos',
      type: 'costos',
      isCloseable: true,
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(tabId);
  };


// Calculate activeTab based on the current state *after* potential updates
const activeTab: TabData | undefined = tabs.find(tab => tab.id === activeTabId);
  return (
    <AppContainer>
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onTabClick={handleTabClick}
        onTabClose={handleCloseTab}
        username={username}
        onUserMenuToggle={() => setShowUserMenu(!showUserMenu)}
        showUserMenu={showUserMenu}
        onChangePassword={() => { setShowUserMenu(false); setShowChangePassword(true); }}
        onLogout={() => { setShowUserMenu(false); logout(); }}
      />
      <TabContentContainer>
        <TabContent
          activeTab={activeTab}
          tabs={tabs}
          onOpenRecipeTab={handleOpenRecipeTab}
          onCloseTab={handleCloseTab}
          onOpenRecipeEditor={handleOpenRecipeEditor}
          onOpenIngredientEditTab={handleOpenIngredientEditModal}
          onOpenIceCreamDashboardTab={handleOpenIceCreamDashboardTab}
          onOpenIceCreamFlavorEditTab={handleOpenFlavorEditModal}
          isProductionMode={activeTab?.type === 'recipe' ? (activeTab.isProductionMode ?? false) : false}
          trackedAmounts={activeTab?.type === 'recipe' ? (activeTab.trackedAmounts ?? {}) : {}}
          onToggleProductionMode={handleToggleProductionMode}
          onAmountTracked={handleAmountTracked}
          scaleFactor={activeTab?.type === 'recipe' ? (activeTab.scaleFactor ?? 1) : 1}
          onScaleChange={handleScaleChange}
        />
      </TabContentContainer>
      <FloatingActionButtonsGroup
        onOpenDefaultStepsTab={handleOpenDefaultStepsModal}
        onOpenIngredientsTab={handleOpenIngredientsTab}
        onOpenNewRecipeEditor={handleOpenNewRecipeEditor}
        onOpenIceCreamDashboardTab={handleOpenIceCreamDashboardTab}
        onOpenCostosTab={handleOpenCostosTab}
      />
      <FloatingTimersDisplay />
      <AlarmSoundHandler />
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />

      {/* Modals for single-use editors (replacing old single-use tabs) */}
      <DefaultStepsModal
        isOpen={showDefaultStepsModal}
        onClose={handleCloseDefaultStepsModal}
      />
      <IngredientEditModal
        isOpen={showIngredientEditModal}
        onClose={handleCloseIngredientEditModal}
        ingredientId={ingredientEditId}
        ingredientName={ingredientEditName}
      />
      <IceCreamFlavorEditModal
        isOpen={showFlavorEditModal}
        onClose={handleCloseFlavorEditModal}
        flavorId={flavorEditId}
        flavorName={flavorEditName}
        sourceRecipeId={flavorEditSourceRecipeId}
        sourceRecipeName={flavorEditSourceRecipeName}
      />
    </AppContainer>
  );
};

export default App;
