import { styled } from '@linaria/react';

// --- Helper Function ---
/**
 * Formats seconds into MM:SS format.
 * @param totalSeconds - The total number of seconds.
 * @returns The formatted time string (e.g., "05:32").
 */
const formatTime = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(seconds).padStart(2, '0');
  return `${paddedMinutes}:${paddedSeconds}`;
};

// --- Props Interface ---
interface TimerProps {
  isRunning: boolean;
  elapsedTime: number; // in seconds
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}

// --- Styled Components ---
// Add a heading
const SectionHeading = styled.h4`
  /* Inherits global h4 styles */
  margin-bottom: var(--space-sm);
  font-size: var(--font-size-base); /* Smaller heading */
  color: var(--text-color-light);
  font-weight: 500;
`;

const TimerContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between; /* Space out time and buttons */
  gap: var(--space-lg);
  padding: var(--space-md) var(--space-lg);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius);
  background-color: var(--surface-color);
  box-shadow: var(--shadow-sm);
`;

const TimeDisplay = styled.span`
  font-size: 1.875rem; /* Larger: 30px */
  font-weight: 600;
  color: var(--primary-color);
  min-width: 100px; /* Ensure enough space */
  text-align: center;
  font-family: 'ui-monospace', 'SFMono-Regular', Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  line-height: 1; /* Prevent extra vertical space */
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: var(--space-sm); /* Use new spacing */
`;

// Base Timer Button - inherits global button styles
const TimerButton = styled.button`
  /* Inherits base styles */
  padding: var(--space-sm) var(--space-md); /* Adjust padding */
  font-size: var(--font-size-sm);
  font-weight: 500;
  border: var(--border-width) solid var(--primary-color);
  background-color: var(--surface-color);
  color: var(--primary-color);
  box-shadow: none; /* Remove shadow for flatter look */

  &:hover:not(:disabled) {
    background-color: var(--primary-color);
    color: var(--text-on-primary);
    border-color: var(--primary-color); /* Keep border color consistent */
  }

  /* Disabled state handled globally */
`;

// Stop Button - Danger variant
const StopButton = styled(TimerButton)`
  border-color: var(--danger-color);
  color: var(--danger-color);

  &:hover:not(:disabled) {
    background-color: var(--danger-color);
    color: var(--text-on-primary); /* White text */
    border-color: var(--danger-color);
  }
`;

// Reset Button - Secondary/Subtle variant
const ResetButton = styled(TimerButton)`
  border-color: var(--border-color); /* Use standard border color */
  color: var(--text-color-light); /* Use lighter text color */

  &:hover:not(:disabled) {
    background-color: var(--button-hover-bg); /* Use default hover */
    color: var(--text-color); /* Darken text on hover */
    border-color: var(--border-color);
  }
`;


// --- Component Implementation ---
export const Timer = ({
  isRunning,
  elapsedTime,
  onStart,
  onStop,
  onReset,
}: TimerProps) => {
  return (
    <div> {/* Wrap in div for heading */}
      <SectionHeading>Timer</SectionHeading>
      <TimerContainer>
      <TimeDisplay>{formatTime(elapsedTime)}</TimeDisplay>
      <ButtonGroup>
        {!isRunning ? (
          <TimerButton onClick={onStart} disabled={isRunning}>
            Start
          </TimerButton>
        ) : (
          <StopButton onClick={onStop} disabled={!isRunning}>
            Stop
          </StopButton>
        )}
        <ResetButton onClick={onReset} disabled={elapsedTime === 0 && !isRunning}>
          Reset
        </ResetButton>
      </ButtonGroup>
      </TimerContainer>
    </div>
  );
};