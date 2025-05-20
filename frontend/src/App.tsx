import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { styled } from '@linaria/react';
import { TabData, RecipeTabData, RecipeEditorTabData, IngredientsTabData, SearchTabData, IngredientEditTabData, DefaultStepsTabData } from './types/tabs'; // Updated import (removed TabType)
import { TabBar } from './components/tabs/TabBar';
import { TabContent } from './components/tabs/TabContent';
import FloatingAddTimerButton from './components/timers/FloatingAddTimerButton';
import { FloatingTimersDisplay } from './components/timers/FloatingTimersDisplay';
import AlarmSoundHandler from './components/timers/AlarmSoundHandler';
// Global styles are imported and applied automatically by Linaria
// import { globalStyles } from './styles/global'; // No longer needed here

// Apply global styles. This is often done in main.tsx, but can be here too.
// If it's already in main.tsx, this might be redundant but harmless.
// Let's assume it's needed here for clarity or if not done in main.tsx yet.
const AppContainer = styled.div`
  /* globalStyles are applied automatically by Linaria via the import */
  display: flex;
  flex-direction: column;
  height: 100vh; /* Full viewport height */
  background-color: var(--background-color); /* Uses new variable */
  color: var(--text-color); /* Uses new variable */
`;

const TabContentContainer = styled.div`
  flex-grow: 1;
  display: flex;
  overflow: hidden;
  /* Use the lighter surface color for the main content area */
  background-color: var(--surface-color-light);
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
        const loadedTabsFromStorage = parsedState.tabs as TabData[]; // Assume new structure for simplicity, migration could be added
        const finalTabs: TabData[] = [];
        let searchTabFound = false;

        loadedTabsFromStorage.forEach(loadedTab => {
          let processedTab: TabData = { ...loadedTab }; // Start with loaded tab

          // Ensure common properties and type-specific defaults/migrations if necessary
          // This example assumes loaded tabs are already in the new discriminated union format
          // or that a more complex migration logic would be here.
          // For now, we'll just ensure the 'type' exists and is valid.

          switch (loadedTab.type) {
            case 'search': {
              // For search, ensure it's always the template, potentially with stored ID/title if they were ever customized (though unlikely for 'search')
              processedTab = {
                ...searchTabTemplate, // Start with base template
                ...loadedTab,         // Overlay any stored values (like a custom title if that was ever possible)
                isCloseable: false    // Explicitly ensure it's not closeable
              } as SearchTabData;
              searchTabFound = true;
              break;
            }
            case 'ingredients': {
              processedTab = {
                ...loadedTab, // Spread stored properties first
                type: 'ingredients', // Enforce type
                id: (loadedTab as IngredientsTabData).id || 'ingredients', // Ensure ID, default if missing
                title: (loadedTab as IngredientsTabData).title || 'Ingredients', // Ensure title, default if missing
                isCloseable: (loadedTab as IngredientsTabData).isCloseable ?? true, // Default isCloseable
              } as IngredientsTabData;
              break;
            }
            case 'recipe': {
              const tempRecipeTab = loadedTab as RecipeTabData; // Cast for easier access
              processedTab = {
                ...tempRecipeTab, // Spread stored properties first
                type: 'recipe', // Enforce type
                // id, title, recipeId are expected to be present from storage for a recipe tab
                isCloseable: tempRecipeTab.isCloseable ?? true,
                initialScaleFactor: tempRecipeTab.initialScaleFactor, // Keep if present
                scaleFactor: tempRecipeTab.scaleFactor ?? tempRecipeTab.initialScaleFactor ?? 1, // Default scaleFactor
                isProductionMode: tempRecipeTab.isProductionMode ?? false, // Default isProductionMode
                trackedAmounts: tempRecipeTab.trackedAmounts ?? {}, // Default trackedAmounts
              } as RecipeTabData;
              break;
            }
            case 'recipeEditor': {
              const tempRecipeEditorTab = loadedTab as RecipeEditorTabData;
              processedTab = {
                ...tempRecipeEditorTab,
                type: 'recipeEditor',
                // id, title are expected
                // recipeId is optional
                isCloseable: tempRecipeEditorTab.isCloseable ?? true,
              } as RecipeEditorTabData;
              break;
            }
            case 'ingredientEdit': {
                const tempIngredientEditTab = loadedTab as IngredientEditTabData;
                processedTab = {
                    ...tempIngredientEditTab,
                    type: 'ingredientEdit',
                    // id, title, ingredientId, ingredientName are expected
                    isCloseable: tempIngredientEditTab.isCloseable ?? true,
                } as IngredientEditTabData;
                break;
            }
            case 'defaultSteps': {
              processedTab = {
                ...loadedTab,
                type: 'defaultSteps',
                id: (loadedTab as DefaultStepsTabData).id || 'defaultSteps',
                title: (loadedTab as DefaultStepsTabData).title || 'Passos per Defecte',
                isCloseable: (loadedTab as DefaultStepsTabData).isCloseable ?? true,
              } as DefaultStepsTabData;
              break;
            }
            default:
              // Skip unknown tab types or handle them as errors
              console.warn("Unknown tab type loaded from storage:", loadedTab);
              return; // Skip this tab
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
  const [tabs, setTabs] = useState<TabData[]>(() => { // Use TabData[]
    const loadedState = loadAppState();
    return loadedState?.tabs || [
      { id: 'search', title: 'Gelatari', type: 'search', isCloseable: false } as SearchTabData, // Default search tab
    ];
  });
  const [activeTabId, setActiveTabId] = useState<string>(() => {
     const loadedState = loadAppState(); // Load again or pass from above useState
     return loadedState?.activeTabId || 'search';
  });

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

  // Updated handleCloseTab function
  const handleCloseTab = (tabIdToClose: string) => {
      // Prevent closing essential tabs if needed (e.g., search, ingredients) - handled by isCloseable flag usually
      const tabToClose = tabs.find(tab => tab.id === tabIdToClose);
      if (!tabToClose || !tabToClose.isCloseable) return;

      const tabIndex = tabs.findIndex(tab => tab.id === tabIdToClose);
      const remainingTabs = tabs.filter(tab => tab.id !== tabIdToClose);

      // Determine new active tab (e.g., the one before, or the first one)
      let newActiveTabId = activeTabId;
      if (activeTabId === tabIdToClose) {
          newActiveTabId = tabs[tabIndex - 1]?.id || remainingTabs[0]?.id || ''; // Fallback logic
      }

      setTabs(remainingTabs);
      setActiveTabId(newActiveTabId);
  };

  const handleOpenRecipeTab = (recipeId: string, recipeName: string, initialScaleFactor?: number) => {
    // Check if tab already exists
    const existingTab = tabs.find(tab => tab.id === recipeId);
    if (existingTab) {
      setActiveTabId(recipeId); // Activate existing tab
      return;
    }

    // Create new tab if it doesn't exist
    const newTab: RecipeTabData = { // Use RecipeTabData
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
    setActiveTabId(recipeId); // Activate the new tab
  };

  // Handler to open a new, blank recipe editor tab
  const handleOpenNewRecipeEditor = () => {
    const newEditorId = `editor-${uuidv4()}`;
    const newTab: RecipeEditorTabData = { // Use RecipeEditorTabData
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
      setActiveTabId(ingredientsTabId); // Activate existing tab
      return;
    }

    const newTab: IngredientsTabData = { // Use IngredientsTabData
      id: ingredientsTabId,
      title: 'Ingredients',
      type: 'ingredients',
      isCloseable: true,
    };
    setTabs(prevTabs => [...prevTabs, newTab]);
    setActiveTabId(ingredientsTabId);
  };

  // Handler to toggle production mode for a specific tab with confirmation
  const handleToggleProductionMode = (tabId: string) => {
    const tabToToggle = tabs.find(tab => tab.id === tabId);

    if (!tabToToggle || tabToToggle.type !== 'recipe') return; // Ensure tab exists and is a recipe tab

    // Now tabToToggle is confirmed to be RecipeTabData
    const recipeTabToToggle = tabToToggle as RecipeTabData;

    const turningOff = recipeTabToToggle.isProductionMode; // Current state is ON, so next is OFF
    const hasTrackedItems = recipeTabToToggle.trackedAmounts && Object.values(recipeTabToToggle.trackedAmounts).some(amount => typeof amount === 'number' && amount > 0);

    let proceed = true; // Assume we proceed unless confirmation is needed and denied

    if (turningOff && hasTrackedItems) {
      proceed = window.confirm(
        'Desactivar el Mode Producció reiniciarà el progrés dels ingredients seguits per aquesta recepta. Esteu segurs que voleu continuar?'
      );
    }

    if (proceed) {
      setTabs(prevTabs =>
        prevTabs.map(tab => {
          if (tab.id === tabId && tab.type === 'recipe') {
            const nextIsProductionMode = !tab.isProductionMode;
            return {
              ...tab,
              isProductionMode: nextIsProductionMode,
              // Reset tracked amounts only if turning production mode OFF
              trackedAmounts: nextIsProductionMode ? tab.trackedAmounts : {},
            };
          }
          return tab;
        })
      );
    }
    // If proceed is false, do nothing (state remains unchanged)
  };

  // Handler to track ingredient amount for a specific tab
  const handleAmountTracked = (tabId: string, ingredientId: string, addedAmountGrams: number) => {
    setTabs(prevTabs =>
      prevTabs.map(tab => {
        if (tab.id === tabId && tab.type === 'recipe') {
          return {
            ...tab,
            trackedAmounts: {
              ...(tab.trackedAmounts ?? {}), // Ensure trackedAmounts exists
              [ingredientId]: addedAmountGrams,
            },
          };
        }
        return tab;
      })
    );
  };

  // Handler to update scale factor for a specific tab
  const handleScaleChange = (tabId: string, newScaleFactor: number) => {
    setTabs(prevTabs =>
      prevTabs.map(tab =>
        tab.id === tabId && tab.type === 'recipe'
          ? { ...tab, scaleFactor: newScaleFactor }
          : tab
      )
    );
  };

  // Handler to open an editor tab for a specific recipe
  const handleOpenRecipeEditor = (recipeId: string, recipeName: string) => {
    const editorTabId = `editor-${recipeId}`;
    const existingTab = tabs.find(tab => tab.id === editorTabId);

    if (existingTab) {
      setActiveTabId(editorTabId); // Activate existing editor tab
      return;
    }

    // Create new editor tab if it doesn't exist
    const newTab: RecipeEditorTabData = { // Use RecipeEditorTabData
      id: editorTabId,
      title: `Edita: ${recipeName}`,
      type: 'recipeEditor',
      recipeId: recipeId,
      isCloseable: true,
    };

    setTabs(prevTabs => [...prevTabs, newTab]);
    setActiveTabId(editorTabId);
  };

  // Handler to open an ingredient editor tab (for new or existing)
  const handleOpenIngredientEditTab = (ingredientName?: string, ingredientId?: string) => {
    let editTabId: string;
    let title: string;
    let currentIngredientId: string | undefined = ingredientId;
    let currentIngredientName: string | undefined = ingredientName;

    if (ingredientId && ingredientName) {
      // Editing existing ingredient
      editTabId = `edit-ingredient-${ingredientId}`;
      title = `Edita: ${ingredientName}`;
    } else {
      // Creating new ingredient
      const newId = uuidv4(); // Generate a unique part for the tab ID
      editTabId = `new-ingredient-${newId}`;
      title = 'Nou Ingredient';
      currentIngredientId = undefined; // Explicitly undefined for new
      currentIngredientName = undefined; // Explicitly undefined for new
    }

    const existingTab = tabs.find(tab => tab.id === editTabId);

    if (existingTab) {
      setActiveTabId(editTabId);
      return;
    }

    const newTab: IngredientEditTabData = {
      id: editTabId,
      title: title,
      type: 'ingredientEdit',
      ingredientId: currentIngredientId,
      ingredientName: currentIngredientName,
      isCloseable: true,
    };

    setTabs(prevTabs => [...prevTabs, newTab]);
    setActiveTabId(editTabId);
  };

  const handleOpenDefaultStepsTab = () => {
    const defaultStepsTabId = 'defaultSteps';
    const existingTab = tabs.find(tab => tab.id === defaultStepsTabId);

    if (existingTab) {
      setActiveTabId(defaultStepsTabId);
      return;
    }

    const newTab: DefaultStepsTabData = {
      id: defaultStepsTabId,
      title: 'Passos per Defecte',
      type: 'defaultSteps',
      isCloseable: true,
    };
    setTabs(prevTabs => [...prevTabs, newTab]);
    setActiveTabId(defaultStepsTabId);
  };


// Calculate activeTab based on the current state *after* potential updates
const activeTab: TabData | undefined = tabs.find(tab => tab.id === activeTabId); // Use TabData
// console.log('Calculated activeTab for render:', activeTab); // Log the calculated active tab - REMOVED
  return (
    <AppContainer>
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onTabClick={handleTabClick}
        onTabClose={handleCloseTab}
        onOpenNewRecipeEditor={handleOpenNewRecipeEditor}
        onOpenIngredientsTab={handleOpenIngredientsTab}
        onOpenDefaultStepsTab={handleOpenDefaultStepsTab} // Added this prop
      />
      <TabContentContainer>
        <TabContent
          activeTab={activeTab} // Type is now TabData | undefined
          tabs={tabs}
          onOpenRecipeTab={handleOpenRecipeTab}
          onCloseTab={handleCloseTab}
          onOpenRecipeEditor={handleOpenRecipeEditor}
          onOpenIngredientEditTab={handleOpenIngredientEditTab} // Pass the new handler
          // Production mode and scale factor are specific to RecipeTabData
          isProductionMode={activeTab?.type === 'recipe' ? (activeTab.isProductionMode ?? false) : false}
          trackedAmounts={activeTab?.type === 'recipe' ? (activeTab.trackedAmounts ?? {}) : {}}
          onToggleProductionMode={handleToggleProductionMode}
          onAmountTracked={handleAmountTracked}
          scaleFactor={activeTab?.type === 'recipe' ? (activeTab.scaleFactor ?? 1) : 1}
          onScaleChange={handleScaleChange}
        />
      </TabContentContainer>
      <FloatingAddTimerButton />
      <FloatingTimersDisplay />
      <AlarmSoundHandler />
    </AppContainer>
  );
};

export default App;
