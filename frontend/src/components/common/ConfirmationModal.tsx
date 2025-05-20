import React from 'react';
import { styled } from '@linaria/react';
import { Modal } from './Modal'; // Assuming Modal.tsx is in the same directory
import { PrimaryButton, DefaultButton, DangerButton } from './DependencyModalStyles'; // Reusing button styles

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonVariant?: 'primary' | 'danger';
}

const MessageContainer = styled.div`
  margin-bottom: var(--space-lg);
  color: var(--text-color);
  line-height: var(--line-height-base);
  white-space: pre-wrap; // To respect newlines in the message string
`;

const FooterActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--space-md);
`;

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = "Confirmar",
  cancelButtonText = "Cancel·lar",
  confirmButtonVariant = "primary",
}) => {
  if (!isOpen) {
    return null;
  }

  const handleConfirm = () => {
    onConfirm();
    onClose(); // Close modal after confirmation
  };

  const ConfirmButtonComponent = confirmButtonVariant === 'danger' ? DangerButton : PrimaryButton;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <FooterActions>
          <DefaultButton onClick={onClose}>
            {cancelButtonText}
          </DefaultButton>
          <ConfirmButtonComponent onClick={handleConfirm}>
            {confirmButtonText}
          </ConfirmButtonComponent>
        </FooterActions>
      }
    >
      <MessageContainer>{message}</MessageContainer>
    </Modal>
  );
};