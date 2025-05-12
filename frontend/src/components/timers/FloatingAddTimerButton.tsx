import { useState } from 'react';
import { styled } from '@linaria/react';
import { useTimers } from '../../contexts/TimerContext';
import { TimerCreationPanel } from './TimerCreationPanel';

const PREDEFINED_COLORS = [
  'var(--timer-color-red)',
  'var(--timer-color-blue)',
  'var(--timer-color-green)',
  'var(--timer-color-yellow)',
  'var(--timer-color-purple)',
];

const FloatingButton = styled.button`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: var(--text-on-primary);
  border: none;
  box-shadow: var(--shadow-md);
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.1);
    box-shadow: var(--shadow-lg);
  }

  &:disabled {
    background-color: var(--text-color-light);
    cursor: not-allowed;
    transform: none;
    opacity: 0.7;
  }
`;

const FloatingAddTimerButton = () => {
  const { state } = useTimers();
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const handleOpenPanel = () => setIsPanelOpen(true);
  const handleClosePanel = () => setIsPanelOpen(false);

  return (
    <>
      <FloatingButton 
        onClick={handleOpenPanel}
        disabled={state.timers.length >= 3}
        aria-label="Afegir temporitzador nou"
      >
        +
      </FloatingButton>
      <TimerCreationPanel
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        availableColors={PREDEFINED_COLORS}
      />
    </>
  );
};

export default FloatingAddTimerButton;