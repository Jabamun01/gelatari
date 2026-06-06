import React, { useRef } from 'react';
import { css } from '@linaria/core';
import { Play, Pause, RotateCcw, X, BellOff } from 'lucide-react';
import { FloatingTimer } from '../../types/timer';
import { useTimers } from '../../contexts/TimerContext';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';

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
`;

const timerVisualsStyle = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: var(--space-lg);
  border-radius: var(--border-radius-lg);
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  box-shadow: var(--shadow-lg);
  border: 2px solid var(--border-color);
  width: 240px;
  overflow: hidden;
  transition: border-color 0.3s ease;

  &[data-alarm-playing='true'] {
    animation: pulse 0.5s infinite alternate;

    @keyframes pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
      }
      100% {
        box-shadow: 0 0 0 12px rgba(239, 68, 68, 0);
      }
    }
  }

  @media (max-width: 640px) {
    width: 200px;
    padding: var(--space-md);
  }
`;

const timeDisplay = css`
  font-size: var(--font-size-xl);
  font-weight: 600;
  text-align: center;
  padding: var(--space-sm);
  background-color: var(--surface-color-light);
  border-radius: var(--border-radius);
  margin-bottom: var(--space-sm);

  @media (max-width: 640px) {
    font-size: var(--font-size-lg);
  }
`;

const buttonGroup = css`
  display: flex;
  gap: var(--space-sm);
  justify-content: space-between;
`;

const timerButton = css`
  flex: 1;
  padding: var(--space-sm);
  min-width: 0;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  background-color: var(--surface-color);
  box-shadow: none;
  transition: all 0.15s ease;
  cursor: pointer;

  &:hover {
    background-color: var(--surface-color-hover);
    border-color: var(--border-color-hover);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const stopAlarmButton = css`
  background-color: var(--danger-color) !important;
  color: var(--text-on-primary) !important;
  border-color: var(--danger-color) !important;
  flex-grow: 1;

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
      onStop={(_: DraggableEvent, data: DraggableData) => {
        dispatch({
          type: 'UPDATE_TIMER_POSITION',
          payload: { id: timer.id, x: data.x, y: data.y },
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
            {timer.isFinished
              ? 'Acabat!'
              : `${formatTime(timer.duration - timer.elapsedTime)}`}
          </div>

          <div className={buttonGroup}>
            {timer.isFinished && timer.alarmPlaying ? (
              <button
                className={`${timerButton} ${stopAlarmButton}`}
                onClick={handleStopAlarm}
                onTouchEnd={handleStopAlarm}
              >
                <BellOff size={22} />
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
