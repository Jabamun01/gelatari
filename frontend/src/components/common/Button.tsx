import { styled } from '@linaria/react';
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  // No custom props needed for now, can be extended later
}

const BaseButton = styled.button<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-sm) var(--space-lg);
  border: var(--border-width) solid transparent;
  border-radius: var(--border-radius);
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
  box-shadow: var(--shadow-sm);
  line-height: var(--line-height-base);

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3); /* Focus ring using primary color */
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

export const PrimaryButton = styled(BaseButton)`
  background-color: var(--primary-color);
  color: var(--text-on-primary);
  border-color: var(--primary-color);

  &:hover:not(:disabled) {
    background-color: var(--primary-color-dark);
    border-color: var(--primary-color-dark);
  }

  &:focus {
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.4); /* Primary focus ring */
  }
`;

export const SecondaryButton = styled(BaseButton)`
  background-color: var(--surface-color);
  color: var(--primary-color);
  border-color: var(--primary-color);

  &:hover:not(:disabled) {
    background-color: var(--primary-color-dark);
    color: var(--text-on-primary);
    border-color: var(--primary-color-dark);
  }
   &:focus {
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3); /* Primary focus ring for consistency */
  }
`;

export const DangerButton = styled(BaseButton)`
  background-color: var(--danger-color);
  color: var(--text-on-primary);
  border-color: var(--danger-color);

  &:hover:not(:disabled) {
    background-color: var(--danger-color-dark);
    border-color: var(--danger-color-dark);
  }

  &:focus {
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.4); /* Danger focus ring */
  }
`;

// Generic button, similar to current ActionButton but using BaseButton
export const ActionButton = styled(BaseButton)`
  background-color: var(--surface-color);
  color: var(--text-color);
  border-color: var(--border-color);

  &:hover:not(:disabled) {
    background-color: var(--background-color); // Similar to --button-hover-bg
    border-color: var(--border-color-light);
  }
  
  &:focus {
     box-shadow: 0 0 0 3px rgba(107, 114, 128, 0.3); /* Gray focus ring */
  }
`;

// Example of a TextButton or minimal button if needed for "Remove" in RecipeEditorTab
export const TextButton = styled(BaseButton)`
  background-color: transparent;
  color: var(--primary-color);
  border-color: transparent;
  box-shadow: none;
  padding: var(--space-sm); // Smaller padding if it's text-like

  &:hover:not(:disabled) {
    background-color: var(--surface-color-light);
    color: var(--primary-color-dark);
  }

  &:focus {
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3); // Subtle focus
  }
`;

// Adding defaultProps for button type
PrimaryButton.defaultProps = { type: 'button' };
SecondaryButton.defaultProps = { type: 'button' };
DangerButton.defaultProps = { type: 'button' };
ActionButton.defaultProps = { type: 'button' };
TextButton.defaultProps = { type: 'button' };

export default BaseButton;
