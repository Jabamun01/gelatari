import { styled } from '@linaria/react';

export const ModalContentWrapper = styled.div`
  padding: var(--space-lg);
`;

export const MessageText = styled.p`
  margin-bottom: var(--space-lg);
  color: var(--text-color);
  line-height: var(--line-height-base);
`;

export const WarningText = styled(MessageText)`
  color: var(--warning-color);
  font-weight: 500;
`;

export const SuccessText = styled(MessageText)`
  color: var(--secondary-color); /* Using secondary for success */
  font-weight: 500;
`;

export const DependentList = styled.ul`
  margin-bottom: var(--space-lg);
  padding-left: 0;
  list-style: none;
  /* For space-y effect: */
  & > * + * {
    margin-top: var(--space-sm);
  }
`;

export const DependentListItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-sm) var(--space-md);
  border: var(--border-width) solid var(--border-color-light);
  border-radius: var(--border-radius);
  background-color: var(--surface-color-light);
`;

export const ItemName = styled.span`
  color: var(--text-color-strong);
`;

export const ListItemActions = styled.div`
  display: flex;
  gap: var(--space-sm);
`;

export const FooterActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--space-md);
`;

// Base Button for Modal Actions (can be used in list items or footer)
export const ActionButton = styled.button`
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--border-radius);
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  border: var(--border-width) solid transparent;
  font-size: var(--font-size-sm);

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

// Specific Button Styles for Footer - typically larger
export const FooterButton = styled(ActionButton)`
  padding: var(--space-sm) var(--space-lg);
  font-size: var(--font-size-base);
`;

// Common Button Variants
export const PrimaryButton = styled(FooterButton)`
  background-color: var(--primary-color);
  color: var(--text-on-primary);
  &:hover:not(:disabled) {
    background-color: var(--primary-color-dark);
  }
`;

export const DangerButton = styled(FooterButton)`
  background-color: var(--danger-color);
  color: var(--text-on-primary);
  &:hover:not(:disabled) {
    background-color: var(--danger-color-dark);
  }
  &:disabled {
    background-color: var(--border-color);
    color: var(--text-color-light);
    border-color: transparent;
  }
`;

export const WarningButton = styled(FooterButton)`
  background-color: var(--warning-color);
  color: var(--text-on-primary);
  &:hover:not(:disabled) {
    background-color: #D97706; /* Amber-600 */
  }
`;

export const DefaultButton = styled(FooterButton)`
  background-color: var(--surface-color);
  color: var(--text-color);
  border-color: var(--border-color);
  &:hover:not(:disabled) {
    background-color: var(--background-color);
    border-color: var(--border-color-light);
  }
`;

// Smaller action buttons for list items
export const ListItemPrimaryButton = styled(ActionButton)`
  background-color: var(--primary-color);
  color: var(--text-on-primary);
  &:hover:not(:disabled) {
    background-color: var(--primary-color-dark);
  }
`;

export const ListItemDangerButton = styled(ActionButton)`
  background-color: var(--danger-color);
  color: var(--text-on-primary);
  &:hover:not(:disabled) {
    background-color: var(--danger-color-dark);
  }
`;