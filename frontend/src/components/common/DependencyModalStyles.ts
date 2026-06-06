import { styled } from '@linaria/react';

export const ModalContentWrapper = styled.div`
  padding: var(--space-lg) 0;
`;

export const MessageText = styled.p`
  margin-bottom: var(--space-lg);
  color: var(--text-color);
  line-height: var(--line-height-base);
  font-size: var(--font-size-sm);
`;

export const WarningText = styled(MessageText)`
  color: var(--warning-color-dark);
  font-weight: 500;
`;

export const SuccessText = styled(MessageText)`
  color: var(--success-color);
  font-weight: 500;
`;

export const DependentList = styled.ul`
  margin-bottom: var(--space-lg);
  padding-left: 0;
  list-style: none;

  & > * + * {
    margin-top: var(--space-sm);
  }
`;

export const DependentListItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md);
  border: var(--border-width) solid var(--border-color-light);
  border-radius: var(--border-radius);
  background-color: var(--surface-color-light);
  gap: var(--space-md);
  flex-wrap: wrap;
`;

export const ItemName = styled.span`
  color: var(--text-color-strong);
  font-weight: 500;
  font-size: var(--font-size-sm);
`;

export const ListItemActions = styled.div`
  display: flex;
  gap: var(--space-sm);
  flex-shrink: 0;

  @media (max-width: 640px) {
    width: 100%;

    button {
      flex: 1;
    }
  }
`;

export const FooterActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--space-md);
  flex-wrap: wrap;
`;
