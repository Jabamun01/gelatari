import React from 'react';
import { styled } from '@linaria/react';
import { formatAmount } from '../../utils/formatting';

// --- Props Interface ---
interface ScalingControlProps {
  scaleFactor: number;
  onScaleChange: (newScale: number) => void;
  baseYieldGrams: number;
  disabled?: boolean; // Add optional disabled prop
}

// --- Styled Components ---

const ControlContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  /* Styles removed: padding, border, border-radius, background-color, box-shadow */
  /* These are now handled by the parent ControlsWrapper in RecipeTab */
`;



const YieldDisplay = styled.div`
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: var(--space-md); /* Increase margin */
  text-align: center;
`;

const InputRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-md); /* Use new spacing */
`;

// Style the range input
const SliderInput = styled.input`
  flex-grow: 1;
  cursor: pointer;
  height: 8px; /* Adjust height */
  appearance: none; /* Override default look */
  background: var(--border-color-light); /* Track background */
  border-radius: var(--border-radius);
  outline: none;

  /* Thumb styles */
  &::-webkit-slider-thumb {
    appearance: none;
    width: 18px;
    height: 18px;
    background: var(--primary-color);
    border-radius: 50%;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  &::-moz-range-thumb {
    width: 18px;
    height: 18px;
    background: var(--primary-color);
    border-radius: 50%;
    cursor: pointer;
    border: none; /* Remove default border */
    transition: background-color 0.2s ease;
  }

  &:hover::-webkit-slider-thumb {
    background: var(--primary-color-dark);
  }
  &:hover::-moz-range-thumb {
    background: var(--primary-color-dark);
  }

  &:focus::-webkit-slider-thumb {
     box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3); /* Focus ring */
  }
   &:focus::-moz-range-thumb {
     box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3); /* Focus ring */
  }

  /* Disabled state */
  &:disabled {
    background: var(--border-color); /* Darker track */
    cursor: not-allowed;
  }
  &:disabled::-webkit-slider-thumb {
    background: var(--text-color-lighter); /* Grey thumb */
    cursor: not-allowed;
  }
  &:disabled::-moz-range-thumb {
    background: var(--text-color-lighter); /* Grey thumb */
    cursor: not-allowed;
  }
`;

// Inherit global input styles and customize
const NumberInput = styled.input`
  width: 72px;
  padding: var(--space-xs) var(--space-sm);
  /* Inherits border, radius, focus from global */
  text-align: center;
  font-size: var(--font-size-sm);
  box-shadow: none; /* Remove shadow for small input */

  /* Hide spinner buttons */
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  /* Disabled state */
  &:disabled {
    background-color: var(--surface-color-light); /* Lighter background */
    color: var(--text-color-lighter);
    cursor: not-allowed;
    border-color: var(--border-color);
  }
`;

// --- Component Implementation ---
export const ScalingControl = ({
  scaleFactor,
  onScaleChange,
  baseYieldGrams,
  disabled = false,
}: ScalingControlProps) => {
  const minScale = 0.1;
  const maxScale = 50;
  const step = 0.1;

  // Local state for the number input to allow free typing
  const [inputValue, setInputValue] = React.useState(scaleFactor.toFixed(2));

  // Update local state when the external scaleFactor changes (e.g., from slider)
  React.useEffect(() => {
    // Update input only if it's not currently focused
    // to avoid interrupting user typing.
    // Format to 2 decimal places for more precision.
    setInputValue(scaleFactor.toFixed(2));
  }, [scaleFactor]);

  const getSnapPoint = (grams: number) => grams / baseYieldGrams;

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newScale = parseFloat(event.target.value);
    onScaleChange(newScale);
  };

  // Update the input value as the user types
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  // Process the input when it loses focus or Enter is pressed
  const processInputValue = () => {
    let value = parseFloat(inputValue);
    if (isNaN(value)) {
      // If input is not a number, revert to the last valid scaleFactor
      setInputValue(scaleFactor.toFixed(2));
      return;
    }
    // Clamp the value within the allowed range
    value = Math.max(minScale, Math.min(maxScale, value));
    onScaleChange(value);
    // Update the input to show the clamped/formatted value
    setInputValue(value.toFixed(2));
  };

  const handleInputBlur = () => {
    processInputValue();
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      processInputValue();
      event.currentTarget.blur();
    }
  };

  const scaledYield = baseYieldGrams * scaleFactor;

  return (
    <React.Fragment>
      <ControlContainer>
        <YieldDisplay>Rendiment: {formatAmount(scaledYield)}</YieldDisplay>

        <InputRow>
          <SliderInput
            id="scaleSlider"
            type="range"
            min={minScale}
            max={maxScale}
            step={step}
            value={scaleFactor}
            onChange={handleSliderChange}
            list="scaleMarks"
            disabled={disabled}
            aria-label="Scale Slider"
          />
          <NumberInput
            id="scaleInput"
            type="number"
            min={minScale}
            max={maxScale}
            step={step}
            value={inputValue} // Use local state for value
            onChange={handleInputChange} // Update local state on change
            onBlur={handleInputBlur} // Process value on blur
            onKeyDown={handleInputKeyDown} // Process value on Enter
            aria-label="Scale Factor Input"
            disabled={disabled}
          />
        </InputRow>

        <datalist id="scaleMarks">
          <option value={getSnapPoint(2500).toFixed(1)} label="2.5kg"></option>
          <option value={getSnapPoint(5000).toFixed(1)} label="5kg"></option>
          <option value={getSnapPoint(7500).toFixed(1)} label="7.5kg"></option>
          <option value={getSnapPoint(10000).toFixed(1)} label="10kg"></option>
          <option value={getSnapPoint(12500).toFixed(1)} label="12.5kg"></option>
          <option value={getSnapPoint(15000).toFixed(1)} label="15kg"></option>
        </datalist>
      </ControlContainer>
    </React.Fragment>
  );
};