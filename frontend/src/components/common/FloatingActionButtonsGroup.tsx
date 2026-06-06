import React, { useState } from 'react';
import { styled } from '@linaria/react';
import { useTimers } from '../../contexts/TimerContext';
import { TimerCreationPanel } from '../timers/TimerCreationPanel';

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
  onOpenIceCreamDashboardTab: () => void;
}

const ActionButtonsContainer = styled.div`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  z-index: 900;
`;

const ActionButton = styled.button`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: var(--text-on-primary);
  border: none;
  box-shadow: var(--shadow-lg);
  font-size: 1.4rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  touch-action: manipulation;

  &:hover {
    transform: scale(1.08);
    box-shadow: var(--shadow-xl);
    background-color: var(--primary-color-dark);
  }

  &:active {
    transform: scale(0.95);
  }

  &:disabled {
    background-color: var(--border-color);
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
  onOpenIceCreamDashboardTab,
}) => {
  const { state: timerState } = useTimers();
  const [isTimerPanelOpen, setIsTimerPanelOpen] = useState(false);

  const handleOpenTimerPanel = () => setIsTimerPanelOpen(true);
  const handleCloseTimerPanel = () => setIsTimerPanelOpen(false);

  return (
    <>
      <ActionButtonsContainer>
        <ActionButton
          onClick={onOpenDefaultStepsTab}
          title="Passos per Defecte"
          aria-label="Passos per Defecte"
        >
          📜
        </ActionButton>
        <ActionButton
          onClick={onOpenIngredientsTab}
          title="Ingredients"
          aria-label="Ingredients"
        >
          🥕
        </ActionButton>
        <ActionButton
          onClick={onOpenIceCreamDashboardTab}
          title="Estoc de Gelats"
          aria-label="Estoc de Gelats"
        >
          🍨
        </ActionButton>
        <ActionButton
          onClick={onOpenNewRecipeEditor}
          title="+ Nova recepta"
          aria-label="+ Nova recepta"
        >
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
