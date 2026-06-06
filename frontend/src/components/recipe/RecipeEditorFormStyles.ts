import { styled } from '@linaria/react';

export const FormGroup = styled.div`
  margin-bottom: var(--space-lg);
  display: flex;
  flex-direction: column;
`;

export const FormLabel = styled.label`
  margin-bottom: var(--space-xs);
  font-weight: 500;
  color: var(--text-color);
  font-size: var(--font-size-sm);
  display: block;
`;

export const FormInput = styled.input`
  width: 100%;

  &[type='number'] {
    max-width: 150px;
  }
`;

export const FormSelect = styled.select`
  cursor: pointer;
  min-height: 44px;
`;

