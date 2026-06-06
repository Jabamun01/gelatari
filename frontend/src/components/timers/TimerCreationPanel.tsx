import React, { useState, useEffect, useCallback } from 'react';
import { styled } from '@linaria/react';
import { useTimers } from '../../contexts/TimerContext';
import { formatDurationMMSS } from '../../utils/formatting';

interface TimerCreationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  availableColors: string[];
}

const parseDurationToSeconds = (durationStr: string): number | null => {
  const parts = durationStr.split(':').map((part) => parseInt(part, 10));
  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    if (!isNaN(minutes) && !isNaN(seconds) && seconds >= 0 && seconds < 60 && minutes >= 0 && minutes < 100) {
      return minutes * 60 + seconds;
    }
  } else if (parts.length === 1) {
    const [secondsOnly] = parts;
    if (!isNaN(secondsOnly) && secondsOnly >= 0) {
      return Math.min(secondsOnly, 3600);
    }
  }
  return null;
};

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
`;

const PanelContainer = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: var(--surface-color);
  padding: var(--space-xl);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-xl);
  z-index: 1000;
  width: 440px;
  max-width: 92vw;
  opacity: 0;
  transition: opacity 0.2s ease;

  &[data-visible='true'] {
    opacity: 1;
  }
`;

const ModalTitle = styled.h2`
  font-size: var(--font-size-xl);
  color: var(--text-color-strong);
  margin: 0 0 var(--space-md) 0;
  text-align: center;
  font-weight: 600;
`;

const StepDescription = styled.p`
  font-size: var(--font-size-sm);
  color: var(--text-color-light);
  text-align: center;
  margin: 0 0 var(--space-lg) 0;
  line-height: var(--line-height-base);
`;

const DurationInputContainer = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
`;

const DurationDisplayInput = styled.input`
  flex-grow: 1;
  padding: var(--space-sm) var(--space-md);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-lg);
  text-align: center;
  transition: border-color 0.2s ease;

  &:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px var(--focus-ring-color);
    outline: none;
  }
`;

const Slider = styled.input`
  width: 100%;
  margin-bottom: var(--space-md);
  accent-color: var(--primary-color);
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--border-color-light);
  border-radius: 3px;
  outline: none;
  cursor: pointer;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--primary-color);
    cursor: pointer;
    border: 2px solid var(--surface-color);
    box-shadow: var(--shadow-sm);
    transition: transform 0.15s ease;
  }

  &::-moz-range-thumb {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--primary-color);
    cursor: pointer;
    border: 2px solid var(--surface-color);
    box-shadow: var(--shadow-sm);
  }

  &::-webkit-slider-thumb:hover {
    transform: scale(1.15);
  }

  &::-moz-range-thumb:hover {
    transform: scale(1.15);
  }

  &:focus {
    &::-webkit-slider-thumb {
      box-shadow: 0 0 0 3px var(--focus-ring-color);
    }
    &::-moz-range-thumb {
      box-shadow: 0 0 0 3px var(--focus-ring-color);
    }
  }
`;

const ColorSwatchContainer = styled.div`
  display: flex;
  gap: var(--space-lg);
  margin-bottom: var(--space-md);
  flex-wrap: wrap;
  justify-content: space-around;
  padding: var(--space-md) 0;
