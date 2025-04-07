import { useState, useEffect, useRef } from 'react'; // Add useEffect, useRef
import { styled } from '@linaria/react';
import { Tab } from './types/tabs';
import { TabBar } from './components/tabs/TabBar';
import { TabContent } from './components/tabs/TabContent';
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


const App = () => {
  const initialTabs: Tab[] = [
    { id: 'search', title: 'Search', type: 'search', isCloseable: false },
    { id: 'ingredients', title: 'Ingredients', type: 'ingredients', isCloseable: false },
  ];
  const [tabs, setTabs] = useState<Tab[]>(initialTabs);
  const [activeTabId, setActiveTabId] = useState<string>('search');

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
      initialScaleFactor, // Add the initial scale factor here
      // Initialize production mode state for the new tab
      isProductionMode: false,
      trackedAmounts: {},
      // Initialize timer state for the new tab
      timerElapsedTime: 0,
      timerIsRunning: false,
    };
    // console.log('Creating new tab:', newTab); // Log the new tab object - REMOVED

    setTabs(prevTabs => [...prevTabs, newTab]); // Add new tab
    setActiveTabId(recipeId); // Activate the new tab
  };

  // Handler to open a new, blank recipe editor tab
  const handleOpenNewRecipeEditor = () => {
    const newEditorId = `editor-${crypto.randomUUID()}`;
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

  // Handler to toggle production mode for a specific tab
  const handleToggleProductionMode = (tabId: string) => {
    setTabs(prevTabs =>
      prevTabs.map(tab => {
        if (tab.id === tabId && tab.type === 'recipe') {
          const nextIsProductionMode = !tab.isProductionMode;
          return {
            ...tab,
            isProductionMode: nextIsProductionMode,
            // Reset tracked amounts and timer if turning production mode OFF
            trackedAmounts: nextIsProductionMode ? tab.trackedAmounts : {},
            timerElapsedTime: nextIsProductionMode ? (tab.timerElapsedTime ?? 0) : 0,
            timerIsRunning: nextIsProductionMode ? (tab.timerIsRunning ?? false) : false,
          };
        }
        return tab;
      })
    );
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
// --- Timer Logic ---
const intervalRefs = useRef<Record<string, NodeJS.Timeout | null>>({});

// Effect to manage intervals for all running timers
useEffect(() => {
  tabs.forEach(tab => {
    if (tab.type === 'recipe' && tab.timerIsRunning) {
      // Start interval if it's not already running for this tab
      if (!intervalRefs.current[tab.id]) {
        intervalRefs.current[tab.id] = setInterval(() => {
          setTabs(prevTabs =>
            prevTabs.map(t =>
              t.id === tab.id
                ? { ...t, timerElapsedTime: (t.timerElapsedTime ?? 0) + 1 }
                : t
            )
          );
        }, 1000);
      }
    } else {
      // Stop interval if it exists for this tab
      if (intervalRefs.current[tab.id]) {
        clearInterval(intervalRefs.current[tab.id]!);
        intervalRefs.current[tab.id] = null;
      }
    }
  });

  // Cleanup function to clear all intervals on unmount
  return () => {
    Object.values(intervalRefs.current).forEach(intervalId => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    });
    intervalRefs.current = {}; // Reset refs
  };
}, [tabs]); // Rerun whenever the tabs array changes (including timerIsRunning status)


// Timer Handlers for a specific tab
const handleTimerStart = (tabId: string) => {
  setTabs(prevTabs =>
    prevTabs.map(tab =>
      tab.id === tabId ? { ...tab, timerIsRunning: true } : tab
    )
  );
};

const handleTimerStop = (tabId: string) => {
  setTabs(prevTabs =>
    prevTabs.map(tab =>
      tab.id === tabId ? { ...tab, timerIsRunning: false } : tab
    )
  );
};

const handleTimerReset = (tabId: string) => {
  setTabs(prevTabs =>
    prevTabs.map(tab =>
      tab.id === tabId ? { ...tab, timerIsRunning: false, timerElapsedTime: 0 } : tab
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
          // Pass timer state and handlers for the active tab
          elapsedTime={activeTab?.timerElapsedTime ?? 0}
          isRunning={activeTab?.timerIsRunning ?? false}
          onTimerStart={handleTimerStart}
          onTimerStop={handleTimerStop}
          onTimerReset={handleTimerReset}
          onOpenRecipeEditor={handleOpenRecipeEditor} // Pass the new handler
        />
      </TabContentContainer>
    </AppContainer>
  );
};

export default App;
