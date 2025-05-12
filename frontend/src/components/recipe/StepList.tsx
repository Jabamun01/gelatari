import React from 'react'; // Import React for Fragment
// Removed React import as Fragments are no longer needed
import { styled } from '@linaria/react';
// Removed LinkedRecipeInfo import

// --- Props Interface ---
interface StepListProps {
  steps: string[];
  // Removed linkedRecipes and onOpenRecipeTab props
}

// --- Styled Components ---
// Add a heading for the section
const SectionHeading = styled.h3`
  /* Inherits global h3 styles */
  margin-bottom: var(--space-md);
  font-size: var(--font-size-lg); /* Slightly smaller heading */
`;
const StyledOrderedList = styled.ol`
  list-style: none; /* Remove default list styling */
  padding: 0;
  margin: 0;
  counter-reset: step-counter; /* Initialize counter */
  /* Styles removed: border, border-radius, background-color, box-shadow, overflow */
  /* These are now handled by the parent wrapper in RecipeTab for grid layout */
`;

const StepListItem = styled.li`
  position: relative;
  padding: var(--space-md) var(--space-lg);
  padding-left: var(--space-2xl); /* Keep space for number */
  line-height: var(--line-height-base);
  color: var(--text-color);
  border-bottom: var(--border-width) solid var(--border-color-light);
  /* Add subtle hover */
  transition: background-color 0.15s ease;

  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }

   &:hover {
      background-color: var(--surface-color-light); /* Use light surface on hover */
  }

  /* Style the step number */
  &::before {
    counter-increment: step-counter;
    content: counter(step-counter) "."; /* Add dot after number */
    position: absolute;
    left: var(--space-lg);
    top: var(--space-md);
    font-weight: 600;
    color: var(--primary-color);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-base);
    /* Optional: Style number appearance */
    /* background-color: var(--primary-color); */
    /* color: var(--text-on-primary); */
    /* border-radius: 50%; */
    /* width: 20px; */
    /* height: 20px; */
    /* display: inline-flex; */
    /* align-items: center; */
    /* justify-content: center; */
  }
`;

// Removed LinkedRecipeButton styled component

// --- Component Implementation ---
// --- Component Implementation ---
export const StepList = ({ steps }: StepListProps) => { // Only accept steps prop
  return (
    <React.Fragment> {/* Use Fragment instead of div */}
      <SectionHeading>Passos</SectionHeading>
      <StyledOrderedList>
      {/* Simple mapping, rendering each step as plain text */}
      {steps.map((step, index) => (
        <StepListItem key={index}>{step}</StepListItem>
      ))}
      </StyledOrderedList>
    </React.Fragment>
  );
};