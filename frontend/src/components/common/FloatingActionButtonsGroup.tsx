import React, { useState, useEffect } from 'react';
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
  onOpenCostosTab: () => void;
  onOpenParadetaIncomeTab: () => void;
}

const ActionButtonsContainer = styled.div`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-sm);
  z-index: 900;

  @media (max-width: 640px) {
    bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
    right: 1rem;
    gap: var(--space-xs);
  }
`;

const ExpandedButtons = styled.div<{ $visible: boolean }>`
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);

  @media (max-width: 640px) {
    gap: var(--space-xs);
    position: absolute;
    bottom: calc(100% + var(--space-xs));
    right: 0;
    opacity: ${({ $visible }) => ($visible ? 1 : 0)};
    transform: ${({ $visible }) =>
      $visible ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.96)'};
    pointer-events: ${({ $visible }) => ($visible ? 'auto' : 'none')};
    transition: opacity 0.2s ease, transform 0.2s ease;
    transform-origin: bottom right;
  }

  @media (min-width: 641px) {
    opacity: 1;
    transform: translateY(0) scale(1);
    pointer-events: auto;
    position: static;
  }
`;

const MobileOverlay = styled.div<{ $visible: boolean }>`
  @media (max-width: 640px) {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: -1;
    display: ${({ $visible }) => ($visible ? 'block' : 'none')};
  }

  @media (min-width: 641px) {
    display: none;
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

const MobileToggleButton = styled.button`
  display: none;

  @media (max-width: 640px) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background-color: var(--primary-color);
    color: var(--text-on-primary);
    border: none;
    box-shadow: var(--shadow-lg);
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1;
    cursor: pointer;
    transition: all 0.2s ease;
    touch-action: manipulation;
    flex-shrink: 0;
    position: relative;
    z-index: 1;

    &:hover {
      transform: scale(1.06);
      box-shadow: var(--shadow-xl);
      background-color: var(--primary-color-dark);
    }

    &:active {
      transform: scale(0.97);
    }

    &[data-expanded='true'] {
      background-color: var(--primary-color-dark);
      box-shadow: var(--shadow-xl);
      transform: rotate(45deg);
    }
  }
`;

export const FloatingActionButtonsGroup: React.FC<FloatingActionButtonsGroupProps> = ({
  onOpenDefaultStepsTab,
  onOpenIngredientsTab,
  onOpenNewRecipeEditor,
  onOpenIceCreamDashboardTab,
  onOpenCostosTab,
  onOpenParadetaIncomeTab,
}) => {
  const { state: timerState } = useTimers();
  const [isTimerPanelOpen, setIsTimerPanelOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Close menu on Escape key
  useEffect(() => {
    if (!isExpanded) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExpanded(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  const handleToggle = () => {
    setIsExpanded((prev) => !prev);
  };

  const handleAction = (action: () => void) => {
    action();
    setIsExpanded(false);
  };

  const handleOpenTimerPanel = () => {
    setIsExpanded(false);
    setIsTimerPanelOpen(true);
  };

  const handleCloseTimerPanel = () => setIsTimerPanelOpen(false);

  const renderButtons = () => (
    <>
      <ActionButton
        onClick={() => handleAction(onOpenDefaultStepsTab)}
        title="Passos per Defecte"
        aria-label="Passos per Defecte"
      >
        <ButtonEmoji>📜</ButtonEmoji>
        <span>Passos per defecte</span>
      </ActionButton>
      <ActionButton
        onClick={() => handleAction(onOpenIngredientsTab)}
        title="Ingredients"
        aria-label="Ingredients"
      >
        <ButtonEmoji>🥕</ButtonEmoji>
        <span>Ingredients</span>
      </ActionButton>
      <ActionButton
        onClick={() => handleAction(onOpenIceCreamDashboardTab)}
        title="Estoc de Gelats"
        aria-label="Estoc de Gelats"
      >
        <ButtonEmoji>🍨</ButtonEmoji>
        <span>Estoc de gelats</span>
      </ActionButton>
      <ActionButton
        onClick={() => handleAction(onOpenCostosTab)}
        title="Costos"
        aria-label="Costos"
      >
        <ButtonEmoji>💰</ButtonEmoji>
        <span>Costos</span>
      </ActionButton>
      <ActionButton
        onClick={() => handleAction(onOpenParadetaIncomeTab)}
        title="Ingressos Paradeta"
        aria-label="Ingressos Paradeta"
      >
        <ButtonEmoji>📊</ButtonEmoji>
        <span>Ingressos paradeta</span>
      </ActionButton>
      <ActionButton
        onClick={() => handleAction(onOpenNewRecipeEditor)}
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
    </>
  );

  return (
    <>
      <ActionButtonsContainer>
        <ExpandedButtons $visible={isExpanded}>
          {renderButtons()}
        </ExpandedButtons>
        <MobileToggleButton
          onClick={handleToggle}
          data-expanded={isExpanded}
          aria-label={isExpanded ? 'Tancar menú' : 'Obrir menú d\'accions'}
          aria-expanded={isExpanded}
          aria-haspopup="true"
        >
          +
        </MobileToggleButton>
        <MobileOverlay $visible={isExpanded} onClick={() => setIsExpanded(false)} />
      </ActionButtonsContainer>
      <TimerCreationPanel
        isOpen={isTimerPanelOpen}
        onClose={handleCloseTimerPanel}
        availableColors={PREDEFINED_COLORS}
      />
    </>
  );
};
