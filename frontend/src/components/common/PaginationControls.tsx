import { styled } from '@linaria/react';
import { ActionButton } from './Button';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

const PaginationWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-md);
  margin-top: var(--space-lg);
  margin-bottom: var(--space-lg);
  flex-wrap: wrap;

  span {
    font-size: var(--font-size-sm);
    color: var(--text-color-light);
  }
`;

export const PaginationControls = ({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
  disabled = false,
}: PaginationControlsProps) => {
  if (totalPages <= 1) return null;

  const isDisabled = isLoading || disabled;

  return (
    <PaginationWrapper>
      <ActionButton
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1 || isDisabled}
      >
        Anterior
      </ActionButton>
      <span>
        Pàgina {currentPage} de {totalPages}
      </span>
      <ActionButton
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages || isDisabled}
      >
        Següent
      </ActionButton>
    </PaginationWrapper>
  );
};
