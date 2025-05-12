import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { styled } from '@linaria/react';
import { Tab } from './types/tabs';
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
const loadAppState = (): { tabs: Tab[]; activeTabId: string } | null => {
  try {
    const savedState = localStorage.getItem(APP_STATE_STORAGE_KEY);
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      // Basic validation (can be more thorough)
      if (parsedState && Array.isArray(parsedState.tabs) && typeof parsedState.activeTabId === 'string') {
        // Ensure essential tabs exist if loading saved state
        const essentialTabs: Tab[] = [ // Explicitly type the array
          { id: 'search', title: 'Search', type: 'search', isCloseable: false },
          { id: 'ingredients', title: 'Ingredients', type: 'ingredients', isCloseable: false },
        ];
        const loadedTabs = parsedState.tabs as Tab[];
        // Start with essential tabs and add loaded non-essential tabs, ensuring scaleFactor exists
        const finalTabs: Tab[] = [...essentialTabs];
        loadedTabs.forEach(loadedTab => {
          if (!essentialTabs.some(et => et.id === loadedTab.id)) {
            // Ensure scaleFactor is present, defaulting if necessary
            const tabToAdd: Tab = {
              ...loadedTab,
              scaleFactor: loadedTab.scaleFactor ?? loadedTab.initialScaleFactor ?? 1,
              trackedAmounts: loadedTab.trackedAmounts ?? {}, // Ensure trackedAmounts exists
              isProductionMode: loadedTab.isProductionMode ?? false, // Ensure production mode exists
            };
            finalTabs.push(tabToAdd);
          }
        });

        // Ensure activeTabId is valid
        const finalActiveTabId = finalTabs.some(tab => tab.id === parsedState.activeTabId)
          ? parsedState.activeTabId
          : finalTabs[0]?.id || 'search'; // Fallback to first tab or 'search'

        return { tabs: finalTabs, activeTabId: finalActiveTabId };
      }
    }
  } catch (error) {
    console.error("Failed to load app state from localStorage:", error);
  }
  return null;
};


const App = () => {
  // Initialize state from localStorage or use defaults
  const [tabs, setTabs] = useState<Tab[]>(() => {
    const loadedState = loadAppState();
    return loadedState?.tabs || [
      { id: 'search', title: 'Search', type: 'search', isCloseable: false },
      { id: 'ingredients', title: 'Ingredients', type: 'ingredients', isCloseable: false },
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
    const newTab: Tab = {
      id: recipeId, // Use recipeId as the unique tab ID
      title: recipeName,
      type: 'recipe',
      recipeId: recipeId,
      isCloseable: true,
      initialScaleFactor, // Store the initial scale factor
      scaleFactor: initialScaleFactor ?? 1, // Initialize current scale factor
      // Initialize production mode state for the new tab
      isProductionMode: false,
      trackedAmounts: {},
    };

    setTabs(prevTabs => [...prevTabs, newTab]); // Add new tab
    setActiveTabId(recipeId); // Activate the new tab
  };

  // Handler to open a new, blank recipe editor tab
  const handleOpenNewRecipeEditor = () => {
    const newEditorId = `editor-${uuidv4()}`;
    const newTab: Tab = {
      id: newEditorId,
      title: 'New Recipe',
      type: 'recipeEditor',
      isCloseable: true,
      recipeId: undefined, // No recipeId when creating a new one
    };
    setTabs(prevTabs => [...prevTabs, newTab]);
    setActiveTabId(newEditorId);
  };

  // Handler to toggle production mode for a specific tab with confirmation
  const handleToggleProductionMode = (tabId: string) => {
    const tabToToggle = tabs.find(tab => tab.id === tabId && tab.type === 'recipe');

    if (!tabToToggle) return; // Should not happen, but good practice

    const turningOff = tabToToggle.isProductionMode; // Current state is ON, so next is OFF
    const hasTrackedItems = tabToToggle.trackedAmounts && Object.values(tabToToggle.trackedAmounts).some(amount => amount > 0);

    let proceed = true; // Assume we proceed unless confirmation is needed and denied

    if (turningOff && hasTrackedItems) {
      proceed = window.confirm(
        'Turning off Production Mode will reset tracked ingredient progress for this recipe. Are you sure you want to continue?'
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
    const newTab: Tab = {
      id: editorTabId,
      title: `Edit: ${recipeName}`,
      type: 'recipeEditor',
      recipeId: recipeId, // Store the recipeId to edit
      isCloseable: true,
    };

    setTabs(prevTabs => [...prevTabs, newTab]); // Add new editor tab
    setActiveTabId(editorTabId); // Activate the new editor tab
  };


// Calculate activeTab based on the current state *after* potential updates
const activeTab = tabs.find(tab => tab.id === activeTabId);
// console.log('Calculated activeTab for render:', activeTab); // Log the calculated active tab - REMOVED
  return (
    <AppContainer>
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onTabClick={handleTabClick}
        onTabClose={handleCloseTab} // Use the updated handler
        onOpenNewRecipeEditor={handleOpenNewRecipeEditor} // Pass the new handler
      />
      <TabContentContainer>
        <TabContent
          activeTab={activeTab}
          tabs={tabs} // Pass the full tabs array down
          onOpenRecipeTab={handleOpenRecipeTab} // Pass the handler down
          onCloseTab={handleCloseTab} // Pass the close tab handler down
          // Pass production mode state and handlers for the active tab
          isProductionMode={activeTab?.isProductionMode ?? false}
          trackedAmounts={activeTab?.trackedAmounts ?? {}}
          onToggleProductionMode={handleToggleProductionMode}
          onAmountTracked={handleAmountTracked}
          onOpenRecipeEditor={handleOpenRecipeEditor} // Pass the new handler
          // Pass scale factor state and handler
          scaleFactor={activeTab?.scaleFactor ?? 1}
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
