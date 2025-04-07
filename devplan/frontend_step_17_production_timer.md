# Frontend Step 17: Implement Production Mode Timer

## Task Description
Create a simple `Timer` component with start, stop, and reset functionality. Integrate this component into the `RecipeTab` so that it is only visible and usable when Production Mode is active. The timer's state (elapsed time, running status) should be managed locally within the `RecipeTab` and tied to the specific tab instance.

## Files to Read
*   `frontend/src/components/recipe/RecipeTab.tsx` (The parent component managing state, integrating Timer, providing hook context, modified step 15, 16)
*   `frontend/src/styles/global.ts` (For styling consistency and CSS variables, created step 4)
*   `frontend/src/components/recipe/StepList.tsx` (Example of a simple presentational component structure and Linaria usage, created step 12)
*   `frontend/src/components/recipe/ScalingControl.tsx` (Example component with props, local display logic, and interaction via parent handlers, created step 13)
*   `frontend/src/components/recipe/IngredientList.tsx` (Example component with more complex rendering logic and props, modified step 16)
*   `frontend/src/utils/formatting.ts` (If a utility file for formatting exists or is expected to be created/used)
*   `frontend/tsconfig.json` (Provides context on TS settings, created step 1)
*   `frontend/package.json` (Shows React installed)
## Constraints Reminder
*   Use only arrow functions (=>) for all JavaScript/TypeScript code. No `function`, `class`, or `this`.
*   Write all code exclusively within the provided tool.
*   Adhere to the "No Shared Code" policy between frontend and backend.

## Deliverables
*   Creation of `frontend/src/components/common/Timer.tsx` (or similar location).
*   Content of `Timer.tsx`:
    *   Import `React`, `useState`, `useEffect`, `useRef`.
    *   Define props interface: `{ isRunning: boolean; elapsedTime: number; onStart: () => void; onStop: () => void; onReset: () => void; }`.
    *   Implement a helper function `formatTime(seconds: number): string` to display time in MM:SS format.
    *   Define styled components for the timer display and buttons.
    *   Implement the `Timer` component:
        *   Accepts props defined above.
        *   Displays the `formatTime(elapsedTime)`.
        *   Renders Start/Stop/Reset buttons.
        *   Calls the corresponding prop functions (`onStart`, `onStop`, `onReset`) when buttons are clicked. Conditionally show Start or Stop based on `isRunning`.
*   Modification of `frontend/src/components/recipe/RecipeTab.tsx`:
    *   Import the `Timer` component.
    *   Add state variables for the timer:
        *   `const [timerIsRunning, setTimerIsRunning] = useState(false);`
        *   `const [elapsedTime, setElapsedTime] = useState(0);`
    *   Use `useRef` to store the interval ID: `const intervalRef = useRef<NodeJS.Timeout | null>(null);`
    *   Use `useEffect` to handle the timer interval:
        *   If `timerIsRunning` is true, set up an interval (`setInterval`) that increments `elapsedTime` every second. Store the interval ID in `intervalRef.current`.
        *   If `timerIsRunning` is false, clear the interval using `intervalRef.current` and set the ref to null.
        *   Include a cleanup function in the `useEffect` to clear the interval when the component unmounts or `timerIsRunning` changes.
    *   Define handler functions:
        *   `handleTimerStart = () => setTimerIsRunning(true);`
        *   `handleTimerStop = () => setTimerIsRunning(false);`
        *   `handleTimerReset = () => { setTimerIsRunning(false); setElapsedTime(0); };`
    *   Conditionally render the `Timer` component only when `isProductionMode` is true:
        ```jsx
        {isProductionMode && (
          <Timer
            isRunning={timerIsRunning}
            elapsedTime={elapsedTime}
            onStart={handleTimerStart}
            onStop={handleTimerStop}
            onReset={handleTimerReset}
          />
        )}
        ```
    *   Ensure timer state (`elapsedTime`, `timerIsRunning`) resets if the tab is closed (this happens implicitly as the state is within `RecipeTab`, which unmounts). Consider if reset is needed when toggling production mode off.

## Manual Testing Note
After implementing, restart the Vite dev server. Open a recipe tab.
*   Verify the timer is not visible initially.
*   Toggle Production Mode ON. Verify the timer appears, showing "00:00".
*   Click "Start". Verify the time starts incrementing. The button should change to "Stop".
*   Click "Stop". Verify the time stops. The button should change back to "Start".
*   Click "Start" again. Verify the time resumes from where it stopped.
*   Click "Reset". Verify the time resets to "00:00" and stops running.
*   Toggle Production Mode OFF. Verify the timer disappears.
*   Toggle Production Mode ON again. Verify the timer reappears reset to "00:00" and stopped (unless specific persistence logic was added).
*   Check styling and console for errors.