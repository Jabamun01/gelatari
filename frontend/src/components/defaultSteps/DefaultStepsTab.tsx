import React, { useState } from 'react';
import { styled } from '@linaria/react';
import DefaultStepsEditor from './DefaultStepsEditor';

const TabContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: var(--space-md);
  gap: var(--space-lg);
`;

const CategorySelector = styled.div`
  display: flex;
  justify-content: center;
  gap: var(--space-md);
  padding: var(--space-sm);
  background-color: var(--surface-color);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-xs);
`;

const CategoryButton = styled.button<{ isActive: boolean }>`
  padding: var(--space-md) var(--space-lg);
  border: 2px solid transparent;
  border-bottom-color: ${({ isActive }) => isActive ? 'var(--primary-color)' : 'transparent'};
  background-color: ${({ isActive }) => isActive ? 'var(--primary-color-light)' : 'transparent'};
  color: ${({ isActive }) => isActive ? 'var(--primary-color-dark)' : 'var(--text-color)'};
  font-weight: ${({ isActive }) => isActive ? '600' : '500'};
  border-radius: var(--border-radius) var(--border-radius) 0 0;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover:not(:disabled) {
    background-color: var(--primary-color-xlight);
    border-bottom-color: var(--primary-color-light);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--primary-color-light);
  }
`;

const EditorWrapper = styled.div`
  flex-grow: 1;
  overflow-y: auto; /* Allow editor content to scroll if it's too long */
`;

const DefaultStepsTab: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<'ice cream' | 'sorbet'>('ice cream');

  return (
    <TabContainer>
      <h2>Gestiona els Passos per Defecte</h2>
      <CategorySelector role="tablist" aria-label="Categories de passos per defecte">
        <CategoryButton
          id="tab-ice-cream"
          role="tab"
          aria-controls="tabpanel-ice-cream-steps"
          aria-selected={selectedCategory === 'ice cream'}
          isActive={selectedCategory === 'ice cream'}
          onClick={() => setSelectedCategory('ice cream')}
        >
          Gelat
        </CategoryButton>
        <CategoryButton
          id="tab-sorbet"
          role="tab"
          aria-controls="tabpanel-sorbet-steps"
          aria-selected={selectedCategory === 'sorbet'}
          isActive={selectedCategory === 'sorbet'}
          onClick={() => setSelectedCategory('sorbet')}
        >
          Sorbet
        </CategoryButton>
      </CategorySelector>
      <EditorWrapper
        id={selectedCategory === 'ice cream' ? "tabpanel-ice-cream-steps" : "tabpanel-sorbet-steps"}
        role="tabpanel"
        aria-labelledby={selectedCategory === 'ice cream' ? "tab-ice-cream" : "tab-sorbet"}
        key={selectedCategory} // Keep key for re-rendering DefaultStepsEditor on category change
      >
        <DefaultStepsEditor category={selectedCategory} />
      </EditorWrapper>
    </TabContainer>
  );
};

export default DefaultStepsTab;