import React, { useState } from 'react';
import { styled } from '@linaria/react';
import { useTimers } from '../../contexts/TimerContext';
import { TimerCreationPanel } from '../timers/TimerCreationPanel';

// Copied from FloatingAddTimerButton.tsx, can be moved to a shared location if needed
const PREDEFINED_COLORS = [
  'var(--timer-color-red)',
  'var(--timer-color-blue)',
  'var(--timer-color-green)',
  'var(--timer-color-yellow)',
  'var(--timer-color-purple)',
];

interface FloatingActionButtonsGroupProps {
  onOpenDefaultStepsTab: () => void;
  onOpenIngredientsTab: () => void;
  onOpenNewRecipeEditor: () => void;
  // The "New Timer" action will be handled internally by opening the TimerCreationPanel
}

const ActionButtonsContainer = styled.div`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  display: flex;
  flex-direction: row; // Stack buttons horizontally
  gap: var(--space-sm);
  z-index: 1000;
`;

const ActionButton = styled.button`
  width: 48px; // Slightly smaller for a group
  height: 48px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: var(--text-on-primary);
  border: none;
  box-shadow: var(--shadow-md);
  font-size: 1.2rem; // Adjusted for icon-like text
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.1);
    box-shadow: var(--shadow-lg);
    background-color: var(--primary-color-dark); // Darken on hover
  }

  &:disabled {
    background-color: var(--text-color-light);
    cursor: not-allowed;
    transform: none;
    opacity: 0.7;
    box-shadow: var(--shadow-sm);
  }
`;

export const FloatingActionButtonsGroup: React.FC<FloatingActionButtonsGroupProps> = ({
  onOpenDefaultStepsTab,
  onOpenIngredientsTab,
  onOpenNewRecipeEditor,
}) => {
  const { state: timerState } = useTimers();
  const [isTimerPanelOpen, setIsTimerPanelOpen] = useState(false);

  const handleOpenTimerPanel = () => setIsTimerPanelOpen(true);
  const handleCloseTimerPanel = () => setIsTimerPanelOpen(false);

  return (
    <>
      <ActionButtonsContainer>
        <ActionButton onClick={onOpenDefaultStepsTab} title="Passos per Defecte" aria-label="Passos per Defecte">
          📜
        </ActionButton>
        <ActionButton onClick={onOpenIngredientsTab} title="Ingredients" aria-label="Ingredients">
          🥕
        </ActionButton>
        <ActionButton onClick={onOpenNewRecipeEditor} title="+ Nova recepta" aria-label="+ Nova recepta">
          🍦
        </ActionButton>
        <ActionButton
          onClick={handleOpenTimerPanel}
          disabled={timerState.timers.length >= 3}
          title="Nou Temporitzador"
          aria-label="Nou Temporitzador"
        >
          ⏱️
        </ActionButton>
      </ActionButtonsContainer>
      <TimerCreationPanel
        isOpen={isTimerPanelOpen}
        onClose={handleCloseTimerPanel}
        availableColors={PREDEFINED_COLORS}
      />
    </>
  );
};