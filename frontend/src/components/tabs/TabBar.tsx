import React from 'react';
import { styled } from '@linaria/react';
import { TabData } from '../../types/tabs';
import { ActionButton, PrimaryButton } from '../common/Button';

interface TabBarProps {
  tabs: TabData[];
  activeTabId: string;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onOpenNewRecipeEditor: () => void;
  onOpenIngredientsTab: () => void; // Add prop for opening ingredients tab
  // onOpenNewRecipeEditor: () => void; // Removed
  // onOpenIngredientsTab: () => void; // Removed
  // onOpenDefaultStepsTab: () => void; // Removed
}

const NavContainer = styled.nav`
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  border-bottom: var(--border-width) solid var(--tab-border-color);
  background-color: var(--surface-color);
  padding: 0 var(--space-sm);
  gap: var(--space-xs);
  box-shadow: var(--shadow-sm);
  position: relative;
  min-height: 50px; 
  justify-content: space-between; /* Ensure tabs are on left, actions (if any) on right */
`;

// Define TabButtonProps to include the isActive prop for styling
interface TabButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive: boolean;
  // No need to explicitly add aria-controls here if it's passed directly
}

// Define a dedicated styled component for the close icon (span)
const CloseIcon = styled.span`
  margin-left: var(--space-sm);
  padding: var(--space-xs);
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 1.1em; /* Make slightly larger */
  color: var(--text-color-light);
  opacity: 0.6; /* Start slightly more transparent */
  border-radius: 50%; /* Make it circular */
  width: 20px; /* Explicit size */
  height: 20px; /* Explicit size */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition: background-color 0.15s ease, opacity 0.15s ease, color 0.15s ease;

  /* Make it more visible on tab hover */
  button:hover & {
      opacity: 0.8;
  }

  &:hover,
  &:focus {
    opacity: 1;
    background-color: var(--danger-color); /* Red background on hover */
    color: var(--text-on-primary); /* White icon */
    outline: none;
  }
`;


const TabButton = styled.button<TabButtonProps>`
  padding: 0 var(--space-lg); /* Adjust padding, rely on align-items stretch */
  border: none;
  border-bottom: 3px solid transparent; /* Slightly thicker indicator */
  background-color: transparent; /* Make inactive tabs transparent */
  color: ${({ isActive }) => isActive ? 'var(--primary-color)' : 'var(--text-color-light)'};
  cursor: pointer;
  font-size: var(--font-size-base);
  font-weight: ${({ isActive }) => isActive ? '600' : '500'};
  border-top-left-radius: var(--border-radius);
  border-top-right-radius: var(--border-radius);
  margin-bottom: -1px; /* Overlap container border slightly */
  position: relative;
  display: inline-flex;
  align-items: center;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;

  /* Style for the active tab */
  ${({ isActive }) => isActive ? `
    border-bottom-color: var(--tab-active-border-color);
    color: var(--primary-color);
    /* Optional: Slightly different background for active tab if needed */
    /* background-color: var(--surface-color-light); */
  ` : ''}

  &:hover:not(:disabled) {
    background-color: var(--tab-hover-bg); /* Use hover background */
    color: ${({ isActive }) => isActive ? 'var(--primary-color)' : 'var(--text-color)'};
    border-bottom-color: ${({ isActive }) => isActive ? 'var(--tab-active-border-color)' : 'var(--border-color-light)'}; /* Subtle border hint on hover */
  }

  &:focus {
    outline: none;
    /* Add focus ring for accessibility */
    box-shadow: inset 0 0 0 2px var(--primary-color);
    z-index: 1; /* Ensure focus ring is visible */
  }
`;

const RightAlignedActionsContainer = styled.div`
  display: flex;
  align-items: center; /* Align buttons vertically */
  margin-left: auto; /* Push this container to the right */
  gap: var(--space-sm); /* Space between buttons */
  padding: var(--space-sm) 0; 
`;

export const TabBar = ({ tabs, activeTabId, onTabClick, onTabClose }: TabBarProps) => { // Removed action button props
  return (
    <NavContainer aria-label="Main navigation">
      <div role="tablist" style={{ display: 'flex', alignItems: 'stretch', gap: 'var(--space-xs)'}}>
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            id={`tab-${tab.id}`} // Added id for aria-labelledby on tabpanel
            role="tab"
            aria-selected={tab.id === activeTabId}
            aria-controls={`tabpanel-${tab.id}`} // Points to the corresponding tabpanel
            isActive={tab.id === activeTabId}
            onClick={() => onTabClick(tab.id)}
            title={tab.title}
          >
            {tab.title}
            {tab.isCloseable && (
            <CloseIcon
              role="button"
              tabIndex={0}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  onTabClose(tab.id);
                }
              }}
              title={`Tanca ${tab.title}`}
              aria-label={`Tanca ${tab.title}`}
            >
              ✕
            </CloseIcon>
          )}
          </TabButton>
        ))}
      </div>
      {/* RightAlignedActionsContainer is removed */}
    </NavContainer>
  );
};