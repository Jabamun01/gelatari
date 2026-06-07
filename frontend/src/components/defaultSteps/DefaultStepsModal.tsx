import React, { useState } from 'react';
import { styled } from '@linaria/react';
import { Modal } from '../common/Modal';
import DefaultStepsEditor from './DefaultStepsEditor';

const CategorySelector = styled.div`
  display: flex;
  gap: 0;
  margin-bottom: var(--space-lg);
  background-color: var(--surface-color);
  border-radius: var(--border-radius);
  border: var(--border-width) solid var(--border-color);
  overflow: hidden;
`;

const CategoryButton = styled.button<{ isActive: boolean }>`
  flex: 1;
  padding: var(--space-sm) var(--space-md);
  border: none;
  background-color: ${({ isActive }) =>
    isActive ? 'var(--primary-color)' : 'transparent'};
  color: ${({ isActive }) =>
    isActive ? 'var(--text-on-primary)' : 'var(--text-color)'};
  font-weight: ${({ isActive }) => (isActive ? '600' : '500')};
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: all 0.15s ease;
  min-height: 44px;
  box-shadow: none;
  border-radius: 0;

  &:hover:not(:disabled) {
    background-color: ${({ isActive }) =>
      isActive ? 'var(--primary-color-dark)' : 'var(--surface-color-hover)'};
  }

  &:focus {
    outline: none;
    box-shadow: inset 0 0 0 2px var(--focus-ring-color);
  }
`;

interface DefaultStepsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DefaultStepsModal: React.FC<DefaultStepsModalProps> = ({ isOpen, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<'ice cream' | 'sorbet'>('ice cream');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gestiona els Passos per Defecte">
      <CategorySelector role="tablist" aria-label="Categories de passos per defecte">
        <CategoryButton
          role="tab"
          aria-selected={selectedCategory === 'ice cream'}
          isActive={selectedCategory === 'ice cream'}
          onClick={() => setSelectedCategory('ice cream')}
        >
          Gelat
        </CategoryButton>
        <CategoryButton
          role="tab"
          aria-selected={selectedCategory === 'sorbet'}
          isActive={selectedCategory === 'sorbet'}
          onClick={() => setSelectedCategory('sorbet')}
        >
          Sorbet
        </CategoryButton>
      </CategorySelector>
      <DefaultStepsEditor category={selectedCategory} />
    </Modal>
  );
};
