import React, { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import { FloatingTimer } from '../types/timer';

// Constants for timer spawning logic
const DEFAULT_X_POSITION = 10;
const DEFAULT_Y_POSITION_BASE = 100;
const TIMER_HEIGHT_ESTIMATE = 80;
const TIMER_SPAWN_GAP = 10;

interface TimerState {
  timers: FloatingTimer[];
}

const TIMER_STATE_STORAGE_KEY = 'gelatariTimerState';

// Function to load timer state from localStorage
const loadTimerState = (): TimerState | null => {
  try {
    const savedState = localStorage.getItem(TIMER_STATE_STORAGE_KEY);
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      // Basic validation (can be more thorough)
      if (parsedState && Array.isArray(parsedState.timers)) {
        // Restore timer state, potentially adjusting for elapsed time since last save
        const now = Date.now();
        const restoredTimers = (parsedState.timers as FloatingTimer[]).map(timer => {
          // If the timer was running when saved, calculate how much time *should* have passed.
          // Note: This doesn't perfectly account for browser sleep/backgrounding,
          // but it's a reasonable approximation for simple persistence.
          // A more robust solution might store the 'startTime' instead of just elapsedTime.
          let adjustedElapsedTime = timer.elapsedTime;
          let adjustedIsRunning = timer.isRunning;
          let adjustedIsFinished = timer.isFinished;
          let adjustedAlarmPlaying = timer.alarmPlaying;

          if (timer.isRunning && timer.lastSavedAt) {
            const timePassedSinceSave = Math.floor((now - timer.lastSavedAt) / 1000);
            adjustedElapsedTime += timePassedSinceSave;
          }

          if (adjustedElapsedTime >= timer.duration) {
            adjustedElapsedTime = timer.duration;
            adjustedIsFinished = true;
            adjustedIsRunning = false;
            // If it finished while the app was closed, mark alarm as needing to play (or handle as needed)
            // For simplicity, let's just ensure alarmPlaying reflects the finished state on load.
            adjustedAlarmPlaying = true;
          }


          return {
            ...timer,
            elapsedTime: adjustedElapsedTime,
            isRunning: adjustedIsRunning,
            isFinished: adjustedIsFinished,
            alarmPlaying: adjustedAlarmPlaying,
            // Remove lastSavedAt after using it for calculation
            lastSavedAt: undefined,
          };
        });
        return { timers: restoredTimers };
      }
    }
  } catch (error) {
    console.error("Failed to load timer state from localStorage:", error);
  }
  return null;
};


type TimerAction =
  | { type: 'ADD_TIMER'; payload: { duration: number; color: string } }
  | { type: 'REMOVE_TIMER'; payload: { id: string } }
  | { type: 'TOGGLE_TIMER'; payload: { id: string } }
  | { type: 'RESET_TIMER'; payload: { id: string } }
  | { type: 'UPDATE_ELAPSED_TIME'; payload: { id: string } }
  | { type: 'SET_ALARM_PLAYING'; payload: { id: string; playing: boolean } }
  | { type: 'UPDATE_TIMER_POSITION'; payload: { id: string; x: number; y: number } };