`;

const ColorSwatch = styled.button<{ $color: string }>`
  width: 56px;
  height: 56px;
  border-radius: var(--border-radius);
  background-color: ${(props) => props.$color};
  border: 3px solid transparent;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease;
  box-shadow: var(--shadow-sm);

  &:hover {
    transform: scale(1.1);
    border-color: var(--border-color-hover);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px var(--focus-ring-color);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: var(--space-sm);
  margin-top: var(--space-xl);
  align-items: center;
`;

const Button = styled.button`
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--border-radius);
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
  border: 1px solid transparent;
  min-height: 44px;
  box-shadow: var(--shadow-xs);

  &.primary {
    background-color: var(--primary-color);
    color: var(--text-on-primary);
    &:hover {
      background-color: var(--primary-color-dark);
    }
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &.secondary {
    background-color: transparent;
    border-color: var(--border-color);
    color: var(--text-color);
    &:hover {
      background-color: var(--surface-color-hover);
      border-color: var(--border-color-hover);
    }
  }
`;

const StatusMessage = styled.p`
  margin: 0 0 var(--space-md) 0;
  color: var(--danger-color);
  font-size: var(--font-size-sm);
  text-align: center;
  min-height: var(--font-size-sm);
`;

const generateSnapPoints = (): number[] => {
  const points: number[] = [0];
  for (let i = 2; i <= 30; i += 2) points.push(i);
  for (let i = 35; i <= 60; i += 5) points.push(i);
  for (let i = 75; i <= 300; i += 15) points.push(i);
  for (let i = 330; i <= 600; i += 30) points.push(i);
  for (let i = 660; i <= 1800; i += 60) points.push(i);
  for (let i = 1800 + 120; i <= 3600; i += 120) points.push(i);
  return [...new Set(points)].sort((a, b) => a - b);
};
const SNAP_POINTS: number[] = generateSnapPoints();
const MAX_SLIDER_VALUE = SNAP_POINTS.length - 1;

export const TimerCreationPanel: React.FC<TimerCreationPanelProps> = ({
  isOpen,
  onClose,
  availableColors,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [durationInSeconds, setDurationInSeconds] = useState(SNAP_POINTS[0]);
  const [manualDurationInput, setManualDurationInput] = useState(formatDurationMMSS(SNAP_POINTS[0]));
  const [statusMessage, setStatusMessage] = useState('');
  const { dispatch } = useTimers();

  const resetForm = useCallback(() => {
    setCurrentStep(1);
    setDurationInSeconds(SNAP_POINTS[0]);
    setManualDurationInput(formatDurationMMSS(SNAP_POINTS[0]));
    setStatusMessage('');
  }, []);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const sliderValue = parseInt(event.target.value, 10);
    const newDuration = SNAP_POINTS[sliderValue];
    setDurationInSeconds(newDuration);
    setManualDurationInput(formatDurationMMSS(newDuration));
    setStatusMessage('');
  };

  const handleSliderRelease = () => {
    if (durationInSeconds > 0) {
      setCurrentStep(2);
      setStatusMessage('');
    }
  };

  const handleManualDurationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setManualDurationInput(event.target.value);
    setStatusMessage('');
    const parsedSeconds = parseDurationToSeconds(event.target.value);
    if (parsedSeconds !== null) {
      setDurationInSeconds(parsedSeconds);
    }
  };

  const handleGoToStep2 = () => {
    const parsedSeconds = parseDurationToSeconds(manualDurationInput);
    if (parsedSeconds !== null && parsedSeconds > 0) {
      setDurationInSeconds(parsedSeconds);
      setCurrentStep(2);
      setStatusMessage('');
    } else {
      setStatusMessage('Durada no vàlida. Utilitza MM:SS o SSS.');
    }
  };

  const handleColorSelect = (color: string) => {
    if (durationInSeconds <= 0) {
      setStatusMessage('La durada ha de ser superior a 0.');
      setCurrentStep(1);
      return;
    }
    dispatch({
      type: 'ADD_TIMER',
      payload: { duration: durationInSeconds, color: color },
    });
    onClose();
  };

  const getSliderValueFromSeconds = (seconds: number): number => {
    if (seconds >= SNAP_POINTS[MAX_SLIDER_VALUE]) return MAX_SLIDER_VALUE;
    const closestIndex = SNAP_POINTS.findIndex((p) => p >= seconds);
    return closestIndex === -1 ? MAX_SLIDER_VALUE : closestIndex;
  };

  if (!isOpen) return null;

  return (
    <>
      <Overlay onClick={onClose} />
      <PanelContainer data-visible={isOpen} aria-modal="true" role="dialog">
        <ModalTitle>Temporitzador</ModalTitle>

        {currentStep === 1 && (
          <>
            <StepDescription>
              Estableix la durada desitjada per al teu temporitzador.
            </StepDescription>
            <StatusMessage>{statusMessage}</StatusMessage>
            <DurationInputContainer>
              <DurationDisplayInput
                type="text"
                value={manualDurationInput}
                onChange={handleManualDurationChange}
                placeholder="MM:SS"
                aria-label="Durada del temporitzador"
              />
            </DurationInputContainer>
            <Slider
              id="duration-slider"
              type="range"
              min="0"
              max={MAX_SLIDER_VALUE}
              value={getSliderValueFromSeconds(durationInSeconds)}
              onChange={handleSliderChange}
              onMouseUp={handleSliderRelease}
              onTouchEnd={handleSliderRelease}
              aria-label="Control lliscant de la durada del temporitzador"
            />
            <ButtonGroup style={{ justifyContent: 'flex-end' }}>
              <Button className="primary" onClick={handleGoToStep2}>
                Següent
              </Button>
            </ButtonGroup>
          </>
        )}

        {currentStep === 2 && (
          <>
            <StepDescription>
              Tria un color per identificar el teu temporitzador.
            </StepDescription>
            <StatusMessage>{statusMessage}</StatusMessage>
            <ColorSwatchContainer>
              {availableColors.map((color) => (
                <ColorSwatch
                  key={color}
                  $color={color}
                  onClick={() => handleColorSelect(color)}
                  aria-label={`Selecciona el color ${color}`}
                />
              ))}
            </ColorSwatchContainer>
            <ButtonGroup style={{ justifyContent: 'flex-start' }}>
              <Button
                className="secondary"
                onClick={() => {
                  setCurrentStep(1);
                  setStatusMessage('');
                }}
              >
                Enrere
              </Button>
            </ButtonGroup>
          </>
        )}
      </PanelContainer>
    </>
  );
};
