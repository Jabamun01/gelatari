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

  @media (max-width: 640px) {
    bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
    right: 1rem;
    gap: var(--space-xs);
  }
`;

const ActionButton = styled.button`
  padding: 0.6rem 1rem;
  min-width: 56px;
  height: 44px;
  border-radius: 22px;
  background-color: var(--primary-color);
  color: var(--text-on-primary);
  border: none;
  box-shadow: var(--shadow-lg);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.5rem;
  transition: all 0.2s ease;
  touch-action: manipulation;
  white-space: nowrap;

  &:hover {
    transform: scale(1.06);
    box-shadow: var(--shadow-xl);
    background-color: var(--primary-color-dark);
  }

  &:active {
    transform: scale(0.97);
  }

  &:disabled {
    background-color: var(--border-color);
    cursor: not-allowed;
    transform: none;
    opacity: 0.7;
    box-shadow: var(--shadow-sm);
  }

  @media (max-width: 640px) {
    padding: 0.5rem 0.75rem;
    height: 40px;
    font-size: 0.8rem;
    gap: 0.4rem;
  }
`;

const ButtonEmoji = styled.span`
  font-size: 1.1rem;
  line-height: 1;

  @media (max-width: 640px) {
    font-size: 1rem;
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
          <ButtonEmoji>📜</ButtonEmoji>
          <span>Passos per defecte</span>
        </ActionButton>
        <ActionButton
          onClick={onOpenIngredientsTab}
          title="Ingredients"
          aria-label="Ingredients"
        >
          <ButtonEmoji>🥕</ButtonEmoji>
          <span>Ingredients</span>
        </ActionButton>
        <ActionButton
          onClick={onOpenIceCreamDashboardTab}
          title="Estoc de Gelats"
          aria-label="Estoc de Gelats"
        >
          <ButtonEmoji>🍨</ButtonEmoji>
          <span>Estoc de gelats</span>
        </ActionButton>
        <ActionButton
          onClick={onOpenNewRecipeEditor}
          title="+ Nova recepta"
          aria-label="+ Nova recepta"
        >
          <ButtonEmoji>🍦</ButtonEmoji>
          <span>Nova recepta</span>
        </ActionButton>
        <ActionButton
          onClick={handleOpenTimerPanel}
          disabled={timerState.timers.length >= 3}
          title="Nou Temporitzador"
          aria-label="Nou Temporitzador"
        >
          <ButtonEmoji>⏱️</ButtonEmoji>
          <span>Nou temporitzador</span>
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
