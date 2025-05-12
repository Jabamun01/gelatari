import React, { useState, useEffect, useCallback } from 'react';
import { styled } from '@linaria/react';
import { useTimers } from '../../contexts/TimerContext';
import { formatDurationMMSS } from '../../utils/formatting';

interface TimerCreationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  availableColors: string[];
}

// Keep existing parseDurationToSeconds, or refine if needed
const parseDurationToSeconds = (durationStr: string): number | null => {
  const parts = durationStr.split(':').map(part => parseInt(part, 10));
  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    if (!isNaN(minutes) && !isNaN(seconds) && seconds >= 0 && seconds < 60 && minutes >= 0 && minutes < 100) {
      return minutes * 60 + seconds;
    }
  } else if (parts.length === 1) {
    const [secondsOnly] = parts;
    if (!isNaN(secondsOnly) && secondsOnly >= 0) {
        // Allow entering just seconds, up to 1 hour for simplicity here.
        // Max value of slider is 3600.
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
  padding: var(--space-lg); /* Reduced padding */
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  width: 400px; /* Increased width for a longer slider */
  opacity: 0;
  transition: opacity 0.2s ease;

  &[data-visible="true"] {
    opacity: 1;
  }
`;

const DurationInputContainer = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-md); /* Reduced margin */
`;

const DurationDisplayInput = styled.input`
  flex-grow: 1;
  padding: var(--space-sm) var(--space-md);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-lg); /* Larger font for duration */
  text-align: center;
  transition: border-color 0.2s ease;

  &:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    outline: none;
  }
`;

const Slider = styled.input`
  width: 100%;
  margin-bottom: var(--space-md); /* Reduced margin */
  accent-color: var(--primary-color); /* Style the slider thumb and track */
`;


const ColorSwatchContainer = styled.div`
  display: flex;
  gap: var(--space-lg); /* Further increased gap */
  margin-bottom: var(--space-md);
  flex-wrap: wrap;
  justify-content: space-around; /* Distribute space more evenly */
  padding: var(--space-md) 0; /* Increased vertical padding */
`;

const ColorSwatch = styled.button<{ $color: string; }>`
  width: 56px; /* Made swatches even larger */
  height: 56px; /* Made swatches even larger */
  border-radius: var(--border-radius); /* Square swatches */
  background-color: ${props => props.$color};
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease;

  &:hover {
    transform: scale(1.1);
    border-color: var(--primary-color-light);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: var(--space-sm);
  justify-content: flex-end;
`;

const Button = styled.button`
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--border-radius);
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
  border: 1px solid transparent;

  &.primary {
    background-color: var(--primary-color);
    color: var(--text-on-primary);
    &:hover {
      background-color: var(--primary-color-dark);
    }
    &:disabled {
      background-color: var(--disabled-color-strong); /* Darker disabled background */
      color: var(--text-on-disabled); /* Ensure text is visible */
      cursor: not-allowed;
      opacity: 0.7; /* Make it slightly less prominent but still visible */
    }
  }

  &.secondary {
    background-color: transparent;
    border-color: var(--border-color);
    color: var(--text-color-normal);
    &:hover {
      background-color: var(--background-color);
      border-color: var(--primary-color-light);
    }
  }
`;

const StatusMessage = styled.p`
  margin-top: 0;
  margin-bottom: var(--space-md); /* Reduced margin */
  color: var(--danger-color);
  font-size: var(--font-size-sm);
  text-align: center;
  min-height: var(--font-size-sm); /* Reduced min-height */
`;


// Define snap points in seconds with more granularity
const generateSnapPoints = (): number[] => {
  const points: number[] = [0];
  // 0s to 30s: 2-second increments
  for (let i = 2; i <= 30; i += 2) points.push(i);
  // 30s to 1min (60s): 5-second increments
  for (let i = 35; i <= 60; i += 5) points.push(i);
  // 1min (60s) to 5min (300s): 15-second increments
  for (let i = 75; i <= 300; i += 15) points.push(i);
  // 5min (300s) to 10min (600s): 30-second increments
  for (let i = 330; i <= 600; i += 30) points.push(i);
  // 10min (600s) to 30min (1800s): 1-minute (60s) increments
  for (let i = 660; i <= 1800; i += 60) points.push(i);
  // 30min (1800s) to 1hr (3600s): 2-minute (120s) increments
  for (let i = 1800 + 120; i <= 3600; i += 120) points.push(i);
  
  // Remove duplicates and sort, just in case generation logic overlaps
  return [...new Set(points)].sort((a, b) => a - b);
};
const SNAP_POINTS: number[] = generateSnapPoints();
const MAX_SLIDER_VALUE = SNAP_POINTS.length - 1;

export const TimerCreationPanel: React.FC<TimerCreationPanelProps> = ({
  isOpen,
  onClose,
  availableColors
}) => {
  const [currentStep, setCurrentStep] = useState(1); // 1 for duration, 2 for color
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
    setStatusMessage(''); // Clear status on slider interaction
  };

  const handleSliderRelease = () => {
    // Go to step 2 if duration is valid (always true with snap points, unless 0 and we want to prevent that)
    if (durationInSeconds > 0) {
      setCurrentStep(2);
      setStatusMessage('');
    } else {
      // Optionally, provide feedback if duration is 0
      // setStatusMessage('Please select a duration greater than 0.');
    }
  };

  const handleManualDurationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setManualDurationInput(event.target.value);
    setStatusMessage(''); // Clear status on input change
    const parsedSeconds = parseDurationToSeconds(event.target.value);
    if (parsedSeconds !== null) {
      setDurationInSeconds(parsedSeconds);
      // The slider's visual position will update automatically on re-render
      // because its `value` prop is derived from `durationInSeconds`
      // via `getSliderValueFromSeconds(durationInSeconds)`.
      // No direct DOM manipulation is needed here.
    }
  };
  
  const handleGoToStep2 = () => {
    const parsedSeconds = parseDurationToSeconds(manualDurationInput);
    if (parsedSeconds !== null && parsedSeconds > 0) {
      setDurationInSeconds(parsedSeconds); // Ensure durationInSeconds is up-to-date
      setCurrentStep(2);
      setStatusMessage('');
    } else {
      setStatusMessage('Invalid duration. Use MM:SS or SSS.');
    }
  };


  const handleColorSelect = (color: string) => {
    if (durationInSeconds <= 0) {
        setStatusMessage('Duration must be greater than 0.');
        setCurrentStep(1); // Go back to fix duration
        return;
    }
    dispatch({
      type: 'ADD_TIMER',
      payload: { duration: durationInSeconds, color: color }
    });
    onClose(); // This will trigger resetForm via useEffect on isOpen
  };
  
  const getSliderValueFromSeconds = (seconds: number): number => {
    if (seconds >= SNAP_POINTS[MAX_SLIDER_VALUE]) return MAX_SLIDER_VALUE;
    const closestIndex = SNAP_POINTS.findIndex(p => p >= seconds);
    return closestIndex === -1 ? MAX_SLIDER_VALUE : closestIndex;
  };


  if (!isOpen) return null;

  return (
    <>
      <Overlay onClick={onClose} />
      <PanelContainer data-visible={isOpen} aria-modal="true" role="dialog">
        <StatusMessage>{statusMessage}</StatusMessage>

        {currentStep === 1 && (
          <>
            <DurationInputContainer>
              <DurationDisplayInput
                type="text"
                value={manualDurationInput}
                onChange={handleManualDurationChange}
                placeholder="MM:SS"
                aria-label="Timer duration"
              />
              <Button className="primary" onClick={handleGoToStep2} disabled={parseDurationToSeconds(manualDurationInput) === null || parseDurationToSeconds(manualDurationInput)! <=0}>
                Next
              </Button>
            </DurationInputContainer>
            <Slider
              id="duration-slider"
              type="range"
              min="0"
              max={MAX_SLIDER_VALUE}
              value={getSliderValueFromSeconds(durationInSeconds)}
              onChange={handleSliderChange}
              onMouseUp={handleSliderRelease}
              onTouchEnd={handleSliderRelease} /* For touch devices */
              aria-label="Timer duration slider"
            />
          </>
        )}

        {currentStep === 2 && (
          <>
            <ColorSwatchContainer>
              {availableColors.map((color) => (
                <ColorSwatch
                  key={color}
                  $color={color}
                  onClick={() => handleColorSelect(color)}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </ColorSwatchContainer>
          </>
        )}

        <ButtonGroup>
          {/* Cancel button removed as per feedback */}
          {/* Create Timer button is removed as per new flow */}
        </ButtonGroup>
      </PanelContainer>
    </>
  );
};