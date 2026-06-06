import React from 'react';
import { styled } from '@linaria/react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.25s ease, visibility 0.25s ease;

  &[data-isopen='true'] {
    opacity: 1;
    visibility: visible;
  }
`;

const ModalContent = styled.div`
  background-color: var(--surface-color);
  padding: var(--space-xl);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-xl);
  width: 92%;
  max-width: 560px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  transform: scale(0.95) translateY(8px);
  transition: transform 0.25s ease;

  ${ModalOverlay}[data-isopen='true'] & {
    transform: scale(1) translateY(0);
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: var(--border-width) solid var(--border-color-light);
  padding-bottom: var(--space-md);
  margin-bottom: var(--space-lg);
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: var(--font-size-xl);
  color: var(--text-color-strong);
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: var(--text-color-light);
  font-size: var(--font-size-xl);
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius);
  transition: background-color 0.15s ease, color 0.15s ease;
  padding: 0;
  box-shadow: none;

  &:hover {
    color: var(--text-color);
    background-color: var(--surface-color-hover);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--focus-ring-color);
  }
`;

const ModalBody = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  margin-bottom: var(--space-lg);
  scrollbar-gutter: stable;
`;

export const ModalFooter = styled.div`
  border-top: var(--border-width) solid var(--border-color-light);
  padding-top: var(--space-lg);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-md);
  flex-wrap: wrap;
`;

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  const titleId = React.useId();

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <ModalOverlay
      data-isopen={isOpen}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle id={titleId}>{title}</ModalTitle>
          <CloseButton onClick={onClose} aria-label="Tanca el modal">
            &times;
          </CloseButton>
        </ModalHeader>
        <ModalBody>
          {children}
        </ModalBody>
        {footer && (
          <ModalFooter>
            {footer}
          </ModalFooter>
        )}
      </ModalContent>
    </ModalOverlay>
  );
};
