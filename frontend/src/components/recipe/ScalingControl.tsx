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
// Add a heading
const SectionHeading = styled.h4`
  /* Inherits global h4 styles */
  margin-bottom: var(--space-sm);
  font-size: var(--font-size-base); /* Smaller heading */
  color: var(--text-color-light);
  font-weight: 500;
`;

const ControlContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: var(--space-lg);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius);
  background-color: var(--surface-color);
  box-shadow: var(--shadow-sm);
`;

const Label = styled.label`
  font-weight: 500;
  color: var(--text-color-light);
  font-size: var(--font-size-sm); /* Use smaller font size */
  /* display: block; - Not needed with flex in InputRow */
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
  width: 80px;
  padding: var(--space-xs) var(--space-sm);
  /* Inherits border, radius, focus from global */
  text-align: right;
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
  disabled = false, // Destructure disabled prop with default
}: ScalingControlProps) => {
  const minScale = 0.1;
  const maxScale = 50; // Adjust max scale as needed
  const step = 0.1;

  // Calculate snap points in terms of scale factor
  const snapPoint5kg = 5000 / baseYieldGrams;
  const snapPoint10kg = 10000 / baseYieldGrams;
  const snapPoint30kg = 30000 / baseYieldGrams;

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onScaleChange(parseFloat(event.target.value));
  };

  const handleNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    // Prevent NaN or invalid numbers, clamp within bounds
    if (!isNaN(value) && value >= minScale && value <= maxScale) {
      onScaleChange(value);
    } else if (!isNaN(value) && value < minScale) {
        onScaleChange(minScale); // Clamp to min
    } else if (!isNaN(value) && value > maxScale) {
        onScaleChange(maxScale); // Clamp to max
    }
    // If input is empty or invalid, don't change (or reset to previous valid?)
  };

  const scaledYield = baseYieldGrams * scaleFactor;
  // Removed console.log

  return (
    <div> {/* Wrap in div for heading */}
      <SectionHeading>Scaling</SectionHeading>
      <ControlContainer>
      <YieldDisplay>Yield: {formatAmount(scaledYield)}</YieldDisplay>
      <InputRow>
        <Label htmlFor="scaleSlider">Scale:</Label>
        <SliderInput
          id="scaleSlider"
          type="range"
          min={minScale}
          max={maxScale}
          step={step}
          value={scaleFactor}
          onChange={handleSliderChange}
          list="scaleMarks" // Link to datalist
          disabled={disabled} // Apply disabled prop
        />
        <NumberInput
          type="number"
          min={minScale}
          max={maxScale}
          step={step}
          value={scaleFactor.toFixed(1)} // Display with one decimal
          onChange={handleNumberChange}
          aria-label="Scale Factor Input"
          disabled={disabled} // Apply disabled prop
        />
      </InputRow>
      {/* Datalist for slider snap points */}
      <datalist id="scaleMarks">
        <option value={snapPoint5kg.toFixed(1)} label="5kg"></option>
        <option value={snapPoint10kg.toFixed(1)} label="10kg"></option>
        <option value={snapPoint30kg.toFixed(1)} label="30kg"></option>
        {/* Add more marks if needed */}
      </datalist>
      </ControlContainer>
    </div>
  );
};