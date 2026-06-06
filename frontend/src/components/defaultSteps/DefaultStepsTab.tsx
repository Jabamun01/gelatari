import React, { useState } from 'react';
import { styled } from '@linaria/react';
import DefaultStepsEditor from './DefaultStepsEditor';

const TabContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: var(--space-md);
  gap: var(--space-lg);
  max-width: 800px;
  margin: 0 auto;

  @media (max-width: 640px) {
    padding: var(--space-xs);
  }
`;

const PageTitle = styled.h2`
  text-align: center;
  margin-bottom: var(--space-md);
`;

const CategorySelector = styled.div`
  display: flex;
  justify-content: center;
  gap: 0;
  padding: 0;
  background-color: var(--surface-color);
  border-radius: var(--border-radius);
  border: var(--border-width) solid var(--border-color);
  overflow: hidden;
`;

const CategoryButton = styled.button<{ isActive: boolean }>`
  flex: 1;
  padding: var(--space-md) var(--space-lg);
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

const EditorWrapper = styled.div`
  flex-grow: 1;
  overflow-y: auto;
`;

const DefaultStepsTab: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<'ice cream' | 'sorbet'>('ice cream');

  return (
    <TabContainer>
      <PageTitle>Gestiona els Passos per Defecte</PageTitle>
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
        id={
          selectedCategory === 'ice cream'
            ? 'tabpanel-ice-cream-steps'
            : 'tabpanel-sorbet-steps'
        }
        role="tabpanel"
        aria-labelledby={
          selectedCategory === 'ice cream' ? 'tab-ice-cream' : 'tab-sorbet'
        }
        key={selectedCategory}
      >
        <DefaultStepsEditor category={selectedCategory} />
      </EditorWrapper>
    </TabContainer>
  );
};

export default DefaultStepsTab;
