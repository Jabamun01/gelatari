import { styled } from '@linaria/react';
import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const BaseButton = styled.button<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-lg);
  border: var(--border-width) solid transparent;
  border-radius: var(--border-radius);
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  line-height: var(--line-height-base);
  min-height: 44px;
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
  transition: background-color 0.15s ease, border-color 0.15s ease,
    color 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease;
  box-shadow: var(--shadow-xs);

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px var(--focus-ring-color);
  }

  &:active:not(:disabled) {
    transform: scale(0.97);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const _PrimaryButton = styled(BaseButton)`
  background-color: var(--primary-color);
  color: var(--text-on-primary);
  border-color: var(--primary-color);

  &:hover:not(:disabled) {
    background-color: var(--primary-color-dark);
    border-color: var(--primary-color-dark);
  }

  &:focus {
    box-shadow: 0 0 0 3px var(--focus-ring-color);
  }
`;
export const PrimaryButton: React.FC<ButtonProps> = ({ type = 'button', ...props }) => (
  <_PrimaryButton type={type} {...props} />
);

const _SecondaryButton = styled(BaseButton)`
  background-color: var(--surface-color);
  color: var(--primary-color);
  border-color: var(--border-color);

  &:hover:not(:disabled) {
    background-color: var(--surface-color-hover);
    border-color: var(--primary-color);
    color: var(--primary-color-dark);
  }

  &:focus {
    box-shadow: 0 0 0 3px var(--focus-ring-color);
  }
`;
export const SecondaryButton: React.FC<ButtonProps> = ({ type = 'button', ...props }) => (
  <_SecondaryButton type={type} {...props} />
);

const _DangerButton = styled(BaseButton)`
  background-color: var(--danger-color);
  color: var(--text-on-primary);
  border-color: var(--danger-color);

  &:hover:not(:disabled) {
    background-color: var(--danger-color-dark);
    border-color: var(--danger-color-dark);
  }

  &:focus {
    box-shadow: 0 0 0 3px var(--focus-ring-danger);
  }
`;
export const DangerButton: React.FC<ButtonProps> = ({ type = 'button', ...props }) => (
  <_DangerButton type={type} {...props} />
);

const _ActionButton = styled(BaseButton)`
  background-color: var(--surface-color);
  color: var(--text-color);
  border-color: var(--border-color);

  &:hover:not(:disabled) {
    background-color: var(--surface-color-hover);
    border-color: var(--border-color-hover);
  }

  &:focus {
    box-shadow: 0 0 0 3px var(--focus-ring-color);
  }
`;
export const ActionButton: React.FC<ButtonProps> = ({ type = 'button', ...props }) => (
  <_ActionButton type={type} {...props} />
);

const _TextButton = styled(BaseButton)`
  background-color: transparent;
  color: var(--primary-color);
  border-color: transparent;
  box-shadow: none;
  min-height: 44px;
  padding: var(--space-xs) var(--space-sm);

  &:hover:not(:disabled) {
    background-color: var(--surface-color-hover);
    color: var(--primary-color-dark);
  }

  &:focus {
    box-shadow: 0 0 0 2px var(--focus-ring-color);
  }
`;
export const TextButton: React.FC<ButtonProps> = ({ type = 'button', ...props }) => (
  <_TextButton type={type} {...props} />
);


