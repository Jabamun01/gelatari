import React from 'react';
import { styled } from '@linaria/react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode; // Optional footer for buttons
}

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6); /* Darker overlay */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000; /* Ensure it's above other content */
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;

  &[data-isopen='true'] {
    opacity: 1;
    visibility: visible;
  }
`;

const ModalContent = styled.div`
  background-color: var(--background-color);
  padding: var(--space-xl);
  border-radius: var(--border-radius-lg); /* Larger radius */
  box-shadow: var(--shadow-lg); /* More prominent shadow */
  width: 90%;
  max-width: 600px; /* Limit max width */
  max-height: 80vh; /* Limit max height */
  display: flex;
  flex-direction: column;
  transform: scale(0.95);
  transition: transform 0.3s ease;

  ${ModalOverlay}[data-isopen='true'] & {
      transform: scale(1);
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
  font-size: var(--font-size-xl); /* Larger title */
  color: var(--text-color-strong);
`;

// Reusing RemoveButton style for Close button, but adjusting color/hover
const CloseButton = styled.button`
  background: transparent;
  border: var(--border-width) solid var(--border-color);
  color: var(--text-color-light);
  font-size: var(--font-size-xl); /* Larger close icon */
  cursor: pointer;
  padding: var(--space-xs);
  line-height: 1;
  border-radius: var(--border-radius);
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;

  &:hover {
    color: var(--text-color);
    background-color: var(--surface-color-hover);
    border-color: var(--border-color-hover);
  }

  &:focus {
      outline: none;
      color: var(--text-color);
      background-color: var(--surface-color-hover);
      border-color: var(--border-color-hover);
      box-shadow: 0 0 0 3px var(--focus-ring-color);
  }
`;


const ModalBody = styled.div`
  flex-grow: 1;
  overflow-y: auto; /* Allow body content to scroll if needed */
  margin-bottom: var(--space-lg); /* Add space before footer */
`;

const ModalFooter = styled.div`
  border-top: var(--border-width) solid var(--border-color-light);
  padding-top: var(--space-lg);
  display: flex;
  justify-content: flex-end; /* Align buttons to the right */
  gap: var(--space-md);
`;

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  // Prevent background scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    // Cleanup function to reset overflow when component unmounts
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle Escape key press to close modal
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

  // Create a unique ID for the modal title to be used by aria-labelledby
  const titleId = `modal-title-${React.useId()}`;

  return (
    <ModalOverlay
      data-isopen={isOpen}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId} // Associate the modal with its title
    >
      {/* Stop propagation prevents closing modal when clicking inside content */}
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle id={titleId}>{title}</ModalTitle> {/* Add id to the title element */}
          <CloseButton onClick={onClose} aria-label="Tanca el modal">&times;</CloseButton>
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