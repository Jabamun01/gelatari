import React, { useRef } from 'react';
import { css } from '@linaria/core';
import { Play, Pause, RotateCcw, X, BellOff } from 'lucide-react';
import { FloatingTimer } from '../../types/timer';
import { useTimers } from '../../contexts/TimerContext';
import Draggable, { DraggableData } from 'react-draggable';

interface IndividualFloatingTimerProps {
  timer: FloatingTimer;
}

const formatTime = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const draggableRootStyle = css`
  position: fixed;
  z-index: 999;
  /* Draggable applies transform for positioning. Width/height are determined by child. */
`;

const timerVisualsStyle = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-md); /* Increased gap */
  padding: var(--space-lg); /* Increased padding */
  border-radius: var(--border-radius-lg); /* Softer radius */
  background-color: rgba(255, 255, 255, 0.95); /* Slightly less transparent */
  backdrop-filter: blur(5px); /* Slightly more blur */
  box-shadow: var(--shadow-lg); /* Softer, larger shadow */
  border: 1px solid var(--border-color); /* Thinner border, more subtle */
  width: 240px; /* Increased width */
  overflow: hidden;
  transition: border-color 0.3s ease; /* For smooth color change if not pulsing */

  &[data-alarm-playing="true"] {
    animation: pulse 0.5s infinite alternate;
    /* The border-color is handled by inline style for alarm state or specific timer color */

    @keyframes pulse {
      0% {
        transform: scale(1); /* This scale is now on the inner div */
        box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
      }
      50% {
        transform: scale(1.02);
      }
      100% {
        transform: scale(1);
        box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
      }
    }
  }
`;

const timeDisplay = css`
  font-size: var(--font-size-xl); /* Larger font for time */
  font-weight: 600;
  text-align: center;
  padding: var(--space-sm); /* Increased padding */
  background-color: rgba(255, 255, 255, 0.8); /* Match container style a bit more */
  border-radius: var(--border-radius);
  margin-bottom: var(--space-sm); /* Increased margin */
`;

const buttonGroup = css`
  display: flex;
  gap: var(--space-sm);
  justify-content: space-between;
`;

const timerButton = css`
  flex: 1;
  padding: var(--space-sm); /* Increased padding for touch */
  min-width: 0;
  height: 44px; /* Explicit height for touch target */
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius); /* Consistent radius */
  background-color: var(--surface-color-light);
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--background-color-hover); /* Use theme variable if available */
    border-color: var(--border-color-strong);
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
  }

  &:active {
    transform: translateY(0);
    box-shadow: none;
  }
`;

const stopAlarmButton = css`
  background-color: var(--danger-color) !important; /* Ensure override if combined */
  color: var(--text-on-primary) !important;

  &:hover {
    background-color: var(--danger-color-dark) !important;
    border-color: var(--danger-color-dark) !important;
  }
`;

export const IndividualFloatingTimer: React.FC<IndividualFloatingTimerProps> = ({ timer }) => {
  const { dispatch } = useTimers();
  const nodeRef = useRef<HTMLDivElement>(null);

  const handleButtonInteraction = (handler: () => void, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handler();
  };

  const handleToggleTimer = (e: React.MouseEvent | React.TouchEvent) => {
    handleButtonInteraction(() => {
      dispatch({ type: 'TOGGLE_TIMER', payload: { id: timer.id } });
    }, e);
  };

  const handleResetTimer = (e: React.MouseEvent | React.TouchEvent) => {
    handleButtonInteraction(() => {
      dispatch({ type: 'RESET_TIMER', payload: { id: timer.id } });
    }, e);
  };

  const handleRemoveTimer = (e: React.MouseEvent | React.TouchEvent) => {
    handleButtonInteraction(() => {
      dispatch({ type: 'REMOVE_TIMER', payload: { id: timer.id } });
    }, e);
  };

  const handleStopAlarm = (e: React.MouseEvent | React.TouchEvent) => {
    handleButtonInteraction(() => {
      dispatch({ type: 'SET_ALARM_PLAYING', payload: { id: timer.id, playing: false } });
    }, e);
  };

  return (
    <Draggable
      nodeRef={nodeRef as React.RefObject<HTMLElement>}
      position={{ x: timer.x, y: timer.y }}
      onStop={(_, data: DraggableData) => {
        dispatch({
          type: 'UPDATE_TIMER_POSITION',
          payload: { id: timer.id, x: data.x, y: data.y }
        });
      }}
      cancel="button, .timer-button"
      bounds="parent"
    >
      <div ref={nodeRef} className={draggableRootStyle}>
        <div
          className={timerVisualsStyle}
          style={{
            borderColor: timer.alarmPlaying ? 'var(--danger-color)' : timer.color,
          }}
          data-alarm-playing={timer.alarmPlaying}
        >
          <div className={timeDisplay} style={{ color: timer.color, fontSize: '1.6rem' }}>
            {timer.isFinished ? (
              'Acabat!'
            ) : (
              `${formatTime(timer.duration - timer.elapsedTime)}`
            )}
          </div>

          <div className={buttonGroup}>
            {timer.isFinished && timer.alarmPlaying ? (
              <button
                className={`${timerButton} ${stopAlarmButton}`} // Combine classes for consistent styling
                onClick={handleStopAlarm}
                onTouchEnd={handleStopAlarm}
                style={{ flexGrow: 1 }} // Make it take full width of the group
              >
                <BellOff size={22} /> {/* Slightly larger icon for primary action */}
              </button>
            ) : (
              <>
                <button
                  className={timerButton}
                  onClick={handleToggleTimer}
                  onTouchEnd={handleToggleTimer}
                >
                  {timer.isRunning ? <Pause size={20} /> : <Play size={20} />}
                </button>
                <button
                  className={timerButton}
                  onClick={handleResetTimer}
                  onTouchEnd={handleResetTimer}
                >
                  <RotateCcw size={20} />
                </button>
                <button
                  className={timerButton}
                  onClick={handleRemoveTimer}
                  onTouchEnd={handleRemoveTimer}
                >
                  <X size={20} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </Draggable>
  );
};