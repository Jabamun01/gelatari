import React from 'react';
import { styled } from '@linaria/react';
import { formatAmount } from '../../utils/formatting';

interface ScalingControlProps {
  scaleFactor: number;
  onScaleChange: (newScale: number) => void;
  baseYieldGrams: number;
  disabled?: boolean;
}

const ControlContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
`;

const YieldDisplay = styled.div`
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--primary-color);
  text-align: center;
`;

const InputRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-md);
`;

const SliderInput = styled.input`
  flex-grow: 1;
  cursor: pointer;
  height: 8px;
  appearance: none;
  -webkit-appearance: none;
  background: var(--border-color-light);
  border-radius: var(--border-radius);
  outline: none;

  &::-webkit-slider-thumb {
    appearance: none;
    -webkit-appearance: none;
    width: 22px;
    height: 22px;
    background: var(--primary-color);
    border-radius: 50%;
    cursor: pointer;
    transition: background-color 0.2s ease;
    border: 2px solid white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  &::-moz-range-thumb {
    width: 22px;
    height: 22px;
    background: var(--primary-color);
    border-radius: 50%;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    transition: background-color 0.2s ease;
  }

  &:hover::-webkit-slider-thumb {
    background: var(--primary-color-dark);
  }

  &:hover::-moz-range-thumb {
    background: var(--primary-color-dark);
  }

  &:focus::-webkit-slider-thumb {
    box-shadow: 0 0 0 3px var(--focus-ring-color);
  }

  &:focus::-moz-range-thumb {
    box-shadow: 0 0 0 3px var(--focus-ring-color);
  }

  &:disabled {
    background: var(--border-color);
    cursor: not-allowed;
  }

  &:disabled::-webkit-slider-thumb {
    background: var(--text-color-lighter);
    cursor: not-allowed;
  }

  &:disabled::-moz-range-thumb {
    background: var(--text-color-lighter);
    cursor: not-allowed;
  }
`;

const NumberInput = styled.input`
  width: 76px;
  padding: var(--space-xs) var(--space-sm);
  text-align: center;
  font-size: var(--font-size-sm);
  box-shadow: none;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  &:disabled {
    background-color: var(--surface-color-light);
    color: var(--text-color-lighter);
    cursor: not-allowed;
    border-color: var(--border-color);
  }
`;

export const ScalingControl = ({
  scaleFactor,
  onScaleChange,
  baseYieldGrams,
  disabled = false,
}: ScalingControlProps) => {
  const minScale = 0.1;
  const maxScale = 50;
  const step = 0.1;

  const [inputValue, setInputValue] = React.useState(scaleFactor.toFixed(2));

  React.useEffect(() => {
    setInputValue(scaleFactor.toFixed(2));
  }, [scaleFactor]);

  const getSnapPoint = (grams: number) => grams / baseYieldGrams;

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newScale = parseFloat(event.target.value);
    onScaleChange(newScale);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const processInputValue = () => {
    let value = parseFloat(inputValue);
    if (isNaN(value)) {
      setInputValue(scaleFactor.toFixed(2));
      return;
    }
    value = Math.max(minScale, Math.min(maxScale, value));
    onScaleChange(value);
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
          aria-label="Escala de producció"
        />
        <NumberInput
          id="scaleInput"
          type="number"
          min={minScale}
          max={maxScale}
          step={step}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          aria-label="Factor d'escala"
          disabled={disabled}
        />
      </InputRow>

      <datalist id="scaleMarks">
        <option value={getSnapPoint(2500).toFixed(1)} label="2.5kg" />
        <option value={getSnapPoint(5000).toFixed(1)} label="5kg" />
        <option value={getSnapPoint(7500).toFixed(1)} label="7.5kg" />
        <option value={getSnapPoint(10000).toFixed(1)} label="10kg" />
        <option value={getSnapPoint(12500).toFixed(1)} label="12.5kg" />
        <option value={getSnapPoint(15000).toFixed(1)} label="15kg" />
      </datalist>
    </ControlContainer>
  );
};
