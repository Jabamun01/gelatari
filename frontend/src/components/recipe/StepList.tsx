import { styled } from '@linaria/react';

interface StepListProps {
  steps: string[];
}

const SectionHeading = styled.h3`
  margin: 0 0 var(--space-md) 0;
  font-size: var(--font-size-lg);
  color: var(--text-color-strong);
`;

const StyledOrderedList = styled.ol`
  list-style: none;
  padding: 0;
  margin: 0;
  counter-reset: step-counter;
`;

const StepListItem = styled.li`
  position: relative;
  padding: var(--space-sm) var(--space-lg) var(--space-sm) var(--space-2xl);
  line-height: var(--line-height-base);
  color: var(--text-color);
  border-bottom: var(--border-width) solid var(--border-color-light);
  font-size: var(--font-size-sm);
  transition: background-color 0.15s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: var(--surface-color-light);
  }

  &::before {
    counter-increment: step-counter;
    content: counter(step-counter);
    position: absolute;
    left: var(--space-md);
    top: var(--space-sm);
    font-weight: 600;
    color: var(--primary-color);
    font-size: var(--font-size-xs);
    background-color: var(--primary-color-xlight);
    border-radius: 50%;
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

export const StepList = ({ steps }: StepListProps) => {
  return (
    <>
      <SectionHeading>Passos</SectionHeading>
      {steps.length === 0 ? (
        <p
          style={{
            color: 'var(--text-color-light)',
            fontStyle: 'italic',
            fontSize: 'var(--font-size-sm)',
            padding: 'var(--space-md) 0',
          }}
        >
          No hi ha passos per aquesta recepta.
        </p>
      ) : (
        <StyledOrderedList>
          {steps.map((step, index) => (
            <StepListItem key={index}>{step}</StepListItem>
          ))}
        </StyledOrderedList>
      )}
    </>
  );
};