const timerReducer = (state: TimerState, action: TimerAction): TimerState => {
  switch (action.type) {
    case 'ADD_TIMER': {
      if (state.timers.length >= 3) return state;
      
      const newTimerIndex = state.timers.length;
      let newY = DEFAULT_Y_POSITION_BASE;
      
      // Stack new timers above previous ones if they haven't been moved
      if (newTimerIndex > 0) {
        const prevTimer = state.timers[newTimerIndex - 1];
        if (!prevTimer.hasBeenMoved) {
          newY = prevTimer.y - TIMER_HEIGHT_ESTIMATE - TIMER_SPAWN_GAP;
        }
      }
      
      const newTimer: FloatingTimer = {
        id: Date.now().toString(),
        duration: action.payload.duration,
        elapsedTime: 0,
        isRunning: false,
        isFinished: false,
        color: action.payload.color,
        alarmPlaying: false,
        createdAt: Date.now(), // Keep track of creation time
        x: DEFAULT_X_POSITION,
        y: newY,
        hasBeenMoved: false,
        lastSavedAt: undefined, // Add field for persistence calculation
      };
      return { ...state, timers: [...state.timers, newTimer] };
    }

    case 'REMOVE_TIMER': {
      return {
        ...state,
        timers: state.timers.filter(timer => timer.id !== action.payload.id)
      };
    }

    case 'TOGGLE_TIMER': {
      return {
        ...state,
        timers: state.timers.map(timer => {
          if (timer.id !== action.payload.id) return timer;
          
          if (timer.isFinished) {
            return {
              ...timer,
              elapsedTime: 0,
              isRunning: true,
              isFinished: false,
              alarmPlaying: false
            };
          }
          return { ...timer, isRunning: !timer.isRunning };
        })
      };
    }

    case 'RESET_TIMER': {
      return {
        ...state,
        timers: state.timers.map(timer => {
          if (timer.id !== action.payload.id) return timer;
          return {
            ...timer,
            elapsedTime: 0,
            isRunning: false,
            isFinished: false,
            alarmPlaying: false
          };
        })
      };
    }

    case 'UPDATE_ELAPSED_TIME': {
      return {
        ...state,
        timers: state.timers.map(timer => {
          if (timer.id !== action.payload.id || !timer.isRunning || timer.isFinished) {
            return timer;
          }

          const newElapsed = timer.elapsedTime + 1;
          const isFinished = newElapsed >= timer.duration;
          
          return {
            ...timer,
            elapsedTime: newElapsed,
            isRunning: !isFinished,
            isFinished,
            alarmPlaying: isFinished
          };
        })
      };
    }

    case 'SET_ALARM_PLAYING': {
      return {
        ...state,
        timers: state.timers.map(timer => {
          if (timer.id !== action.payload.id) return timer;
          return { ...timer, alarmPlaying: action.payload.playing };
        })
      };
    }

    case 'UPDATE_TIMER_POSITION': {
      return {
        ...state,
        timers: state.timers.map(timer => {
          if (timer.id !== action.payload.id) return timer;
          return {
            ...timer,
            x: action.payload.x,
            y: action.payload.y,
            hasBeenMoved: true
          };
        })
      };
    }

    default:
      return state;
  }
};

const TimerContext = createContext<
  | {
      state: TimerState;
      dispatch: React.Dispatch<TimerAction>;
    }
  | undefined
>(undefined);

interface TimerProviderProps {
  children: React.ReactNode;
}

export const TimerProvider: React.FC<TimerProviderProps> = ({ children }) => {
  // Initialize state from localStorage or use defaults
  const [state, dispatch] = useReducer(timerReducer, { timers: [] }, (initialState) => {
      const loadedState = loadTimerState();
      return loadedState || initialState;
  });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Effect to save state to localStorage whenever timers change
  useEffect(() => {
    try {
      // Add a timestamp before saving to help restore elapsed time
      const stateToSave = {
        ...state,
        timers: state.timers.map(timer => ({
          ...timer,
          lastSavedAt: timer.isRunning ? Date.now() : undefined // Only store if running
        }))
      };
      localStorage.setItem(TIMER_STATE_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.error("Failed to save timer state to localStorage:", error);
    }
  }, [state.timers]);


  // Effect for the timer interval logic (unchanged)
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      state.timers.forEach(timer => {
        if (timer.isRunning && !timer.isFinished) {
          dispatch({ type: 'UPDATE_ELAPSED_TIME', payload: { id: timer.id } });
        }
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.timers]);

  return (
    <TimerContext.Provider value={{ state, dispatch }}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimers = () => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimers must be used within a TimerProvider');
  }
  return context;
};