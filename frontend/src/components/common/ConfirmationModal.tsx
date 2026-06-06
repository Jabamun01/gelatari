import React from 'react';
import { styled } from '@linaria/react';
import { Modal, ModalFooter } from './Modal';
import { PrimaryButton, SecondaryButton, DangerButton } from './Button';

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
  white-space: pre-wrap;
  font-size: var(--font-size-base);
`;

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = 'Confirmar',
  cancelButtonText = 'Cancel·lar',
  confirmButtonVariant = 'primary',
}) => {
  if (!isOpen) {
    return null;
  }

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const ConfirmButtonComponent =
    confirmButtonVariant === 'danger' ? DangerButton : PrimaryButton;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <ModalFooter>
          <SecondaryButton onClick={onClose}>{cancelButtonText}</SecondaryButton>
          <ConfirmButtonComponent onClick={handleConfirm}>
            {confirmButtonText}
          </ConfirmButtonComponent>
        </ModalFooter>
      }
    >
      <MessageContainer>{message}</MessageContainer>
    </Modal>
  );
};
